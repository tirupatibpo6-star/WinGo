import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import {
  X,
  Shield,
  Users,
  CreditCard,
  Settings,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Coins,
  RefreshCw,
  Sliders,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  UserProfile,
  PaymentGateway,
  RechargeRequest,
  WithdrawalRequest,
  SystemSettings,
  GatewayType,
} from '../types';
import { useAuth } from '../context/AuthContext';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { systemSettings } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'gateways' | 'recharges' | 'withdrawals' | 'settings'>('users');

  // Firestore collections state
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [recharges, setRecharges] = useState<RechargeRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);

  // User coin edit modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [coinsAmountInput, setCoinsAmountInput] = useState<string>('');

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
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleResetUserStage = async (user: UserProfile) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        gamesPlayedCount: 0,
        updatedAt: Date.now(),
      });
      setUsersList((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, gamesPlayedCount: 0 } : u))
      );
    } catch (err) {
      console.error('Could not reset user stage:', err);
    }
  };

  // Subscribe to collections
  useEffect(() => {
    if (!isOpen) return;

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs.map((d) => ({ ...d.data() } as UserProfile));
        setUsersList(list);
      },
      (err) => {
        console.warn('Could not fetch users, client offline:', err);
      }
    );

    const unsubGateways = onSnapshot(
      collection(db, 'gateways'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentGateway));
        setGateways(list);
      },
      (err) => {
        console.warn('Could not fetch gateways, client offline:', err);
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
        console.warn('Could not fetch recharges, client offline:', err);
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
        console.warn('Could not fetch withdrawals, client offline:', err);
      }
    );

    return () => {
      unsubUsers();
      unsubGateways();
      unsubRecharges();
      unsubWithdrawals();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle assigning/modifying user coins
  const handleSaveCoins = async () => {
    if (!editingUser) return;
    const newCoins = parseFloat(coinsAmountInput);
    if (isNaN(newCoins)) return;

    await updateDoc(doc(db, 'users', editingUser.uid), {
      coins: newCoins,
      updatedAt: Date.now(),
    });
    setEditingUser(null);
  };

  // Toggle user block status
  const handleToggleBlock = async (u: UserProfile) => {
    await updateDoc(doc(db, 'users', u.uid), {
      isBlocked: !u.isBlocked,
      updatedAt: Date.now(),
    });
  };

  // Add new payment gateway
  const handleAddGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gwTitle.trim() || !gwDetails.trim()) return;

    try {
      const newGw: Omit<PaymentGateway, 'id'> = {
        type: gwType,
        title: gwTitle.trim(),
        details: gwDetails.trim(),
        ratePerCoin: parseFloat(gwRate) || 1,
        isActive: true,
        createdAt: Date.now(),
      };

      if (gwQrUrl.trim()) {
        newGw.qrImageUrl = gwQrUrl.trim();
      }
      if (gwInstructions.trim()) {
        newGw.instructions = gwInstructions.trim();
      }

      await addDoc(collection(db, 'gateways'), newGw);
      setShowAddGateway(false);
      setGwTitle('');
      setGwDetails('');
      setGwQrUrl('');
      setGwInstructions('');
      setGwRate('1');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'gateways');
      console.error('Failed to add gateway:', err);
    }
  };

  // Delete gateway
  const handleDeleteGateway = async (id: string) => {
    if (confirm('Delete this payment gateway?')) {
      await deleteDoc(doc(db, 'gateways', id));
    }
  };

  // Toggle gateway active
  const handleToggleGatewayActive = async (gw: PaymentGateway) => {
    await updateDoc(doc(db, 'gateways', gw.id), {
      isActive: !gw.isActive,
    });
  };

  // Approve Recharge
  const handleApproveRecharge = async (req: RechargeRequest) => {
    // 1. Credit INR balance to user's account + Free bonus after 1st recharge!
    const userDocRef = doc(db, 'users', req.userId);
    const targetUser = usersList.find((u) => u.uid === req.userId);
    const existingCoins = targetUser?.coins || 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const isFirstRecharge = !targetUser?.hasFirstRechargeBonusClaimed && (!targetUser?.totalRechargesCount || targetUser.totalRechargesCount === 0);
    const firstRechargeBonus = isFirstRecharge ? 50 : 0; // Free bonus after 1st recharge only!

    await updateDoc(userDocRef, {
      coins: existingCoins + req.coins + firstRechargeBonus,
      hasRechargedToday: true,
      hasFirstRechargeBonusClaimed: true,
      totalRechargesCount: (targetUser?.totalRechargesCount || 0) + 1,
      lastRechargeDate: todayStr,
      updatedAt: Date.now(),
    });

    // 2. Mark recharge as approved
    await updateDoc(doc(db, 'recharges', req.id), {
      status: 'approved',
      approvedAt: Date.now(),
    });
  };

  // Reject Recharge
  const handleRejectRecharge = async (req: RechargeRequest) => {
    await updateDoc(doc(db, 'recharges', req.id), {
      status: 'rejected',
      approvedAt: Date.now(),
    });
  };

  // Process / Complete Withdrawal Claim
  const handleProcessWithdrawal = async (req: WithdrawalRequest, newStatus: 'completed' | 'rejected') => {
    if (newStatus === 'rejected') {
      // Refund coins back to user
      const targetUser = usersList.find((u) => u.uid === req.userId);
      const existingCoins = targetUser?.coins || 0;
      await updateDoc(doc(db, 'users', req.userId), {
        coins: existingCoins + req.coinsAmount,
        updatedAt: Date.now(),
      });
    }

    await updateDoc(doc(db, 'withdrawals', req.id), {
      status: newStatus,
      processedAt: Date.now(),
    });
  };

  // Save System Settings (Starting coins & 20% algorithm)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const startCoins = parseFloat(startingBalance);
    const rate = parseFloat(winRate);

    await setDoc(
      doc(db, 'settings', 'config'),
      {
        defaultStartingCoins: isNaN(startCoins) ? 100 : startCoins,
        winRatePercentage: isNaN(rate) ? 20 : rate,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-4xl bg-[#111a28] rounded-2xl border border-sky-500/50 shadow-2xl overflow-hidden flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 p-4 border-b border-sky-500/30 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400 shadow">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black tracking-tight">Admin Master Console</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                  Live Control
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage players, assign coins, configure payment gateways, approvals &amp; algorithm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-[#0c131f] overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#18253a] text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Players / Users ({usersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gateways')}
            className={`py-3 px-4 flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer ${
              activeTab === 'gateways'
                ? 'bg-[#18253a] text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payment Gateways ({gateways.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recharges')}
            className={`py-3 px-4 flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer relative ${
              activeTab === 'recharges'
                ? 'bg-[#18253a] text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit Requests</span>
            {recharges.filter((r) => r.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('withdrawals')}
            className={`py-3 px-4 flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer relative ${
              activeTab === 'withdrawals'
                ? 'bg-[#18253a] text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Claims / Payouts</span>
            {withdrawals.filter((w) => w.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#18253a] text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Game Settings &amp; Algorithm</span>
          </button>
        </div>

        {/* Console Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* TAB 1: USERS LIST & COINS ASSIGNMENT */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Registered Players:</span>
                <span className="text-slate-400">Click &ldquo;Assign Coins&rdquo; to modify player balances instantly</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1522]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141e2e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Player / Email</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3 text-right">INR Balance (₹)</th>
                      <th className="py-2.5 px-3 text-center">AI Stage</th>
                      <th className="py-2.5 px-3 text-center">Recharged Today</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {usersList.map((u) => {
                      const count = u.gamesPlayedCount ?? 0;
                      return (
                        <tr key={u.uid} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-white">{u.displayName || 'Anonymous'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                u.role === 'admin'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-amber-300">
                            ₹{u.coins.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
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
                          <td className="py-2.5 px-3 text-center">
                            {u.hasRechargedToday ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                Yes (Spin Unlocked)
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">No</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(u);
                                setCoinsAmountInput(String(u.coins));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              Assign INR
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetUserStage(u)}
                              className="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 text-[11px] font-bold cursor-pointer transition-colors"
                              title="Reset to 1st Game (Win)"
                            >
                              Reset AI
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleBlock(u)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                                u.isBlocked
                                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
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

          {/* TAB 2: GATEWAYS MANAGEMENT (UPI, Binance, TRC20, QR) */}
          {activeTab === 'gateways' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-200">Recharge Gateways</h3>
                  <p className="text-[11px] text-slate-400">
                    Add UPI ID, Binance ID, TRC20 wallet address or QR codes for player recharges.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddGateway(!showAddGateway)}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddGateway ? 'Cancel' : 'Add New Gateway'}</span>
                </button>
              </div>

              {/* Add Gateway Form */}
              {showAddGateway && (
                <form
                  onSubmit={handleAddGateway}
                  className="p-4 bg-slate-900 rounded-xl border border-sky-500/40 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Gateway Type</label>
                      <select
                        value={gwType}
                        onChange={(e) => setGwType(e.target.value as GatewayType)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                      >
                        <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                        <option value="binance">Binance Pay ID</option>
                        <option value="trc20">USDT (TRC20 Wallet Address)</option>
                        <option value="qr">Direct QR Code Payment</option>
                        <option value="custom">Custom Bank / Transfer</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Display Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Official UPI ID or Binance Pay"
                        value={gwTitle}
                        onChange={(e) => setGwTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">
                      Payment Address / ID (e.g. UPI ID or TRC20 Hash)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. yourpay@okhdfcbank or 294819482 or TRC20Address..."
                      value={gwDetails}
                      onChange={(e) => setGwDetails(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">
                        QR Image URL (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="https://example.com/qr.png or image link"
                        value={gwQrUrl}
                        onChange={(e) => setGwQrUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">
                        Rate (Coins per Currency unit)
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        required
                        value={gwRate}
                        onChange={(e) => setGwRate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">
                      Instructions / Notes for Players
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Please put your username in the transaction remarks"
                      value={gwInstructions}
                      onChange={(e) => setGwInstructions(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase cursor-pointer"
                  >
                    Save Gateway
                  </button>
                </form>
              )}

              {/* Gateway Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gateways.map((gw) => (
                  <div
                    key={gw.id}
                    className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30">
                          {gw.type}
                        </span>
                        <h4 className="font-bold text-white text-xs">{gw.title}</h4>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleToggleGatewayActive(gw)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            gw.isActive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {gw.isActive ? 'Active' : 'Disabled'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGateway(gw.id)}
                          className="p-1 rounded text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-950 rounded text-xs font-mono text-amber-300 break-all select-all">
                      {gw.details}
                    </div>

                    {gw.qrImageUrl && (
                      <div className="w-24 h-24 bg-white p-1 rounded mx-auto">
                        <img src={gw.qrImageUrl} alt="QR" className="w-full h-full object-contain" />
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Rate: 1 Unit = {gw.ratePerCoin} Coins</span>
                      {gw.instructions && <span className="truncate max-w-[150px]">{gw.instructions}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DEPOSIT / RECHARGE REQUESTS APPROVAL */}
          {activeTab === 'recharges' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-300 font-semibold">
                Player Recharge Receipts ({recharges.length}):
              </div>

              {recharges.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  No recharge requests submitted yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1522]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#141e2e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Player</th>
                        <th className="py-2.5 px-3">Gateway</th>
                        <th className="py-2.5 px-3">Amount / Coins</th>
                        <th className="py-2.5 px-3">UTR / TxID</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {recharges.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono text-[11px]">{r.userEmail}</td>
                          <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-sky-400">
                            {r.gatewayType}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <div className="font-bold text-white">{r.amount}</div>
                            <div className="text-amber-400 text-[11px]">+{r.coins} Coins</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 break-all select-all">
                            {r.transactionId}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                r.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : r.status === 'rejected'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {r.status === 'pending' ? (
                              <div className="inline-flex space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveRecharge(r)}
                                  className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] cursor-pointer"
                                >
                                  Approve &amp; Credit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectRecharge(r)}
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
              )}
            </div>
          )}

          {/* TAB 4: CLAIMS / WITHDRAWALS */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-300 font-semibold">
                Winning Coin Claims / Withdrawals ({withdrawals.length}):
              </div>

              {withdrawals.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  No claims submitted yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1522]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#141e2e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Player</th>
                        <th className="py-2.5 px-3">Claim Coins</th>
                        <th className="py-2.5 px-3">Method &amp; Account Details</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono text-[11px]">{w.userEmail}</td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className="text-amber-400 font-black text-sm">
                              {w.coinsAmount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="uppercase font-bold text-[10px] text-emerald-400">
                              {w.method}
                            </div>
                            <div className="font-mono text-[11px] text-slate-300 break-all select-all">
                              {w.accountDetails}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                w.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : w.status === 'rejected'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {w.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
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
                              <span className="text-[11px] text-slate-500">Done</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: GAME SETTINGS & AI ALGORITHM */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">AI Player Detection &amp; Draw Algorithm</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configures new player detection, 1st/2nd/3rd game sequence &amp; strict 15-20% house algorithm.
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
                  <div className="font-bold text-sky-300 flex items-center space-x-1">
                    <span>4. After 3rd Game (Old Player Strict Algorithm):</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Strict algorithm where only <strong>15% to 20%</strong> of players win (decided randomly).
                    The winning outcome chosen is whichever number, color, or big/small has the <strong>minimum bet amount or minimum bettors</strong>, or the number/color in which <strong>no one bet</strong> (zero liability).
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                {/* Win Rate Percentage Algorithm (Strict 15% to 20%) */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-200 block uppercase tracking-wider text-[11px]">
                      Strict AI Win Rate for Old Players (15% - 20%)
                    </label>
                    <span className="text-amber-400 font-mono font-black text-sm bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                      {winRate}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    &ldquo;Strict algorithms 15 to 20 percent players will win only but not everyone will win. Algorithm will decide random players to win.&rdquo;
                  </p>
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

                {/* Default Starting Balance */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200 block uppercase tracking-wider text-[11px]">
                    Default Starting Balance for New Signups (INR ₹)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    &ldquo;Free bonus will come after 1st recharge only.&rdquo; Default: ₹0
                  </p>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      required
                      value={startingBalance}
                      onChange={(e) => setStartingBalance(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono font-bold focus:outline-none focus:border-sky-400"
                    />
                  </div>
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
        </div>
      </div>

      {/* Mini Modal for Editing Single User INR Balance */}
      {editingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-slate-900 border border-amber-500/50 rounded-2xl p-4 space-y-3 shadow-2xl">
            <h4 className="text-xs font-bold text-white">
              Assign INR Balance to {editingUser.displayName || editingUser.email}
            </h4>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">New INR Balance (₹)</label>
              <input
                type="number"
                min="0"
                value={coinsAmountInput}
                onChange={(e) => setCoinsAmountInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white font-mono font-bold"
              />
            </div>
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCoins}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black uppercase"
              >
                Update INR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
