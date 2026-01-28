"use client";

import React from "react";
import { Lock, Trophy } from "lucide-react";

interface GridProps {
  rows: number[];
  cols: number[];
  squares: Record<string, { uid: string; name: string; claimedAt: number }[]>;
  onSquareClick: (row: number, col: number) => void;
  teamA: string;
  teamB: string;
  teamALogo?: string;
  teamBLogo?: string;
  isScrambled: boolean;
  selectedCell: { row: number; col: number } | null;
  winningCell?: { row: number; col: number } | null;
  pendingIndices: number[];
  currentUserId?: string;
}

export default function Grid({
  rows,
  cols,
  squares,
  onSquareClick,
  teamA,
  teamB,
  isScrambled,
  selectedCell,
  winningCell,
  pendingIndices,
  currentUserId,
}: GridProps) {
  
  // 1. COLOR GENERATOR (Restored from your old code for vibrant squares)
  const getUserColor = (name: string) => {
    const colors = [
      "bg-red-500/20 text-red-200 border-red-500/30",
      "bg-orange-500/20 text-orange-200 border-orange-500/30",
      "bg-amber-500/20 text-amber-200 border-amber-500/30",
      "bg-green-500/20 text-green-200 border-green-500/30",
      "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
      "bg-teal-500/20 text-teal-200 border-teal-500/30",
      "bg-cyan-500/20 text-cyan-200 border-cyan-500/30",
      "bg-sky-500/20 text-sky-200 border-sky-500/30",
      "bg-blue-500/20 text-blue-200 border-blue-500/30",
      "bg-indigo-500/20 text-indigo-200 border-indigo-500/30",
      "bg-violet-500/20 text-violet-200 border-violet-500/30",
      "bg-purple-500/20 text-purple-200 border-purple-500/30",
      "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/30",
      "bg-pink-500/20 text-pink-200 border-pink-500/30",
      "bg-rose-500/20 text-rose-200 border-rose-500/30",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const isWinner = (rIndex: number, cIndex: number) => {
    return winningCell?.row === rIndex && winningCell?.col === cIndex;
  };

  return (
    <div className="w-full h-full flex flex-col select-none bg-[#0f111a] p-1 md:p-2">
      {/* --- TOP HEADER (TEAM B - CYAN) --- */}
      <div className="flex h-8 md:h-12 items-center mb-1">
        {/* Corner Spacer */}
        <div className="w-8 md:w-12 shrink-0 mr-1" />
        
        {/* Team B Name */}
        <div className="flex-1 flex items-center justify-center bg-[#151725] rounded-t-lg border border-white/5 relative overflow-hidden">
           <div className="absolute inset-0 bg-cyan-500/5" />
           <span className="text-cyan-400 font-teko text-lg md:text-2xl tracking-[0.2em] uppercase z-10 font-bold drop-shadow-md">
             {teamB}
           </span>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* --- LEFT HEADER (TEAM A - PINK) --- */}
        <div className="w-8 md:w-12 flex flex-col mr-1">
           {/* Corner Box */}
           <div className="h-8 md:h-10 mb-1 bg-[#151725] rounded-tl-lg border border-white/5 flex items-center justify-center text-slate-600">
              {isScrambled ? <Lock className="w-3 h-3 md:w-4 md:h-4 opacity-50" /> : <div className="w-1 h-1 bg-slate-700 rounded-full" />}
           </div>

           {/* Team A Name */}
           <div className="flex-1 bg-[#151725] rounded-l-lg border border-white/5 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-pink-500/5" />
              <span className="text-pink-500 font-teko text-lg md:text-2xl tracking-[0.2em] uppercase -rotate-90 whitespace-nowrap z-10 font-bold drop-shadow-md">
                {teamA}
              </span>
           </div>
        </div>

        {/* --- MAIN GRID --- */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* --- TOP NUMBERS --- */}
          <div className="flex h-8 md:h-10 mb-1">
            {cols.map((num, i) => (
              <div
                key={`col-${i}`}
                className="flex-1 flex items-center justify-center bg-[#151725] border-r border-white/5 last:border-r-0 first:rounded-bl-lg relative overflow-hidden transition-colors duration-300"
              >
                {/* HIDE NUMBERS IF NOT SCRAMBLED */}
                {isScrambled ? (
                  <span className="text-cyan-400 font-teko text-xl md:text-3xl font-bold drop-shadow-sm">
                    {num}
                  </span>
                ) : (
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-slate-800" />
                )}
                
                {/* Highlight Logic */}
                {winningCell?.col === i && (
                   <div className="absolute inset-0 bg-cyan-500/20 shadow-[inset_0_0_10px_#22d3ee] animate-pulse" />
                )}
              </div>
            ))}
          </div>

          {/* --- ROWS --- */}
          <div className="flex-1 flex flex-col">
            {rows.map((rowNum, rIndex) => (
              <div key={`row-${rIndex}`} className="flex-1 flex min-h-0">
                
                {/* --- SIDE NUMBERS --- */}
                <div className="w-8 md:w-12 shrink-0 bg-[#151725] border-b border-white/5 flex items-center justify-center relative overflow-hidden transition-colors duration-300">
                   {isScrambled ? (
                      <span className="text-pink-500 font-teko text-xl md:text-3xl font-bold drop-shadow-sm">
                        {rowNum}
                      </span>
                   ) : (
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-slate-800" />
                   )}

                   {winningCell?.row === rIndex && (
                      <div className="absolute inset-0 bg-pink-500/20 shadow-[inset_0_0_10px_#ec4899] animate-pulse" />
                   )}
                </div>

                {/* --- SQUARES --- */}
                {cols.map((colNum, cIndex) => {
                  const cellKey = `${rIndex}-${cIndex}`;
                  const cellData = squares[cellKey];
                  const owner = Array.isArray(cellData) ? cellData[0] : cellData;
                  const isPending = pendingIndices.includes(rIndex * 10 + cIndex);
                  const isSelected = selectedCell?.row === rIndex && selectedCell?.col === cIndex;
                  const cellWinner = isWinner(rIndex, cIndex);

                  // --- STYLE LOGIC ---
                  let containerClass = "flex-1 relative cursor-pointer flex items-center justify-center transition-all duration-200 border-r border-b border-white/5";
                  let textClass = "font-bold text-[8px] md:text-[10px] lg:text-xs uppercase tracking-wider truncate px-0.5 text-center w-full";

                  if (cellWinner) {
                    // Winner: Gold/Yellow Override
                    containerClass += " bg-yellow-500/20 shadow-[inset_0_0_15px_rgba(250,204,21,0.4)] z-30 border border-yellow-500";
                    textClass += " text-yellow-200";
                  } else if (isSelected) {
                    // Selected: Bright Indigo
                    containerClass += " bg-indigo-500/80 z-20 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white";
                    textClass += " text-white";
                  } else if (isPending) {
                    // Cart: Pulsing Indigo
                    containerClass += " bg-indigo-900/30 animate-pulse border-indigo-500/30 dashed";
                    textClass += " text-indigo-300";
                  } else if (owner) {
                    // Taken: Use Vibrant User Color
                    const userColor = getUserColor(owner.name);
                    containerClass += ` ${userColor}`;
                    // Highlight if it's Me
                    if (owner.uid === currentUserId) {
                       containerClass += " border border-indigo-400/50 shadow-inner";
                    }
                  } else {
                    // Empty: Dark
                    containerClass += " bg-[#0B0C15] hover:bg-white/5";
                    textClass += " text-white/20";
                  }

                  return (
                    <div
                      key={cellKey}
                      onClick={() => onSquareClick(rIndex, cIndex)}
                      className={containerClass}
                    >
                      {/* Name Label */}
                      <span className={textClass}>
                        {owner ? (
                           owner.name.split(' ')[0].slice(0, 8)
                        ) : isPending ? (
                           "PICK"
                        ) : (
                           ""
                        )}
                      </span>

                      {/* Winner Crown */}
                      {cellWinner && (
                        <div className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 text-yellow-400 drop-shadow-[0_2px_10px_rgba(250,204,21,0.8)] z-40 animate-bounce">
                          <Trophy className="w-3 h-3 md:w-5 md:h-5 fill-yellow-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}