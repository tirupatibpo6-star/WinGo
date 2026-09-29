import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  X,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { db } from '../firebase';
import { WithdrawalRequest } from '../types';
import { useAuth } from '../context/AuthContext';

interface ClaimWinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClaimWinModal: React.FC<ClaimWinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, userProfile, systemSettings } = useAuth();
  const [coinsToClaim, setCoinsToClaim] = useState<string>('500');
  const [method, setMethod] = useState<'upi' | 'binance' | 'trc20' | 'bank'>('upi');
  const [accountDetails, setAccountDetails] = useState<string>('');
  const [userWithdrawals, setUserWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'claim' | 'history'>('claim');

  // Load user's withdrawal claims
  useEffect(() => {
    if (!isOpen || !currentUser) return;
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
        setUserWithdrawals(list);
      },
      (err) => {
        console.warn('Could not fetch user withdrawals, client offline:', err);
      }
    );
    return () => unsub();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const currentBalance = userProfile?.coins || 0;
  const numCoins = parseFloat(coinsToClaim) || 0;
  const minCoins = systemSettings.minWithdrawCoins || 500;
  const isInsufficient = numCoins > currentBalance;
  const isBelowMin = numCoins < minCoins;

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || isInsufficient || isBelowMin || !accountDetails.trim()) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Deduct coins from user balance immediately
      const newBalance = Math.max(0, currentBalance - numCoins);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        coins: newBalance,
        updatedAt: Date.now(),
      });

      // 2. Create withdrawal request
      const newRequest: Omit<WithdrawalRequest, 'id'> = {
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        coinsAmount: numCoins,
        currencyAmount: numCoins, // 1:1 or configurable
        method,
        accountDetails: accountDetails.trim(),
        status: 'pending',
        createdAt: Date.now(),
      };

      await addDoc(collection(db, 'withdrawals'), newRequest);
      setSubmitting(false);

      // 3. Show notification popup: "Amount will be deposited within 36 hours"
      setShowNotificationModal(true);
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to submit claim. Please try again.');
      }
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div
          className="w-full max-w-md bg-[#131d2e] rounded-2xl border border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 p-4 text-white relative flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shadow">
                <ArrowUpRight className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight">Claim Winning Amount</h2>
                <p className="text-[11px] text-emerald-100 font-medium">
                  Withdraw your game winnings directly
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-slate-800 bg-[#0f172a]">
            <button
              type="button"
              onClick={() => setActiveTab('claim')}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'claim'
                  ? 'bg-[#1e2f47] text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Withdraw INR (₹)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-[#1e2f47] text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Claim History ({userWithdrawals.length})
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 space-y-4 overflow-y-auto">
            {activeTab === 'claim' ? (
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                {/* Available balance indicator */}
                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400">Available Winning Balance:</span>
                  <div className="flex items-center space-x-1.5 font-black text-amber-300 font-mono text-sm">
                    <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">₹</span>
                    <span>₹{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Amount to withdraw */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <label className="font-bold text-slate-300 uppercase tracking-wider">
                      INR Amount to Claim (₹)
                    </label>
                    <span className="text-slate-400">Min: ₹{minCoins} INR</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                      ₹
                    </div>
                    <input
                      type="number"
                      min={minCoins}
                      max={currentBalance}
                      required
                      value={coinsToClaim}
                      onChange={(e) => setCoinsToClaim(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-7 pr-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  {isInsufficient && (
                    <p className="text-[11px] text-rose-400 font-semibold">
                      Insufficient INR balance.
                    </p>
                  )}
                  {isBelowMin && (
                    <p className="text-[11px] text-rose-400 font-semibold">
                      Minimum claim amount is ₹{minCoins} INR.
                    </p>
                  )}
                </div>

                {/* Method Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Payout Method
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'upi', label: 'UPI' },
                      { id: 'binance', label: 'Binance Pay' },
                      { id: 'trc20', label: 'TRC20' },
                      { id: 'bank', label: 'Bank' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id as any)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          method === m.id
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account details input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    {method === 'upi' && 'Your UPI ID (e.g. mobile@upi)'}
                    {method === 'binance' && 'Your Binance Pay ID / Email'}
                    {method === 'trc20' && 'Your USDT TRC20 Wallet Address'}
                    {method === 'bank' && 'Account No, IFSC, Account Holder Name'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder={`Enter your ${method.toUpperCase()} payout details`}
                    value={accountDetails}
                    onChange={(e) => setAccountDetails(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || isInsufficient || isBelowMin || !accountDetails.trim()}
                  className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                    submitting || isInsufficient || isBelowMin || !accountDetails.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-white shadow-emerald-500/25 active:scale-95'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{submitting ? 'Processing...' : 'Confirm Claim / Withdrawal'}</span>
                </button>
              </form>
            ) : (
              <div className="space-y-2">
                {userWithdrawals.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No winning claims yet.
                  </div>
                ) : (
                  userWithdrawals.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white uppercase">{req.method} Payout</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            req.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : req.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-300 font-mono text-xs">
                        <span>Withdrawal: ₹{req.coinsAmount.toLocaleString()} INR</span>
                        <span className="text-emerald-400 font-bold">
                          Est. Payout: ₹{req.currencyAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono break-all">
                        To: {req.accountDetails}
                      </div>

                      <div className="text-[10px] text-slate-500">
                        {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Specific Notification Popup as requested: "Amount will be deposited within 36 hours" */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-sm bg-gradient-to-b from-[#19273c] to-[#0f172a] rounded-2xl border-2 border-emerald-400/80 p-6 text-center shadow-2xl space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-white">
                Claim Request Received!
              </h3>
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                <p className="text-sm font-extrabold text-emerald-300">
                  &ldquo;Amount will be deposited within 36 hours&rdquo;
                </p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                Your winning coins have been submitted for verification. Admin is processing the payout to your provided account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowNotificationModal(false);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
