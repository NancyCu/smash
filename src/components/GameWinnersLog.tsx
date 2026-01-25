import React from "react";
import { Trophy, Clock, Medal } from "lucide-react";
import { PayoutLog } from "@/context/GameContext";

interface GameWinnersLogProps {
  history: PayoutLog[];
}

export default function GameWinnersLog({ history }: GameWinnersLogProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
        <Trophy className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
        <p className="text-sm text-slate-500 font-medium">No winners recorded yet.</p>
      </div>
    );
  }

  // Helper to format labels
  const getQuarterLabel = (q: string) => {
    switch(q) {
      case 'q1': return '1st Quarter';
      case 'q2': return 'Halftime';
      case 'q3': return '3rd Quarter';
      case 'final': return 'Final Score';
      default: return q;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-slate-400" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Winner History</h3>
      </div>
      
      <div className="space-y-2">
        {history.map((log, index) => (
          <div 
            key={`${log.timestamp}-${index}`} 
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/5 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                <Medal className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{log.winnerName}</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider group-hover:text-amber-500/70 transition-colors">
                  {getQuarterLabel(log.quarter)}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="block text-sm font-black text-slate-900 dark:text-white">${log.amount}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}