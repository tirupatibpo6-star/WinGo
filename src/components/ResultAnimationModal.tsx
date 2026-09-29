import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy, CheckCircle, XCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DrawResult, UserBet } from '../types';
import { NumberBall } from './NumberBall';
import { playWinSound, playLossSound } from '../utils/audio';

interface ResultAnimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: DrawResult | null;
  roundBets: UserBet[];
}

export const ResultAnimationModal: React.FC<ResultAnimationModalProps> = ({
  isOpen,
  onClose,
  result,
  roundBets,
}) => {
  const [reelState, setReelState] = useState<['7️⃣' | '💎' | '🍒' | '⭐', '7️⃣' | '💎' | '🍒' | '⭐', '7️⃣' | '💎' | '🍒' | '⭐']>([
    '7️⃣',
    '7️⃣',
    '7️⃣',
  ]);
  const [lightsActive, setLightsActive] = useState(true);

  const winningBets = roundBets.filter((b) => b.status === 'won');
  const hasWon = winningBets.length > 0;
  const totalWon = winningBets.reduce((sum, b) => sum + b.payout, 0);
  const totalProfit = winningBets.reduce((sum, b) => sum + b.profit, 0);

  // Marquee light chase & casino effects
  useEffect(() => {
    if (!isOpen || !result) return;

    if (hasWon) {
      playWinSound();
      // Grand casino confetti burst
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#ffd700', '#ff0055', '#00ffcc', '#ffffff', '#ff9900'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 70,
          origin: { x: 0 },
          colors: ['#ffd700', '#ffaa00'],
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 70,
          origin: { x: 1 },
          colors: ['#ffd700', '#ffaa00'],
        });
      }, 500);
    } else if (roundBets.length > 0) {
      playLossSound();
    }

    const lightTimer = setInterval(() => {
      setLightsActive((prev) => !prev);
    }, 350);

    // Auto-close timer
    const autoClose = setTimeout(() => {
      onClose();
    }, hasWon ? 8000 : 5000);

    return () => {
      clearInterval(lightTimer);
      clearTimeout(autoClose);
    };
  }, [isOpen, result, hasWon, roundBets.length, onClose]);

  if (!isOpen || !result) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none cursor-pointer"
    >
      <div
        className="w-full max-w-sm sm:max-w-md overflow-hidden relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {hasWon ? (
          /* =========================================================================
             CASINO MACHINE JACKPOT POPUP GRAPHIC WITH CONGRATULATIONS
             ========================================================================= */
          <div className="relative rounded-3xl bg-gradient-to-b from-[#2a0e0e] via-[#1a1226] to-[#0c0d18] border-4 border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.6)] p-1 text-center animate-scale-up">
            {/* Flashing Casino Marquee Lights Ring */}
            <div className="flex justify-between items-center px-4 pt-2.5 pb-1">
              {[...Array(11)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    (i % 2 === 0 ? lightsActive : !lightsActive)
                      ? 'bg-amber-300 shadow-[0_0_10px_#fde047]'
                      : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                  }`}
                />
              ))}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-amber-200 border border-amber-400/40 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Casino Machine Header Crown */}
            <div className="pt-2 px-4 pb-2">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-slate-950 px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>🎰 LUCKY CASINO WINNER 🎰</span>
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-yellow-500 tracking-tight mt-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                CONGRATULATIONS!
              </h2>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300/90">
                You hit the winning prediction!
              </div>
            </div>

            {/* Casino Slot Machine Reels Graphic */}
            <div className="mx-4 my-2 p-3 bg-gradient-to-b from-[#120808] to-[#201010] rounded-2xl border-2 border-amber-400/70 shadow-inner">
              <div className="flex items-center justify-center space-x-2.5">
                {/* Slot Reel 1 */}
                <div className="w-16 h-18 bg-gradient-to-b from-slate-950 via-slate-800 to-slate-950 rounded-xl border border-amber-400/60 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                  <span className="text-2xl animate-bounce">7️⃣</span>
                  <span className="text-[9px] font-mono text-amber-400 font-black mt-0.5">WIN</span>
                  <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                </div>

                {/* Slot Reel 2: Center Winning Ball */}
                <div className="w-20 h-22 bg-gradient-to-b from-amber-950 via-slate-900 to-amber-950 rounded-2xl border-2 border-yellow-300 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.6)] relative z-10 scale-105">
                  <div className="absolute -top-2 px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[8px] uppercase tracking-wider">
                    RESULT
                  </div>
                  <NumberBall number={result.number} size="md" showGlow={true} />
                  <div className="flex items-center space-x-1 mt-1">
                    {result.colors.map((c) => (
                      <span
                        key={c}
                        className={`w-2 h-2 rounded-full ${
                          c === 'green' ? 'bg-emerald-400' : c === 'violet' ? 'bg-purple-400' : 'bg-rose-500'
                        }`}
                      />
                    ))}
                    <span className="text-[9px] font-black uppercase text-amber-300">
                      {result.size}
                    </span>
                  </div>
                </div>

                {/* Slot Reel 3 */}
                <div className="w-16 h-18 bg-gradient-to-b from-slate-950 via-slate-800 to-slate-950 rounded-xl border border-amber-400/60 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                  <span className="text-2xl animate-bounce">7️⃣</span>
                  <span className="text-[9px] font-mono text-amber-400 font-black mt-0.5">WIN</span>
                  <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Payout Display in INR (₹) */}
            <div className="mx-4 my-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-500/20 border border-amber-400/60 shadow-lg text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                Total Cash Payout (INR)
              </span>
              <div className="font-mono text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 drop-shadow-[0_2px_10px_rgba(251,191,36,0.6)] my-1">
                +₹{totalWon.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-center space-x-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Net Profit: +₹{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR</span>
              </div>
            </div>

            {/* Winning Bets Details */}
            <div className="mx-4 mb-3 max-h-24 overflow-y-auto space-y-1 text-left">
              {winningBets.map((bet) => (
                <div
                  key={bet.id}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-slate-200 uppercase">
                      {String(bet.targetValue)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (₹{bet.totalAmount})
                    </span>
                  </div>
                  <span className="font-mono font-black text-amber-300 text-xs">
                    +₹{bet.payout.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Golden Action Button */}
            <div className="p-3 bg-black/40 rounded-b-3xl">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 text-slate-950 shadow-xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>COLLECT ₹{totalWon.toFixed(2)} &amp; CONTINUE PLAYING</span>
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             STANDARD DRAW RESULT (When no win or lost bet)
             ========================================================================= */
          <div className="bg-gradient-to-b from-[#1c2a42] to-[#101826] rounded-3xl border-2 border-slate-700 shadow-2xl p-5 text-center space-y-3.5 animate-scale-up">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                Round Draw Result
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-white font-mono text-xs font-bold text-slate-300">
              Period: {result.period}
            </div>

            {/* Ball */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="p-2 rounded-full bg-slate-900 border border-slate-700 shadow-inner">
                <NumberBall number={result.number} size="xl" showGlow={true} />
              </div>

              {/* Color & Size tags */}
              <div className="flex items-center space-x-2 mt-3">
                {result.colors.map((c) => (
                  <span
                    key={c}
                    className={`px-3 py-0.5 rounded-full text-xs font-black uppercase text-white ${
                      c === 'green'
                        ? 'bg-emerald-600'
                        : c === 'violet'
                        ? 'bg-purple-600'
                        : 'bg-rose-600'
                    }`}
                  >
                    {c}
                  </span>
                ))}
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black uppercase ${
                    result.size === 'big' ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950'
                  }`}
                >
                  {result.size}
                </span>
              </div>
            </div>

            {roundBets.length > 0 ? (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-1">
                <div className="flex items-center justify-center space-x-1 text-rose-400 font-bold text-xs">
                  <XCircle className="w-4 h-4" />
                  <span>Better luck on the next round!</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Total Bet: ₹{roundBets.reduce((s, b) => s + b.totalAmount, 0).toLocaleString()} INR
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-1">
                No bets placed on this round. Try predicting the next one!
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
