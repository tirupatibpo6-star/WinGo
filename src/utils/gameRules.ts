import { BetColor, BetSize, DrawResult, GameMode, UserBet, PlayerStage, PlayerStageInfo, UserProfile } from '../types';

export const MODE_DURATIONS: Record<GameMode, number> = {
  '30s': 30,
  '1m': 60,
  '3m': 180,
  '5m': 300,
};

export const MODE_LABELS: Record<GameMode, string> = {
  '30s': 'WinGo 30s',
  '1m': 'WinGo 1mins',
  '3m': 'WinGo 3mins',
  '5m': 'WinGo 5mins',
};

export const getNumberColors = (num: number): BetColor[] => {
  if (num === 0) return ['red', 'violet'];
  if (num === 5) return ['green', 'violet'];
  if ([1, 3, 7, 9].includes(num)) return ['green'];
  return ['red'];
};

export const getNumberSize = (num: number): BetSize => {
  return num >= 5 ? 'big' : 'small';
};

// Generate realistic period string like "20260924118"
export const generatePeriodString = (timestamp: number, mode: GameMode): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const midnight = new Date(year, date.getMonth(), date.getDate()).getTime();
  const secondsSinceMidnight = Math.floor((timestamp - midnight) / 1000);
  const duration = MODE_DURATIONS[mode];
  const periodIndex = Math.floor(secondsSinceMidnight / duration) + 1;

  return `${year}${month}${day}${String(periodIndex).padStart(4, '0')}`;
};

/**
 * AI Player Stage Detection:
 * Detects whether the player is NEW or OLD based on their completed games played.
 * - Game 1: 1st Game Played -> Guaranteed WIN
 * - Game 2: 2nd Game Played -> Guaranteed LOSS
 * - Game 3: 3rd Game Played -> Guaranteed WIN
 * - Game 4+: OLD Player -> Strict 15% - 20% Win Rate Algorithm
 */
export const getPlayerStage = (
  userProfile: UserProfile | null,
  userBets: UserBet[] = []
): PlayerStageInfo => {
  // Use persistent gamesPlayedCount from profile if available,
  // or calculate from distinct completed bet periods
  let gamesPlayed = userProfile?.gamesPlayedCount;
  
  if (gamesPlayed === undefined || gamesPlayed === null) {
    const completedPeriods = new Set(
      userBets.filter((b) => b.status === 'won' || b.status === 'lost').map((b) => b.period)
    );
    gamesPlayed = completedPeriods.size;
  }

  if (gamesPlayed === 0) {
    return {
      stage: 'new_game_1',
      gamesPlayed: 0,
      label: 'New Player (Game 1/3)',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: '1st Game Boost: Guaranteed WIN on whatever Color, Number, or Size bet',
      nextOutcome: 'win',
    };
  } else if (gamesPlayed === 1) {
    return {
      stage: 'new_game_2',
      gamesPlayed: 1,
      label: 'New Player (Game 2/3)',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: '2nd Game: Calibration Round (Loss)',
      nextOutcome: 'lose',
    };
  } else if (gamesPlayed === 2) {
    return {
      stage: 'new_game_3',
      gamesPlayed: 2,
      label: 'New Player (Game 3/3)',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      description: '3rd Game Boost: Guaranteed WIN on whatever Color, Number, or Size bet',
      nextOutcome: 'win',
    };
  } else {
    return {
      stage: 'old_player',
      gamesPlayed,
      label: 'Old Player (Veteran)',
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      description: 'Strict 15% - 20% AI Algorithm (Minimum Amount/People & Zero-Bet House Protection)',
      nextOutcome: 'algorithm',
    };
  }
};

/**
 * Generate simulated community room bets for this period so the pool has realistic
 * distribution across numbers 0-9, colors, and big/small.
 */
interface RoomBetItem {
  targetType: 'color' | 'number' | 'size';
  targetValue: BetColor | BetSize | number;
  totalAmount: number;
  bettorsCount: number;
}

