"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import { Lock, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Defined locally until re-added to GameContext
export interface PropBet {
  id: string;
  question: string;
  entryFee: number;
  bets?: { userId: string; selectedOption: string; displayName: string }[];
  winningOption?: string;
  status: "OPEN" | "LOCKED" | "PAYOUT";
  options: string[];
}

interface PropBetCardProps {
  prop: PropBet;
  isAdmin: boolean;
}

export default function PropBetCard({ prop, isAdmin }: PropBetCardProps) {
  // const { placePropBet, settlePropBet, deletePropBet } = useGame();
  // Mock functions to fix build until feature is restored
  const placePropBet = async (id: string, option: string, user: any) => {}; 
  const settlePropBet = async (id: string, val: string) => {};
  const deletePropBet = async (id: string) => {};

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // If bets is undefined, default to []
  const bets = prop.bets || [];
  
  const myBet = user ? bets.find(b => b.userId === user.uid) : null;
  const totalPot = bets.length * prop.entryFee;
  const winnerCount = prop.winningOption 
    ? bets.filter(b => b.selectedOption === prop.winningOption).length 
    : 0;
  const payoutPerWinner = winnerCount > 0 ? Math.floor(totalPot / winnerCount) : 0;

  const handlePlaceBet = async (option: string) => {
    if (!user || loading) return;
    if (!confirm(`Confirm bet on "${option}" for $${prop.entryFee}?`)) return;
    setLoading(true);
    try {
      await placePropBet(prop.id, option, { uid: user.uid, displayName: user.displayName || "Anonymous" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Bet placement failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) return;
    if (!confirm(`Settle "${prop.question}" with winner: ${value}? This cannot be undone.`)) return;
    try {
      await settlePropBet(prop.id, value);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Settlement failed");
    }
  };

  const handleDelete = async () => {
      if(!confirm("Delete this prop bet?")) return;
      await deletePropBet(prop.id);
  }

  return (
    <div className={cn(
      "relative p-6 rounded-2xl border shadow-sm transition-all",
      prop.status === "OPEN" 
        ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-white/5" 
        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-90"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{prop.question}</h3>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <span className="flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-emerald-500" />
               ${prop.entryFee} Entry
            </span>
             <span className="flex items-center gap-1">
               <Trophy className="w-3.5 h-3.5" />
               ${totalPot} Pot
            </span>
            <span className="flex items-center gap-1">
               <User className="w-3.5 h-3.5" />
               {bets.length} Bets
            </span>
          </div>
        </div>
        
        {prop.status !== "OPEN" && (
           <div className={cn(
             "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5",
             prop.status === "PAYOUT" ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
           )}>
             {prop.status === "PAYOUT" ? <><Trophy className="w-3 h-3" /> Paid Out</> : <><Lock className="w-3 h-3" /> Locked</>}
           </div>
        )}
         
         {isAdmin && (
             <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 ml-4">Delete</button>
         )}
      </div>

      {prop.status === "PAYOUT" && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-500/20 text-center">
             <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
               Winner: {prop.winningOption}
             </div>
             <p className="font-medium text-slate-700 dark:text-slate-300">
               {winnerCount} Winner{winnerCount !== 1 && 's'} took home <span className="font-black text-amber-600 dark:text-amber-400">${payoutPerWinner}</span> each!
             </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {prop.options.map(opt => {
          const isSelected = myBet?.selectedOption === opt;
          const isWinner = prop.winningOption === opt;
          
          return (
            <button
              key={opt}
              disabled={!!myBet || prop.status !== "OPEN"}
              onClick={() => handlePlaceBet(opt)}
              className={cn(
                "py-3 px-4 rounded-xl text-center font-bold text-sm transition-all border-2",
                isWinner 
                  ? "bg-green-500 text-white border-green-600 shadow-md scale-105"
                  : isSelected
                    ? "bg-indigo-600 text-white border-indigo-700 shadow-inner"
                    : prop.status === "OPEN"
                        ? "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-white/5 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300"
                        : "bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 cursor-not-allowed"
              )}
            >
              {opt}
              {isSelected && <span className="block text-[10px] font-normal opacity-80 mt-0.5">(Your Pick)</span>}
            </button>
          );
        })}
      </div>

      {isAdmin && prop.status === "OPEN" && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
           <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admin: Settle Bet</label>
           <select 
             onChange={handleSettle}
             className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
             defaultValue=""
           >
             <option value="" disabled>Select Winner...</option>
             {prop.options.map(o => <option key={o} value={o}>{o}</option>)}
           </select>
        </div>
      )}
    </div>
  );
}
