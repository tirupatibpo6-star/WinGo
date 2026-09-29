import React from 'react';
import { X, BookOpen, CheckCircle, ShieldCheck } from 'lucide-react';
import { NumberBall } from './NumberBall';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-[#131d2e] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 text-white relative shadow-md flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-sky-300" />
            <h2 className="text-base font-extrabold tracking-tight">How to Play WinGo</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs text-slate-300">
          {/* Section 1: Overview */}
          <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <h3 className="font-extrabold text-sky-400 text-sm">Game Overview</h3>
            <p className="leading-relaxed">
              WinGo is a fast-paced color and number trading game. The game runs continuous rounds (30s, 1min, 3min, 5min). In each round, a random winning number from 0 to 9 is drawn.
            </p>
          </div>

          {/* Section 2: Colors and Multipliers */}
          <div className="space-y-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <h3 className="font-extrabold text-emerald-400 text-sm">Color Rules &amp; Multipliers</h3>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-start space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-300">GREEN:</strong> If result is 1, 3, 7, 9, you win <strong>2x</strong> payout (e.g. ₹10 bet wins ₹19.60). If result is 5, you get <strong>1.5x</strong> (Green + Violet split).
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-300">RED:</strong> If result is 2, 4, 6, 8, you win <strong>2x</strong> payout (e.g. ₹10 bet wins ₹19.60). If result is 0, you get <strong>1.5x</strong> (Red + Violet split).
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-300">VIOLET:</strong> If result is 0 or 5, you win <strong>4.5x</strong> payout!
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Exact Numbers & Big/Small */}
          <div className="space-y-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <h3 className="font-extrabold text-amber-400 text-sm">Numbers &amp; Big/Small</h3>

            <div className="space-y-1.5 text-[11px]">
              <div>
                <strong className="text-amber-300">Exact Number (0-9):</strong> Predict the exact number ball. If correct, you win massive <strong>9.0x</strong> INR payout (₹10 bet wins ₹88.20)!
              </div>
              <div className="pt-1 flex items-center justify-center space-x-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <NumberBall key={n} number={n} size="xs" />
                ))}
              </div>
              <div className="pt-2">
                <strong className="text-cyan-300">BIG (5, 6, 7, 8, 9):</strong> Pays <strong>2x</strong> INR.
              </div>
              <div>
                <strong className="text-cyan-300">SMALL (0, 1, 2, 3, 4):</strong> Pays <strong>2x</strong> INR.
              </div>
            </div>
          </div>

          {/* Section 4: Presale Lock & Fair Play */}
          <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px]">
            <h3 className="font-extrabold text-slate-200 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Fair Play &amp; Presale Lock</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              When 5 seconds remain before draw time, betting is locked to ensure fair calculation and server synchronization. Winning INR amounts are credited immediately to your balance after each round.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