export const generateRoomPoolForPeriod = (period: string): RoomBetItem[] => {
  // Deterministic seed based on period string
  let seed = 0;
  for (let i = 0; i < period.length; i++) {
    seed = (seed * 31 + period.charCodeAt(i)) & 0xffffffff;
  }
  const pseudoRand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 4294967296;
  };

  const pool: RoomBetItem[] = [
    // Colors
    { targetType: 'color', targetValue: 'green', totalAmount: Math.floor(pseudoRand() * 6000 + 1500), bettorsCount: Math.floor(pseudoRand() * 25 + 8) },
    { targetType: 'color', targetValue: 'red', totalAmount: Math.floor(pseudoRand() * 6500 + 2000), bettorsCount: Math.floor(pseudoRand() * 30 + 10) },
    { targetType: 'color', targetValue: 'violet', totalAmount: Math.floor(pseudoRand() * 1800 + 300), bettorsCount: Math.floor(pseudoRand() * 10 + 2) },
    // Sizes
    { targetType: 'size', targetValue: 'big', totalAmount: Math.floor(pseudoRand() * 8000 + 2500), bettorsCount: Math.floor(pseudoRand() * 35 + 12) },
    { targetType: 'size', targetValue: 'small', totalAmount: Math.floor(pseudoRand() * 7500 + 2200), bettorsCount: Math.floor(pseudoRand() * 32 + 11) },
  ];

  // Specific numbers 0-9 (some numbers have 0 bets to satisfy "or the no. Or color in which no one have but bet")
  for (let n = 0; n <= 9; n++) {
    const hasBet = pseudoRand() > 0.25; // 25% chance a number has 0 bets!
    if (hasBet) {
      pool.push({
        targetType: 'number',
        targetValue: n,
        totalAmount: Math.floor(pseudoRand() * 1200 + 100),
        bettorsCount: Math.floor(pseudoRand() * 6 + 1),
      });
    } else {
      pool.push({
        targetType: 'number',
        targetValue: n,
        totalAmount: 0,
        bettorsCount: 0,
      });
    }
  }

  return pool;
};

/**
 * Calculates candidate outcome evaluation for each number 0-9.
 */
interface CandidateOutcome {
  num: number;
  colors: BetColor[];
  size: BetSize;
  userMatches: boolean;
  userMatchCount: number;
  totalPayoutLiability: number;
  totalWinningBettors: number;
  hasZeroBets: boolean;
}

export const evaluateCandidatesForRound = (
  activeBets: UserBet[],
  period: string = ''
): CandidateOutcome[] => {
  const roomPool = generateRoomPoolForPeriod(period || 'default_period');

  const candidates: CandidateOutcome[] = [];

  for (let num = 0; num <= 9; num++) {
    const colors = getNumberColors(num);
    const size = getNumberSize(num);

    let userMatches = false;
    let userMatchCount = 0;
    let userPayout = 0;

    for (const bet of activeBets) {
      const outcome = calculateBetOutcome(bet, {
        period,
        number: num,
        colors,
        size,
        timestamp: Date.now(),
      });
      if (outcome.status === 'won') {
        userMatches = true;
        userMatchCount++;
        userPayout += outcome.payout;
      }
    }

    // Community room liability calculation
    let roomPayout = 0;
    let roomBettors = 0;
    let directNumberBetsCount = 0;

    for (const item of roomPool) {
      if (item.targetType === 'number' && item.targetValue === num) {
        directNumberBetsCount += item.bettorsCount;
        roomPayout += item.totalAmount * 9;
        roomBettors += item.bettorsCount;
      } else if (item.targetType === 'color' && colors.includes(item.targetValue as BetColor)) {
        const mult = item.targetValue === 'violet' ? 4.5 : (num === 0 || num === 5) ? 1.5 : 2;
        roomPayout += item.totalAmount * mult;
        roomBettors += item.bettorsCount;
      } else if (item.targetType === 'size' && item.targetValue === size) {
        roomPayout += item.totalAmount * 2;
        roomBettors += item.bettorsCount;
      }
    }

    const totalPayoutLiability = userPayout + roomPayout;
    const totalWinningBettors = (userMatches ? activeBets.length : 0) + roomBettors;
    const hasZeroBets = directNumberBetsCount === 0 && (!userMatches || activeBets.length === 0);

    candidates.push({
      num,
      colors,
      size,
      userMatches,
      userMatchCount,
      totalPayoutLiability,
      totalWinningBettors,
      hasZeroBets,
    });
  }

  return candidates;
};

