import React from 'react';
import { Trophy, Crown } from 'lucide-react';
import { PayoutLog } from '@/context/GameContext';

interface TrophyCaseProps {
  payouts: any; // Using any for flexibility with your config object
  history: PayoutLog[];
  totalPot: number;
}

const TrophyCase: React.FC<TrophyCaseProps> = ({ payouts, history, totalPot }) => {
  
  // Helper to map technical keys (q1) to readable labels
  const getLabel = (key: string) => {
      switch(key) {
          case 'q1': return '1st Quarter';
          case 'q2': return 'Halftime';
          case 'q3': return '3rd Quarter';
          case 'final': return 'Final Score';
          default: return key;
      }
  };

  // Define the standard order of trophies
  const periods = ['q1', 'q2', 'q3', 'final'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {periods.map((period) => {
        // Find if we have a winner in history for this period
        const winnerLog = history.find(h => h.quarter === period);
        const amount = payouts[period] || 0;
        const isFinal = period === 'final';

        return (
          <div 
            key={period} 
            className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                winnerLog 
                ? (isFinal ? "bg-yellow-500/10 border-yellow-500/50" : "bg-indigo-500/10 border-indigo-500/50") 
                : "bg-black/20 border-white/5 opacity-70"
            }`}
          >
            {/* ICON */}
            <div className={`mb-3 p-3 rounded-full ${
                winnerLog 
                ? (isFinal ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/50" : "bg-indigo-500 text-white shadow-lg shadow-indigo-500/50") 
                : "bg-white/5 text-slate-500"
            }`}>
               {isFinal ? <Crown className="w-5 h-5" /> : <Trophy className="w-4 h-4" />}
            </div>

            {/* LABEL & AMOUNT */}
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{getLabel(period)}</span>
            <span className={`text-lg font-black ${winnerLog ? "text-white" : "text-slate-600"}`}>${amount}</span>

            {/* WINNER NAME (If exists) */}
            {winnerLog && (
                <div className="mt-3 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-[8px] font-bold text-white">
                        {winnerLog.winnerName[0]}
                    </div>
                    <span className="text-xs font-bold text-white max-w-[80px] truncate">{winnerLog.winnerName}</span>
                </div>
            )}
            
            {!winnerLog && (
                <div className="mt-3 px-3 py-1.5 rounded-full border border-dashed border-white/10 text-[10px] text-slate-600">
                    Pending
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TrophyCase;