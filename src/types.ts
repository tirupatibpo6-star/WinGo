export type GameMode = '30s' | '1m' | '3m' | '5m';

export type BetColor = 'green' | 'violet' | 'red';
export type BetSize = 'big' | 'small';

export type BetTargetType = 'color' | 'number' | 'size';

export interface DrawResult {
  period: string;
  number: number;
  colors: BetColor[];
  size: BetSize;
  timestamp: number;
}

export interface UserBet {
  id: string;
  period: string;
  mode: GameMode;
  targetType: BetTargetType;
  targetValue: BetColor | BetSize | number;
  contractAmount: number;
  multiplier: number;
  totalAmount: number;
  status: 'pending' | 'won' | 'lost';
  payout: number;
  profit: number;
  timestamp: number;
  winDetails?: string;
  drawResult?: DrawResult;
}

export type PlayerStage = 'new_game_1' | 'new_game_2' | 'new_game_3' | 'old_player';

export interface PlayerStageInfo {
  stage: PlayerStage;
  gamesPlayed: number;
  label: string;
  badgeColor: string;
  description: string;
  nextOutcome: 'win' | 'lose' | 'algorithm';
}

export interface UserProfile {
  uid: string;
  email: string;
  phoneNumber?: string;
  phoneFormatted?: string;
  displayName?: string;
  role: 'user' | 'admin' | 'subadmin';
  coins: number; // Balance in INR (₹)
  referralCode?: string; // Subadmin unique referral code (e.g. VIP888)
  referredBy?: string; // UID of subadmin who referred this player
  referredByCode?: string; // Code used during registration
  referredByName?: string; // Display name of referring subadmin
  assignedByAdmin?: string; // Admin UID who assigned this subadmin
  totalCoinsDistributed?: number; // Total coins this subadmin has distributed to their users
  isBlocked?: boolean;
  hasRechargedToday?: boolean;
  totalRechargesCount?: number;
  hasFirstRechargeBonusClaimed?: boolean;
  dailySpinCount?: number; // 2 free spins daily (after 1st recharge)
  lastSpinDate?: string; // YYYY-MM-DD
  lastDailyRewardDate?: string; // YYYY-MM-DD
  gamesPlayedCount?: number; // Count of games user has participated in with bets
  createdAt: number;
  updatedAt?: number;
}

export interface CoinTransferRecord {
  id: string;
  fromUid: string;
  fromName: string;
  fromRole: 'admin' | 'subadmin';
  toUid: string;
  toName: string;
  toEmail?: string;
  amount: number;
  note?: string;
  timestamp: number;
}

export type GatewayType = 'upi' | 'binance' | 'trc20' | 'qr' | 'custom';

export interface PaymentGateway {
  id: string;
  type: GatewayType;
  title: string;
  details: string; // UPI ID, Binance Pay ID, TRC20 Address, etc.
  qrImageUrl?: string;
  ratePerCoin: number; // e.g. 1 INR = 10 Coins or 1 USDT = 1000 Coins
  instructions?: string;
  isActive: boolean;
  createdAt: number;
}

export interface RechargeRequest {
  id: string;
  userId: string;
  userEmail: string;
  gatewayId: string;
  gatewayType: string;
  amount: number; // in fiat or crypto
  coins: number; // coins to credit
  transactionId: string; // UTR or TxHash
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  approvedAt?: number;
  adminNote?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  coinsAmount: number;
  currencyAmount: number;
  method: 'upi' | 'binance' | 'trc20' | 'bank';
  accountDetails: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  adminNote?: string;
  createdAt: number;
  processedAt?: number;
}

export interface SystemSettings {
  defaultStartingCoins: number;
  winRatePercentage: number; // Strictly 15 to 20 percent (e.g. 18%)
  minRechargeAmount: number;
  minWithdrawCoins: number;
  announcement?: string;
  newPlayerRulesEnabled?: boolean; // Win 1st, Lose 2nd, Win 3rd
  updatedAt: number;
}