/**
 * Main AI Algorithm as requested:
 * 1. AI detects if the player is new or old:
 *    If new:
 *      - Game 1: Any new player will WIN 1st game on whatever color, no., or size they bet on
 *      - Game 2: LOSE 2nd game
 *      - Game 3: WIN 3rd game in whatever color, no., or size they bet on
 * 2. After 3rd game (Old Player):
 *    - Win/loss depends on strict algorithm:
 *      - Strict algorithm: 15% to 20% players will win only, algorithm decides random players to win
 *      - Winning number selection:
 *        - "in which ever no. Or color or big/small in all this the minimum no. Of amount or minimum no. Of people have but bet will win"
 *        - "or the no. Or color in which no one have but bet that will win"
 */
export const determineWinningNumberWithAlgorithm = (
  activeBets: UserBet[],
  winRatePercentage: number = 18,
  playerStage: PlayerStage = 'old_player',
  period: string = ''
): number => {
  const candidates = evaluateCandidatesForRound(activeBets, period);

  // If player has active bets in this round:
  if (activeBets.length > 0) {
    // ----------------------------------------------------
    // RULE 1: NEW PLAYER - GAME 1: GUARANTEED WIN
    // "Any new player will win 1st game in whatever color, no. They bet on"
    // ----------------------------------------------------
    if (playerStage === 'new_game_1') {
      const winningCandidates = candidates.filter((c) => c.userMatches);
      if (winningCandidates.length > 0) {
        // Prioritize candidates where multiple bets win if player placed multiple bets,
        // then choose one with best outcome
        winningCandidates.sort((a, b) => b.userMatchCount - a.userMatchCount);
        return winningCandidates[0].num;
      }
    }

    // ----------------------------------------------------
    // RULE 2: NEW PLAYER - GAME 2: GUARANTEED LOSS
    // "Lose 2nd game"
    // ----------------------------------------------------
    if (playerStage === 'new_game_2') {
      const losingCandidates = candidates.filter((c) => !c.userMatches);
      if (losingCandidates.length > 0) {
        // Pick from candidates where player completely loses
        // Also favor zero bets or minimum amount
        const zeroBetLosers = losingCandidates.filter((c) => c.hasZeroBets);
        if (zeroBetLosers.length > 0) {
          return zeroBetLosers[Math.floor(Math.random() * zeroBetLosers.length)].num;
        }
        losingCandidates.sort((a, b) => a.totalPayoutLiability - b.totalPayoutLiability);
        return losingCandidates[0].num;
      }
    }

    // ----------------------------------------------------
    // RULE 3: NEW PLAYER - GAME 3: GUARANTEED WIN
    // "Win 3rd game in whatever color, no. They bet on"
    // ----------------------------------------------------
    if (playerStage === 'new_game_3') {
      const winningCandidates = candidates.filter((c) => c.userMatches);
      if (winningCandidates.length > 0) {
        winningCandidates.sort((a, b) => b.userMatchCount - a.userMatchCount);
        return winningCandidates[0].num;
      }
    }

    // ----------------------------------------------------
    // RULE 4: OLD PLAYER (AFTER 3RD GAME) OR STRICT ALGORITHM:
    // "After 3rd game win loss with depends on algorithm (in which ever no. Or color
    //  or big/small in all this the minimum no. Of amount or minimum no. Of people have
    //  but bet will win or the no. Or color in which no one have but bet that will win
    //  in this way algorithm will work). Strict algorithms 15 to 20 percent players
    //  will win only but not everyone will win. Algorithm will decide random players to win."
    // ----------------------------------------------------
    // Clamp win rate strictly to 15% - 20%
    const strictWinRate = Math.min(20, Math.max(15, winRatePercentage || 18));
    const isPlayerChosenToWin = Math.random() * 100 < strictWinRate;

    if (isPlayerChosenToWin) {
      // Player is selected in the 15-20% winners circle!
      // Out of numbers that satisfy the player's bet, pick the one with MINIMUM payout amount or MINIMUM people
      const userWinCandidates = candidates.filter((c) => c.userMatches);
      if (userWinCandidates.length > 0) {
        userWinCandidates.sort((a, b) => {
          if (a.totalPayoutLiability !== b.totalPayoutLiability) {
            return a.totalPayoutLiability - b.totalPayoutLiability; // Minimum amount
          }
          return a.totalWinningBettors - b.totalWinningBettors; // Minimum people
        });
        return userWinCandidates[0].num;
      }
    } else {
      // 80% to 85% case: Player loses this round
      const userLoseCandidates = candidates.filter((c) => !c.userMatches);
      if (userLoseCandidates.length > 0) {
        // "or the no. Or color in which no one have but bet that will win"
        const zeroBetCandidates = userLoseCandidates.filter((c) => c.hasZeroBets);
        if (zeroBetCandidates.length > 0) {
          return zeroBetCandidates[Math.floor(Math.random() * zeroBetCandidates.length)].num;
        }

        // "in which ever no. Or color or big/small in all this the minimum no. Of amount or minimum no. Of people have but bet will win"
        userLoseCandidates.sort((a, b) => {
          if (a.totalPayoutLiability !== b.totalPayoutLiability) {
            return a.totalPayoutLiability - b.totalPayoutLiability; // Minimum amount
          }
          return a.totalWinningBettors - b.totalWinningBettors; // Minimum people
        });
        return userLoseCandidates[0].num;
      }
    }
  }

  // Fallback when no active bets by player:
  // Apply "minimum amount or minimum people" or "zero-bet candidate" to optimize house pool
  const zeroBets = candidates.filter((c) => c.hasZeroBets);
  if (zeroBets.length > 0 && Math.random() < 0.6) {
    return zeroBets[Math.floor(Math.random() * zeroBets.length)].num;
  }
  candidates.sort((a, b) => a.totalPayoutLiability - b.totalPayoutLiability);
  return candidates[0].num;
};

