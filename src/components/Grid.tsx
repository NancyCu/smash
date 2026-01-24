'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// --- Types ---
type SquareClaim = {
  uid: string;
  name: string;
  claimedAt: number;
};

interface GridProps {
  rows: number[];
  cols: number[];
  squares: Record<string, SquareClaim[]>; 
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
  { bg: 'bg-rose-200 dark:bg-rose-900/60', text: 'text-rose-900 dark:text-rose-100', border: 'border-rose-300 dark:border-rose-500/60' },
  { bg: 'bg-cyan-200 dark:bg-cyan-900/60', text: 'text-cyan-900 dark:text-cyan-100', border: 'border-cyan-300 dark:border-cyan-500/60' },
  { bg: 'bg-emerald-200 dark:bg-emerald-900/60', text: 'text-emerald-900 dark:text-emerald-100', border: 'border-emerald-300 dark:border-emerald-500/60' },
  { bg: 'bg-violet-200 dark:bg-violet-900/60', text: 'text-violet-900 dark:text-violet-100', border: 'border-violet-300 dark:border-violet-500/60' },
  { bg: 'bg-amber-200 dark:bg-amber-900/60', text: 'text-amber-900 dark:text-amber-100', border: 'border-amber-300 dark:border-amber-500/60' },
];

function classesForUid(uid: string) {
  const idx = hashToHue(uid) % USER_COLOR_CLASSES.length;
  return USER_COLOR_CLASSES[idx];
}

