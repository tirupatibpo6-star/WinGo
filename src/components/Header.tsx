import React from 'react';
import {
  Coins,
  Volume2,
  VolumeX,
  HelpCircle,
  Gift,
  Shield,
  CreditCard,
  ArrowUpRight,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';
import { GameMode } from '../types';
import { MODE_LABELS } from '../utils/gameRules';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentMode: GameMode;
  balance: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHowToPlay: () => void;
  onOpenBonusModal: () => void;
  onOpenRechargeModal: () => void;
  onOpenClaimModal: () => void;
  onOpenAdminModal: () => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  balance,
  soundEnabled,
  onToggleSound,
  onOpenHowToPlay,
  onOpenBonusModal,
  onOpenRechargeModal,
  onOpenClaimModal,
  onOpenAdminModal,
  onOpenAuthModal,
  onOpenProfileModal,
}) => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#141d2d]/95 backdrop-blur-md border-b border-slate-800/90 px-2 sm:px-4 py-2 shadow-md">
      <div className="max-w-md mx-auto flex items-center justify-between gap-1.5">
        {/* Left: App Title and Brand Icon */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 flex items-center justify-center shadow-[0_2px_8px_rgba(244,63,94,0.4)]">
            <span className="font-black text-white text-sm sm:text-base tracking-tighter">W</span>
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <h1 className="text-white font-extrabold text-xs sm:text-sm tracking-tight leading-none">
                {MODE_LABELS[currentMode]}
              </h1>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[9px] text-slate-400 font-medium">WinGo Arena</p>
          </div>
        </div>

        {/* Right: Balance, Deposit, Claim, Bonus, Profile */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          {/* Balance chip in INR */}
          <div
            onClick={onOpenRechargeModal}
            className="flex items-center space-x-1 bg-gradient-to-r from-slate-900/95 to-slate-800/95 border border-amber-500/60 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 cursor-pointer hover:border-amber-400 transition-all shadow-inner"
            title="Click to recharge INR wallet"
          >
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-[0_0_8px_rgba(251,191,36,0.8)] font-black text-[9px] sm:text-[10px] text-slate-950">
              ₹
            </div>
            <span className="text-amber-300 font-black text-[11px] sm:text-xs tracking-tight tabular-nums leading-none">
              ₹{balance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
            </span>
            <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[9px] font-bold">
              +
            </span>
          </div>

          {/* Deposit quick button */}
          <button
            type="button"
            onClick={onOpenRechargeModal}
            className="px-1.5 sm:px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[9px] sm:text-[10px] font-black uppercase flex items-center space-x-1 cursor-pointer transition-colors"
            title="Deposit & Recharge INR (₹)"
          >
            <CreditCard className="w-3 h-3" />
            <span className="hidden sm:inline">Deposit</span>
          </button>

          {/* Claim quick button */}
          <button
            type="button"
            onClick={onOpenClaimModal}
            className="px-1.5 sm:px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[9px] sm:text-[10px] font-black uppercase flex items-center space-x-1 cursor-pointer transition-colors"
            title="Claim Winning Amount (36h Payout)"
          >
            <ArrowUpRight className="w-3 h-3" />
            <span className="hidden sm:inline">Claim</span>
          </button>

          {/* Lucky spin / daily rewards */}
          <button
            type="button"
            onClick={onOpenBonusModal}
            className="p-1 sm:p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors relative"
            title="Daily Lucky Spin & Rewards"
          >
            <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 transition-colors"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" />
            ) : (
              <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
            )}
          </button>

          {/* My Profile Button */}
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="p-1 sm:p-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-colors cursor-pointer flex items-center space-x-1"
            title="My Profile & History"
          >
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
