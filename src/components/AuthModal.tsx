import React, { useState } from 'react';
import { X, LogIn, AlertCircle, Sparkles, ShieldCheck, Gift, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { loginWithGoogle } = useAuth();
  const [referralCode, setReferralCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wingo_ref_code') || '';
    }
    return '';
  });
  const [showReferralInput, setShowReferralInput] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(localStorage.getItem('wingo_ref_code'));
    }
    return false;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle(referralCode.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (!err.message.includes('auth/popup-closed-by-user')) {
          setError(err.message);
        }
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm bg-[#131d2e] rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                WinGo Account Access
              </h2>
              <p className="text-xs text-white/80">
                INR Wallet &bull; Min Withdrawal ₹5,000
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-300">
              Sign in with your Google account. No passwords or phone OTP required.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-start space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Referral Code (Optional) */}
          <div className="space-y-2">
            {!showReferralInput ? (
              <button
                type="button"
                onClick={() => setShowReferralInput(true)}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 mx-auto transition-colors cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Enter Subadmin Partner Code</span>
              </button>
            ) : (
              <div className="p-3 bg-[#0b111e] border border-cyan-500/30 rounded-2xl space-y-1.5 animate-fade-in">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                  <span className="flex items-center space-x-1 text-cyan-300">
                    <Gift className="w-3 h-3 text-cyan-400" />
                    <span>Referral Code</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowReferralInput(false)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    Hide
                  </button>
                </div>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. VIP888"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 uppercase tracking-wider"
                />
              </div>
            )}
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className={`w-full py-3 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-lg ${
              loading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-900 border border-white shadow-white/10 active:scale-98'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
            {!loading && <ArrowRight className="w-3.5 h-3.5 text-slate-700 ml-1" />}
          </button>

          {/* Quick Notice */}
          <div className="pt-2 border-t border-slate-800 text-center">
            <span className="text-[11px] text-amber-300 font-bold">
              Minimum withdrawal: ₹5,000 INR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
