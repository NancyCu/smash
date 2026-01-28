"use client";

import React from "react";
import { Lock, Trophy } from "lucide-react";

interface GridProps {
  rows: number[];
  cols: number[];
  squares: Record<string, { uid: string; name: string }[]>;
  onSquareClick: (row: number, col: number) => void;
  teamA: string;
  teamB: string;
  teamALogo?: string;
  teamBLogo?: string;
  isScrambled?: boolean;
  selectedCell?: { row: number; col: number } | null;
  winningCell?: { row: number; col: number } | null;
  pendingIndices?: number[];
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
    // OUTER CONTAINER - FLEX COLUMN (thin team bars like reference)
    <div className="flex flex-col h-full w-full bg-[#0f111a] select-none rounded-2xl relative">
      
      {/* MAIN CONTENT - FLEX ROW */}
      <div className="flex flex-1 min-h-0 relative">
        
        {/* --- 3. THE GRID --- */}
        <div className="w-full h-full">
          <div className="relative h-full w-full">
            {/* Team B name overlay across the top header row (inside grid) */}
            <div className="pointer-events-none absolute top-0 left-8 md:left-10 right-0 h-8 md:h-10 flex items-center justify-center z-50 -translate-y-1/2">
                <span className="text-cyan-300/90 font-teko uppercase font-bold tracking-[0.12em] drop-shadow-[0_0_8px_rgba(34,211,238,0.9)] text-sm md:text-base truncate max-w-[85%]">
                {teamB}
                </span>
            </div>

            {/* Team A name overlay down the left header column (inside grid) */}
            <div className="pointer-events-none absolute top-8 md:top-10 left-0 w-8 md:w-10 bottom-0 flex items-center justify-center z-50 -translate-x-1/2">
                <span className="text-pink-300/90 font-teko uppercase font-bold tracking-[0.12em] drop-shadow-[0_0_8px_rgba(236,72,153,0.9)] text-sm md:text-base whitespace-nowrap [writing-mode:vertical-rl] rotate-180 truncate">
                {teamA}
                </span>
            </div>

