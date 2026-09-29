import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
} from 'firebase/firestore';
import {
  X,
  CreditCard,
  QrCode,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { db } from '../firebase';
import { PaymentGateway, RechargeRequest } from '../types';
import { useAuth } from '../context/AuthContext';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [amount, setAmount] = useState<string>('500');
  const [transactionId, setTransactionId] = useState<string>('');
  const [userRecharges, setUserRecharges] = useState<RechargeRequest[]>([]);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pay' | 'history'>('pay');

  // Load active gateways
  useEffect(() => {
    if (!isOpen) return;
    const q = query(collection(db, 'gateways'), where('isActive', '==', true));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PaymentGateway[];
        setGateways(list);
        if (list.length > 0 && !selectedGateway) {
          setSelectedGateway(list[0]);
        }
      },
      (err) => {
        console.warn('Could not fetch gateways, client offline:', err);
      }
    );
    return () => unsub();
  }, [isOpen]);

  // Load user's recharge history
  useEffect(() => {
    if (!isOpen || !currentUser) return;
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
        setUserRecharges(list);
      },
      (err) => {
        console.warn('Could not fetch user recharges, client offline:', err);
      }
    );
    return () => unsub();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const currentRate = selectedGateway?.ratePerCoin || 1; // 1 unit = 1 coin default
  const numericAmount = parseFloat(amount) || 0;
  const calculatedCoins = Math.round(numericAmount * currentRate);

  const handleCopyDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedGateway || numericAmount <= 0 || !transactionId.trim()) {
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const newRequest: Omit<RechargeRequest, 'id'> = {
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        gatewayId: selectedGateway.id,
        gatewayType: selectedGateway.type,
        amount: numericAmount,
        coins: calculatedCoins,
        transactionId: transactionId.trim(),
        status: 'pending',
        createdAt: Date.now(),
      };

      await addDoc(collection(db, 'recharges'), newRequest);
      setStatusMessage('Recharge request submitted! Admin will verify and credit coins.');
      setTransactionId('');
      onSuccess();
      setActiveTab('history');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setStatusMessage(`Submission failed: ${err.message}`);
      } else {
        setStatusMessage('Submission failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-[#131d2e] rounded-2xl border border-amber-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 p-4 text-slate-950 relative flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-amber-400 border border-white flex items-center justify-center shadow">
              <CreditCard className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Recharge INR Wallet (₹)
              </h2>
              <p className="text-[11px] font-bold text-amber-100">
                1st recharge unlocks Free Bonus &bull; 2 Daily Spins
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
            onClick={() => setActiveTab('pay')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'pay'
                ? 'bg-[#1e2f47] text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deposit / Pay
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#1e2f47] text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Recharge History ({userRecharges.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {activeTab === 'pay' ? (
            <>
              {gateways.length === 0 ? (
                <div className="p-6 text-center space-y-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">
                    No payment gateways configured by admin yet.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    If you are the Admin, please add a UPI ID, Binance Pay ID, TRC20 address or QR code in the Admin Panel.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRecharge} className="space-y-4">
                  {/* Select Payment Gateway */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                      Select Deposit Gateway
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {gateways.map((g) => {
                        const isSelected = selectedGateway?.id === g.id;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setSelectedGateway(g)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span className="text-xs font-bold block truncate">{g.title}</span>
                            <span className="text-[10px] text-amber-400 uppercase font-semibold">
                              {g.type}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gateway Details Box */}
                  {selectedGateway && (
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Gateway Address / ID:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyDetails(selectedGateway.details)}
                          className="flex items-center space-x-1 text-[11px] font-bold text-sky-400 hover:underline cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy ID</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-2.5 bg-slate-950 rounded-lg font-mono text-xs text-amber-300 break-all select-all border border-slate-800">
                        {selectedGateway.details}
                      </div>

                      {selectedGateway.qrImageUrl && (
                        <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg w-36 h-36 mx-auto">
                          <img
                            src={selectedGateway.qrImageUrl}
                            alt="Payment QR"
                            className="max-h-full object-contain"
                          />
                        </div>
                      )}

                      {selectedGateway.instructions && (
                        <p className="text-[11px] text-slate-400 italic">
                          ℹ️ {selectedGateway.instructions}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Amount Selection */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <label className="font-bold text-slate-300 uppercase tracking-wider">
                        Recharge Amount (INR)
                      </label>
                      <span className="text-amber-400 font-bold">
                        Credited Balance: ₹{calculatedCoins.toLocaleString()} INR
                      </span>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                        ₹
                      </div>
                      <input
                        type="number"
                        min="1"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-7 pr-3 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Quick amount presets */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {['100', '500', '1000', '5000'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAmount(preset)}
                          className="py-1 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                          ₹{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transaction ID / UTR input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      UTR / Transaction Hash / Order ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter 12-digit UTR or Transaction Hash after paying"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {statusMessage && (
                    <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-200 text-xs font-semibold">
                      {statusMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !selectedGateway || numericAmount <= 0 || !transactionId.trim()}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                      submitting || !selectedGateway || numericAmount <= 0 || !transactionId.trim()
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 text-slate-950 shadow-amber-500/25 active:scale-95'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black flex items-center justify-center">₹</span>
                    <span>{submitting ? 'Submitting Receipt...' : 'Submit Deposit Receipt'}</span>
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="space-y-2">
              {userRecharges.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No recharge requests submitted yet.
                </div>
              ) : (
                userRecharges.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase">{req.gatewayType} Deposit</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          req.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : req.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Coins: +{req.coins.toLocaleString()}</span>
                      <span className="font-mono">Amount: {req.amount}</span>
                    </div>

                    <div className="font-mono text-[10px] text-slate-500 truncate">
                      UTR: {req.transactionId}
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
  );
};