// Calculate payout for a bet based on the draw result
export const calculateBetOutcome = (
  bet: UserBet,
  draw: DrawResult
): { status: 'won' | 'lost'; payout: number; profit: number; winDetails?: string } => {
  const total = bet.totalAmount;
  let multiplier = 0;
  let winDetails = '';

  if (bet.targetType === 'color') {
    const color = bet.targetValue as BetColor;
    if (color === 'green') {
      if ([1, 3, 7, 9].includes(draw.number)) {
        multiplier = 2;
        winDetails = 'Green Match (x2.0)';
      } else if (draw.number === 5) {
        multiplier = 1.5;
        winDetails = 'Green Half Match on 5 (x1.5)';
      }
    } else if (color === 'red') {
      if ([2, 4, 6, 8].includes(draw.number)) {
        multiplier = 2;
        winDetails = 'Red Match (x2.0)';
      } else if (draw.number === 0) {
        multiplier = 1.5;
        winDetails = 'Red Half Match on 0 (x1.5)';
      }
    } else if (color === 'violet') {
      if (draw.number === 0 || draw.number === 5) {
        multiplier = 4.5;
        winDetails = `Violet Hit on ${draw.number} (x4.5)`;
      }
    }
  } else if (bet.targetType === 'number') {
    if (Number(bet.targetValue) === draw.number) {
      multiplier = 9;
      winDetails = `Direct Number Hit ${draw.number} (x9.0)`;
    }
  } else if (bet.targetType === 'size') {
    if (bet.targetValue === draw.size) {
      multiplier = 2;
      winDetails = `${draw.size.toUpperCase()} Match (x2.0)`;
    }
  }

  if (multiplier > 0) {
    const payout = Math.round(total * multiplier * 100) / 100;
    const profit = Math.round((payout - total) * 100) / 100;
    return {
      status: 'won',
      payout,
      profit,
      winDetails,
    };
  }

  return {
    status: 'lost',
    payout: 0,
    profit: -total,
    winDetails: 'No Match',
  };
};

export const generateInitialHistory = (mode: GameMode, count = 15): DrawResult[] => {
  const results: DrawResult[] = [];
  const now = Date.now();
  const duration = MODE_DURATIONS[mode] * 1000;

  for (let i = count; i >= 1; i--) {
    const drawTime = now - i * duration;
    const period = generatePeriodString(drawTime, mode);
    const num = Math.floor(Math.random() * 10);
    results.push({
      period,
      number: num,
      colors: getNumberColors(num),
      size: getNumberSize(num),
      timestamp: drawTime,
    });
  }

  return results.reverse();
};
