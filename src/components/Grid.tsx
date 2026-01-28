"use client";

import React from "react";
import { Lock, HelpCircle, Trophy } from "lucide-react";

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
  
  // Helper to check if a specific cell is the winner
  const isWinner = (rIndex: number, cIndex: number) => {
    return winningCell?.row === rIndex && winningCell?.col === cIndex;
  };

  return (
    <div className="w-full h-full flex flex-col select-none bg-[#0f111a] p-1 md:p-2">
      {/* --- TOP HEADER (TEAM B - CYAN) --- */}
      <div className="flex h-8 md:h-12 items-center mb-1">
        {/* Empty corner spacer */}
        <div className="w-8 md:w-12 shrink-0 mr-1" />
        
        {/* Team B Name Centered */}
        <div className="flex-1 flex items-center justify-center bg-[#151725] rounded-t-lg border border-white/5 relative overflow-hidden">
           <div className="absolute inset-0 bg-cyan-500/5" />
           <span className="text-cyan-400 font-teko text-lg md:text-2xl tracking-[0.2em] uppercase z-10 font-bold">
             {teamB}
           </span>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* --- LEFT HEADER (TEAM A - PINK) --- */}
        <div className="w-8 md:w-12 flex flex-col mr-1">
           {/* Top-Left Corner Box (Logo or Icon) */}
           <div className="h-8 md:h-10 mb-1 bg-[#151725] rounded-tl-lg border border-white/5 flex items-center justify-center text-slate-600">
              {isScrambled ? <Lock className="w-3 h-3 md:w-4 md:h-4" /> : <HelpCircle className="w-3 h-3 md:w-4 md:h-4 opacity-50" />}
           </div>

           {/* Team A Name (Vertical) */}
           <div className="flex-1 bg-[#151725] rounded-l-lg border border-white/5 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-pink-500/5" />
              <span className="text-pink-500 font-teko text-lg md:text-2xl tracking-[0.2em] uppercase -rotate-90 whitespace-nowrap z-10 font-bold">
                {teamA}
              </span>
           </div>
        </div>

        {/* --- MAIN GRID AREA --- */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* --- COLUMN NUMBERS (TOP ROW) --- */}
          <div className="flex h-8 md:h-10 mb-1">
            {cols.map((num, i) => (
              <div
                key={`col-${i}`}
                className="flex-1 flex items-center justify-center bg-[#151725] border-r border-white/5 last:border-r-0 first:rounded-bl-lg relative overflow-hidden"
              >
                {/* HIDE NUMBERS IF NOT SCRAMBLED */}
                {isScrambled ? (
                  <span className="text-cyan-400 font-teko text-xl md:text-3xl font-bold">
                    {num}
                  </span>
                ) : (
                  <div className="w-1 h-1 md:w-2 md:h-2 rounded-full bg-slate-800" />
                )}
                
                {/* Highlight Logic for Column */}
                {winningCell?.col === i && (
                   <div className="absolute inset-0 bg-cyan-500/20 shadow-[inset_0_0_10px_#22d3ee]" />
                )}
              </div>
            ))}
          </div>

          {/* --- GRID ROWS --- */}
          <div className="flex-1 flex flex-col">
            {rows.map((rowNum, rIndex) => (
              <div key={`row-${rIndex}`} className="flex-1 flex min-h-0">
                
                {/* --- ROW NUMBER (LEFT SIDE) --- */}
                <div className="w-8 md:w-10 shrink-0 bg-[#151725] border-b border-white/5 flex items-center justify-center relative overflow-hidden">
                   {/* HIDE NUMBERS IF NOT SCRAMBLED */}
                   {isScrambled ? (
                      <span className="text-pink-500 font-teko text-xl md:text-3xl font-bold">
                        {rowNum}
                      </span>
                   ) : (
                      <div className="w-1 h-1 md:w-2 md:h-2 rounded-full bg-slate-800" />
                   )}

                   {/* Highlight Logic for Row */}
                   {winningCell?.row === rIndex && (
                      <div className="absolute inset-0 bg-pink-500/20 shadow-[inset_0_0_10px_#ec4899]" />
                   )}
                </div>

                {/* --- SQUARES --- */}
                {cols.map((colNum, cIndex) => {
                  const cellKey = `${rIndex}-${cIndex}`;
                  const cellData = squares[cellKey];
                  const owner = Array.isArray(cellData) ? cellData[0] : cellData;
                  const isPending = pendingIndices.includes(rIndex * 10 + cIndex);
                  const isSelected = selectedCell?.row === rIndex && selectedCell?.col === cIndex;
                  const isWinning = isWinner(rIndex, cIndex);

                  // Dynamic Styles
                  let bgClass = "bg-[#0B0C15]"; // Default Dark
                  let borderClass = "border border-white/5";
                  let textClass = "text-white/20"; // Empty text color

                  if (isWinning) {
                    bgClass = "bg-yellow-500/20 animate-pulse";
                    borderClass = "border border-yellow-400";
                    textClass = "text-yellow-200";
                  } else if (isSelected) {
                    bgClass = "bg-indigo-600/40";
                    borderClass = "border border-indigo-400";
                    textClass = "text-white";
                  } else if (isPending) {
                    bgClass = "bg-indigo-500/20";
                    borderClass = "border border-indigo-500/50 dashed";
                    textClass = "text-indigo-200";
                  } else if (owner) {
                    // Check if current user owns it
                    if (owner.uid === currentUserId) {
                       bgClass = "bg-cyan-900/30";
                       borderClass = "border border-cyan-500/30";
                       textClass = "text-cyan-200";
                    } else {
                       // Occupied by someone else
                       bgClass = "bg-[#1a1d2d]"; 
                       borderClass = "border border-white/10";
                       textClass = "text-slate-300";
                    }
                  }

                  return (
                    <div
                      key={cellKey}
                      onClick={() => onSquareClick(rIndex, cIndex)}
                      className={`flex-1 relative cursor-pointer flex items-center justify-center transition-all duration-200 ${bgClass} ${borderClass}`}
                    >
                      {/* Name Label */}
                      <span
                        className={`font-bold text-[8px] md:text-[10px] lg:text-xs uppercase tracking-wider truncate px-0.5 text-center w-full ${textClass}`}
                      >
                        {owner ? (
                           // Show Name
                           owner.name.split(' ')[0] 
                        ) : isPending ? (
                           <span className="animate-pulse">...</span>
                        ) : (
                           // Empty State
                           ""
                        )}
                      </span>

                      {/* Winner Crown Icon */}
                      {isWinning && (
                        <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 text-yellow-400 drop-shadow-[0_2px_10px_rgba(250,204,21,0.5)] z-20">
                          <Trophy className="w-4 h-4 md:w-6 md:h-6 fill-yellow-400" />
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