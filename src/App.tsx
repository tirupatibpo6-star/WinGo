import React, { useState, useEffect, useRef } from 'react';
import { GameMode, BetColor, BetSize, BetTargetType, DrawResult, UserBet } from './types';
import {
  MODE_DURATIONS,
  MODE_LABELS,
  generatePeriodString,
  generateInitialHistory,
  getNumberColors,
  getNumberSize,
  calculateBetOutcome,
  determineWinningNumberWithAlgorithm,
  getPlayerStage,
} from './utils/gameRules';
import {
  playTick,
  playUrgentTick,
  playChipBet,
  setSoundEnabled,
  getSoundEnabled,
} from './utils/audio';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { GameCard } from './components/GameCard';
import { BettingConsole } from './components/BettingConsole';
import { BetModal } from './components/BetModal';
import { GameTabs } from './components/GameTabs';
import { FreeBonusModal } from './components/FreeBonusModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ResultAnimationModal } from './components/ResultAnimationModal';
import { FloatingBonusBadge } from './components/FloatingBonusBadge';
import { AuthModal } from './components/AuthModal';
import { RechargeModal } from './components/RechargeModal';
import { ClaimWinModal } from './components/ClaimWinModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthLandingView } from './components/AuthLandingView';
import { AdminPortal } from './components/AdminPortal';
import { SubadminPortal } from './components/SubadminPortal';
import { useAuth } from './context/AuthContext';

const LOCAL_STORAGE_KEY_BETS = 'wingo_user_bets';

