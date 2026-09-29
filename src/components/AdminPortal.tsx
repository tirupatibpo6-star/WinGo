import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Coins,
  Share2,
  TrendingUp,
  History,
  CreditCard,
  ArrowUpRight,
  Sliders,
  LogOut,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Cpu,
  Sparkles,
  AlertCircle,
  Send,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  UserProfile,
  PaymentGateway,
  RechargeRequest,
  WithdrawalRequest,
  GatewayType,
  CoinTransferRecord,
} from '../types';

export const AdminPortal: React.FC = () => {
  const {
    currentUser,
    userProfile,
    isAdmin,
    logout,
    systemSettings,
    assignSubadmin,
    assignSubadminCoins,
    demoteSubadmin,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'subadmins' | 'users' | 'transfers' | 'recharges' | 'withdrawals' | 'gateways' | 'settings'
  >('subadmins');

  // Firestore collections
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [recharges, setRecharges] = useState<RechargeRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [transfers, setTransfers] = useState<CoinTransferRecord[]>([]);

  // Subadmin Assign Modal
  const [showAssignSubadminModal, setShowAssignSubadminModal] = useState(false);
  const [selectedUserUid, setSelectedUserUid] = useState('');
  const [newSubadminCode, setNewSubadminCode] = useState('');
  const [initialCoinsInput, setInitialCoinsInput] = useState('10000');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [submittingSubadmin, setSubmittingSubadmin] = useState(false);

  // Subadmin Top-up Modal
  const [topupModalSubadmin, setTopupModalSubadmin] = useState<UserProfile | null>(null);
  const [topupAmountInput, setTopupAmountInput] = useState('5000');
  const [topupNoteInput, setTopupNoteInput] = useState('');
  const [topupError, setTopupError] = useState<string | null>(null);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);
  const [submittingTopup, setSubmittingTopup] = useState(false);

  // Edit single user balance modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userCoinsInput, setUserCoinsInput] = useState('');

  // Gateway form state
  const [showAddGateway, setShowAddGateway] = useState(false);
  const [gwType, setGwType] = useState<GatewayType>('upi');
  const [gwTitle, setGwTitle] = useState('');
  const [gwDetails, setGwDetails] = useState('');
  const [gwQrUrl, setGwQrUrl] = useState('');
  const [gwRate, setGwRate] = useState<string>('1');
  const [gwInstructions, setGwInstructions] = useState('');

  // Settings form state
  const [startingBalance, setStartingBalance] = useState<string>(
    String(systemSettings.defaultStartingCoins ?? 0)
  );
  const [winRate, setWinRate] = useState<string>(
    String(systemSettings.winRatePercentage ?? 18)
  );
  const [minWithdrawInput, setMinWithdrawInput] = useState<string>(
    String(systemSettings.minWithdrawCoins ?? 5000)
  );
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'subadmin' | 'admin'>('all');

  // Subscriptions - only subscribe when user is authenticated as Admin
  useEffect(() => {
    if (!currentUser || !isAdmin) return;

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...d.data() } as UserProfile));
        setUsersList(list);
      },
      (err) => {
        console.warn('AdminPortal users listener error:', err.message);
      }
    );

    const unsubGateways = onSnapshot(
      collection(db, 'gateways'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentGateway));
        setGateways(list);
      },
      (err) => {
        console.warn('AdminPortal gateways listener error:', err.message);
      }
    );

    const unsubRecharges = onSnapshot(
      collection(db, 'recharges'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RechargeRequest));
        list.sort((a, b) => b.createdAt - a.createdAt);
        setRecharges(list);
      },
      (err) => {
        console.warn('AdminPortal recharges listener error:', err.message);
      }
    );

    const unsubWithdrawals = onSnapshot(
      collection(db, 'withdrawals'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WithdrawalRequest));
        list.sort((a, b) => b.createdAt - a.createdAt);
        setWithdrawals(list);
      },
      (err) => {
        console.warn('AdminPortal withdrawals listener error:', err.message);
      }
    );

    const unsubTransfers = onSnapshot(
      collection(db, 'transfers'),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...d.data() } as CoinTransferRecord));
        list.sort((a, b) => b.timestamp - a.timestamp);
        setTransfers(list);
      },
      (err) => {
        console.warn('AdminPortal transfers listener error:', err.message);
      }
    );

    return () => {
      unsubUsers();
      unsubGateways();
      unsubRecharges();
      unsubWithdrawals();
      unsubTransfers();
    };
  }, [currentUser, isAdmin]);

  // Subadmins list
  const subadminsList = usersList.filter((u) => u.role === 'subadmin');

  // Generate random referral code suggestion
  const generateRandomCode = () => {
    const letters = 'VIP,ROYAL,WIN,TOP,LUCKY,ACE'.split(',');
    const prefix = letters[Math.floor(Math.random() * letters.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${prefix}${num}`;
  };

  const handleOpenAssignModal = (user?: UserProfile) => {
    if (user) {
      setSelectedUserUid(user.uid);
    } else if (usersList.length > 0) {
      setSelectedUserUid(usersList[0].uid);
    }
    setNewSubadminCode(generateRandomCode());
    setInitialCoinsInput('10000');
    setAssignError(null);
    setAssignSuccess(null);
    setShowAssignSubadminModal(true);
  };

  const handleCreateSubadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);
    setAssignSuccess(null);

    if (!selectedUserUid) {
      setAssignError('Please select a user to promote to Subadmin.');
      return;
    }
    if (!newSubadminCode.trim()) {
      setAssignError('Referral code is required.');
      return;
    }

    const coins = Number(initialCoinsInput) || 0;
    setSubmittingSubadmin(true);
    try {
      await assignSubadmin(selectedUserUid, newSubadminCode.trim(), coins);
      setAssignSuccess(`User successfully promoted to Subadmin with referral code "${newSubadminCode.toUpperCase()}"!`);
      setTimeout(() => {
        setShowAssignSubadminModal(false);
        setAssignSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAssignError(err.message);
      } else {
        setAssignError('Failed to assign subadmin.');
      }
    } finally {
      setSubmittingSubadmin(false);
    }
  };

  const handleOpenTopup = (sub: UserProfile) => {
    setTopupModalSubadmin(sub);
    setTopupAmountInput('5000');
    setTopupNoteInput('');
    setTopupError(null);
    setTopupSuccess(null);
  };

  const handleExecuteTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupModalSubadmin) return;
    setTopupError(null);
    setTopupSuccess(null);

    const amount = Number(topupAmountInput);
    if (!amount || amount <= 0) {
      setTopupError('Enter a valid amount greater than 0.');
      return;
    }

    setSubmittingTopup(true);
    try {
      await assignSubadminCoins(topupModalSubadmin.uid, amount, topupNoteInput.trim() || undefined);
      setTopupSuccess(`Successfully added ₹${amount.toLocaleString()} to ${topupModalSubadmin.displayName || topupModalSubadmin.email}!`);
      setTimeout(() => {
        setTopupModalSubadmin(null);
        setTopupSuccess(null);
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setTopupError(err.message);
      } else {
        setTopupError('Failed to top-up coins.');
      }
    } finally {
      setSubmittingTopup(false);
    }
  };

  const handleDemote = async (sub: UserProfile) => {
    if (!window.confirm(`Are you sure you want to demote subadmin ${sub.displayName || sub.email} back to regular player?`)) {
      return;
    }
    try {
      await demoteSubadmin(sub.uid);
    } catch (err) {
      console.error('Demote failed:', err);
    }
  };

  const handleResetUserStage = async (user: UserProfile) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        gamesPlayedCount: 0,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error('Reset AI stage failed:', err);
    }
  };

  const handleToggleBlock = async (user: UserProfile) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        isBlocked: !user.isBlocked,
        updatedAt: Date.now(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSaveCoins = async () => {
    if (!editingUser) return;
    const amount = Number(userCoinsInput);
    if (isNaN(amount) || amount < 0) return;

    try {
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, {
        coins: amount,
        updatedAt: Date.now(),
      });
      setEditingUser(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${editingUser.uid}`);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = Number(startingBalance) || 0;
    const rate = Math.min(20, Math.max(15, Number(winRate) || 18));
    const minWithdraw = Math.max(100, Number(minWithdrawInput) || 5000);

    try {
      await setDoc(
        doc(db, 'settings', 'config'),
        {
          defaultStartingCoins: balance,
          winRatePercentage: rate,
          minWithdrawCoins: minWithdraw,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/config');
    }
  };

  const handleProcessRecharge = async (req: RechargeRequest, newStatus: 'approved' | 'rejected') => {
    try {
      const recRef = doc(db, 'recharges', req.id);
      await updateDoc(recRef, {
        status: newStatus,
        approvedAt: Date.now(),
      });

      if (newStatus === 'approved') {
        const userRef = doc(db, 'users', req.userId);
        const userSnap = await usersList.find((u) => u.uid === req.userId);
        const currentCoins = userSnap ? userSnap.coins : 0;
        const currentCount = userSnap?.totalRechargesCount || 0;

        await updateDoc(userRef, {
          coins: currentCoins + req.coins,
          hasRechargedToday: true,
          totalRechargesCount: currentCount + 1,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `recharges/${req.id}`);
    }
  };

  const handleProcessWithdrawal = async (req: WithdrawalRequest, newStatus: 'completed' | 'rejected') => {
    try {
      const withRef = doc(db, 'withdrawals', req.id);
      await updateDoc(withRef, {
        status: newStatus,
        processedAt: Date.now(),
      });

      if (newStatus === 'rejected') {
        const userRef = doc(db, 'users', req.userId);
        const userSnap = await usersList.find((u) => u.uid === req.userId);
        const currentCoins = userSnap ? userSnap.coins : 0;

        await updateDoc(userRef, {
          coins: currentCoins + req.coinsAmount,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `withdrawals/${req.id}`);
    }
  };

  const handleAddGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newGwRef = doc(collection(db, 'gateways'));
      const newGw: PaymentGateway = {
        id: newGwRef.id,
        type: gwType,
        title: gwTitle,
        details: gwDetails,
        qrImageUrl: gwQrUrl.trim() || undefined,
        ratePerCoin: Number(gwRate) || 1,
        instructions: gwInstructions.trim() || undefined,
        isActive: true,
        createdAt: Date.now(),
      };
      await setDoc(newGwRef, newGw);
      setShowAddGateway(false);
      setGwTitle('');
      setGwDetails('');
      setGwQrUrl('');
      setGwInstructions('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'gateways');
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = u.displayName?.toLowerCase().includes(term);
    const emailMatch = u.email.toLowerCase().includes(term);
    const phoneMatch = u.phoneNumber?.includes(term);
    const codeMatch = u.referralCode?.toLowerCase().includes(term) || u.referredByCode?.toLowerCase().includes(term);
    const roleMatch = userRoleFilter === 'all' || u.role === userRoleFilter;
    return (nameMatch || emailMatch || phoneMatch || codeMatch) && roleMatch;
  });

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-black tracking-tight text-white">
                  WinGo Master Admin Portal
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Full Authority
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {userProfile?.email} (Admin will not play game)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Players</span>
              <span className="text-sm font-black text-white font-mono">{usersList.length}</span>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Subadmins</span>
              <span className="text-sm font-black text-cyan-300 font-mono">{subadminsList.length}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="bg-[#0c1424] border-b border-slate-800 sticky top-14 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto text-xs font-bold py-1">
          <button
            type="button"
            onClick={() => setActiveTab('subadmins')}
            className={`py-2 px-3.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors shrink-0 ${
              activeTab === 'subadmins'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Subadmins ({subadminsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors shrink-0 ${
              activeTab === 'users'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Users ({usersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className={`py-2 px-3.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors shrink-0 ${
              activeTab === 'transfers'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Coin Distributions ({transfers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recharges')}
            className={`py-2 px-3.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors shrink-0 relative ${
              activeTab === 'recharges'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Recharges ({recharges.filter((r) => r.status === 'pending').length} pending)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('withdrawals')}
            className={`py-2 px-3.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors shrink-0 relative ${
              activeTab === 'withdrawals'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Claims ({withdrawals.filter((w) => w.status === 'pending').length} pending)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gateways')}
            className={`py-2 px-3.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors shrink-0 ${
              activeTab === 'gateways'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Gateways ({gateways.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-3.5 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors shrink-0 ${
              activeTab === 'settings'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AI &amp; System Settings</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        {/* TAB 1: SUBADMINS MANAGEMENT */}
        {activeTab === 'subadmins' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-white flex items-center space-x-2">
                  <span>Subadmin Partners</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                    {subadminsList.length} Partners
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Admin assigns subadmins with coins. Subadmins can distribute coins to users registered under their referral code only.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAssignModal()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-black text-xs uppercase flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Assign New Subadmin</span>
              </button>
            </div>

            {subadminsList.length === 0 ? (
              <div className="p-12 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                <Share2 className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Subadmins Assigned Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click &ldquo;Assign New Subadmin&rdquo; to promote any registered player to Subadmin, give them coins, and assign a unique referral code.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase cursor-pointer"
                >
                  Assign First Subadmin
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0e1624]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141f30] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-3 px-3.5">Subadmin Partner</th>
                      <th className="py-3 px-3.5 text-center">Referral Code</th>
                      <th className="py-3 px-3.5 text-right">Available Coins (₹)</th>
                      <th className="py-3 px-3.5 text-center">Referred Players</th>
                      <th className="py-3 px-3.5 text-right">Coins Distributed</th>
                      <th className="py-3 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {subadminsList.map((sub) => {
                      const referredCount = usersList.filter(
                        (u) => u.referredBy === sub.uid || (sub.referralCode && u.referredByCode === sub.referralCode)
                      ).length;

                      return (
                        <tr key={sub.uid} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-white flex items-center space-x-1.5">
                              <span>{sub.displayName || 'Subadmin'}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {sub.phoneFormatted || sub.email}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-black border border-cyan-500/40 text-xs tracking-wider">
                              {sub.referralCode || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-300">
                            ₹{sub.coins.toLocaleString()}
                          </td>
                          <td className="py-3 px-3.5 text-center font-mono font-bold text-white">
                            {referredCount} users
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono text-emerald-400 font-bold">
                            ₹{(sub.totalCoinsDistributed || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3.5 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenTopup(sub)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold cursor-pointer transition-colors inline-flex items-center space-x-1"
                              title="Assign/Top-up more coins for this subadmin to distribute"
                            >
                              <Coins className="w-3 h-3" />
                              <span>Assign Coins</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setUserRoleFilter('user');
                                setSearchTerm(sub.referralCode || sub.uid);
                                setActiveTab('users');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              Check Users
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDemote(sub)}
                              className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold cursor-pointer transition-colors"
                              title="Demote to regular user"
                            >
                              Demote
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

        {/* TAB 2: ALL USERS MASTER TABLE */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search player, phone, referral code..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Regular Players Only</option>
                  <option value="subadmin">Subadmins Only</option>
                  <option value="admin">Master Admins</option>
                </select>
              </div>

              <div className="text-xs text-slate-400">
                Master Admin can view and manage every user across the entire platform.
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0e1624]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141f30] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-3.5">Player / Mobile</th>
                    <th className="py-3 px-3.5">Role</th>
                    <th className="py-3 px-3.5 text-right">Coins (₹)</th>
                    <th className="py-3 px-3.5 text-center">Referred By (Subadmin)</th>
                    <th className="py-3 px-3.5 text-center">AI Stage</th>
                    <th className="py-3 px-3.5 text-center">Recharged Today</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredUsers.map((u) => {
                    const count = u.gamesPlayedCount ?? 0;
                    return (
                      <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-white">{u.displayName || 'Player'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {u.phoneFormatted || u.email}
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              u.role === 'admin'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : u.role === 'subadmin'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-300">
                          ₹{u.coins.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {u.referredByCode ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                              {u.referredByName || u.referredByCode} ({u.referredByCode})
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Direct Signup</span>
                          )}
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
                              Old ({count} played)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {u.hasRechargedToday ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              Yes
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">No</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setUserCoinsInput(String(u.coins));
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold cursor-pointer"
                          >
                            Set Coins
                          </button>
                          {u.role === 'user' && (
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(u)}
                              className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-[11px] font-bold cursor-pointer"
                              title="Make this player a Subadmin"
                            >
                              Make Subadmin
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleResetUserStage(u)}
                            className="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 text-[11px] font-bold cursor-pointer"
                            title="Reset to 1st Game (Win)"
                          >
                            Reset AI
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(u)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                              u.isBlocked
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {u.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: COIN DISTRIBUTIONS AUDIT */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-white">
              Platform Coin Distribution Audit Log
            </h2>
            <p className="text-xs text-slate-400">
              Tracks all coins assigned by Admin to Subadmins, and coins distributed by Subadmins to their players.
            </p>

            {transfers.length === 0 ? (
              <div className="p-10 text-center space-y-2 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                <History className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-xs font-bold text-slate-300">No Transfers Logged Yet</h4>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0e1624]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141f30] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-3 px-3.5">From</th>
                      <th className="py-3 px-3.5">To (Recipient)</th>
                      <th className="py-3 px-3.5 text-right">Amount (₹)</th>
                      <th className="py-3 px-3.5">Note</th>
                      <th className="py-3 px-3.5 text-right">Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase mr-1.5 ${
                              t.fromRole === 'admin'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            }`}
                          >
                            {t.fromRole}
                          </span>
                          <span className="font-bold text-white">{t.fromName}</span>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-white">{t.toName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{t.toEmail}</div>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400">
                          ₹{t.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-slate-300 text-[11px]">{t.note}</td>
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

        {/* TAB 4: RECHARGES */}
        {activeTab === 'recharges' && (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-white">Player Coin Recharge Requests</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0e1624]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141f30] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-3.5">User</th>
                    <th className="py-3 px-3.5">Gateway</th>
                    <th className="py-3 px-3.5 text-right">Fiat / Coins</th>
                    <th className="py-3 px-3.5">Transaction ID / UTR</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {recharges.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-white">{r.userEmail}</td>
                      <td className="py-3 px-3.5 uppercase font-mono text-[11px]">{r.gatewayType}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-300">
                        ₹{r.amount} / {r.coins} coins
                      </td>
                      <td className="py-3 px-3.5 font-mono text-cyan-300 text-[11px]">{r.transactionId}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : r.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        {r.status === 'pending' ? (
                          <div className="inline-flex space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleProcessRecharge(r, 'approved')}
                              className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProcessRecharge(r, 'rejected')}
                              className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[11px] font-bold cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: WITHDRAWALS */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <h2 className="text-sm font-black text-white">Player Winning Claim Requests</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0e1624]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141f30] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-3.5">User</th>
                    <th className="py-3 px-3.5">Method</th>
                    <th className="py-3 px-3.5 text-right">Coins to Withdraw</th>
                    <th className="py-3 px-3.5">Account / UPI Details</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-white">{w.userEmail}</td>
                      <td className="py-3 px-3.5 uppercase font-mono text-[11px]">{w.method}</td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-amber-300">
                        ₹{w.coinsAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-cyan-300 text-[11px]">{w.accountDetails}</td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : w.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        {w.status === 'pending' ? (
                          <div className="inline-flex space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleProcessWithdrawal(w, 'completed')}
                              className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] cursor-pointer"
                            >
                              Mark Deposited
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProcessWithdrawal(w, 'rejected')}
                              className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[11px] font-bold cursor-pointer"
                            >
                              Reject &amp; Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: GATEWAYS */}
        {activeTab === 'gateways' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-white">Recharge Payment Gateways</h2>
                <p className="text-xs text-slate-400">
                  Configure UPI IDs, Binance IDs, TRC20 wallet addresses, and QR codes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddGateway(!showAddGateway)}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase flex items-center space-x-1.5 cursor-pointer shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddGateway ? 'Cancel' : 'Add New Gateway'}</span>
              </button>
            </div>

            {showAddGateway && (
              <form onSubmit={handleAddGateway} className="p-4 bg-slate-900 rounded-2xl border border-cyan-500/40 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 uppercase">Gateway Type</label>
                    <select
                      value={gwType}
                      onChange={(e) => setGwType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white mt-1"
                    >
                      <option value="upi">UPI (GPay, PhonePe, Paytm)</option>
                      <option value="binance">Binance Pay ID</option>
                      <option value="trc20">USDT (TRC20 Wallet Address)</option>
                      <option value="qr">Direct QR Code Payment</option>
                      <option value="custom">Custom Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 uppercase">Display Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Official UPI Payment"
                      value={gwTitle}
                      onChange={(e) => setGwTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 uppercase">Payment Details (UPI ID / Address)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. wingopay@okaxis"
                    value={gwDetails}
                    onChange={(e) => setGwDetails(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono mt-1"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-wider cursor-pointer"
                >
                  Create Gateway
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {gateways.map((gw) => (
                <div key={gw.id} className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-xs">{gw.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      {gw.type}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg text-cyan-400 font-mono text-[11px] truncate">
                    {gw.details}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: AI & SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto space-y-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">AI Player Detection &amp; Draw Algorithm</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  New player detection, 1st/2nd/3rd game sequence &amp; strict 15-20% house algorithm.
                </p>
              </div>
            </div>

            {/* AI Rules Breakdown Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center space-x-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Detection Sequence (New vs Old)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30 uppercase">
                  Active &amp; Enforced
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-[#0e1624] border border-emerald-500/30">
                  <div className="font-bold text-emerald-300">1. Game 1 (1st Win)</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    New player wins 1st game on whatever color, no., or size they bet on.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0e1624] border border-amber-500/30">
                  <div className="font-bold text-amber-300">2. Game 2 (Loss)</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Player loses 2nd game (system selects non-matching outcome).
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0e1624] border border-purple-500/30">
                  <div className="font-bold text-purple-300">3. Game 3 (2nd Win)</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    New player wins 3rd game on whatever color, no., or size they bet on.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0e1624] border border-sky-500/30 text-[11px] text-slate-300">
                <div className="font-bold text-sky-300">
                  4. After 3rd Game (Old Player Strict Algorithm):
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Strict algorithm where only <strong>15% to 20%</strong> of players win (decided randomly).
                  The winning outcome chosen is whichever number, color, or big/small has the <strong>minimum bet amount or minimum bettors</strong>, or the number/color in which <strong>no one bet</strong> (zero liability).
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-200 block uppercase tracking-wider text-[11px]">
                    Strict AI Win Rate for Old Players (15% - 20%)
                  </label>
                  <span className="text-amber-400 font-mono font-black text-sm bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                    {winRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="20"
                  step="1"
                  value={winRate}
                  onChange={(e) => setWinRate(e.target.value)}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>15% Strict Minimum</span>
                  <span className="text-amber-400 font-bold">Selected: {winRate}% Player Win / {100 - parseFloat(winRate || '18')}% House Win</span>
                  <span>20% Strict Maximum</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 block uppercase tracking-wider text-[11px]">
                  Default Starting Balance for New Signups (INR ₹)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-200 block uppercase tracking-wider text-[11px]">
                  Minimum Player Withdrawal Amount (INR ₹)
                </label>
                <input
                  type="number"
                  min="100"
                  required
                  value={minWithdrawInput}
                  onChange={(e) => setMinWithdrawInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400">
                  Player claims below this limit will be rejected automatically.
                </span>
              </div>

              {settingsSaved && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-center">
                  Settings successfully saved!
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-white font-black uppercase tracking-wider shadow-lg cursor-pointer"
              >
                Save Global Configuration
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Modal: Assign New Subadmin */}
      {showAssignSubadminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#111928] rounded-3xl border border-slate-700 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Assign Subadmin Partner</h3>
                  <span className="text-[10px] text-slate-400">
                    Gives subadmin access, coins balance, and a unique referral code
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignSubadminModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {assignError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{assignError}</span>
              </div>
            )}

            {assignSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{assignSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubadmin} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Select User to Promote
                </label>
                <select
                  value={selectedUserUid}
                  onChange={(e) => setSelectedUserUid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs"
                >
                  {usersList
                    .filter((u) => u.role !== 'admin')
                    .map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.displayName || 'Player'} ({u.phoneFormatted || u.email}) [Current: {u.role}]
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Unique Referral Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewSubadminCode(generateRandomCode())}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newSubadminCode}
                  onChange={(e) => setNewSubadminCode(e.target.value.toUpperCase())}
                  placeholder="e.g. VIP888"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono font-bold uppercase tracking-wider text-sm focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[10px] text-slate-500">
                  Players who enter this code during signup will be assigned to this subadmin.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Initial Assigned Coins (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={initialCoinsInput}
                  onChange={(e) => setInitialCoinsInput(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-500">
                  Subadmins can distribute these coins to their referred players.
                </p>
              </div>

              <button
                type="submit"
                disabled={submittingSubadmin}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{submittingSubadmin ? 'Assigning Subadmin...' : 'Confirm & Promote to Subadmin'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Top-up Coins for Subadmin */}
      {topupModalSubadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#111928] rounded-3xl border border-amber-500/50 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Assign Coins to {topupModalSubadmin.displayName || topupModalSubadmin.email}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Code: {topupModalSubadmin.referralCode} | Current: ₹{topupModalSubadmin.coins.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTopupModalSubadmin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {topupError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{topupError}</span>
              </div>
            )}

            {topupSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{topupSuccess}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTopup} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Coins Amount to Add (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={topupAmountInput}
                  onChange={(e) => setTopupAmountInput(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                />

                <div className="flex items-center space-x-1.5 pt-1">
                  {[2000, 5000, 10000, 25000, 50000].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setTopupAmountInput(String(chip))}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold cursor-pointer"
                    >
                      +₹{chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Audit Note / Reason
                </label>
                <input
                  type="text"
                  value={topupNoteInput}
                  onChange={(e) => setTopupNoteInput(e.target.value)}
                  placeholder="e.g. Weekly allocation"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submittingTopup}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 mt-2"
              >
                <Coins className="w-4 h-4" />
                <span>{submittingTopup ? 'Assigning...' : `Add ₹${Number(topupAmountInput || 0).toLocaleString()} Coins`}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Set User Coins */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-slate-900 border border-amber-500/50 rounded-2xl p-4 space-y-3 shadow-2xl">
            <h4 className="text-xs font-bold text-white">
              Set Coins for {editingUser.displayName || editingUser.email}
            </h4>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">New INR Balance (₹)</label>
              <input
                type="number"
                min="0"
                value={userCoinsInput}
                onChange={(e) => setUserCoinsInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono text-xs font-bold"
              />
            </div>
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCoins}
                className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
