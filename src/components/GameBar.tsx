"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useGame, type GameData } from "@/context/GameContext";

export default function GameBar() {
  const { user } = useAuth();
  const { getUserGames, game: currentGame } = useGame();
  const router = useRouter();
  const params = useParams();
  const [games, setGames] = useState<GameData[]>([]);

  useEffect(() => {
    async function fetchGames() {
      if (!user) return;
      try {
        const userGames = await getUserGames(user.uid);
        // Filter for active games (optional: based on status?)
        // For now, sorting by createdAt desc to show newest first
        const sorted = userGames.sort((a, b) => {
            const da = a.createdAt?.seconds || 0;
            const db = b.createdAt?.seconds || 0;
            return db - da; // Newest first
        });
        setGames(sorted);
      } catch (err) {
        console.error("Failed to load user games", err);
      }
    }
    fetchGames();
  }, [user, getUserGames, currentGame?.id]); // Re-fetch if current game changes (might have joined new one)

  if (!user || games.length === 0) return null;

  return (
    <div className="w-full flex overflow-x-auto gap-3 no-scrollbar py-3 px-4 bg-[#0B0C15] border-b border-white/10 shadow-lg">
      {games.map((g) => {
        const isActive = g.id === params.id;
        // Determine Winning State (Simple Approximation)
        const sA = g.scores?.teamA || 0;
        const sB = g.scores?.teamB || 0;
        const row = sA % 10;
        const col = sB % 10;
        const idx = row * 10 + col;
        
        let isWinning = false;
        if (!g.isScrambled) {
            const cell = g.squares?.[idx];
            if (Array.isArray(cell)) {
                isWinning = cell.some((c) => c.userId === user.uid);
            } else if (cell) {
                isWinning = cell.userId === user.uid;
            }
        }
        
        const isHost = g.host === user.uid;
        const hostLabel = isHost ? "You" : "Host";

        return (
          <button
            key={g.id}
            onClick={() => router.push(`/game/${g.id}`)}
            className={`
              relative shrink-0 flex flex-col items-start justify-center px-4 py-2.5 rounded-xl transition-all duration-300 w-40 overflow-hidden
              ${isActive 
                ? "bg-cyan-400 text-black font-bold border-2 border-white shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-105 z-10" 
                : "bg-[#1E293B] text-slate-200 border border-slate-700 hover:bg-[#334155] hover:border-slate-500 shadow-sm opacity-100"
              }
            `}
          >
            {/* Winning Indicator */}
            {isWinning && (
                <div className="absolute top-1 right-1">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                </div>
            )}

            <span className={`text-[11px] uppercase tracking-wider font-extrabold truncate w-full text-left ${isActive ? "text-cyan-950" : "text-slate-300"}`}>
              {g.teamA} vs {g.teamB}
            </span>
            <div className={`flex items-baseline gap-1 mt-0.5 ${isActive ? "text-black" : "text-white"}`}>
               <span className="text-xs font-bold">$</span>
               <span className={`text-xl font-black tracking-tighter ${isActive ? "text-black" : "text-green-400"}`}>
                 {g.pot || g.totalPot || 0}
               </span>
            </div>
            <span className={`text-[9px] uppercase tracking-widest leading-none mt-1 ${isActive ? "text-cyan-900/70" : "text-slate-500"}`}>
                {hostLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
