import React, { useState } from 'react';
import { X, Check, AlertCircle, Coins, ChevronRight } from 'lucide-react';
import { BetColor, BetSize, BetTargetType } from '../types';
import { NumberBall } from './NumberBall';

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: BetTargetType;
  targetValue: BetColor | BetSize | number;
  period: string;
  balance: number;
  onConfirmBet: (contractAmount: number, multiplier: number) => void;
}

const CONTRACT_AMOUNTS = [10, 100, 1000, 10000];
const MULTIPLIERS = [1, 5, 10, 20, 50, 100];

export const BetModal: React.FC<BetModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetValue,
  period,
  balance,
  onConfirmBet,
}) => {
  const [contractAmount, setContractAmount] = useState<number>(100);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [agreed, setAgreed] = useState<boolean>(true);

  if (!isOpen) return null;

  const totalAmount = contractAmount * multiplier;
  const isInsufficientBalance = totalAmount > balance;

  // Potential payout estimation
  let expectedMultiplier = '2x';
  if (targetType === 'color') {
    if (targetValue === 'violet') expectedMultiplier = '4.5x';
    else expectedMultiplier = '2x (or 1.5x on 0/5)';
  } else if (targetType === 'number') {
    expectedMultiplier = '9x';
  } else if (targetType === 'size') {
    expectedMultiplier = '2x';
  }

  // Header theme color based on target
  let headerBg = 'bg-slate-800';
  let badgeName = '';

  if (targetType === 'color') {
    if (targetValue === 'green') {
      headerBg = 'bg-gradient-to-r from-emerald-600 to-green-700';
      badgeName = 'GREEN';
    } else if (targetValue === 'violet') {
      headerBg = 'bg-gradient-to-r from-purple-600 to-violet-700';
      badgeName = 'VIOLET';
    } else {
      headerBg = 'bg-gradient-to-r from-rose-600 to-red-700';
      badgeName = 'RED';
    }
  } else if (targetType === 'number') {
    headerBg = 'bg-gradient-to-r from-indigo-700 to-slate-800';
    badgeName = `NUMBER ${targetValue}`;
  } else if (targetType === 'size') {
    headerBg = targetValue === 'big' 
      ? 'bg-gradient-to-r from-amber-600 to-orange-700' 
      : 'bg-gradient-to-r from-cyan-600 to-blue-700';
    badgeName = `${String(targetValue).toUpperCase()}`;
  }

  const handleConfirm = () => {
    if (isInsufficientBalance || !agreed || totalAmount <= 0) return;
    onConfirmBet(contractAmount, multiplier);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full sm:max-w-md bg-[#131d2e] rounded-t-3xl sm:rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Banner */}
        <div className={`${headerBg} p-4 text-white relative shadow-md`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            {targetType === 'number' ? (
              <NumberBall number={Number(targetValue)} size="md" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-lg border border-white/30">
                {badgeName[0]}
              </div>
            )}
            <div>
              <span className="text-xs uppercase tracking-wider text-white/80 font-bold">
                Select {badgeName}
              </span>
              <div className="text-white text-base font-extrabold flex items-center space-x-2">
                <span>Period: {period}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Balance info */}
          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Available Balance:</span>
            <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">₹</span>
              <span>₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Contract Amount Selection */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-300">Contract Amount (INR)</label>
              <span className="text-[11px] text-amber-400 font-mono">1 INR = ₹1</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {CONTRACT_AMOUNTS.map((amt) => {
                const isSelected = contractAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setContractAmount(amt)}
                    className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-sky-500 to-blue-600 text-white shadow-md border-t border-sky-300 ring-2 ring-sky-400/50'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    ₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multiplier Quantity */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-300">Multiplier Quantity</label>
              <span className="text-xs font-bold text-sky-400 font-mono">x{multiplier}</span>
            </div>

            {/* Stepper */}
            <div className="flex items-center space-x-2 mb-2">
              <button
                type="button"
                onClick={() => setMultiplier((prev) => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-lg flex items-center justify-center border border-slate-700 active:scale-95 transition-transform"
              >
                -
              </button>

              <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl h-10 flex items-center justify-center font-mono font-black text-white text-base">
                {multiplier}
              </div>

              <button
                type="button"
                onClick={() => setMultiplier((prev) => prev + 1)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-lg flex items-center justify-center border border-slate-700 active:scale-95 transition-transform"
              >
                +
              </button>
            </div>

            {/* Quick Multiplier Chips */}
            <div className="grid grid-cols-6 gap-1.5">
              {MULTIPLIERS.map((mul) => {
                const isSelected = multiplier === mul;
                return (
                  <button
                    key={mul}
                    type="button"
                    onClick={() => setMultiplier(mul)}
                    className={`py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    x{mul}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payout & Odds summary card */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Bet Amount:</span>
              <span className="text-base font-black text-amber-300 font-mono">
                ₹{totalAmount.toLocaleString()} INR
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Expected Win Multiplier:</span>
              <span className="font-semibold text-emerald-400">{expectedMultiplier}</span>
            </div>
            {isInsufficientBalance && (
              <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-semibold pt-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Insufficient INR balance! Please recharge wallet.</span>
              </div>
            )}
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-center space-x-2 text-xs text-slate-400 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
            />
            <span>
              I agree to the <span className="text-sky-400 font-medium">Pre-Sale &amp; WinGo Rules</span>
            </span>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isInsufficientBalance || !agreed || totalAmount <= 0}
            onClick={handleConfirm}
            className={`flex-2 py-3 px-4 rounded-xl font-black text-sm tracking-wide transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer ${
              isInsufficientBalance || !agreed || totalAmount <= 0
                ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400'
                : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25 active:scale-[0.98]'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">₹</span>
            <span>Confirm Bet (₹{totalAmount.toLocaleString()} INR)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
