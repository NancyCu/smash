"use client";

import React from 'react';
import { Lock, Trophy } from "lucide-react";

interface GridProps {
  rows: number[];
  cols: number[];
  squares: Record<string, { uid: string, name: string }[]>;
  onSquareClick: (row: number, col: number) => void;
  teamA: string;
  teamB: string;
  teamALogo?: string;
  teamBLogo?: string;
  isScrambled?: boolean;
  selectedCell?: { row: number, col: number } | null;
  winningCell?: { row: number, col: number } | null;
  pendingIndices?: number[];
  currentUserId?: string;
}

export default function Grid({ 
  rows, cols, squares, onSquareClick, 
  teamA, teamB, teamALogo, teamBLogo, isScrambled, 
  selectedCell, winningCell, pendingIndices = [], currentUserId 
}: GridProps) {

  // 1. HELPER: Get all owners for a cell
  const getOwners = (r: number, c: number) => {
      const data = squares[`${r}-${c}`];
      if (!data) return [];
      return Array.isArray(data) ? data : [data];
  };

  // 2. Active Focus Logic
  const activeFocus = selectedCell ?? winningCell ?? null;

  // 3. COLOR GENERATOR
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

  return (
    <div className="grid grid-cols-11 border border-white/5 bg-[#0f111a] select-none h-full w-full">
      
      {/* --- HEADER ROW (TEAM B / COLUMNS) --- */}
      <div className="contents">
         
         {/* THE SCRAMBLE KEY (CORNER CELL) */}
         <div className="bg-[#0B0C15] border-r border-b border-white/5 flex items-center justify-center p-1 overflow-hidden relative">
             {isScrambled ? (
                 teamALogo && teamBLogo ? (
                     // Live: Show VS Logos
                     <div className="relative w-full h-full opacity-80">
                         <img src={teamALogo} className="absolute top-0 left-0 w-[45%] h-[45%] object-contain" alt="" />
                         <img src={teamBLogo} className="absolute bottom-0 right-0 w-[45%] h-[45%] object-contain" alt="" />
                         <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[6px] font-bold text-white/30">VS</span>
                         </div>
                     </div>
                 ) : (
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[8px] text-slate-500 font-bold">VS</div>
                 )
             ) : (
                 // Pre-Game: Show Lock
                 <Lock className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
             )}
         </div>

         {cols.map((num, i) => {
           const isColHighlighted = activeFocus?.col === i;
           return (
             <div key={`col-${i}`} className={`relative p-1 h-8 md:h-10 flex items-center justify-center border-b border-r border-white/5 bg-[#151725] overflow-hidden transition-all duration-300 ${isColHighlighted ? 'bg-cyan-900/60 shadow-[inset_0_0_20px_rgba(34,211,238,0.4),0_0_20px_rgba(34,211,238,0.3)] z-40' : ''}`}>
               {/* TEAM LOGO WATERMARK */}
               {teamBLogo && (
                  <img src={teamBLogo} className="absolute inset-0 w-full h-full object-contain opacity-[0.07] grayscale" alt="" />
               )}
               
               {isColHighlighted && (
                 <>
                   <div className="absolute inset-0 border-b-4 border-cyan-400 animate-pulse"></div>
                   <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 to-transparent"></div>
                 </>
               )}
               
               {/* HIDE NUMBERS IF NOT SCRAMBLED */}
               {isScrambled ? (
                   <span className={`font-mono font-bold text-sm md:text-lg transition-all relative z-10 ${isColHighlighted ? 'text-cyan-300 scale-125 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-cyan-600'}`}>
                       {num}
                   </span>
               ) : (
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
               )}
             </div>
           );
         })}
      </div>

      {/* --- GRID ROWS --- */}
      {rows.map((rowNum, rIndex) => {
        const isRowHighlighted = activeFocus?.row === rIndex;

        return (
            <div key={`row-${rIndex}`} className="contents">
                {/* LEFT HEADER COLUMN (TEAM A / ROWS) */}
                <div className={`relative w-8 md:w-10 flex items-center justify-center border-r border-b border-white/5 bg-[#151725] overflow-hidden transition-all duration-300 ${isRowHighlighted ? 'bg-pink-900/60 shadow-[inset_0_0_20px_rgba(236,72,153,0.4),0_0_20px_rgba(236,72,153,0.3)] z-40' : ''}`}>
                
                {/* TEAM LOGO WATERMARK */}
                {teamALogo && (
                   <img src={teamALogo} className="absolute inset-0 w-full h-full object-contain opacity-[0.07] grayscale" alt="" />
                )}

                {isRowHighlighted && (
                  <>
                    <div className="absolute inset-0 border-r-4 border-pink-400 animate-pulse"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-transparent"></div>
                  </>
                )}
                {/* HIDE NUMBERS IF NOT SCRAMBLED */}
                {isScrambled ? (
                    <span className={`font-mono font-bold text-sm md:text-lg transition-all relative z-10 ${isRowHighlighted ? 'text-pink-300 scale-125 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'text-pink-700'}`}>
                        {rowNum}
                    </span>
                ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                )}
                </div>
                
                {/* SQUARES */}
                {cols.map((_, cIndex) => {
                    const cellKey = `${rIndex}-${cIndex}`;
                    const owners = getOwners(rIndex, cIndex);
                    const isMulti = owners.length > 1;
                    
                    const isPending = pendingIndices.includes(rIndex * 10 + cIndex);
                    const isExactSelected = selectedCell && selectedCell.row === rIndex && selectedCell.col === cIndex;
                    const isWinner = winningCell && winningCell.row === rIndex && winningCell.col === cIndex;
                    
                    // --- HIGHLIGHTING LOGIC ---
                    const isInHighlightedRow = activeFocus && activeFocus.row === rIndex;
                    const isInHighlightedCol = activeFocus && activeFocus.col === cIndex;
                    const isInCrosshair = isInHighlightedRow || isInHighlightedCol;

                    // --- BASE STYLE ---
                    let containerClass = "relative w-full aspect-square cursor-pointer transition-all duration-300 overflow-hidden";
                    
                    // Only center content if it's NOT a multi-grid
                    if (!isMulti) {
                        containerClass += " flex flex-col items-center justify-center";
                    }

                    let borderClass = "border-r border-b border-white/5"; 
                    let textClass = "text-[8px] md:text-[10px] font-bold truncate max-w-[90%] px-0.5";

                    if (isWinner) {
                        // WINNER
                        containerClass += " bg-yellow-500/20 shadow-[inset_0_0_15px_rgba(250,204,21,0.4)] z-30 border border-yellow-500";
                        borderClass = ""; 
                        textClass += " text-yellow-200";
                    } else if (isExactSelected) {
                        // SELECTED
                        containerClass += " bg-indigo-500/80 z-20 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.5)] border-2 border-white";
                        borderClass = ""; 
                        textClass += " text-white";
                    } else if (isInCrosshair) {
                        // CROSSHAIR
                        containerClass += " shadow-[inset_0_0_12px_rgba(255,255,255,0.2),0_0_10px_rgba(255,255,255,0.15)]";
                        borderClass = "border-r border-b border-white/[0.02]";
                        
                        // Keep color logic for crosshair
                        if (owners.length > 0 && !isMulti) {
                            const userColor = getUserColor(owners[0].name);
                            containerClass += ` ${userColor}`;
                        } else if (owners.length === 0) {
                            containerClass += " bg-[#0B0C15]";
                        }
                    } else if (isPending) {
                        // PENDING CART
                        containerClass += " bg-indigo-900/30 animate-pulse";
                        textClass += " text-indigo-300";
                    } else if (owners.length === 1) {
                        // SINGLE OWNER
                        const userColor = getUserColor(owners[0].name);
                        containerClass += ` ${userColor}`;
                        if (currentUserId && owners[0].uid === currentUserId) {
                            containerClass += " border border-indigo-500/40";
                            borderClass = ""; 
                        }
                    } else if (!isMulti) {
                        // EMPTY
                        containerClass += " hover:bg-white/5";
                        textClass += " text-white/20";
                    }

                    return (
                        <div key={cellKey} onClick={() => onSquareClick(rIndex, cIndex)} className={`${containerClass} ${borderClass}`}>
                            {isWinner && <div className="absolute -top-1 -right-1 text-[8px] z-40 pointer-events-none">👑</div>}
                            
                            {/* --- CONTENT RENDERER --- */}
                            {isMulti ? (
                                // 2x2 MULTI-USER GRID (FIXED)
                                <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                                    {owners.slice(0, 4).map((o, idx) => (
                                        <div key={idx} className={`flex items-center justify-center ${getUserColor(o.name)} !border-0 overflow-hidden`}>
                                            <span className="text-[6px] md:text-[8px] font-bold leading-none text-white/90">
                                                {o.name.slice(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                    {owners.length > 4 && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="bg-black/70 backdrop-blur-sm rounded-full w-4 h-4 flex items-center justify-center border border-white/20">
                                                <span className="text-[6px] font-bold text-white">+{owners.length - 4}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // SINGLE USER / PENDING / EMPTY
                                <>
                                    {owners.length === 1 ? (
                                        <span className={textClass}>{owners[0].name.slice(0, 6)}</span>
                                    ) : isPending ? (
                                        <span className="text-[8px] font-bold text-indigo-400">PICK</span>
                                    ) : null}
                                    
                                    {isExactSelected && <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full shadow-sm" />}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
      })}
    </div>
  );
}