export default function App() {
  const { currentUser, userProfile, isAdmin, isSubadmin, updateUserCoins, incrementGamesPlayed, systemSettings, loading } = useAuth();

  // Active INR balance from Firestore UserProfile
  const activeBalance = currentUser && userProfile ? userProfile.coins : 0;

  // Sound State
  const [soundOn, setSoundOn] = useState<boolean>(() => getSoundEnabled());

  // Active Game Mode (defaults to '1m' WinGo 1mins)
  const [currentMode, setCurrentMode] = useState<GameMode>('1m');

  // Draw Results History by Mode
  const [historyByMode, setHistoryByMode] = useState<Record<GameMode, DrawResult[]>>(() => {
    return {
      '30s': generateInitialHistory('30s', 20),
      '1m': generateInitialHistory('1m', 20),
      '3m': generateInitialHistory('3m', 15),
      '5m': generateInitialHistory('5m', 15),
    };
  });

  // User Bets List
  const [userBets, setUserBets] = useState<UserBet[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_BETS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore error
        }
      }
    }
    return [];
  });

  // AI Player Stage Detection (Game 1 Win, Game 2 Lose, Game 3 Win, Old Player 15-20%)
  const playerStageInfo = getPlayerStage(userProfile, userBets);

  // Modals State
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{
    type: BetTargetType;
    value: BetColor | BetSize | number;
  }>({ type: 'color', value: 'green' });

  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Result popup modal after draw
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [latestDrawResult, setLatestDrawResult] = useState<DrawResult | null>(null);
  const [resolvedRoundBets, setResolvedRoundBets] = useState<UserBet[]>([]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Timer & Period States
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const duration = MODE_DURATIONS[currentMode];
    const elapsed = Math.floor((Date.now() / 1000) % duration);
    return duration - elapsed;
  });

  const [currentPeriod, setCurrentPeriod] = useState<string>(() =>
    generatePeriodString(Date.now(), currentMode)
  );

  const prevPeriodRef = useRef<string>(currentPeriod);
  const isLocked = secondsRemaining <= 5;

  // Persist user bets
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_BETS, JSON.stringify(userBets));
  }, [userBets]);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Sound toggle
  const handleToggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    setSoundEnabled(nextState);
  };

  // Resolve Bets when a draw occurs
  const handleDrawResolution = (mode: GameMode, draw: DrawResult) => {
    setHistoryByMode((prev) => {
      const modeHistory = prev[mode] || [];
      return {
        ...prev,
        [mode]: [draw, ...modeHistory].slice(0, 50),
      };
    });

    // Check bets for this period and mode
    setUserBets((prevBets) => {
      let totalWonCoins = 0;
      const updatedForRound: UserBet[] = [];

      const nextBets = prevBets.map((bet) => {
        if (bet.mode === mode && bet.period === draw.period && bet.status === 'pending') {
          const outcome = calculateBetOutcome(bet, draw);
          const resolvedBet: UserBet = {
            ...bet,
            status: outcome.status,
            payout: outcome.payout,
            profit: outcome.profit,
            winDetails: outcome.winDetails,
            drawResult: draw,
          };
          if (outcome.status === 'won') {
            totalWonCoins += outcome.payout;
          }
          updatedForRound.push(resolvedBet);
          return resolvedBet;
        }
        return bet;
      });

      // Credit winnings
      if (totalWonCoins > 0 && currentUser) {
        updateUserCoins(totalWonCoins);
      }

      // If user played bets in this round, advance their completed games count
      if (updatedForRound.length > 0 && currentUser) {
        incrementGamesPlayed();
      }

      // If this draw is for the currently viewed mode, trigger result modal
      if (mode === currentMode) {
        setLatestDrawResult(draw);
        setResolvedRoundBets(updatedForRound);
        setResultModalOpen(true);
      }

      return nextBets;
    });
  };

  // Countdown clock loop (1-second tick)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const duration = MODE_DURATIONS[currentMode];
      const elapsed = Math.floor((now / 1000) % duration);
      const remaining = duration - elapsed;
      const period = generatePeriodString(now, currentMode);

      setSecondsRemaining(remaining);
      setCurrentPeriod(period);

      // Play audio clicks on countdown
      if (remaining <= 5 && remaining > 0) {
        playUrgentTick();
      } else if (remaining > 5 && remaining % 5 === 0) {
        playTick();
      }

      // Detect round transition
      if (prevPeriodRef.current !== period) {
        const completedPeriod = prevPeriodRef.current;
        prevPeriodRef.current = period;

        // Find active pending bets for this round and mode
        const pendingBetsForRound = userBets.filter(
          (b) => b.mode === currentMode && b.period === completedPeriod && b.status === 'pending'
        );

        // Compute player stage (Game 1 Win, Game 2 Lose, Game 3 Win, Old Player 15-20%)
        const currentStageInfo = getPlayerStage(userProfile, userBets);

        // Compute winning number with AI algorithm (Strict 15-20% win rate or new player guaranteed rules)
        const winRate = systemSettings.winRatePercentage ?? 18;
        const winningNumber = determineWinningNumberWithAlgorithm(
          pendingBetsForRound,
          winRate,
          currentStageInfo.stage,
          completedPeriod
        );

        const drawResult: DrawResult = {
          period: completedPeriod,
          number: winningNumber,
          colors: getNumberColors(winningNumber),
          size: getNumberSize(winningNumber),
          timestamp: now - 1000,
        };

        handleDrawResolution(currentMode, drawResult);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentMode, userBets, userProfile, systemSettings.winRatePercentage]);

  // Mode change handler
  const handleSelectMode = (mode: GameMode) => {
    setCurrentMode(mode);
    const now = Date.now();
    const duration = MODE_DURATIONS[mode];
    const elapsed = Math.floor((now / 1000) % duration);
    setSecondsRemaining(duration - elapsed);
    const period = generatePeriodString(now, mode);
    setCurrentPeriod(period);
    prevPeriodRef.current = period;
  };

  // Click on bet target (Color, Number, or Big/Small)
  const handleSelectBetTarget = (type: BetTargetType, value: BetColor | BetSize | number) => {
    if (isLocked) {
      showToast('Betting is locked for the current round (Last 5 seconds)!');
      return;
    }
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedTarget({ type, value });
    setBetModalOpen(true);
  };

  // Confirm bet placement
  const handleConfirmBet = async (contractAmount: number, multiplier: number) => {
    const total = contractAmount * multiplier;
    if (total > activeBalance) {
      showToast('Insufficient INR balance! Please recharge.');
      setRechargeModalOpen(true);
      return;
    }

    // Deduct INR from Firebase UserProfile
    if (currentUser) {
      await updateUserCoins(-total);
    }
    playChipBet();

    // Create user bet record
    const newBet: UserBet = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      period: currentPeriod,
      mode: currentMode,
      targetType: selectedTarget.type,
      targetValue: selectedTarget.value,
      contractAmount,
      multiplier,
      totalAmount: total,
      status: 'pending',
      payout: 0,
      profit: 0,
      timestamp: Date.now(),
    };

    setUserBets((prev) => [newBet, ...prev]);
    showToast(`Bet placed on ${String(selectedTarget.value).toUpperCase()} for ₹${total.toLocaleString()} INR!`);
  };

  // Add INR (Bonus, Lucky Spin)
  const handleAddCoins = async (amount: number, reason: string) => {
    if (currentUser) {
      await updateUserCoins(amount);
    }
    showToast(`+₹${amount.toFixed(2)} INR added! (${reason})`);
  };

  // Mode results
  const currentModeResults = historyByMode[currentMode] || [];
  const previousResult = currentModeResults[0] || null;

  // 1. Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center text-white space-y-4 font-sans select-none">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-[0_0_35px_rgba(244,63,94,0.4)] animate-bounce border-2 border-white/20">
          <span className="font-black text-3xl">W</span>
        </div>
        <div className="text-sm font-bold text-slate-300">Loading WinGo Trading Arena...</div>
      </div>
    );
  }

  // 2. Unauthenticated: "Game page will appear after login and signup only"
  if (!currentUser) {
    return <AuthLandingView />;
  }

  // 3. Admin: "Admin will not play game. Remove game page from admin."
  if (isAdmin) {
    return <AdminPortal />;
  }

  // 4. Subadmin: "Remove game page from subadmins. Subadmins can check their users (from referral code) only."
  if (isSubadmin) {
    return <SubadminPortal />;
  }

  // 5. Authenticated Regular Players: Full Game Page
  return (
    <div className="min-h-screen bg-[#0d1421] text-slate-100 flex flex-col font-sans select-none pb-12 antialiased">
      {/* Top Header */}
      <Header
        currentMode={currentMode}
        balance={activeBalance}
        soundEnabled={soundOn}
        onToggleSound={handleToggleSound}
        onOpenHowToPlay={() => setHowToPlayOpen(true)}
        onOpenBonusModal={() => setBonusModalOpen(true)}
        onOpenRechargeModal={() => {
          if (!currentUser) setAuthModalOpen(true);
          else setRechargeModalOpen(true);
        }}
        onOpenClaimModal={() => {
          if (!currentUser) setAuthModalOpen(true);
          else setClaimModalOpen(true);
        }}
        onOpenAdminModal={() => setAdminModalOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenProfileModal={() => setProfileModalOpen(true)}
      />

      {/* Mode Selector Tabs (30s, 1mins, 3mins, 5mins) */}
      <ModeSelector
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
      />

      {/* Main Content Area */}
      <main className="max-w-md w-full mx-auto px-3 py-3 space-y-3.5 flex-1">
        {/* Game Status Card with Last Result Ball & Countdown */}
        <GameCard
          mode={currentMode}
          modeLabel={MODE_LABELS[currentMode]}
          previousResult={previousResult}
          currentPeriod={currentPeriod}
          secondsRemaining={secondsRemaining}
          isLocked={isLocked}
          onOpenHowToPlay={() => setHowToPlayOpen(true)}
          playerStageInfo={playerStageInfo}
        />

        {/* Betting Console (Green, Violet, Red, Numbers 0-9, Big/Small) */}
        <BettingConsole
          isLocked={isLocked}
          onSelectBet={handleSelectBetTarget}
        />

        {/* Tabs: Game Record / My Bets / Trends / My Profile */}
        <GameTabs
          mode={currentMode}
          results={currentModeResults}
          userBets={userBets}
          onOpenProfileModal={() => setProfileModalOpen(true)}
          onOpenRecharge={() => {
            if (!currentUser) setAuthModalOpen(true);
            else setRechargeModalOpen(true);
          }}
          onOpenClaim={() => {
            if (!currentUser) setAuthModalOpen(true);
            else setClaimModalOpen(true);
          }}
        />
      </main>

      {/* Floating Free Bonus Badge */}
      <FloatingBonusBadge onClick={() => setBonusModalOpen(true)} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 border border-sky-400 text-sky-200 text-xs font-bold rounded-full shadow-2xl animate-fade-in flex items-center space-x-2">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bet Configuration Modal */}
      <BetModal
        isOpen={betModalOpen}
        onClose={() => setBetModalOpen(false)}
        targetType={selectedTarget.type}
        targetValue={selectedTarget.value}
        period={currentPeriod}
        balance={activeBalance}
        onConfirmBet={handleConfirmBet}
      />

      {/* Daily Lucky Spin Modal (requires minimum 1 recharge today) */}
      <FreeBonusModal
        isOpen={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        balance={activeBalance}
        onAddCoins={handleAddCoins}
        onOpenRecharge={() => {
          if (!currentUser) setAuthModalOpen(true);
          else setRechargeModalOpen(true);
        }}
      />

      {/* Recharge Modal (Gateways: UPI, Binance, TRC20, QR + UTR Receipt Submission) */}
      <RechargeModal
        isOpen={rechargeModalOpen}
        onClose={() => setRechargeModalOpen(false)}
        onSuccess={() => showToast('Recharge submitted! Awaiting Admin approval.')}
      />

      {/* Claim Win Modal with "Amount will be deposited within 36 hours" Popup */}
      <ClaimWinModal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        onSuccess={() => showToast('Claim request received!')}
      />

      {/* Admin Panel Modal (Users coins management, Gateway configs, Approvals & 20% algorithm) */}
      <AdminPanelModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

      {/* User Profile Modal (Total bets, Win rate statistics, Recharge & Withdrawal history) */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userBets={userBets}
        onOpenRecharge={() => {
          if (!currentUser) setAuthModalOpen(true);
          else setRechargeModalOpen(true);
        }}
        onOpenClaim={() => {
          if (!currentUser) setAuthModalOpen(true);
          else setClaimModalOpen(true);
        }}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Auth Modal (Login & Registration) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* How to Play Rules Modal */}
      <HowToPlayModal
        isOpen={howToPlayOpen}
        onClose={() => setHowToPlayOpen(false)}
      />

      {/* Result Reveal Animation Modal */}
      <ResultAnimationModal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        result={latestDrawResult}
        roundBets={resolvedRoundBets}
      />
    </div>
  );
}