export default function Grid({ rows, cols, squares, onSquareClick, teamA, teamB, teamALogo, teamBLogo, isScrambled, winningCell, selectedCell }: GridProps) {
  // Always show logos if they are provided, regardless of scramble state
  const showLogos = true;

  return (
    // ROOT CONTAINER
    // We reserve padding for the labels so they sit INSIDE the box
    <div className="relative w-full h-full flex flex-col pl-10 pt-10 md:pl-16 md:pt-16">

      {/* --------------------------- */}
      {/* TOP LABEL (Team B - Horizontal) */}
      {/* --------------------------- */}
      <div className="absolute top-0 left-10 md:left-16 right-0 h-10 md:h-16 flex items-center justify-center z-30 pointer-events-none">
        <div className="flex items-center gap-2 md:gap-4 px-4 pb-2">
           {/* TEXT */}
           <span className="font-black text-[min(6vw,2.5rem)] text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.15em] drop-shadow-[0_2px_10px_rgba(34,211,238,0.6)] whitespace-nowrap leading-none">
            {teamB}
          </span>
          {/* LOGO */}
          {showLogos && teamBLogo && (
            <div className="relative w-[min(6vw,2.5rem)] h-[min(6vw,2.5rem)] shrink-0">
              <Image src={teamBLogo} alt={teamB} fill className="object-contain drop-shadow-md" />
            </div>
          )}
        </div>
      </div>

      {/* --------------------------- */}
      {/* LEFT LABEL (Team A - Vertical) */}
      {/* --------------------------- */}
      <div className="absolute left-0 top-10 md:top-16 bottom-0 w-10 md:w-16 flex items-center justify-center z-30 pointer-events-none">
        {/* Rotated Container: Name bottom -> top, Logo at top */}
        <div className="transform -rotate-90 flex items-center gap-2 md:gap-4 whitespace-nowrap origin-center">
            {/* TEXT */}
            <span className="font-black text-[min(6vw,2.5rem)] text-pink-600 dark:text-pink-500 uppercase tracking-[0.15em] drop-shadow-[0_2px_10px_rgba(236,72,153,0.6)] leading-none">
              {teamA}
            </span>
            {/* LOGO */}
            {showLogos && teamALogo && (
                // Counter-rotate the logo 90deg if you want it upright, 
                // OR leave it if you want it aligned with text flow. 
                // Usually keeping it aligned with text flow looks cleaner vertically.
                <div className="relative w-[min(6vw,2.5rem)] h-[min(6vw,2.5rem)] shrink-0">
                  <Image src={teamALogo} alt={teamA} fill className="object-contain drop-shadow-md" />
                </div>
            )}
        </div>
      </div>

      {/* --------------------------- */}
      {/* THE GRID ITSELF */}
      {/* --------------------------- */}
      <div className="relative w-full h-full aspect-square rounded-xl shadow-2xl bg-slate-300 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-700/50 p-0.5 md:p-1">
        <div className="grid grid-cols-11 w-full h-full bg-slate-100 dark:bg-slate-900">
            
            {/* 1. TOP-LEFT CORNER */}
            <div className="aspect-square bg-[#0B0C15] shadow-md border-b border-r border-slate-300 dark:border-white/10 flex items-center justify-center z-20">
               <div className="w-1.5 h-1.5 bg-white/10 rounded-full"></div>
            </div>

            {/* 2. COLUMN HEADERS (Team B Numbers) */}
            {cols.map((num) => (
              <div key={`col-${num}`} className="aspect-square flex items-center justify-center bg-[#0B0C15] border-b border-r border-slate-200 dark:border-white/10 text-cyan-600 dark:text-cyan-400 font-black text-sm md:text-2xl shadow-sm relative overflow-hidden group">
                {isScrambled ? (
                    <span className="relative z-10 group-hover:scale-110 transition-transform">{num}</span>
                ) : (
                  teamBLogo && <div className="absolute inset-0 flex items-center justify-center p-2"><Image src={teamBLogo} alt={teamB} fill className="object-contain opacity-20 grayscale" /></div>
                )}
              </div>
            ))}

            {/* 3. ROWS & CELLS */}
            {rows.map((rowNum, rowIndex) => (
              <React.Fragment key={`row-${rowNum}`}>
                
                {/* Row Header (Team A Numbers) */}
                <div className="aspect-square flex items-center justify-center bg-[#0B0C15] border-r border-b border-slate-200 dark:border-white/10 text-pink-600 dark:text-pink-500 font-black text-sm md:text-2xl shadow-sm relative overflow-hidden group">
                  {isScrambled ? (
                    <span className="relative z-10 group-hover:scale-110 transition-transform">{rowNum}</span>
                  ) : (
                    teamALogo && <div className="absolute inset-0 flex items-center justify-center p-2"><Image src={teamALogo} alt={teamA} fill className="object-contain opacity-20 grayscale" /></div>
                  )}
                </div>

                {/* The 10 Squares for this Row */}
                {cols.map((colNum, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const claims = (squares[key] ?? []).slice(0, 10);
                  const isWinner = !!winningCell && winningCell.row === rowIndex && winningCell.col === colIndex;
                  const isSelected = !!selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex;

                  return (
                    <div
                      key={key}
                      onClick={() => onSquareClick(rowIndex, colIndex)}
                      className={cn(
                        'aspect-square relative w-full h-full gap-[1px] group overflow-hidden border-[0.5px] border-slate-200/50 dark:border-white/5 transition-all duration-150',
                        claims.length > 0 ? 'bg-slate-50 dark:bg-slate-800/60' : 'bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/80',
                        (isWinner || isSelected) && 'z-10 scale-105 rounded-md shadow-lg border-transparent',
                        isWinner && 'ring-2 ring-yellow-400 bg-yellow-400/20 animate-pulse shadow-[0_0_20px_rgba(250,204,21,0.5)] z-20',
                        isSelected && !isWinner && 'ring-2 ring-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)] z-20'
                      )}
                    >
                      {/* Empty State */}
                      {claims.length === 0 ? (
                          <div className="absolute inset-0 m-auto w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700/50 group-hover:bg-cyan-500/50 group-hover:scale-150 transition-all" />
                      ) : claims.length <= 4 ? (
                        // 1-4 Users: Stacked List
                        <div className="w-full h-full flex flex-col">
                          {claims.map((c) => (
                            <div key={c.uid} className={cn('flex-1 flex items-center justify-center text-[8px] lg:text-[10px] leading-none font-bold truncate px-0.5', classesForUid(c.uid).bg, classesForUid(c.uid).text)}>{c.name}</div>
                          ))}
                        </div>
                      ) : (
                        // 5+ Users: Mini Grid
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-[1px]">
                          {claims.map((c) => (
                             <div key={c.uid} className={cn('flex items-center justify-center text-[6px] lg:text-[8px] font-white font-bold leading-none', classesForUid(c.uid).bg, classesForUid(c.uid).text)}>{c.name.charAt(0).toUpperCase()}</div>
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
