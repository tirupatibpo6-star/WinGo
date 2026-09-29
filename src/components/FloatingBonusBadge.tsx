import React from 'react';
import { Sparkles, Coins, Gift } from 'lucide-react';

interface FloatingBonusBadgeProps {
  onClick: () => void;
}

export const FloatingBonusBadge: React.FC<FloatingBonusBadgeProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 cursor-pointer select-none group transform hover:scale-105 active:scale-95 transition-all duration-200"
      title="Claim Free Bonus Coins!"
    >
      <div className="relative flex items-center">
        {/* Glow behind badge */}
        <div className="absolute inset-0 bg-emerald-500/40 rounded-full blur-md group-hover:bg-amber-500/50 transition-colors animate-pulse" />

        {/* Mascot & Coins circular container */}
        <div className="relative flex items-center bg-gradient-to-r from-emerald-600 via-green-700 to-amber-600 pl-2 pr-3 py-1.5 rounded-full border-2 border-amber-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] space-x-2">
          {/* Rupee Coin Icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 border border-white flex items-center justify-center shadow-md animate-bounce font-black text-slate-950 text-sm">
            ₹
          </div>

          {/* Banner Text */}
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-amber-200 tracking-wider uppercase leading-none drop-shadow">
              2 FREE SPINS
            </span>
            <span className="text-xs font-black text-white tracking-wide uppercase leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              BONUS ₹🎁
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
