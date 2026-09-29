import React, { useState, useEffect } from 'react';
import {
  Users,
  Coins,
  Send,
  Copy,
  Check,
  Share2,
  TrendingUp,
  History,
  ShieldCheck,
  LogOut,
  Search,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Clock,
  UserCheck,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UserProfile, CoinTransferRecord } from '../types';

export const SubadminPortal: React.FC = () => {
  const { userProfile, currentUser, logout, distributeCoins } = useAuth();

  // Subadmin's referred users
  const [myUsers, setMyUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Transfers history
  const [myTransfers, setMyTransfers] = useState<CoinTransferRecord[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<'users' | 'transfers'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  // Distribute Modal
  const [distributeModalOpen, setDistributeModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [amountInput, setAmountInput] = useState<string>('500');
  const [noteInput, setNoteInput] = useState<string>('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralCode = userProfile?.referralCode || 'PARTNER';
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${referralCode}` : '';

  // 1. Subscribe to users referred by this subadmin
  useEffect(() => {
    if (!currentUser) return;

    // Query players who have referredBy === currentUser.uid
    const q1 = query(
      collection(db, 'users'),
      where('referredBy', '==', currentUser.uid)
    );

    const unsub = onSnapshot(
      q1,
      (snapshot) => {
        const users = snapshot.docs.map((doc) => doc.data() as UserProfile);
        setMyUsers(users);
        setLoadingUsers(false);
      },
      (err) => {
        console.warn('Subadmin referred users listener error:', err.message);
        setLoadingUsers(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // 2. Subscribe to transfer records from this subadmin
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'transfers'),
      where('fromUid', '==', currentUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const transfers = snapshot.docs.map((doc) => doc.data() as CoinTransferRecord);
        // Sort newest first
        transfers.sort((a, b) => b.timestamp - a.timestamp);
        setMyTransfers(transfers);
        setLoadingTransfers(false);
      },
      (err) => {
        console.warn('Subadmin transfers listener error:', err.message);
        setLoadingTransfers(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenDistribute = (user?: UserProfile) => {
    if (user) {
      setSelectedUser(user);
    } else if (myUsers.length > 0 && !selectedUser) {
      setSelectedUser(myUsers[0]);
    }
    setTransferError(null);
    setTransferSuccess(null);
    setDistributeModalOpen(true);
  };

  const handleExecuteDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    setTransferSuccess(null);

    if (!selectedUser) {
      setTransferError('Please select a player.');
      return;
    }

    const amount = Number(amountInput);
    if (!amount || amount <= 0) {
      setTransferError('Please enter a valid coin amount greater than 0.');
      return;
    }

    const currentBalance = userProfile?.coins || 0;
    if (amount > currentBalance) {
      setTransferError(`Insufficient subadmin balance. You currently have ₹${currentBalance.toLocaleString()}.`);
      return;
    }

    setTransferring(true);
    try {
      await distributeCoins(selectedUser.uid, amount, noteInput.trim() || undefined);
      setTransferSuccess(`Successfully credited ₹${amount.toLocaleString()} to ${selectedUser.displayName || selectedUser.email}!`);
      setAmountInput('');
      setNoteInput('');
      setTimeout(() => {
        setDistributeModalOpen(false);
        setTransferSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTransferError(err.message);
      } else {
        setTransferError('Failed to transfer coins.');
      }
    } finally {
      setTransferring(false);
    }
  };

  const filteredUsers = myUsers.filter((u) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = u.displayName?.toLowerCase().includes(term);
    const emailMatch = u.email.toLowerCase().includes(term);
    const phoneMatch = u.phoneNumber?.includes(term);
    return nameMatch || emailMatch || phoneMatch;
  });

  const totalDistributed = userProfile?.totalCoinsDistributed || 0;

  return (
    <div className="min-h-screen bg-[#0a101d] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Navbar */}
      <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black tracking-tight text-white">
                  WinGo Partner Portal
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Subadmin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {userProfile?.displayName || userProfile?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Balance Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block leading-tight">
                  Available Coins
                </span>
                <span className="text-sm font-black text-amber-300 font-mono">
                  ₹{(userProfile?.coins || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        {/* Banner with Referral Card and Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Referral Code & Link */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Share2 className="w-4 h-4" />
                <span>My Referral Code</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Auto-Links New Players</span>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-cyan-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">
                  Partner Code
                </span>
                <span className="text-xl font-black text-cyan-300 font-mono tracking-widest">
                  {referralCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow transition-all"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Player Invite Link'}</span>
            </button>
          </div>

          {/* Card 2: Coin Distribution Controller */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Distribute Coins to Users</span>
              </div>
              <p className="text-xs text-slate-300">
                Transfer coins directly to players registered under your referral code.
              </p>
            </div>

            <div className="p-3 bg-black/40 rounded-xl border border-indigo-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-bold block">
                  Subadmin Balance
                </span>
                <span className="text-lg font-black text-amber-300 font-mono">
                  ₹{(userProfile?.coins || 0).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenDistribute()}
                disabled={myUsers.length === 0 || (userProfile?.coins || 0) <= 0}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs uppercase flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Coins</span>
              </button>
            </div>
          </div>

          {/* Card 3: Performance Metrics */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#121c2c] border border-slate-800 shadow-xl grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-bold uppercase">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>My Players</span>
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">{myUsers.length}</div>
                <span className="text-[10px] text-slate-500">From Referral Code</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-bold uppercase">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Total Distributed</span>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  ₹{totalDistributed.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">{myTransfers.length} Transfers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls: My Players / Transfer History */}
        <div className="flex border-b border-slate-800 space-x-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-2.5 px-4 rounded-t-xl flex items-center space-x-2 transition-colors cursor-pointer border-t border-x ${
              activeTab === 'users'
                ? 'bg-slate-900 text-cyan-400 border-slate-700 border-b-2 border-b-cyan-400'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>My Referred Players ({myUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className={`py-2.5 px-4 rounded-t-xl flex items-center space-x-2 transition-colors cursor-pointer border-t border-x ${
              activeTab === 'transfers'
                ? 'bg-slate-900 text-cyan-400 border-slate-700 border-b-2 border-b-cyan-400'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Coin Transfer History ({myTransfers.length})</span>
          </button>
        </div>

        {/* Tab 1: My Referred Players Table */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search player name, phone..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="text-xs text-slate-400">
                Subadmins can view and distribute coins to their referred users only.
              </div>
            </div>

            {loadingUsers ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                Loading referred players...
              </div>
            ) : myUsers.length === 0 ? (
              <div className="p-10 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mx-auto flex items-center justify-center text-cyan-400">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">No Players Registered Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Share your referral code <span className="text-cyan-300 font-mono font-bold">{referralCode}</span> with players. When they register using your code or link, they will appear here automatically!
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase inline-flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Player Invite Link</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0e1624]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141f30] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-3 px-3.5">Player / Mobile</th>
                      <th className="py-3 px-3.5 text-right">Coins Balance (₹)</th>
                      <th className="py-3 px-3.5 text-center">Games Played</th>
                      <th className="py-3 px-3.5 text-center">AI Stage</th>
                      <th className="py-3 px-3.5 text-center">Registered Date</th>
                      <th className="py-3 px-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredUsers.map((u) => {
                      const count = u.gamesPlayedCount ?? 0;
                      return (
                        <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-white flex items-center space-x-1.5">
                              <span>{u.displayName || 'Player'}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {u.phoneFormatted || u.email}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-300">
                            ₹{u.coins.toLocaleString()}
                          </td>
                          <td className="py-3 px-3.5 text-center font-mono">
                            {count} games
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {count === 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                1/3 (Win)
                              </span>
                            )}
                            {count === 1 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                2/3 (Lose)
                              </span>
                            )}
                            {count === 2 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                3/3 (Win)
                              </span>
                            )}
                            {count >= 3 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                                Old Player
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenDistribute(u)}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center space-x-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send Coins</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Coin Distribution History Table */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-300">
              Audit Log of Coins Distributed to Your Players
            </h3>

            {loadingTransfers ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                Loading transfer records...
              </div>
            ) : myTransfers.length === 0 ? (
              <div className="p-10 text-center space-y-2 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs font-bold text-slate-300">No Coins Distributed Yet</h4>
                <p className="text-[11px] text-slate-500">
                  When you distribute coins to your players, every transaction record will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0e1624]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141f30] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-3 px-3.5">Recipient Player</th>
                      <th className="py-3 px-3.5 text-right">Amount (₹)</th>
                      <th className="py-3 px-3.5">Note / Reason</th>
                      <th className="py-3 px-3.5 text-right">Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {myTransfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-white">{t.toName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{t.toEmail}</div>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                          +₹{t.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-slate-300 text-[11px]">
                          {t.note || 'Coin Distribution'}
                        </td>
                        <td className="py-3 px-3.5 text-right text-slate-400 font-mono text-[11px]">
                          {new Date(t.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Distribute Coins */}
      {distributeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md bg-[#111928] rounded-3xl border border-slate-700 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Send className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Distribute Coins to Player</h3>
                  <span className="text-[10px] text-slate-400">
                    Deducts from your balance and credits user immediately
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDistributeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {transferError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{transferError}</span>
              </div>
            )}

            {transferSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{transferSuccess}</span>
              </div>
            )}

            <form onSubmit={handleExecuteDistribute} className="space-y-3.5 text-xs">
              {/* Select Player */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Select Player
                </label>
                <select
                  value={selectedUser?.uid || ''}
                  onChange={(e) => {
                    const found = myUsers.find((u) => u.uid === e.target.value);
                    if (found) setSelectedUser(found);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs"
                >
                  {myUsers.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName || 'Player'} ({u.phoneFormatted || u.email}) - Current: ₹{u.coins}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount to Send */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Coins Amount (₹)
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">
                    Available: ₹{(userProfile?.coins || 0).toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={userProfile?.coins || 0}
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                />

                {/* Quick Chips */}
                <div className="flex items-center space-x-1.5 pt-1">
                  {[100, 500, 1000, 2000, 5000].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setAmountInput(String(chip))}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      +₹{chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Reason */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Note / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="e.g. Offline cash deposit received, or player bonus"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={transferring}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 mt-2"
              >
                <Send className="w-4 h-4" />
                <span>{transferring ? 'Transferring Coins...' : `Credit ₹${Number(amountInput || 0).toLocaleString()} to Player`}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
