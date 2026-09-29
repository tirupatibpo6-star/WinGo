import React, { useState } from 'react';
import { DrawResult, GameMode, UserBet } from '../types';
import { NumberBall } from './NumberBall';
import {
  TrendingUp,
  FileText,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Award,
  ChevronRight,
  Coins,
  CreditCard,
  ArrowUpRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GameTabsProps {
  mode: GameMode;
  results: DrawResult[];
  userBets: UserBet[];
  onOpenProfileModal?: () => void;
  onOpenRecharge?: () => void;
  onOpenClaim?: () => void;
}

export const GameTabs: React.FC<GameTabsProps> = ({
  mode,
  results,
  userBets,
  onOpenProfileModal,
  onOpenRecharge,
  onOpenClaim,
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'result' | 'order' | 'trend' | 'profile'>('result');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');

  const filteredBets = userBets.filter((bet) => {
    if (orderFilter === 'all') return true;
    return bet.status === orderFilter;
  });

  // Calculate statistics for trend tab
  const totalDraws = results.length;
  const greenCount = results.filter((r) => r.colors.includes('green')).length;
  const redCount = results.filter((r) => r.colors.includes('red')).length;
  const violetCount = results.filter((r) => r.colors.includes('violet')).length;
  const bigCount = results.filter((r) => r.size === 'big').length;
  const smallCount = results.filter((r) => r.size === 'small').length;

  // Profile Stats
  const totalBets = userBets.length;
  const wonBets = userBets.filter((b) => b.status === 'won').length;
  const lostBets = userBets.filter((b) => b.status === 'lost').length;
  const resolvedBets = wonBets + lostBets;
  const winRate = resolvedBets > 0 ? Math.round((wonBets / resolvedBets) * 100) : 0;
  const totalWagered = userBets.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const netProfit = userBets.reduce((sum, b) => {
    if (b.status === 'won') return sum + (b.profit || 0);
    if (b.status === 'lost') return sum - (b.totalAmount || 0);
    return sum;
  }, 0);

  return (
    <div className="rounded-2xl bg-[#141e2e] border border-slate-700/60 overflow-hidden shadow-lg">
      {/* Tab Navigation Headers */}
      <div className="flex border-b border-slate-700/80 bg-[#111927]">
        <button
          type="button"
          onClick={() => setActiveTab('result')}
          className={`flex-1 py-3 text-center text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
            activeTab === 'result'
              ? 'bg-[#1e2f47] text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Game Record</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('order')}
          className={`flex-1 py-3 text-center text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer relative ${
            activeTab === 'order'
              ? 'bg-[#1e2f47] text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>My Bets</span>
          {userBets.filter((b) => b.status === 'pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trend')}
          className={`flex-1 py-3 text-center text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
            activeTab === 'trend'
              ? 'bg-[#1e2f47] text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Trends</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 text-center text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#1e2f47] text-sky-400 border-b-2 border-sky-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile</span>
        </button>
      </div>

      {/* Tab 1: Game Record / Results History */}
      {activeTab === 'result' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#182335] text-slate-400 border-b border-slate-700/60 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3 text-center">Number</th>
                <th className="py-2.5 px-3 text-center">Big/Small</th>
                <th className="py-2.5 px-3 text-right">Color</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {results.map((item, idx) => (
                <tr
                  key={item.period + idx}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-300">
                    {item.period}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-flex justify-center">
                      <NumberBall number={item.number} size="sm" />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        item.size === 'big'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {item.size.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {item.colors.includes('green') && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                      )}
                      {item.colors.includes('violet') && (
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_6px_#a855f7]" />
                      )}
                      {item.colors.includes('red') && (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#ef4444]" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: My Bets / Orders */}
      {activeTab === 'order' && (
        <div className="p-3 space-y-3">
          {/* Sub-filter pills */}
          <div className="flex space-x-1.5 overflow-x-auto pb-1">
            {(['all', 'pending', 'won', 'lost'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setOrderFilter(filter)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                  orderFilter === filter
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {filteredBets.length === 0 ? (
            <div className="py-10 text-center text-slate-500 space-y-2">
              <Clock className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
              <p className="text-xs">No {orderFilter !== 'all' ? orderFilter : ''} bets found</p>
              <p className="text-[11px] text-slate-600">Select a color or number above to play!</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredBets.map((bet) => (
                <div
                  key={bet.id}
                  className="bg-[#111927] p-3 rounded-xl border border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-300 font-bold">
                        {bet.period}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(bet.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {bet.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5 animate-spin" />
                          <span>Waiting Draw</span>
                        </span>
                      )}
                      {bet.status === 'won' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          <span>WON +₹{bet.profit.toLocaleString()}</span>
                        </span>
                      )}
                      {bet.status === 'lost' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                          <XCircle className="w-2.5 h-2.5 text-rose-400" />
                          <span>LOST -₹{bet.totalAmount.toLocaleString()}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bet Details row */}
                  <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Choice:</span>
                      {bet.targetType === 'number' ? (
                        <span className="font-black text-white px-2 py-0.5 rounded bg-indigo-600">
                          Num {bet.targetValue}
                        </span>
                      ) : bet.targetType === 'color' ? (
                        <span
                          className={`font-black text-white px-2 py-0.5 rounded uppercase text-[10px] ${
                            bet.targetValue === 'green'
                              ? 'bg-emerald-600'
                              : bet.targetValue === 'violet'
                              ? 'bg-purple-600'
                              : 'bg-rose-600'
                          }`}
                        >
                          {bet.targetValue}
                        </span>
                      ) : (
                        <span
                          className={`font-black text-white px-2 py-0.5 rounded uppercase text-[10px] ${
                            bet.targetValue === 'big' ? 'bg-amber-600' : 'bg-cyan-600'
                          }`}
                        >
                          {bet.targetValue}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">
                        (₹{bet.contractAmount} × {bet.multiplier})
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 text-[11px] mr-1">Bet:</span>
                      <span className="font-black text-amber-300 font-mono">
                        ₹{bet.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {bet.winDetails && (
                    <div className="text-[11px] text-slate-400 flex justify-between items-center px-1">
                      <span>Result note: {bet.winDetails}</span>
                      {bet.drawResult && (
                        <span className="text-slate-300 font-mono">
                          Draw Ball: <strong className="text-white">{bet.drawResult.number}</strong> ({bet.drawResult.size.toUpperCase()})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Trends & Analytics */}
      {activeTab === 'trend' && (
        <div className="p-4 space-y-4">
          <div className="text-xs text-slate-400 font-medium">
            Recent {totalDraws} Draws Frequency Analysis:
          </div>

          {/* Color Breakdown Bars */}
          <div className="space-y-2 bg-[#101826] p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold">Colors Distribution</span>
              <span className="text-slate-500 text-[10px]">Green / Violet / Red</span>
            </div>

            <div className="h-4 rounded-full overflow-hidden flex bg-slate-800 shadow-inner">
              <div
                style={{ width: `${(greenCount / (totalDraws || 1)) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Green: ${greenCount}`}
              />
              <div
                style={{ width: `${(violetCount / (totalDraws || 1)) * 100}%` }}
                className="bg-purple-500 h-full transition-all"
                title={`Violet: ${violetCount}`}
              />
              <div
                style={{ width: `${(redCount / (totalDraws || 1)) * 100}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Red: ${redCount}`}
              />
            </div>

            <div className="grid grid-cols-3 text-center text-[11px] pt-1">
              <div className="text-emerald-400 font-bold">
                Green: {Math.round((greenCount / (totalDraws || 1)) * 100)}%
              </div>
              <div className="text-purple-400 font-bold">
                Violet: {Math.round((violetCount / (totalDraws || 1)) * 100)}%
              </div>
              <div className="text-rose-400 font-bold">
                Red: {Math.round((redCount / (totalDraws || 1)) * 100)}%
              </div>
            </div>
          </div>

          {/* Size Breakdown */}
          <div className="space-y-2 bg-[#101826] p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-bold">Big vs Small Ratio</span>
              <span className="text-slate-500 text-[10px]">5-9 (Big) / 0-4 (Small)</span>
            </div>

            <div className="h-3 rounded-full overflow-hidden flex bg-slate-800 shadow-inner">
              <div
                style={{ width: `${(bigCount / (totalDraws || 1)) * 100}%` }}
                className="bg-amber-500 h-full"
              />
              <div
                style={{ width: `${(smallCount / (totalDraws || 1)) * 100}%` }}
                className="bg-cyan-500 h-full"
              />
            </div>

            <div className="flex justify-between text-xs font-bold pt-1">
              <span className="text-amber-400">
                Big: {Math.round((bigCount / (totalDraws || 1)) * 100)}% ({bigCount})
              </span>
              <span className="text-cyan-400">
                Small: {Math.round((smallCount / (totalDraws || 1)) * 100)}% ({smallCount})
              </span>
            </div>
          </div>

          {/* Bead Road / Trend Matrix */}
          <div className="space-y-2 bg-[#101826] p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300 font-bold block">
              Recent Sequence Bead Matrix
            </span>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900 rounded-lg">
              {results.slice(0, 18).map((r, i) => (
                <div key={i} className="flex flex-col items-center">
                  <NumberBall number={r.number} size="xs" />
                  <span
                    className={`text-[8px] font-bold mt-0.5 ${
                      r.size === 'big' ? 'text-amber-400' : 'text-cyan-400'
                    }`}
                  >
                    {r.size === 'big' ? 'B' : 'S'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: My Profile & Performance Overview */}
      {activeTab === 'profile' && (
        <div className="p-4 space-y-3.5 bg-[#0f1726]">
          {/* User Quick Identity */}
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow">
                {(userProfile?.displayName || currentUser?.email || 'G').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">
                  {userProfile?.displayName || currentUser?.email?.split('@')[0] || 'Guest Trader'}
                </h4>
                <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  {currentUser?.email || 'Guest Mode (Local Bets Only)'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Wallet (INR)</span>
              <span className="text-xs font-black text-amber-300">
                ₹{(userProfile?.coins ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Bets</span>
              <span className="text-base font-black text-white">{totalBets}</span>
            </div>

            <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Win Rate</span>
              <span className={`text-base font-black ${winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {winRate}%
              </span>
            </div>

            <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Wagered (INR)</span>
              <span className="text-base font-black text-amber-300">₹{totalWagered.toLocaleString()}</span>
            </div>

            <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Net Profit</span>
              <span className={`text-base font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netProfit >= 0 ? `+₹${netProfit.toLocaleString()}` : `-₹${Math.abs(netProfit).toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Win/Loss Progress Bar */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300 text-[11px] flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Win/Loss Record</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {wonBets} Won • {lostBets} Lost
              </span>
            </div>
            {resolvedBets > 0 ? (
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${(wonBets / resolvedBets) * 100}%` }}
                />
                <div
                  className="bg-rose-500 h-full"
                  style={{ width: `${(lostBets / resolvedBets) * 100}%` }}
                />
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 text-center py-1">No settled bets yet</p>
            )}
          </div>

          {/* Action Buttons: Open Full Profile and Logout */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onOpenProfileModal}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>Open Full Profile (Recharges, Withdrawals &amp; Stats)</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await logout();
                  } catch (e) {
                    console.error('Logout error:', e);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-extrabold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Account</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
