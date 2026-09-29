import React from 'react';
import { getNumberColors } from '../utils/gameRules';

interface NumberBallProps {
  number: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  showGlow?: boolean;
}

/**
 * Authentic Casino Poker/Roulette Chip Graphic
 * Features:
 * - Real casino chip notched edge stripes (6 contrasting edge inserts / rim stripes)
 * - Deep outer beveled rim with inner recessed dish
 * - Golden dotted / beaded security ring
 * - Contrast inner inlay medallion with currency / decorative denomination markings
 * - 3D glossy reflective bevels and authentic drop shadow
 * - Special 2-tone split chip design for numbers 0 (Red/Violet) and 5 (Green/Violet)
 */
export const NumberBall: React.FC<NumberBallProps> = ({
  number,
  size = 'md',
  onClick,
  selected = false,
  disabled = false,
  className = '',
  showGlow = false,
}) => {
  const colors = getNumberColors(number);
  const isSplit = colors.length === 2;

  // Size styling classes & scale dimensions
  const sizeConfig = {
    xs: {
      btn: 'w-6 h-6',
      num: 'text-[11px] font-black',
      stripeW: 'w-[3px]',
      innerPadding: 'p-[2px]',
      dotsSize: 'w-[1px] h-[1px]',
      showDenom: false,
    },
    sm: {
      btn: 'w-8 h-8',
      num: 'text-xs font-black',
      stripeW: 'w-[4px]',
      innerPadding: 'p-[2.5px]',
      dotsSize: 'w-[1.5px] h-[1.5px]',
      showDenom: false,
    },
    md: {
      btn: 'w-12 h-12 sm:w-[50px] sm:h-[50px]',
      num: 'text-base font-black',
      stripeW: 'w-[5px]',
      innerPadding: 'p-[3.5px]',
      dotsSize: 'w-[2px] h-[2px]',
      showDenom: true,
    },
    lg: {
      btn: 'w-16 h-16',
      num: 'text-2xl font-black',
      stripeW: 'w-[7px]',
      innerPadding: 'p-[5px]',
      dotsSize: 'w-[2.5px] h-[2.5px]',
      showDenom: true,
    },
    xl: {
      btn: 'w-22 h-22',
      num: 'text-3xl font-black',
      stripeW: 'w-[9px]',
      innerPadding: 'p-[7px]',
      dotsSize: 'w-[3px] h-[3px]',
      showDenom: true,
    },
  }[size];

  // Base casino chip palette depending on number colors
  // Standard casino chip coloring:
  // Red chips (#e11d48, #be123c) with white / gold edge inserts
  // Green chips (#16a34a, #15803d) with white / gold edge inserts
  // Split 0: Red & Purple chips
  // Split 5: Green & Purple chips
  let chipBaseGradient = '';
  let chipBorder = 'border-slate-900/40';
  let stripeColor = '#ffffff';
  let inlayBg = '#0b0f19';
  let inlayBorder = 'border-amber-400/80';
  let shadowStyle = 'shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.4)]';
  let ringAura = '';

  if (isSplit) {
    if (number === 0) {
      // Red + Violet Split Casino Chip
      chipBaseGradient = 'linear-gradient(135deg, #e11d48 0%, #be123c 48%, #9333ea 52%, #7e22ce 100%)';
      stripeColor = '#fef08a'; // Gold inserts
      inlayBorder = 'border-amber-300';
      shadowStyle = 'shadow-[0_5px_15px_rgba(147,51,234,0.45),inset_0_1px_2px_rgba(255,255,255,0.5)]';
      ringAura = 'ring-2 ring-purple-400/50';
    } else {
      // 5: Green + Violet Split Casino Chip
      chipBaseGradient = 'linear-gradient(135deg, #16a34a 0%, #15803d 48%, #9333ea 52%, #7e22ce 100%)';
      stripeColor = '#fef08a'; // Gold inserts
      inlayBorder = 'border-amber-300';
      shadowStyle = 'shadow-[0_5px_15px_rgba(34,197,94,0.45),inset_0_1px_2px_rgba(255,255,255,0.5)]';
      ringAura = 'ring-2 ring-emerald-400/50';
    }
  } else if (colors.includes('green')) {
    // Solid Emerald Casino Chip
    chipBaseGradient = 'linear-gradient(145deg, #22c55e 0%, #16a34a 55%, #14532d 100%)';
    stripeColor = '#ffffff';
    inlayBorder = 'border-amber-400';
    shadowStyle = 'shadow-[0_5px_15px_rgba(22,163,74,0.45),inset_0_1px_2px_rgba(255,255,255,0.5)]';
  } else {
    // Solid Crimson Casino Chip
    chipBaseGradient = 'linear-gradient(145deg, #f43f5e 0%, #e11d48 55%, #881337 100%)';
    stripeColor = '#ffffff';
    inlayBorder = 'border-amber-400';
    shadowStyle = 'shadow-[0_5px_15px_rgba(225,29,72,0.45),inset_0_1px_2px_rgba(255,255,255,0.5)]';
  }

  // 6 radial chip edge stripe angles (0°, 60°, 120°, 180°, 240°, 300°)
  const stripeRotations = [0, 60, 120, 180, 240, 300];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 select-none transition-all duration-150 border ${chipBorder} ${sizeConfig.btn} ${shadowStyle} ${ringAura} ${
        onClick && !disabled
          ? 'cursor-pointer hover:scale-110 active:scale-95 hover:rotate-6'
          : 'cursor-default'
      } ${
        selected
          ? 'ring-4 ring-amber-300 ring-offset-2 ring-offset-[#0d1421] scale-110 shadow-[0_0_20px_rgba(251,191,36,0.8)] z-20'
          : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed grayscale-[30%]' : ''} ${className}`}
      style={{
        background: chipBaseGradient,
      }}
    >
      {/* Outer Chip Edge Stripes / Molded Casino Rim Inserts */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        {stripeRotations.map((deg) => (
          <div
            key={deg}
            className={`absolute top-0 left-1/2 -translate-x-1/2 h-full ${sizeConfig.stripeW} flex flex-col justify-between items-center pointer-events-none`}
            style={{
              transform: `translateX(-50%) rotate(${deg}deg)`,
            }}
          >
            {/* Top rim insert */}
            <div
              className="w-full h-1.5 sm:h-2 rounded-b-[1px] shadow-[0_1px_1px_rgba(0,0,0,0.4)]"
              style={{
                backgroundColor: stripeColor,
                backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(200,200,200,0.8))',
              }}
            />
            {/* Bottom rim insert */}
            <div
              className="w-full h-1.5 sm:h-2 rounded-t-[1px] shadow-[0_-1px_1px_rgba(0,0,0,0.4)]"
              style={{
                backgroundColor: stripeColor,
                backgroundImage: 'linear-gradient(to top, rgba(255,255,255,0.9), rgba(200,200,200,0.8))',
              }}
            />
          </div>
        ))}
      </div>

      {/* Recessed Dish Groove / Texture Groove (standard casino clay ring) */}
      <div className="absolute inset-[10%] rounded-full border border-black/35 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_1px_1px_rgba(255,255,255,0.3)] pointer-events-none" />

      {/* Casino Chip Golden Dotted / Beaded Security Ring */}
      <div className="absolute inset-[15%] rounded-full border border-dashed border-amber-300/80 pointer-events-none opacity-85" />

      {/* Center Casino Inlay Medallion */}
      <div
        className={`relative z-10 w-[64%] h-[64%] rounded-full border ${inlayBorder} flex flex-col items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_1px_2px_rgba(255,255,255,0.3)]`}
        style={{
          background: `radial-gradient(circle at 40% 35%, #1e293b 0%, #0f172a 60%, ${inlayBg} 100%)`,
        }}
      >
        {/* Subtle top arc shine on inlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 via-transparent to-transparent pointer-events-none" />

        {/* Casino Chip Center Denomination Number */}
        <span
          className={`relative z-10 text-white font-serif tracking-tighter ${sizeConfig.num} drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]`}
          style={{
            textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 2px rgba(255,255,255,0.2)',
          }}
        >
          {number}
        </span>

        {/* Tiny VIP Star / Denomination pip for realistic casino chip feel */}
        {sizeConfig.showDenom && (
          <span className="absolute bottom-[2px] text-[7px] font-black tracking-widest text-amber-300/90 scale-75 select-none uppercase font-mono">
            ★
          </span>
        )}
      </div>

      {/* Realistic Acrylic Surface Specular Glare (3D sheen) */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none overflow-hidden opacity-40"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Flashing glow ring for winning draw results */}
      {showGlow && (
        <span className="absolute -inset-1.5 rounded-full border-2 border-amber-300 animate-ping pointer-events-none" />
      )}
    </button>
  );
};
