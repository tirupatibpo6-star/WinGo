import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  TrendingUp,
  Award,
  Coins,
  CreditCard,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Shield,
  Sparkles,
  LogIn,
  LogOut,
  PieChart,
  Calendar,
  Percent,
  Zap,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UserBet, RechargeRequest, WithdrawalRequest } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBets: UserBet[];
  onOpenRecharge: () => void;
  onOpenClaim: () => void;
  onOpenAuth: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userBets,
  onOpenRecharge,
  onOpenClaim,
  onOpenAuth,
}) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'recharges' | 'withdrawals' | 'bets'>('stats');
  const [recharges, setRecharges] = useState<RechargeRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [copiedUid, setCopiedUid] = useState(false);

  // Subscribe to user recharges
  useEffect(() => {
    if (!isOpen || !currentUser) {
      setRecharges([]);
      return;
    }
    const q = query(
      collection(db, 'recharges'),
      where('userId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as RechargeRequest[];
        list.sort((a, b) => b.createdAt - a.createdAt);
        setRecharges(list);
      },
      (err) => {
        console.warn('Profile: could not fetch recharges:', err);
      }
    );
    return () => unsub();
  }, [isOpen, currentUser]);

  // Subscribe to user withdrawals
  useEffect(() => {
    if (!isOpen || !currentUser) {
      setWithdrawals([]);
      return;
    }
    const q = query(
      collection(db, 'withdrawals'),
      where('userId', '==', currentUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as WithdrawalRequest[];
        list.sort((a, b) => b.createdAt - a.createdAt);
        setWithdrawals(list);
      },
      (err) => {
        console.warn('Profile: could not fetch withdrawals:', err);
      }
    );
    return () => unsub();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Calculate Betting Statistics
  const totalBets = userBets.length;
  const wonBets = userBets.filter((b) => b.status === 'won').length;
  const lostBets = userBets.filter((b) => b.status === 'lost').length;
  const pendingBets = userBets.filter((b) => b.status === 'pending').length;
  const resolvedBets = wonBets + lostBets;

  const winRate = resolvedBets > 0 ? Math.round((wonBets / resolvedBets) * 100) : 0;

  const totalWagered = userBets.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalWon = userBets
    .filter((b) => b.status === 'won')
    .reduce((sum, b) => sum + (b.payout || 0), 0);
  const netProfit = userBets.reduce((sum, b) => {
    if (b.status === 'won') return sum + (b.profit || 0);
    if (b.status === 'lost') return sum - (b.totalAmount || 0);
    return sum;
  }, 0);

  // Category specific stats
  const colorBets = userBets.filter((b) => b.targetType === 'color');
  const numberBets = userBets.filter((b) => b.targetType === 'number');
  const sizeBets = userBets.filter((b) => b.targetType === 'size');

  const colorResolved = colorBets.filter((b) => b.status !== 'pending').length;
  const colorWon = colorBets.filter((b) => b.status === 'won').length;
  const colorWinRate = colorResolved > 0 ? Math.round((colorWon / colorResolved) * 100) : 0;

  const numberResolved = numberBets.filter((b) => b.status !== 'pending').length;
  const numberWon = numberBets.filter((b) => b.status === 'won').length;
  const numberWinRate = numberResolved > 0 ? Math.round((numberWon / numberResolved) * 100) : 0;

  const sizeResolved = sizeBets.filter((b) => b.status !== 'pending').length;
  const sizeWon = sizeBets.filter((b) => b.status === 'won').length;
  const sizeWinRate = sizeResolved > 0 ? Math.round((sizeWon / sizeResolved) * 100) : 0;

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const displayName = userProfile?.displayName || (userProfile?.phoneNumber ? `Player_${userProfile.phoneNumber.slice(-4)}` : currentUser?.email?.split('@')[0]) || 'Trader';
  const displayContact = userProfile?.phoneFormatted || (userProfile?.phoneNumber ? `+91 ${userProfile.phoneNumber}` : currentUser?.email) || 'Trader';
  const coinsBalance = userProfile?.coins ?? 0;
  const memberDate = userProfile?.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recent Trader';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#121b2a] rounded-2xl border border-sky-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white relative border-b border-sky-500/30">
          <div className="absolute top-3 right-3 flex items-center space-x-1.5">
            {currentUser && (
              <button
                type="button"
                disabled={loggingOut}
                onClick={async () => {
                  try {
                    setLoggingOut(true);
                    await logout();
                    onClose();
                  } catch (err) {
                    console.error('Logout error:', err);
                  } finally {
                    setLoggingOut(false);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                title="Log out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile User Info Card */}
          <div className="flex items-start space-x-3.5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-sky-500/25 border-2 border-white/20">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {isAdmin && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[10px]" title="Administrator">
                  <Shield className="w-3 h-3 text-amber-300" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  {displayName}
                </h2>
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 text-[10px] font-extrabold uppercase tracking-wider">
                    Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                    VIP Trader
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 truncate mt-0.5">{displayContact}</p>

              {currentUser && (
                <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-slate-400">
                  <span className="font-mono truncate max-w-[150px] sm:max-w-[200px]">
                    UID: {currentUser.uid}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyUid(currentUser.uid)}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 transition-colors"
                    title="Copy UID"
                  >
                    {copiedUid ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{memberDate}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Balance & Action Strip */}
          <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center font-black text-amber-400 text-sm">
                ₹
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                  INR Balance
                </span>
                <span className="text-base font-black text-amber-300 leading-tight">
                  ₹{coinsBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecharge();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Recharge ₹</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenClaim();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase flex items-center space-x-1 cursor-pointer transition-colors shadow-sm"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Claim</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-[#0e1624] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-[#1a273b] text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Statistics</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recharges')}
            className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer relative ${
              activeTab === 'recharges'
                ? 'bg-[#1a273b] text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Recharges ({recharges.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer relative ${
              activeTab === 'withdrawals'
                ? 'bg-[#1a273b] text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Withdrawals ({withdrawals.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bets')}
            className={`flex-1 py-2.5 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'bets'
                ? 'bg-[#1a273b] text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Bets ({userBets.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 overflow-y-auto space-y-4 max-h-[calc(90vh-230px)]">
          {!currentUser && (
            <div className="p-3 bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/30 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-sky-300 block">
                  You are currently in Guest Mode
                </span>
                <p className="text-[11px] text-slate-400">
                  Sign in with Google to synchronize your balance, recharges, and claims across all devices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase flex items-center space-x-1 cursor-pointer shrink-0 ml-2"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}

          {/* TAB 1: BETTING & WIN RATE STATISTICS */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              {/* Top Key Metrics 4-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Total Bets */}
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                  <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px] font-bold uppercase mb-1">
                    <Zap className="w-3 h-3 text-sky-400" />
                    <span>Total Bets</span>
                  </div>
                  <div className="text-lg font-black text-white">{totalBets}</div>
                  <span className="text-[10px] text-slate-500">Orders Placed</span>
                </div>

                {/* Win Rate */}
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                  <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px] font-bold uppercase mb-1">
                    <Percent className="w-3 h-3 text-emerald-400" />
                    <span>Win Rate</span>
                  </div>
                  <div className={`text-lg font-black ${winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {winRate}%
                  </div>
                  <span className="text-[10px] text-slate-500">{wonBets}W / {lostBets}L</span>
                </div>

                {/* Total Wagered */}
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                  <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px] font-bold uppercase mb-1">
                    <span className="w-3 h-3 text-amber-400 font-bold">₹</span>
                    <span>Total Wagered</span>
                  </div>
                  <div className="text-lg font-black text-amber-300">
                    ₹{totalWagered.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500">INR Bet</span>
                </div>

                {/* Net Profit */}
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center">
                  <div className="flex items-center justify-center space-x-1 text-slate-400 text-[10px] font-bold uppercase mb-1">
                    <TrendingUp className="w-3 h-3 text-indigo-400" />
                    <span>Net Profit</span>
                  </div>
                  <div className={`text-lg font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {netProfit >= 0 ? `+₹${netProfit.toLocaleString()}` : `-₹${Math.abs(netProfit).toLocaleString()}`}
                  </div>
                  <span className="text-[10px] text-slate-500">INR Profit</span>
                </div>
              </div>

              {/* Win / Loss Visual Ratio Bar */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Win / Loss Breakdown</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {wonBets} Won • {lostBets} Lost • {pendingBets} Pending
                  </span>
                </div>

                {resolvedBets > 0 ? (
                  <div className="space-y-1.5">
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${(wonBets / resolvedBets) * 100}%` }}
                        title={`Won: ${wonBets}`}
                      />
                      <div
                        className="bg-rose-500 h-full transition-all duration-500"
                        style={{ width: `${(lostBets / resolvedBets) * 100}%` }}
                        title={`Lost: ${lostBets}`}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span className="text-emerald-400 font-bold">Won: {wonBets} ({winRate}%)</span>
                      <span className="text-rose-400 font-bold">Lost: {lostBets} ({100 - winRate}%)</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-1">
                    Place your first game bet to see your live win rate ratio!
                  </p>
                )}
              </div>

              {/* Performance by Category */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Target Category Performance
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Colors */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-emerald-400">Colors (G/V/R)</span>
                      <span className="font-black text-white">{colorWinRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full"
                        style={{ width: `${colorWinRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{colorBets.length} Bets</span>
                      <span>{colorWon} Won</span>
                    </div>
                  </div>

                  {/* Numbers 0-9 */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-purple-400">Numbers (0-9)</span>
                      <span className="font-black text-white">{numberWinRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-400 h-full"
                        style={{ width: `${numberWinRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{numberBets.length} Bets</span>
                      <span>{numberWon} Won (9x)</span>
                    </div>
                  </div>

                  {/* Big / Small */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-amber-400">Big / Small</span>
                      <span className="font-black text-white">{sizeWinRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full"
                        style={{ width: `${sizeWinRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{sizeBets.length} Bets</span>
                      <span>{sizeWon} Won (2x)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECHARGE REQUESTS HISTORY */}
          {activeTab === 'recharges' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">
                  Wallet Recharges ({recharges.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRecharge();
                  }}
                  className="text-xs font-bold text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>New Deposit</span>
                </button>
              </div>

              {recharges.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 space-y-2">
                  <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No recharge requests found</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRecharge();
                    }}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs uppercase"
                  >
                    Deposit INR Now
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recharges.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {req.gatewayType}
                          </span>
                          <span className="text-xs font-bold text-white">
                            +₹{req.coins.toLocaleString()} INR
                          </span>
                        </div>

                        {req.status === 'approved' && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </span>
                        )}
                        {req.status === 'pending' && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Verification Pending</span>
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Paid Amount:</span>
                          <span className="text-slate-200 font-mono">{req.amount} Currency</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transaction ID:</span>
                          <span className="text-amber-300 font-mono truncate max-w-[200px]">
                            {req.transactionId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Requested:</span>
                          <span>{new Date(req.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WITHDRAWAL REQUESTS HISTORY */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">
                  Withdrawal Claims ({withdrawals.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenClaim();
                  }}
                  className="text-xs font-bold text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Claim Winnings</span>
                </button>
              </div>

              {withdrawals.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 space-y-2">
                  <ArrowUpRight className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No withdrawal claims found</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenClaim();
                    }}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase"
                  >
                    Claim Winnings Now
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {withdrawals.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {req.method}
                          </span>
                          <span className="text-xs font-bold text-white">
                            ₹{req.coinsAmount.toLocaleString()} INR
                          </span>
                        </div>

                        {req.status === 'completed' && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid Out</span>
                          </span>
                        )}
                        {req.status === 'pending' && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Processing (36h max)</span>
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" />
                            <span>Refunded / Rejected</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Payout Target:</span>
                          <span className="text-emerald-300 font-mono truncate max-w-[200px]">
                            {req.accountDetails}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Claimed Date:</span>
                          <span>{new Date(req.createdAt).toLocaleString()}</span>
                        </div>
                        {req.status === 'pending' && (
                          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] mt-1">
                            ℹ️ Funds are securely dispatched to your account within 36 hours.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BETS LOG */}
          {activeTab === 'bets' && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Recent Bets ({userBets.length})</span>
                <span className="text-slate-400 font-medium">Sorted by latest</span>
              </div>

              {userBets.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-400">
                  No bets placed yet. Select Green, Red, Violet, Big, Small, or Numbers to start!
                </div>
              ) : (
                <div className="space-y-2">
                  {userBets.slice(0, 30).map((bet) => (
                    <div
                      key={bet.id}
                      className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-slate-400 text-[11px]">
                            Period: {bet.period.slice(-5)}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                            {bet.mode}
                          </span>
                          <span className="font-bold text-white capitalize">
                            {bet.targetType}: {String(bet.targetValue)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Amount: ₹{bet.totalAmount} INR • {new Date(bet.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="text-right">
                        {bet.status === 'won' && (
                          <div>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                              +₹{bet.payout} Won
                            </span>
                            <span className="block text-[10px] text-emerald-300 font-medium mt-0.5">
                              Profit: +₹{bet.profit}
                            </span>
                          </div>
                        )}
                        {bet.status === 'lost' && (
                          <div>
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                              -₹{bet.totalAmount} Lost
                            </span>
                          </div>
                        )}
                        {bet.status === 'pending' && (
                          <div>
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                              Waiting Result
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Account Status & Logout */}
        <div className="p-3 bg-[#0d1522] border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Account Active</span>
          </div>

          {currentUser ? (
            <button
              type="button"
              disabled={loggingOut}
              onClick={async () => {
                try {
                  setLoggingOut(true);
                  await logout();
                  onClose();
                } catch (err) {
                  console.error('Logout error:', err);
                } finally {
                  setLoggingOut(false);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? 'Logging out...' : 'Log Out Account'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Mini helper PlusIcon
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
