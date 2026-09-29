import React, { useState } from 'react';
import {
  Phone,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  Gift,
  Flame,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Coins,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthLandingViewProps {
  onSuccess?: () => void;
}

export const AuthLandingView: React.FC<AuthLandingViewProps> = ({ onSuccess }) => {
  const { loginWithPhone, signupWithPhone, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanDigits = phoneNumber.replace(/\D/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await loginWithPhone(cleanDigits, password);
      } else {
        await signupWithPhone(
          cleanDigits,
          password,
          displayName.trim() || undefined,
          referralCode.trim() || undefined
        );
      }
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('auth/invalid-credential') || err.message.includes('wrong-password') || err.message.includes('user-not-found')) {
          setError('Invalid phone number or password. Check your details or Sign Up if new.');
        } else if (err.message.includes('email-already-in-use')) {
          setError('This phone number is already registered. Please Sign In.');
        } else if (err.message.includes('weak-password')) {
          setError('Password is too weak. Please use at least 6 characters.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (!err.message.includes('auth/popup-closed-by-user')) {
          setError(err.message);
        }
      } else {
        setError('Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type: 'user' | 'new') => {
    if (type === 'user') {
      setMode('signin');
      setPhoneNumber('9876543210');
      setPassword('password123');
    } else {
      setMode('signup');
      const randomPhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
      setPhoneNumber(randomPhone);
      setDisplayName(`Player_${randomPhone.slice(-4)}`);
      setPassword('pass123456');
      setConfirmPassword('pass123456');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Banner / Ticker */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 px-3 py-1.5 text-center text-[11px] font-black text-white tracking-wide flex items-center justify-center space-x-2 shadow-md">
        <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-spin" />
        <span>WELCOME TO WINGO COLOR TRADING • 100% INR PAYOUTS (₹) • 1ST RECHARGE FREE BONUS</span>
        <Flame className="w-3.5 h-3.5 text-amber-200" />
      </div>

      <div className="max-w-md w-full mx-auto px-4 py-6 flex-1 flex flex-col justify-center">
        {/* Brand Hero */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 rounded-3xl shadow-[0_0_35px_rgba(244,63,94,0.4)] border-2 border-white/20">
            <span className="font-black text-3xl text-white tracking-tighter drop-shadow-md">WinGo</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2">
            Color &amp; Number Trading
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Predict Green, Red, Violet &amp; Numbers in 30s, 1m, 3m &amp; 5m fast rounds with real INR (₹) rewards!
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#121b2d] rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden p-5 sm:p-6 backdrop-blur-md">
          {/* Tab Selector */}
          <div className="flex bg-[#0b111e] p-1 rounded-2xl mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-start space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name on Sign Up */}
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Trader Nickname (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Lucky Trader"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#0b111e] border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                    <span>Referral Code (Optional)</span>
                    <span className="text-cyan-400 font-mono text-[10px]">Partner Code</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400">
                      <Gift className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="e.g. VIP888"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#0b111e] border border-slate-700 rounded-xl text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 uppercase tracking-wider transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Phone Number Input with +91 Country Code */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Phone Number</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">10 Digits</span>
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-700 focus-within:border-amber-400 bg-[#0b111e] transition-colors">
                <div className="px-3 py-2.5 bg-slate-800/80 border-r border-slate-700 text-xs font-bold text-slate-200 flex items-center space-x-1 shrink-0">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit mobile number"
                  required
                  className="flex-1 px-3 py-2.5 bg-transparent text-white text-xs tracking-wider placeholder:text-slate-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Password</span>
                </span>
                <span className="text-[10px] text-slate-400">Min 6 characters</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full px-3 py-2.5 pr-10 bg-[#0b111e] border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password on Sign Up */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full px-3 py-2.5 bg-[#0b111e] border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all cursor-pointer bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <span className="text-xs font-bold animate-pulse">Processing...</span>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Play' : 'Register & Start Playing'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons for Fast Testing */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Quick Test:</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleFillDemo('user')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-semibold cursor-pointer"
              >
                Existing User
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('new')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-semibold cursor-pointer"
              >
                New Phone
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500">
              <span className="bg-[#121b2d] px-3">or continue with</span>
            </div>
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center p-0.5">
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
            <span>Continue with Google</span>
          </button>

          {/* Admin badge */}
          <div className="mt-4 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-2">
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
                2 free spins every day with max win up to ₹2 INR!
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
                Check in daily for ₹0.50 or ₹1.00 INR free gift!
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
                All bets, wins and wallets in Indian Rupee (INR).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
