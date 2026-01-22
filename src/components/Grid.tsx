"use client";

import React from "react";
import { cn } from "@/lib/utils";

type SquareClaim = {
  uid: string;
  name: string;
  claimedAt: number;
};

import Image from "next/image";

interface GridProps {
  rows: number[];
  cols: number[];
  squares: Record<string, SquareClaim[]>; // cellKey => claims
  onSquareClick: (row: number, col: number) => void;
  teamA: string;
  teamB: string;
  teamALogo?: string;
  teamBLogo?: string;
  isScrambled?: boolean;
  winningCell?: { row: number; col: number } | null;
  selectedCell?: { row: number; col: number } | null;
}

function hashToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

const USER_COLOR_CLASSES = [
  { bg: "bg-rose-200 dark:bg-rose-900/60", text: "text-rose-900 dark:text-rose-100", border: "border-rose-300 dark:border-rose-500/60" },
  { bg: "bg-red-200 dark:bg-red-900/60", text: "text-red-900 dark:text-red-100", border: "border-red-300 dark:border-red-500/60" },
  { bg: "bg-orange-200 dark:bg-orange-900/60", text: "text-orange-900 dark:text-orange-100", border: "border-orange-300 dark:border-orange-500/60" },
  { bg: "bg-amber-200 dark:bg-amber-900/60", text: "text-amber-900 dark:text-amber-100", border: "border-amber-300 dark:border-amber-500/60" },
  { bg: "bg-yellow-200 dark:bg-yellow-900/60", text: "text-yellow-900 dark:text-yellow-100", border: "border-yellow-300 dark:border-yellow-500/60" },
  { bg: "bg-lime-200 dark:bg-lime-900/60", text: "text-lime-900 dark:text-lime-100", border: "border-lime-300 dark:border-lime-500/60" },
  { bg: "bg-green-200 dark:bg-green-900/60", text: "text-green-900 dark:text-green-100", border: "border-green-300 dark:border-green-500/60" },
  { bg: "bg-emerald-200 dark:bg-emerald-900/60", text: "text-emerald-900 dark:text-emerald-100", border: "border-emerald-300 dark:border-emerald-500/60" },
  { bg: "bg-teal-200 dark:bg-teal-900/60", text: "text-teal-900 dark:text-teal-100", border: "border-teal-300 dark:border-teal-500/60" },
  { bg: "bg-cyan-200 dark:bg-cyan-900/60", text: "text-cyan-900 dark:text-cyan-100", border: "border-cyan-300 dark:border-cyan-500/60" },
  { bg: "bg-sky-200 dark:bg-sky-900/60", text: "text-sky-900 dark:text-sky-100", border: "border-sky-300 dark:border-sky-500/60" },
  { bg: "bg-blue-200 dark:bg-blue-900/60", text: "text-blue-900 dark:text-blue-100", border: "border-blue-300 dark:border-blue-500/60" },
  { bg: "bg-indigo-200 dark:bg-indigo-900/60", text: "text-indigo-900 dark:text-indigo-100", border: "border-indigo-300 dark:border-indigo-500/60" },
  { bg: "bg-violet-200 dark:bg-violet-900/60", text: "text-violet-900 dark:text-violet-100", border: "border-violet-300 dark:border-violet-500/60" },
  { bg: "bg-purple-200 dark:bg-purple-900/60", text: "text-purple-900 dark:text-purple-100", border: "border-purple-300 dark:border-purple-500/60" },
  { bg: "bg-fuchsia-200 dark:bg-fuchsia-900/60", text: "text-fuchsia-900 dark:text-fuchsia-100", border: "border-fuchsia-300 dark:border-fuchsia-500/60" },
  { bg: "bg-pink-200 dark:bg-pink-900/60", text: "text-pink-900 dark:text-pink-100", border: "border-pink-300 dark:border-pink-500/60" },
  { bg: "bg-rose-300 dark:bg-rose-800/70", text: "text-rose-950 dark:text-rose-100", border: "border-rose-400 dark:border-rose-500/70" },
  { bg: "bg-cyan-300 dark:bg-cyan-800/70", text: "text-cyan-950 dark:text-cyan-100", border: "border-cyan-400 dark:border-cyan-500/70" },
  { bg: "bg-emerald-300 dark:bg-emerald-800/70", text: "text-emerald-950 dark:text-emerald-100", border: "border-emerald-400 dark:border-emerald-500/70" },
  { bg: "bg-indigo-300 dark:bg-indigo-800/70", text: "text-indigo-950 dark:text-indigo-100", border: "border-indigo-400 dark:border-indigo-500/70" },
];

function classesForUid(uid: string) {
  const idx = hashToHue(uid) % USER_COLOR_CLASSES.length;
  return USER_COLOR_CLASSES[idx];
}

