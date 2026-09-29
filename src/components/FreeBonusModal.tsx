import React, { useState } from 'react';
import {
  X,
  Gift,
  Sparkles,
  Trophy,
  Lock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  CreditCard,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playWheelTick, playWinSound } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface FreeBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onAddCoins: (amount: number, reason: string) => void;
  onOpenRecharge: () => void;
}

// Strictly maximum win ₹2 INR (2 coins) as requested!
const WHEEL_PRIZES = [
  { amount: 0.5, color: '#10b981', label: '₹0.50' },
  { amount: 1.0, color: '#3b82f6', label: '₹1.00' },
  { amount: 0.2, color: '#8b5cf6', label: '₹0.20' },
  { amount: 2.0, color: '#f59e0b', label: '⭐ JACKPOT ₹2.00' },
  { amount: 0.5, color: '#06b6d4', label: '₹0.50' },
  { amount: 1.5, color: '#ec4899', label: '₹1.50' },
  { amount: 0.3, color: '#f97316', label: '₹0.30' },
  { amount: 2.0, color: '#ef4444', label: '⭐ MAX WIN ₹2.00' },
];

export const FreeBonusModal: React.FC<FreeBonusModalProps> = ({
  isOpen,
  onClose,
  balance,
  onAddCoins,
  onOpenRecharge,
}) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'wheel' | 'daily' | 'firstBonus'>('wheel');
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<number | null>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Free bonus will come after 1st recharge only!
  const hasRechargedAtLeastOnce = Boolean(
    isAdmin ||
    (userProfile?.totalRechargesCount && userProfile.totalRechargesCount > 0) ||
    userProfile?.hasRechargedToday ||
    userProfile?.hasFirstRechargeBonusClaimed
  );

  // Daily 2 free spins
  const spinsUsedToday = userProfile?.lastSpinDate === todayStr ? (userProfile?.dailySpinCount ?? 0) : 0;
  const spinsRemainingToday = isAdmin ? 2 : Math.max(0, 2 - spinsUsedToday);
  const hasSpinsLeft = spinsRemainingToday > 0;

  // Daily gift check-in
  const hasClaimedDailyToday = userProfile?.lastDailyRewardDate === todayStr && !isAdmin;

  const handleSpinWheel = async () => {
    if (isSpinning || !hasRechargedAtLeastOnce || !hasSpinsLeft) return;
    setIsSpinning(true);
    setWonPrize(null);

    const prizeIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const prize = WHEEL_PRIZES[prizeIndex];

    const segmentAngle = 360 / WHEEL_PRIZES.length;
    const extraSpins = 360 * 6;
    const targetAngle = 360 - (prizeIndex * segmentAngle + segmentAngle / 2);
    const newTotalRotation = wheelRotation + extraSpins + (targetAngle - (wheelRotation % 360));

    setWheelRotation(newTotalRotation);

    let tickCount = 0;
    const tickInterval = setInterval(() => {
      playWheelTick();
      tickCount++;
      if (tickCount > 25) clearInterval(tickInterval);
    }, 120);

    setTimeout(async () => {
      setIsSpinning(false);
      setWonPrize(prize.amount);
      onAddCoins(prize.amount, `Daily Free Spin (${prize.label})`);
      playWinSound();

      if (currentUser) {
        const nextCount = (userProfile?.lastSpinDate === todayStr ? (userProfile?.dailySpinCount ?? 0) : 0) + 1;
        await updateDoc(doc(db, 'users', currentUser.uid), {
          lastSpinDate: todayStr,
          dailySpinCount: nextCount,
          updatedAt: Date.now(),
        });
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 3800);
  };

  const handleClaimDailyGift = async () => {
    if (!hasRechargedAtLeastOnce || hasClaimedDailyToday) return;

    // Daily gift check-in max 1 coin or 0.5 coin (₹0.50 or ₹1.00 INR)
    const possibleGifts = [0.5, 1.0, 0.5, 1.0, 0.5];
    const giftAmount = possibleGifts[Math.floor(Math.random() * possibleGifts.length)];

    onAddCoins(giftAmount, `Daily Gift Check-In (₹${giftAmount.toFixed(2)})`);
    playWinSound();

    if (currentUser) {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        lastDailyRewardDate: todayStr,
        updatedAt: Date.now(),
      });
    }

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="w-full max-w-sm bg-[#131d2e] rounded-3xl border border-amber-500/50 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 p-4 text-slate-950 relative shadow-md">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-full bg-yellow-300 border-2 border-white flex items-center justify-center shadow-lg">
              <Gift className="w-6 h-6 text-amber-900" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-none text-white drop-shadow">
                FREE BONUSES &amp; REWARDS
              </h2>
              <p className="text-[11px] font-bold text-amber-100 drop-shadow-sm mt-0.5">
                Active after 1st recharge only &bull; Direct INR (₹)
              </p>
            </div>
          </div>
        </div>

        {/* 1st Recharge Requirement Notice */}
        {!hasRechargedAtLeastOnce && (
          <div className="p-3 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-amber-300">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="leading-tight">
                <span className="font-extrabold text-[11px] block">
                  Free bonus comes after 1st recharge only!
                </span>
                <span className="text-[10px] text-amber-200/80">
                  Recharge once to unlock 2 daily spins &amp; check-in gifts.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRecharge();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-[10px] uppercase shadow cursor-pointer shrink-0 ml-2"
            >
              Recharge ₹
            </button>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-[#0f172a]">
          <button
            type="button"
            onClick={() => setActiveTab('wheel')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'wheel'
                ? 'bg-[#1e2f47] text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2 Free Spins
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-[#1e2f47] text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daily Check-In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('firstBonus')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'firstBonus'
                ? 'bg-[#1e2f47] text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1st Recharge
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 space-y-4">
          {/* TAB 1: 2 Daily Free Spins (Max Win ₹2 INR) */}
          {activeTab === 'wheel' && (
            <div className="flex flex-col items-center text-center space-y-3.5">
              <div className="space-y-0.5">
                <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-amber-400">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Daily 2 Free Spins &bull; Max Win ₹2.00 INR</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Spins Left Today:{' '}
                  <strong className="text-emerald-400 font-mono text-xs">
                    {spinsRemainingToday} / 2
                  </strong>
                </div>
              </div>

              {/* Wheel Graphic */}
              <div className="relative w-48 h-48 my-1">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />

                <div
                  className="w-full h-full rounded-full border-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] relative overflow-hidden transition-transform duration-[3800ms] cubic-bezier(0.15, 0.9, 0.2, 1.0)"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    background:
                      'conic-gradient(#10b981 0deg 45deg, #3b82f6 45deg 90deg, #8b5cf6 90deg 135deg, #f59e0b 135deg 180deg, #06b6d4 180deg 225deg, #ec4899 225deg 270deg, #f97316 270deg 315deg, #ef4444 315deg 360deg)',
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-slate-900 border-2 border-amber-400 flex flex-col items-center justify-center shadow-lg z-10">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-[9px] font-black text-amber-300">MAX ₹2</span>
                  </div>
                </div>
              </div>

              {/* Prize slices legend preview */}
              <div className="grid grid-cols-4 gap-1 w-full text-[9px] font-bold">
                {WHEEL_PRIZES.slice(0, 4).map((p, idx) => (
                  <div key={idx} className="p-1 rounded bg-slate-900/80 border border-slate-800 text-amber-200">
                    {p.label}
                  </div>
                ))}
              </div>

              {wonPrize !== null && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-bounce">
                  🎉 Congratulations! You won +₹{wonPrize.toFixed(2)} INR!
                </div>
              )}

              {!hasRechargedAtLeastOnce ? (
                <div className="w-full space-y-1.5">
                  <div className="text-[11px] text-amber-300 font-medium">
                    Free bonus comes after 1st recharge only.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRecharge();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
                  >
                    Recharge to Unlock 2 Free Spins
                  </button>
                </div>
              ) : !hasSpinsLeft ? (
                <div className="w-full p-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold">
                  You used all 2 free spins today! Come back tomorrow for 2 more.
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isSpinning}
                  onClick={handleSpinWheel}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-lg cursor-pointer ${
                    isSpinning
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 text-slate-950 shadow-amber-500/30 active:scale-95'
                  }`}
                >
                  {isSpinning ? 'SPINNING WHEEL...' : `SPIN WHEEL (${spinsRemainingToday}/2 LEFT)`}
                </button>
              )}
            </div>
          )}

          {/* TAB 2: Daily Gift Check-in (max 1 coin or 0.5 coin / ₹1 or ₹0.50) */}
          {activeTab === 'daily' && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Calendar className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Daily Gift Check-In</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Daily gift check-in max ₹1.00 or ₹0.50 INR!
                </p>
              </div>

              {/* Reward preview box */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Today&apos;s Gift Reward</span>
                </div>
                <span className="font-mono font-black text-amber-300 text-sm">
                  ₹0.50 ~ ₹1.00 INR
                </span>
              </div>

              {/* 7-Day calendar visual */}
              <div className="grid grid-cols-7 gap-1">
                {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((d, i) => (
                  <div
                    key={d}
                    className="p-1 rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center text-[9px]"
                  >
                    <span className="text-slate-400 font-bold">{d}</span>
                    <span className="text-amber-300 font-black mt-0.5">
                      {i === 2 || i === 6 ? '₹1.00' : '₹0.50'}
                    </span>
                  </div>
                ))}
              </div>

              {!hasRechargedAtLeastOnce ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                    Free bonus &amp; daily gift check-in unlock after 1st recharge only!
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRecharge();
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
                  >
                    Recharge to Unlock Daily Gifts
                  </button>
                </div>
              ) : hasClaimedDailyToday ? (
                <div className="p-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Today&apos;s check-in gift already claimed!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClaimDailyGift}
                  className="w-full py-3 px-4 rounded-xl font-black text-xs tracking-wider uppercase transition-all cursor-pointer bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 text-white shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center space-x-1.5"
                >
                  <Gift className="w-4 h-4" />
                  <span>Check In &amp; Claim (Max ₹1.00 / ₹0.50)</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 3: 1st Recharge Free Bonus Information */}
          {activeTab === 'firstBonus' && (
            <div className="space-y-3.5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">1st Recharge Free Bonus</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Free bonus will come after 1st recharge only!
                </p>
              </div>

              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    hasRechargedAtLeastOnce
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {hasRechargedAtLeastOnce ? 'Active / Unlocked' : 'Pending 1st Recharge'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">1st Recharge Perk:</span>
                  <span className="font-bold text-amber-300">+₹50.00 Free Bonus</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Daily Free Spins:</span>
                  <span className="font-bold text-emerald-400">2 Spins Every Day</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Daily Gift Check-In:</span>
                  <span className="font-bold text-sky-400">Max ₹1.00 / ₹0.50</span>
                </div>
              </div>

              {!hasRechargedAtLeastOnce ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRecharge();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
                >
                  Make 1st Recharge Now
                </button>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  ✓ You are an active recharged member! Enjoy daily free spins and gifts.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
