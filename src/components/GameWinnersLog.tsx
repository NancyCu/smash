"use client";

import React from "react";
import { Trophy, Clock, Medal } from "lucide-react";
import { PayoutLog } from "@/context/GameContext";

interface GameWinnersLogProps {
  history: PayoutLog[];
}

export default function GameWinnersLog({ history }: GameWinnersLogProps) {
  if (!history || history.length === 0) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl p-3 border border-slate-200 dark:border-white/10 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
            Game Winners
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">Record of payouts so far</p>
        </div>
      </div>

      <div className="space-y-3">
        {history.map((log) => (
          <div 
            key={log.id} 
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/5 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center justify-center w-10 h-10 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
                 <span className="text-[10px] font-black text-slate-400 uppercase">Q{log.period}</span>
                 {log.label.includes("Final") ? (
                   <Medal className="w-4 h-4 text-amber-500" />
                 ) : (
                   <Clock className="w-4 h-4 text-slate-400" />
                 )}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-500 tracking-wider">
                  {log.label}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {log.winnerName}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                ${log.amount}
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 rounded">
                SCORE {log.teamAScore}-{log.teamBScore}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
