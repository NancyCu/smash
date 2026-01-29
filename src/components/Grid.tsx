"use client";

import React from "react";
import { Lock } from "lucide-react";
import { getNeonColor } from "../utils/colorHash";

interface GridProps {
  rows: number[];
  cols: number[];
  squares: Record<string, { uid: string; name: string; paid?: boolean }[]>;
  onSquareClick: (row: number, col: number) => void;
  teamA: string;
  teamB: string;
  teamALogo?: string;
  teamBLogo?: string;
  isScrambled?: boolean;
  selectedCell?: { row: number; col: number } | null;
  winningCell?: { row: number; col: number } | null;
  pendingIndices?: number[];
  restoringIndices?: number[]; // Task 3: Squares being restored after auth
  currentUserId?: string;
}

export default function Grid({
  rows,
  cols,
  squares,
  onSquareClick,
  teamA,
  teamB,
  teamALogo,
  teamBLogo,
  isScrambled,
  selectedCell,
  winningCell,
  pendingIndices = [],
  restoringIndices = [],
  currentUserId,
}: GridProps) {
  // 1. HELPER: Get all owners for a cell
  const getOwners = (r: number, c: number) => {
    const data = squares[`${r}-${c}`];
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  };

  // 2. Active Focus Logic
  const activeFocus = selectedCell ?? winningCell ?? null;

  return (
    // OUTER CONTAINER
    <div className="flex flex-col h-full w-full bg-[#0B0C15] select-none rounded-2xl relative overflow-visible">
      
      {/* MAIN CONTENT */}
      <div className="flex flex-1 min-h-0 relative overflow-visible">
        
        {/* --- THE GRID --- */}
        <div className="w-full h-full">
          <div className="relative h-full w-full">
            
            {/* Team B Header - Horizontal/Top - Overlapping */}
            <div className="absolute top-0 left-[50%] -translate-x-1/2 -translate-y-[45%] z-30 pointer-events-none">
              <span className="text-[#22d3ee] font-black uppercase tracking-[0.4em] text-sm md:text-lg select-none drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]">
                {teamB}
              </span>
            </div>
            
            {/* Team A Header - Vertical/Left - Overlapping */}
            <div className="absolute left-0 top-[50%] -translate-y-1/2 -translate-x-[35%] z-30 pointer-events-none">
              <span className="text-[#db2777] font-black uppercase tracking-[0.4em] text-sm md:text-lg select-none rotate-[-90deg] whitespace-nowrap drop-shadow-[0_0_12px_rgba(219,39,119,0.8)]">
                {teamA}
              </span>
            </div>
            <div className="grid grid-cols-[auto_repeat(10,1fr)] gap-px border-b border-r border-white/10 h-full w-full bg-transparent rounded-2xl overflow-visible">
            {/* HEADER ROW (COLUMNS) */}
            <div className="contents">
              {/* CORNER */}
              <div className="bg-white/10 backdrop-blur-md border-r border-b border-white/10 flex items-center justify-center p-1 relative z-20 w-8 md:w-10">
                {isScrambled ? (
                  teamALogo && teamBLogo ? (
                    <div className="relative w-full h-full opacity-80">
                      <img
                        src={teamALogo}
                        className="absolute top-0 left-0 w-[45%] h-[45%] object-contain"
                        alt=""
                      />
                      <img
                        src={teamBLogo}
                        className="absolute bottom-0 right-0 w-[45%] h-[45%] object-contain"
                        alt=""
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[6px] font-bold text-white/50">
                          VS
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-slate-300 font-bold">
                      VS
                    </div>
                  )
                ) : (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {/* COLUMN NUMBERS */}
              {cols.map((num, i) => {
                const isColHighlighted = activeFocus?.col === i;
                return (
                  <div
                    key={`col-${i}`}
                    className={`relative p-1 h-8 md:h-10 flex items-center justify-center border-b border-r border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden transition-all duration-300 ${isColHighlighted ? "bg-cyan-500/30 shadow-[inset_0_0_20px_rgba(34,211,238,0.4),0_0_20px_rgba(34,211,238,0.3)] z-40" : ""}`}
                  >
                    {!isScrambled && teamBLogo && (
                      <img
                        src={teamBLogo}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain opacity-[0.08] grayscale pointer-events-none"
                      />
                    )}
                    {isColHighlighted && (
                      <>
                        <div className="absolute inset-0 border-b-4 border-cyan-400 animate-pulse"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 to-transparent"></div>
                      </>
                    )}
                    {isScrambled ? (
                      <span
                        className={`font-mono font-bold text-base md:text-2xl transition-all relative z-10 ${isColHighlighted ? "text-cyan-200 scale-125 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "text-cyan-400"}`}
                      >
                        {num}
                      </span>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* GRID ROWS */}
            {rows.map((rowNum, rIndex) => {
              const isRowHighlighted = activeFocus?.row === rIndex;
              return (
                <div key={`row-${rIndex}`} className="contents">
                  {/* ROW NUMBERS */}
                  <div
                    className={`relative w-8 md:w-10 flex items-center justify-center border-r border-b border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden transition-all duration-300 ${isRowHighlighted ? "bg-pink-500/30 shadow-[inset_0_0_20px_rgba(236,72,153,0.4),0_0_20px_rgba(236,72,153,0.3)] z-40" : ""}`}
                  >
                    {!isScrambled && teamALogo && (
                      <img
                        src={teamALogo}
                        alt=""
                        className="absolute inset-0 w-full h-full object-contain opacity-[0.08] grayscale pointer-events-none"
                      />
                    )}
                    {isRowHighlighted && (
                      <>
                        <div className="absolute inset-0 border-r-4 border-pink-400 animate-pulse"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-transparent"></div>
                      </>
                    )}
                    {isScrambled ? (
                      <span
                        className={`font-mono font-bold text-base md:text-2xl transition-all relative z-10 ${isRowHighlighted ? "text-pink-200 scale-125 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" : "text-pink-500"}`}
                      >
                        {rowNum}
                      </span>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    )}
                  </div>

                  {/* SQUARES (Using your original multi-user logic) */}
                  {cols.map((_, cIndex) => {
                    const cellKey = `${rIndex}-${cIndex}`;
                    const owners = getOwners(rIndex, cIndex);
                    const isMulti = owners.length > 1;
                    const cellIndex = rIndex * cols.length + cIndex;
                    const isPending = pendingIndices.includes(cellIndex);
                    const isRestoring = restoringIndices.includes(cellIndex); // Task 3: Check if restoring
                    const isExactSelected =
                      selectedCell &&
                      selectedCell.row === rIndex &&
                      selectedCell.col === cIndex;
                    const isWinner =
                      winningCell &&
                      winningCell.row === rIndex &&
                      winningCell.col === cIndex;
                    const isInHighlightedRow =
                      activeFocus && activeFocus.row === rIndex;
                    const isInHighlightedCol =
                      activeFocus && activeFocus.col === cIndex;
                    const isInCrosshair =
                      isInHighlightedRow || isInHighlightedCol;

                    // --- NEW STYLE LOGIC ---
                    const firstOwnerIsMe =
                      owners.length > 0 &&
                      owners[0].uid === currentUserId;

                    let containerClass =
                      "relative w-full aspect-square cursor-pointer transition-all duration-300 overflow-hidden rounded-sm border border-white/10";
                    let textClass =
                      "text-[8px] md:text-[10px] font-bold whitespace-normal break-words leading-tight text-center px-0.5 z-10 select-none";

                    // 1. Winner
                    if (isWinner) {
                      containerClass =
                        "relative w-full aspect-square cursor-pointer overflow-hidden rounded-sm bg-[#22d3ee] shadow-[0_0_20px_#22d3ee,inset_0_0_10px_white] border-white ring-2 ring-[#22d3ee]/50 z-50 animate-pulse";
                      textClass =
                        "text-[8px] md:text-[10px] font-bold whitespace-normal break-words leading-tight text-center px-0.5 z-10 text-black";
                    }
                    // 2. Selected
                    else if (isExactSelected) {
                      containerClass +=
                        " bg-[#22d3ee]/30 z-40 border-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105 backdrop-blur-sm";
                      textClass += " text-white";
                    }
                    // 3. Owned
                    else if (owners.length > 0) {
                      if (isMulti) {
                        // Base for multi, content handled inside
                        containerClass += " bg-white/20 backdrop-blur-sm";
                      } else {
                        // Dynamic Neon Color for Single Owner
                        const neonClass = getNeonColor(owners[0].name, firstOwnerIsMe);
                        containerClass += ` ${neonClass} backdrop-blur-sm`;
                        if (!firstOwnerIsMe) {
                           textClass += " text-white/90";
                        } else {
                           textClass += " text-cyan-50 drop-shadow-[0_0_2px_rgba(34,211,238,0.8)]";
                        }
                      }
                    }
                    // 4. Pending
                    else if (isPending) {
                      containerClass +=
                        " bg-[#22d3ee]/20 animate-pulse border-[#22d3ee]/40 backdrop-blur-sm";
                      textClass += " text-[#22d3ee]";
                    }
                    // 4b. Restoring (Grid Sync Animation - Sequential Lock-In)
                    else if (isRestoring) {
                      containerClass +=
                        " bg-green-400/30 border-green-400 backdrop-blur-sm shadow-[0_0_20px_rgba(74,222,128,0.5),inset_0_0_15px_rgba(74,222,128,0.2)] scale-105 transition-all duration-200";
                      textClass += " text-green-200";
                    }
                    // 5. Empty (Brighter Glass)
                    else {
                      containerClass +=
                        " bg-white/10 hover:bg-white/20 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)] backdrop-blur-[2px]";
                      if (isInCrosshair) {
                        containerClass +=
                          " bg-white/20 shadow-[inset_0_0_12px_rgba(255,255,255,0.15)] border-white/20";
                      }
                    }

                    return (
                      <div
                        key={cellKey}
                        onClick={() => onSquareClick(rIndex, cIndex)}
                        className={containerClass}
                      >
                        {/* Grid Sync: Scan line animation for restoring squares */}
                        {isRestoring && (
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-300/40 to-transparent h-full w-full animate-[slideDown_0.5s_ease-out]" />
                          </div>
                        )}
                        
                        {isWinner && (
                          <div className="absolute -top-1 -right-1 text-[8px] z-40 pointer-events-none drop-shadow-md">
                            👑
                          </div>
                        )}

                        {isMulti ? (
                          // MULTI-OWNER LAYOUT
                          owners.length <= 4 ? (
                            <div className="w-full h-full flex flex-col">
                              {owners.map((o, idx) => {
                                const isSubMe =
                                  currentUserId && o.uid === currentUserId;
                                const subClass = isSubMe
                                  ? "bg-[#22d3ee]/40 text-cyan-50 border-[#22d3ee]/30"
                                  : "bg-[#db2777]/30 text-pink-100 border-[#db2777]/20";
                                return (
                                  <div
                                    key={idx}
                                    className={`flex-1 flex items-center justify-center border-b last:border-0 border-white/10 ${subClass}`}
                                  >
                                    <span className="text-[6px] md:text-[8px] font-bold leading-none truncate px-0.5">
                                      {o.name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                              {owners.slice(0, 9).map((o, idx) => {
                                const isSubMe =
                                  currentUserId && o.uid === currentUserId;
                                const subClass = isSubMe
                                  ? "bg-[#22d3ee]/40 text-cyan-50"
                                  : "bg-[#db2777]/30 text-pink-100";
                                return (
                                  <div
                                    key={idx}
                                    className={`flex items-center justify-center border-[0.5px] border-white/10 ${subClass}`}
                                  >
                                    <span className="text-[4px] md:text-[6px] font-bold leading-none">
                                      {o.name.slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                );
                              })}
                              {owners.length > 9 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black/60 backdrop-blur-sm rounded-full w-4 h-4 flex items-center justify-center border border-white/30 shadow-lg z-10">
                                    <span className="text-[6px] font-bold text-white">
                                      +{owners.length - 9}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        ) : (
                          // SINGLE OWNER / EMPTY LAYOUT
                          <div className="flex items-center justify-center w-full h-full p-0.5">
                            {owners.length === 1 ? (
                              <span className={textClass}>
                                {owners[0].name}
                              </span>
                            ) : isRestoring ? (
                              <span className={textClass}>...</span>
                            ) : null}
                          </div>
                        )}

                        {/* TACTICAL GLOW OUTLINE - Replaces "PICK" text */}
                        {isPending && (
                          <div className="absolute inset-0 z-20 border-2 border-cyan-400 rounded-sm animate-pulse pointer-events-none shadow-[inset_0_0_12px_rgba(34,211,238,0.4),0_0_20px_rgba(34,211,238,0.6)]">
                            {/* Corner Accents - Targeting Reticle */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white" />
                            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white" />
                          </div>
                        )}

                        {/* SELECTION DOT */}
                        {isExactSelected && (
                          <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#22d3ee] rounded-full shadow-[0_0_4px_#22d3ee]" />
                        )}

                        {/* UNPAID INDICATOR - Red Dot for squares with unpaid status */}
                        {owners.length > 0 && owners.some(o => !o.paid) && (
                          <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.8)] border border-red-300 z-30 animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
