"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { collectionGroup, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PayoutLog } from "@/context/GameContext";
import { Trophy, Calendar, DollarSign, ArrowLeft } from "lucide-react";

export default function WinnersPage() {
  const [winners, setWinners] = useState<PayoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWinners() {
      try {
        const q = query(
          collectionGroup(db, "payouts"),
          orderBy("timestamp", "desc"),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => d.data() as PayoutLog);
        setWinners(data);
      } catch (error) {
        console.error("Error fetching winners:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWinners();
  }, []);

  const formatDate = (ts: number | string) => {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
               <ArrowLeft className="w-5 h-5" />
             </Link>
             <h1 className="text-xl font-black uppercase tracking-tight">Hall of Winners</h1>
          </div>
          <Trophy className="w-6 h-6 text-amber-500" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : winners.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p>No winners recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {winners.map((winner, i) => (
              <div 
                key={i}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden group hover:shadow-md transition-shadow"
              >
                {/* Decorative BG */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-[100px] -mr-8 -mt-8" />
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                        {winner.gameName || "Game #" + (winner.gameId?.slice(0, 4) ?? "???")} 
                      </span>
                      {winner.teamA && winner.teamB && (
                         <span className="text-[10px] font-bold text-slate-400">
                           {winner.teamA} vs {winner.teamB}
                         </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {winner.winnerName}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-500" />
                        {winner.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(winner.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center">
                      <span className="text-lg mr-0.5">$</span>{winner.amount}
                    </div>
                    <div className="px-2 py-0.5 mt-1 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      SCORE: {winner.teamAScore}-{winner.teamBScore}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
