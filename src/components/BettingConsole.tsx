import React from 'react';
import { BetColor, BetSize, BetTargetType } from '../types';
import { NumberBall } from './NumberBall';

interface BettingConsoleProps {
  isLocked: boolean;
  onSelectBet: (type: BetTargetType, value: BetColor | BetSize | number) => void;
}

export const BettingConsole: React.FC<BettingConsoleProps> = ({ isLocked, onSelectBet }) => {
  return (
    <div className="relative rounded-2xl bg-[#141e2e] border border-slate-700/60 p-3 sm:p-4 shadow-lg space-y-3.5">
      {/* 3 Large Color Buttons */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* GREEN BUTTON */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => onSelectBet('color', 'green')}
          className={`group relative overflow-hidden rounded-xl py-2.5 sm:py-3 px-1 text-center transition-all duration-150 ${
            isLocked
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]'
          }`}
          style={{
            background: 'linear-gradient(180deg, #10b981 0%, #059669 45%, #047857 100%)',
            boxShadow: '0 4px 14px rgba(16,185,129,0.45), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {/* Specular sheen */}
          <div className="absolute top-0 inset-x-2 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-lg pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-white font-black tracking-wider text-xs sm:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              GREEN
            </span>
            <span className="text-[10px] text-emerald-100 font-semibold opacity-90">
              x2 / x1.5
            </span>
          </div>
        </button>

        {/* VIOLET BUTTON */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => onSelectBet('color', 'violet')}
          className={`group relative overflow-hidden rounded-xl py-2.5 sm:py-3 px-1 text-center transition-all duration-150 ${
            isLocked
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]'
          }`}
          style={{
            background: 'linear-gradient(180deg, #a855f7 0%, #9333ea 45%, #7e22ce 100%)',
            boxShadow: '0 4px 14px rgba(168,85,247,0.45), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <div className="absolute top-0 inset-x-2 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-lg pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-white font-black tracking-wider text-xs sm:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              VIOLET
            </span>
            <span className="text-[10px] text-purple-100 font-semibold opacity-90">
              x4.5
            </span>
          </div>
        </button>

        {/* RED BUTTON */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => onSelectBet('color', 'red')}
          className={`group relative overflow-hidden rounded-xl py-2.5 sm:py-3 px-1 text-center transition-all duration-150 ${
            isLocked
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]'
          }`}
          style={{
            background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 45%, #b91c1c 100%)',
            boxShadow: '0 4px 14px rgba(239,68,68,0.45), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <div className="absolute top-0 inset-x-2 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-lg pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-white font-black tracking-wider text-xs sm:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              RED
            </span>
            <span className="text-[10px] text-rose-100 font-semibold opacity-90">
              x2 / x1.5
            </span>
          </div>
        </button>
      </div>

      {/* 10 Casino Chips (0-9) - Casino Roulette/Poker Style */}
      <div className="bg-[#0b121e] p-2.5 sm:p-3.5 rounded-2xl border border-slate-800/90 space-y-2.5 shadow-inner">
        <div className="flex items-center justify-between px-1 border-b border-slate-800/60 pb-1.5">
          <span className="text-[11px] font-black text-amber-400 tracking-wider uppercase flex items-center space-x-1">
            <span>🪙</span>
            <span>CASINO CHIPS NUMBER BOARD</span>
          </span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            Payout 9x
          </span>
        </div>

        {/* Row 1: 0, 1, 2, 3, 4 */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 justify-items-center items-center py-1">
          {[0, 1, 2, 3, 4].map((num) => (
            <NumberBall
              key={num}
              number={num}
              size="md"
              disabled={isLocked}
              onClick={() => onSelectBet('number', num)}
            />
          ))}
        </div>

        {/* Row 2: 5, 6, 7, 8, 9 */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 justify-items-center items-center py-1">
          {[5, 6, 7, 8, 9].map((num) => (
            <NumberBall
              key={num}
              number={num}
              size="md"
              disabled={isLocked}
              onClick={() => onSelectBet('number', num)}
            />
          ))}
        </div>

        <div className="text-center pt-0.5">
          <span className="text-[10px] font-semibold text-slate-400 tracking-wide">
            Tap any casino chip to bet on exact number
          </span>
        </div>
      </div>

      {/* Big / Small Choice */}
      <div className="grid grid-cols-2 gap-2.5 pt-0.5">
        <button
          type="button"
          disabled={isLocked}
          onClick={() => onSelectBet('size', 'big')}
          className={`py-2.5 px-3.5 rounded-xl border font-black text-xs sm:text-sm tracking-wider flex items-center justify-between transition-all ${
            isLocked
              ? 'opacity-50 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-500'
              : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300 hover:border-amber-400 hover:from-amber-500/30 cursor-pointer shadow-md'
          }`}
        >
          <div className="flex flex-col text-left">
            <span>BIG</span>
            <span className="text-[9px] font-semibold text-slate-400">5, 6, 7, 8, 9</span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
            x2
          </span>
        </button>

        <button
          type="button"
          disabled={isLocked}
          onClick={() => onSelectBet('size', 'small')}
          className={`py-2.5 px-3.5 rounded-xl border font-black text-xs sm:text-sm tracking-wider flex items-center justify-between transition-all ${
            isLocked
              ? 'opacity-50 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-500'
              : 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 border-sky-500/40 text-sky-300 hover:border-sky-400 hover:from-sky-500/30 cursor-pointer shadow-md'
          }`}
        >
          <div className="flex flex-col text-left">
            <span>SMALL</span>
            <span className="text-[9px] font-semibold text-slate-400">0, 1, 2, 3, 4</span>
          </div>
          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
            x2
          </span>
        </button>
      </div>
    </div>
  );
};
