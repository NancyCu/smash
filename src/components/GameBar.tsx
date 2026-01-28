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
    <div className="w-full shrink-0 flex overflow-x-auto gap-2 no-scrollbar py-1 px-4 bg-white/10 backdrop-blur-md border-b border-white/20 relative items-center h-12 shadow-sm z-30">
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

        return (
          <button
            key={g.id}
            onClick={() => router.push(`/game/${g.id}`)}
            className={`
              relative shrink-0 flex flex-row items-center gap-2 px-3 pl-3 pr-4 rounded-full transition-all duration-200 h-8
              border
              ${isActive 
                ? "bg-cyan-400/30 border-cyan-400/50 text-white shadow-[0_0_10px_rgba(34,211,238,0.2)]" 
                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"
              }
            `}
          >
            {/* Winning Indicator */}
            {isWinning && (
                <div className="absolute top-0 right-0 -mt-0.5 -mr-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />
                </div>
            )}

            <div className="flex items-center gap-1.5 max-w-[140px]">
                <span className={`text-xs font-bold truncate ${isActive ? "text-cyan-100" : ""}`}>
                {g.teamA} vs {g.teamB}
                </span>
                <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? "text-cyan-200" : "text-white/40"}`}>
                • ${g.pot || g.totalPot || 0}
                </span>
            </div>
            
            {isHost && (
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ml-1 ${isActive ? "bg-cyan-500/20 text-cyan-200" : "bg-white/10 text-white/40"}`}>
                    YOU
                </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