            <div className="grid grid-cols-[auto_repeat(10,1fr)] border-b border-r border-white/5 h-full w-full bg-[#0f111a] rounded-2xl overflow-hidden">
            {/* HEADER ROW (COLUMNS) */}
            <div className="contents">
              {/* CORNER */}
              <div className="bg-[#0B0C15] border-r border-b border-white/5 flex items-center justify-center p-1 relative z-20 w-8 md:w-10">
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
                        <span className="text-[6px] font-bold text-white/30">
                          VS
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[8px] text-slate-500 font-bold">
                      VS
                    </div>
                  )
                ) : (
                  <Lock className="w-4 h-4 text-slate-600" />
                )}
              </div>

              {/* COLUMN NUMBERS */}
              {cols.map((num, i) => {
                const isColHighlighted = activeFocus?.col === i;
                return (
                  <div
                    key={`col-${i}`}
                    className={`relative p-1 h-8 md:h-10 flex items-center justify-center border-b border-r border-white/5 bg-[#151725] overflow-hidden transition-all duration-300 ${isColHighlighted ? "bg-cyan-900/60 shadow-[inset_0_0_20px_rgba(34,211,238,0.4),0_0_20px_rgba(34,211,238,0.3)] z-40" : ""}`}
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
                        className={`font-mono font-bold text-base md:text-2xl transition-all relative z-10 ${isColHighlighted ? "text-cyan-300 scale-125 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "text-cyan-600"}`}
                      >
                        {num}
                      </span>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
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
                    className={`relative w-8 md:w-10 flex items-center justify-center border-r border-b border-white/5 bg-[#151725] overflow-hidden transition-all duration-300 ${isRowHighlighted ? "bg-pink-900/60 shadow-[inset_0_0_20px_rgba(236,72,153,0.4),0_0_20px_rgba(236,72,153,0.3)] z-40" : ""}`}
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
                        className={`font-mono font-bold text-base md:text-2xl transition-all relative z-10 ${isRowHighlighted ? "text-pink-300 scale-125 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" : "text-pink-700"}`}
                      >
                        {rowNum}
                      </span>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                    )}
                  </div>

                  {/* SQUARES (Using your original multi-user logic) */}
                  {cols.map((_, cIndex) => {
                    const cellKey = `${rIndex}-${cIndex}`;
                    const owners = getOwners(rIndex, cIndex);
                    const isMulti = owners.length > 1;
                    const isPending = pendingIndices.includes(
                      rIndex * cols.length + cIndex,
                    );
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
                    const isMe =
                      currentUserId &&
                      owners.some((o) => o.uid === currentUserId);
                    const firstOwnerIsMe =
                      owners.length > 0 &&
                      currentUserId &&
                      owners[0].uid === currentUserId;

                    let containerClass =
                      "relative w-full aspect-square cursor-pointer transition-all duration-300 overflow-hidden rounded-sm border border-white/5";
                    let textClass =
                      "text-[8px] md:text-[10px] font-bold truncate max-w-[90%] px-0.5 z-10 select-none";

                    // 1. Winner
                    if (isWinner) {
                      containerClass =
                        "relative w-full aspect-square cursor-pointer overflow-hidden rounded-sm bg-[#22d3ee] shadow-[0_0_20px_#22d3ee,inset_0_0_10px_white] border-white ring-2 ring-[#22d3ee]/50 z-50 animate-pulse";
                      textClass =
                        "text-[8px] md:text-[10px] font-bold truncate max-w-[90%] px-0.5 z-10 text-black";
                    }
                    // 2. Selected
                    else if (isExactSelected) {
                      containerClass +=
                        " bg-[#22d3ee]/20 z-40 border-[#22d3ee] shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-105";
                      textClass += " text-white";
                    }
                    // 3. Owned
                    else if (owners.length > 0) {
                      if (isMulti) {
                        // Base for multi, content handled inside
                        containerClass += " bg-white/5";
                      } else if (firstOwnerIsMe) {
                        // "Owned" Square (Me)
                        containerClass +=
                          " bg-gradient-to-br from-[#22d3ee]/20 to-[#22d3ee]/5 border-[#22d3ee]/30 shadow-[0_0_10px_rgba(34,211,238,0.1),inset_0_0_5px_rgba(34,211,238,0.2)]";
                        textClass +=
                          " text-[#22d3ee] drop-shadow-[0_0_2px_rgba(34,211,238,0.8)]";
                      } else {
                        // "Opponent" Square
                        containerClass +=
                          " bg-[#db2777]/10 border-[#db2777]/20";
                        textClass += " text-[#db2777]/80";
                      }
                    }
                    // 4. Pending
                    else if (isPending) {
                      containerClass +=
                        " bg-[#22d3ee]/10 animate-pulse border-[#22d3ee]/30";
                      textClass += " text-[#22d3ee]/70";
                    }
                    // 5. Empty
                    else {
                      containerClass +=
                        " bg-white/5 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]";
                      if (isInCrosshair) {
                        containerClass +=
                          " bg-white/[0.08] shadow-[inset_0_0_12px_rgba(255,255,255,0.1)] border-white/10";
                      }
                    }

                    return (
                      <div
                        key={cellKey}
                        onClick={() => onSquareClick(rIndex, cIndex)}
                        className={containerClass}
                      >
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
                                  ? "bg-[#22d3ee]/20 text-[#22d3ee] border-[#22d3ee]/20"
                                  : "bg-[#db2777]/10 text-[#db2777]/70 border-[#db2777]/10";
                                return (
                                  <div
                                    key={idx}
                                    className={`flex-1 flex items-center justify-center border-b last:border-0 ${subClass}`}
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
                                  ? "bg-[#22d3ee]/20 text-[#22d3ee]"
                                  : "bg-[#db2777]/10 text-[#db2777]/70";
                                return (
                                  <div
                                    key={idx}
                                    className={`flex items-center justify-center border-[0.5px] border-white/5 ${subClass}`}
                                  >
                                    <span className="text-[4px] md:text-[6px] font-bold leading-none">
                                      {o.name.slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                );
                              })}
                              {owners.length > 9 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black/90 rounded-full w-4 h-4 flex items-center justify-center border border-white/20 shadow-lg z-10">
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
                          <div className="flex items-center justify-center w-full h-full">
                            {owners.length === 1 ? (
                              <span className={textClass}>
                                {owners[0].name.slice(0, 6)}
                              </span>
                            ) : isPending ? (
                              <span className={textClass}>PICK</span>
                            ) : null}
                          </div>
                        )}

                        {/* SELECTION DOT */}
                        {isExactSelected && (
                          <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#22d3ee] rounded-full shadow-[0_0_4px_#22d3ee]" />
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
