import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  AlertCircle,
  ShieldCheck,
  Gift,
  Coins,
  TrendingUp,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthLandingViewProps {
  onSuccess?: () => void;
}

export const AuthLandingView: React.FC<AuthLandingViewProps> = ({ onSuccess }) => {
  const { loginWithGoogle } = useAuth();

  const [referralCode, setReferralCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParam = new URLSearchParams(window.location.search).get('ref');
      if (urlParam) {
        const c = urlParam.trim().toUpperCase();
        localStorage.setItem('wingo_ref_code', c);
        return c;
      }
      return localStorage.getItem('wingo_ref_code') || '';
    }
    return '';
  });

  const [showReferralInput, setShowReferralInput] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return Boolean(new URLSearchParams(window.location.search).get('ref'));
    }
    return false;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle(referralCode.trim() || undefined);
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (!err.message.includes('auth/popup-closed-by-user')) {
          setError(err.message);
        }
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Banner / Ticker */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 px-3 py-1.5 text-center text-[11px] font-black text-white tracking-wide flex items-center justify-center space-x-2 shadow-md">
        <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-spin" />
        <span>WELCOME TO WINGO COLOR TRADING • 100% INR PAYOUTS (₹) • MIN WITHDRAWAL ₹5,000</span>
        <Flame className="w-3.5 h-3.5 text-amber-200" />
      </div>

      <div className="max-w-md w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        {/* Brand Hero */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 rounded-3xl shadow-[0_0_35px_rgba(244,63,94,0.4)] border-2 border-white/20">
            <span className="font-black text-3xl text-white tracking-tighter drop-shadow-md">WinGo</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2">
            Color &amp; Number Trading
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Predict Green, Red, Violet &amp; Numbers in 30s, 1m, 3m &amp; 5m fast rounds with real INR (₹) rewards!
          </p>
        </div>

        {/* Auth Card - Google Only */}
        <div className="bg-[#121b2d] rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden p-6 sm:p-7 backdrop-blur-md space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-black text-white">One-Click Google Access</h2>
            <p className="text-xs text-slate-400">
              Sign in or create your trader account instantly with Google. No password or phone required.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-start space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Optional Referral Code Toggle/Input */}
          <div className="space-y-2">
            {!showReferralInput ? (
              <button
                type="button"
                onClick={() => setShowReferralInput(true)}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 mx-auto transition-colors cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Have a Subadmin Referral Code?</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-[#0b111e] border border-cyan-500/30 space-y-1.5 animate-fade-in">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                  <span className="flex items-center space-x-1 text-cyan-300">
                    <Gift className="w-3 h-3 text-cyan-400" />
                    <span>Referral / Partner Code</span>
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
                <p className="text-[10px] text-slate-500">
                  Connected to your subadmin partner for custom bonuses and coin transfers.
                </p>
              </div>
            )}
          </div>

          {/* Primary Action Button: Continue with Google */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className={`w-full py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center space-x-3 transition-all cursor-pointer shadow-xl active:scale-[0.98] ${
              loading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-900 border border-white shadow-white/10 hover:shadow-white/20'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>{loading ? 'Connecting with Google...' : 'Continue with Google'}</span>
            {!loading && <ArrowRight className="w-4 h-4 text-slate-700 ml-1" />}
          </button>

          {/* Quick Notice */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Verification</span>
            </span>
            <span>•</span>
            <span className="text-amber-300 font-bold">Min Withdrawal: ₹5,000</span>
          </div>

          {/* Admin badge info */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-tight">
              Admin account <span className="text-amber-300 font-mono">tirupatibpo6@gmail.com</span> unlocks Admin Master Console automatically.
            </span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#121b2d]/80 border border-slate-800 flex items-start space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">1st Recharge Bonus</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                Free bonus unlocks immediately upon your 1st recharge!
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#121b2d]/80 border border-slate-800 flex items-start space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Daily 2 Free Spins</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                2 free spins every day with real INR rewards!
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#121b2d]/80 border border-slate-800 flex items-start space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Daily Gift Check-In</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                Check in daily for free login bonuses!
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#121b2d]/80 border border-slate-800 flex items-start space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Direct INR (₹)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                All bets, wins, and withdrawals in Indian Rupee (INR).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