export default function Grid({ rows, cols, squares, onSquareClick, teamA, teamB, teamALogo, teamBLogo, isScrambled, winningCell, selectedCell }: GridProps) {
  const showLogos = !isScrambled;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center pt-2 pl-6 md:pt-4 md:pl-10">
      {/* Team B Label (Horizontal Top) - Centered above Grid */}
      <div className="absolute top-0 left-0 right-0 pl-6 md:pl-10 flex items-center justify-center gap-2 md:gap-4 z-30 pointer-events-none -translate-y-3/4">
          {showLogos && teamBLogo && (
            <div className="relative w-6 h-6 md:w-8 md:h-8 shrink-0">
              <Image src={teamBLogo} alt={teamB} fill className="object-contain drop-shadow-md" />
            </div>
          )}
          <div className="text-center font-black text-xl md:text-3xl text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.2em] drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] whitespace-nowrap">
            {teamB}
          </div>
      </div>

      {/* Team A Label (Vertical Left) - Centered left of Grid */}
      <div className="absolute left-0 top-0 bottom-0 pt-6 md:pt-10 flex items-center justify-center z-30 pointer-events-none translate-x-3">
        <div className="flex flex-col items-center gap-2 md:gap-4">
          {showLogos && teamALogo && (
              <div className="relative w-6 h-6 md:w-8 md:h-8 shrink-0">
                <Image src={teamALogo} alt={teamA} fill className="object-contain drop-shadow-md" />
              </div>
          )}
          <div className="[writing-mode:vertical-lr] rotate-180 font-black text-xl md:text-3xl text-pink-600 dark:text-pink-500 uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] whitespace-nowrap">
            {teamA}
          </div>
        </div>
      </div>

      {/* The Grid Wrapper */}
      <div className="relative w-full aspect-square rounded-xl shadow-2xl bg-slate-300 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-700/50 p-0.5 md:p-1">
        <div className="grid grid-cols-11 w-full h-full bg-slate-100 dark:bg-slate-900">
            {/* Top-left empty corner */}
            <div className="aspect-square bg-slate-200 dark:bg-slate-800 shadow-md border-b border-r border-slate-300 dark:border-white/10"></div>

            {/* Column Headers (0-9) */}
            {cols.map((num) => (
              <div
                key={`col-${num}`}
                className="aspect-square flex items-center justify-center bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-cyan-600 dark:text-cyan-400 font-black text-xs sm:text-sm md:text-xl shadow-sm"
              >
                {isScrambled ? (
                  num
                ) : (
                  showLogos && teamBLogo && (
                    <div className="relative w-full h-full p-1 opacity-20 hover:opacity-100 transition-opacity">
                      <Image src={teamBLogo} alt={teamB} fill className="object-contain" />
                    </div>
                  )
                )}
                {!isScrambled && !teamBLogo && num}
              </div>
            ))}

            {/* Rows & Cells */}
            {rows.map((rowNum, rowIndex) => (
              <React.Fragment key={`row-${rowNum}`}>
                {/* Row Header */}
                <div className="aspect-square flex items-center justify-center bg-slate-100 dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 text-pink-600 dark:text-pink-500 font-black text-xs sm:text-sm md:text-xl shadow-sm">
                  {isScrambled ? (
                    rowNum
                  ) : (
                    showLogos && teamALogo && (
                      <div className="relative w-full h-full p-1 opacity-20 hover:opacity-100 transition-opacity">
                        <Image src={teamALogo} alt={teamA} fill className="object-contain" />
                      </div>
                    )
                  )}
                  {!isScrambled && !teamALogo && rowNum}
                </div>

                {/* Squares */}
                {cols.map((colNum, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const claims = (squares[key] ?? []).slice(0, 10);
                  const isFull = claims.length >= 10;
                  const isWinner = !!winningCell && winningCell.row === rowIndex && winningCell.col === colIndex;
                  const isSelected = !!selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex;

                  return (
                    <div
                      key={key}
                      onClick={() => onSquareClick(rowIndex, colIndex)}
                      className={cn(
                        "aspect-square relative w-full h-full gap-[1px] group overflow-hidden border-[0.5px] border-slate-200/50 dark:border-white/5",
                        claims.length > 0 ? "bg-slate-50 dark:bg-slate-800/60" : "bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/80",
                        isFull ? "cursor-not-allowed opacity-90" : "cursor-pointer",
                        (isWinner || isSelected) && "z-10",
                        isWinner && "ring-2 ring-yellow-400 bg-yellow-400/20 animate-pulse shadow-[0_0_20px_rgba(250,204,21,0.5)] z-20",
                        isSelected && !isWinner && "ring-2 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] z-20"
                      )}
                    >
                      {claims.length === 0 ? (
                         <div className="absolute inset-0 m-auto w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700/50 group-hover:bg-cyan-500/50 transition-colors" />
                      ) : claims.length <= 4 ? (
                        <div className="w-full h-full flex flex-col">
                          {claims.map((c, idx) => (
                            <div
                              key={c.uid}
                              className={cn(
                                "flex-1 flex items-center justify-center text-[8px] lg:text-[10px] leading-none font-bold truncate px-0.5",
                                classesForUid(c.uid).bg,
                                classesForUid(c.uid).text
                              )}
                              title={c.name}
                            >
                              {c.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-[1px]">
                          {claims.map((c) => (
                             <div
                              key={c.uid}
                              className={cn(
                                "flex items-center justify-center text-[6px] lg:text-[8px] font-white font-bold leading-none",
                                classesForUid(c.uid).bg,
                                classesForUid(c.uid).text
                              )}
                              title={c.name}
                            >
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
    </div>
  );
}
