import React from 'react';
import { HelpCircle, ShieldAlert } from 'lucide-react';
import { DrawResult, GameMode } from '../types';
import { NumberBall } from './NumberBall';

interface GameCardProps {
  mode: GameMode;
  modeLabel: string;
  previousResult: DrawResult | null;
  currentPeriod: string;
  secondsRemaining: number;
  isLocked: boolean;
  onOpenHowToPlay: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  mode,
  modeLabel,
  previousResult,
  currentPeriod,
  secondsRemaining,
  isLocked,
  onOpenHowToPlay,
}) => {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const minStr = String(minutes).padStart(2, '0');
  const secStr = String(seconds).padStart(2, '0');

  // Mode duration textual label (e.g. "1 minutes", "30 seconds")
  const durationText = {
    '30s': '30 seconds',
    '1m': '1 minutes',
    '3m': '3 minutes',
    '5m': '5 minutes',
  }[mode];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#192437] via-[#131c2c] to-[#0e1522] border border-slate-700/60 p-3 sm:p-4 shadow-xl">
      {/* Background subtle radial glow behind chip */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Grid: Left info, Center chip, Right timer */}
      <div className="relative z-10 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left Side: Duration & Previous Period */}
        <div className="flex-1 flex flex-col justify-between items-start space-y-1.5 min-w-0">
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-400 capitalize block truncate">
              {durationText}
            </span>
            <span className="text-xs sm:text-[13px] font-mono font-bold text-slate-200 tracking-tight block truncate">
              {previousResult?.period || '20260924000'}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenHowToPlay}
            className="inline-flex items-center space-x-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-sky-400 text-[10px] sm:text-[11px] font-semibold border border-sky-500/20 transition-all cursor-pointer shadow-sm shrink-0"
          >
            <HelpCircle className="w-3 h-3 text-sky-400" />
            <span>Rules</span>
          </button>
        </div>

        {/* Center: Previous Draw Winning Casino Chip Display */}
        <div className="flex flex-col items-center justify-center px-1 sm:px-2 shrink-0">
          <div className="relative flex items-center justify-center p-1.5 sm:p-2 rounded-full bg-slate-950/70 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            {previousResult ? (
              <NumberBall
                number={previousResult.number}
                size="lg"
                showGlow={true}
                className="transform transition-transform hover:scale-105"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-400 font-black text-xl">
                ?
              </div>
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] text-amber-300 font-bold mt-1 uppercase tracking-wider">
            Last Win Chip
          </span>
        </div>

        {/* Right Side: Countdown and Current Period */}
        <div className="flex-1 flex flex-col justify-between items-end space-y-1 text-right min-w-0">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 truncate">
            Time to bet
          </span>

          {/* Digital Timer boxes */}
          <div className="flex items-center space-x-1 font-mono">
            {/* Minutes Box */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#22334e] border border-sky-400/40 flex items-center justify-center text-white font-extrabold text-base sm:text-lg shadow-[0_0_10px_rgba(56,189,248,0.25)]">
              {minStr}
            </div>
            <span className="text-sky-300 font-bold text-base sm:text-lg animate-pulse">:</span>
            {/* Seconds Box */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center font-extrabold text-base sm:text-lg transition-colors ${
                isLocked
                  ? 'bg-rose-600/30 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-bounce'
                  : 'bg-[#22334e] border-sky-400/40 text-white shadow-[0_0_10px_rgba(56,189,248,0.25)]'
              }`}
            >
              {secStr}
            </div>
          </div>

          <div className="font-mono text-[11px] sm:text-xs font-bold text-sky-300/90 tracking-tight truncate max-w-full">
            #{currentPeriod.slice(-5)}
          </div>
        </div>
      </div>

      {/* Lock alert banner on final 5 seconds */}
      {isLocked && (
        <div className="mt-2.5 py-1 px-3 rounded-lg bg-rose-950/80 border border-rose-500/50 flex items-center justify-center space-x-1.5 animate-pulse">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-xs font-black text-rose-200 tracking-wide uppercase">
            Order Locked • Drawing Winner Casino Chip...
          </span>
        </div>
      )}
    </div>
  );
};
