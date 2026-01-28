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
    for (let i = 0; i < name.length; i++)
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    // OUTER CONTAINER - FLEX COLUMN (thin team bars like reference)
    <div className="flex flex-col h-full w-full bg-[#0f111a] select-none">
      {/* --- 1. TOP HEADER BAR (TEAM B - CYAN) --- */}
      {isScrambled ? (
        <div
          className="relative w-full flex items-center justify-center border-b border-white/5 bg-[#151725] h-6 md:h-8 overflow-hidden"
        >
          {/* Watermark Logo */}
          {teamBLogo && (
            <img
              src={teamBLogo}
              className="absolute inset-0 w-full h-full object-cover opacity-[0.05] grayscale"
              alt=""
            />
          )}

          <div
            className="flex items-center gap-2 relative z-10 px-2"
          >
            {teamBLogo && (
              <img
                src={teamBLogo}
                className="w-3 h-3 md:w-4 md:h-4 object-contain drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"
                alt=""
              />
            )}
            <span
              className="text-cyan-400 font-teko uppercase font-bold tracking-[0.15em] drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] text-xs md:text-sm truncate max-w-[80%]"
            >
              {teamB}
            </span>
            {teamBLogo && (
              <img
                src={teamBLogo}
                className="w-3 h-3 md:w-4 md:h-4 object-contain drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]"
                alt=""
              />
            )}
          </div>
        </div>
      ) : null}

      {/* MAIN CONTENT - FLEX ROW */}
      <div className="flex flex-1 min-h-0 relative">
        {/* --- 2. LEFT SIDEBAR (TEAM A - PINK) --- */}
        {isScrambled ? (
          <div
            className="relative h-full border-r border-white/5 flex items-center justify-center bg-[#151725] w-6 md:w-8 overflow-hidden"
          >
            {/* Watermark Logo */}
            {teamALogo && (
              <img
                src={teamALogo}
                className="absolute inset-0 w-full h-full object-cover opacity-[0.05] grayscale"
                alt=""
              />
            )}

            <div
              className="flex flex-col items-center gap-2 relative z-10 py-2 h-full justify-center"
            >
              {teamALogo && (
                <img
                  src={teamALogo}
                  className="w-3 h-3 md:w-4 md:h-4 object-contain drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]"
                  alt=""
                />
              )}
              <span
                className="text-pink-500 font-teko uppercase font-bold tracking-[0.15em] drop-shadow-[0_0_10px_rgba(236,72,153,0.4)] whitespace-nowrap [writing-mode:vertical-rl] rotate-180 text-xs md:text-sm truncate"
              >
                {teamA}
              </span>
              {teamALogo && (
                <img
                  src={teamALogo}
                  className="w-3 h-3 md:w-4 md:h-4 object-contain drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]"
                  alt=""
                />
              )}
            </div>
          </div>
        ) : null}

        {/* --- 3. THE GRID --- */}
        <div className={`${isScrambled ? "flex-1" : "w-full"} h-full`}>
          <div className="relative h-full w-full">
            {!isScrambled && (
              <>
                {/* Team B name overlay across the top header row (inside grid) */}
                <div className="pointer-events-none absolute top-0 left-8 md:left-10 right-0 h-8 md:h-10 flex items-center justify-center z-50">
                  <span className="text-cyan-300/90 font-teko uppercase font-bold tracking-[0.12em] drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] text-sm md:text-base truncate max-w-[85%]">
                    {teamB}
                  </span>
                </div>

                {/* Team A name overlay down the left header column (inside grid) */}
                <div className="pointer-events-none absolute top-8 md:top-10 left-0 w-8 md:w-10 bottom-0 flex items-center justify-center z-50">
                  <span className="text-pink-300/90 font-teko uppercase font-bold tracking-[0.12em] drop-shadow-[0_0_8px_rgba(236,72,153,0.5)] text-sm md:text-base whitespace-nowrap [writing-mode:vertical-rl] rotate-180 truncate">
                    {teamA}
                  </span>
                </div>
              </>
            )}

            <div className="grid grid-cols-[auto_repeat(10,1fr)] border-b border-r border-white/5 h-full w-full bg-[#0f111a]">
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

                    let containerClass =
                      "relative w-full aspect-square cursor-pointer transition-all duration-300 overflow-hidden";
                    if (!isMulti)
                      containerClass +=
                        " flex flex-col items-center justify-center";
                    let borderClass = "border-r border-b border-white/5";
                    let textClass =
                      "text-[8px] md:text-[10px] font-bold truncate max-w-[90%] px-0.5";

                    if (isWinner) {
                      containerClass +=
                        " bg-yellow-500/20 shadow-[inset_0_0_15px_rgba(250,204,21,0.4)] z-30 border border-yellow-500";
                      borderClass = "";
                      textClass += " text-yellow-200";
                    } else if (isExactSelected) {
                      containerClass +=
                        " bg-indigo-500/80 z-20 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.5)] border-2 border-white";
                      borderClass = "";
                      textClass += " text-white";
                    } else if (isInCrosshair) {
                      containerClass +=
                        " shadow-[inset_0_0_12px_rgba(255,255,255,0.2),0_0_10px_rgba(255,255,255,0.15)]";
                      borderClass = "border-r border-b border-white/[0.02]";
                      if (owners.length > 0 && !isMulti)
                        containerClass += ` ${getUserColor(owners[0].name)}`;
                      else if (owners.length === 0)
                        containerClass += " bg-[#0B0C15]";
                    } else if (isPending) {
                      containerClass += " bg-indigo-900/30 animate-pulse";
                      textClass += " text-indigo-300";
                    } else if (owners.length === 1) {
                      containerClass += ` ${getUserColor(owners[0].name)}`;
                      if (currentUserId && owners[0].uid === currentUserId) {
                        containerClass += " border border-indigo-500/40";
                        borderClass = "";
                      }
                    } else if (!isMulti) {
                      containerClass += " hover:bg-white/5";
                      textClass += " text-white/20";
                    }

                    return (
                      <div
                        key={cellKey}
                        onClick={() => onSquareClick(rIndex, cIndex)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSquareClick(rIndex, cIndex);
                          }
                        }}
                        className={`${containerClass} ${borderClass}`}
                      >
                        {isWinner && (
                          <div className="absolute -top-1 -right-1 text-[8px] z-40 pointer-events-none">
                            👑
                          </div>
                        )}
                        {isMulti ? (
                          owners.length <= 4 ? (
                            <div className="w-full h-full flex flex-col">
                              {owners.map((o, idx) => (
                                <div
                                  key={idx}
                                  className={`flex-1 flex items-center justify-center ${getUserColor(o.name)} !border-0 overflow-hidden min-h-0 bg-blend-soft-light`}
                                >
                                  <span className="text-[6px] md:text-[8px] font-bold leading-none text-white/95 truncate px-0.5 max-w-full tracking-tight">
                                    {o.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                              {owners.slice(0, 9).map((o, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center justify-center ${getUserColor(o.name)} !border-0 overflow-hidden`}
                                >
                                  <span className="text-[4px] md:text-[6px] font-bold leading-none text-white/90">
                                    {o.name.slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              ))}
                              {owners.length > 9 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black/80 backdrop-blur-sm rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center border border-white/20 shadow-lg z-10">
                                    <span className="text-[6px] md:text-[8px] font-bold text-white">
                                      +{owners.length - 9}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        ) : (
                          <>
                            {owners.length === 1 ? (
                              <span className={textClass}>
                                {owners[0].name.slice(0, 6)}
                              </span>
                            ) : isPending ? (
                              <span className="text-[8px] font-bold text-indigo-400">
                                PICK
                              </span>
                            ) : null}
                            {isExactSelected && (
                              <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full shadow-sm" />
                            )}
                          </>
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
