import React from 'react';
import { Clock } from 'lucide-react';
import { GameMode } from '../types';

interface ModeSelectorProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
}

const MODES: { id: GameMode; label: string; sub: string }[] = [
  { id: '30s', label: '30s', sub: 'Fast' },
  { id: '1m', label: '1mins', sub: 'Classic' },
  { id: '3m', label: '3mins', sub: 'Strategic' },
  { id: '5m', label: '5mins', sub: 'Deep' },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onSelectMode }) => {
  return (
    <div className="bg-[#111927] p-1.5 border-b border-slate-800">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {MODES.map((mode) => {
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-b from-[#253856] to-[#1a2942] text-white shadow-md border-t border-sky-400/40 relative'
                  : 'bg-[#152033]/60 hover:bg-[#1a2840] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-1">
                <Clock
                  className={`w-3 h-3 ${isActive ? 'text-sky-300 animate-spin-slow' : 'text-slate-500'}`}
                />
                <span className="font-bold text-xs tracking-tight">{mode.label}</span>
              </div>
              <span
                className={`text-[9px] font-medium mt-0.5 ${
                  isActive ? 'text-sky-300/80 font-semibold' : 'text-slate-500'
                }`}
              >
                {mode.sub}
              </span>

              {isActive && (
                <div className="absolute -bottom-1.5 w-6 h-0.5 bg-sky-400 rounded-full shadow-[0_0_8px_#38bdf8]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
