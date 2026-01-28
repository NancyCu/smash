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
    <div className="w-full flex overflow-x-auto gap-3 no-scrollbar py-2 px-4 sticky top-0 z-30 bg-[#0B0C15]/5 backdrop-blur-sm border-b border-white/5">
      {games.map((g) => {
        const isActive = g.id === params.id;
        // Determine Winning State (Simple Approximation)
        // This relies on Firestore scores being up to date
        const sA = g.scores?.teamA || 0;
        const sB = g.scores?.teamB || 0;
        // Default Logic (No Scramble Awareness here for simplicity yet)
        const row = sA % 10;
        const col = sB % 10;
        const idx = row * 10 + col;
        
        let isWinning = false;
        // Basic check: If unscrambled, check index directly
        if (!g.isScrambled) {
            const cell = g.squares?.[idx];
            if (Array.isArray(cell)) {
                isWinning = cell.some((c) => c.userId === user.uid);
            } else if (cell) {
                isWinning = cell.userId === user.uid;
            }
        }
        
        // Host Name Truncation
        // We might not have host name directly if fetching by ID, 
        // but let's assume host ID is present. We'll verify if we have host display name or just ID.
        // GameData has 'host' (uid). It doesn't have host *name* stored usually?
        // Let's check GameData structure in Context.
        // It has `host: string` (likely UID). 
        // We'll use "Host" or check if the user is the host.
        const isHost = g.host === user.uid;
        const hostLabel = isHost ? "You" : "Host";

        return (
          <button
            key={g.id}
            onClick={() => router.push(`/game/${g.id}`)}
            className={`
              relative shrink-0 flex flex-col items-start justify-center px-4 py-2 rounded-xl transition-all duration-300 w-32
              ${isActive 
                ? "bg-cyan-400 text-black font-bold border-2 border-white shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105" 
                : "bg-white/5 text-white border border-white/10 hover:bg-white/10 opacity-70 hover:opacity-100"
              }
            `}
          >
            {/* Winning Indicator */}
            {isWinning && (
                <div className="absolute top-1 right-1">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                </div>
            )}

            <span className={`text-[10px] uppercase tracking-wider font-extrabold truncate w-full text-left ${isActive ? "text-cyan-900" : "text-slate-400"}`}>
              {g.teamA.substring(0,3)} vs {g.teamB.substring(0,3)}
            </span>
            <div className={`flex items-baseline gap-1 ${isActive ? "text-black" : "text-white"}`}>
               <span className="text-xs font-bold">$</span>
               <span className={`text-lg font-black tracking-tighter ${isActive ? "text-black" : "text-green-400"}`}>
                 {g.pot || g.totalPot || 0}
               </span>
            </div>
            <span className={`text-[9px] uppercase tracking-widest leading-none ${isActive ? "text-cyan-800/60" : "text-slate-600"}`}>
                {hostLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
