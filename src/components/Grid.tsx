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
  { bg: 'bg-rose-200 dark:bg-rose-900/60', text: 'text-rose-900 dark:text-rose-100' },
  { bg: 'bg-cyan-200 dark:bg-cyan-900/60', text: 'text-cyan-900 dark:text-cyan-100' },
  { bg: 'bg-emerald-200 dark:bg-emerald-900/60', text: 'text-emerald-900 dark:text-emerald-100' },
  { bg: 'bg-violet-200 dark:bg-violet-900/60', text: 'text-violet-900 dark:text-violet-100' },
  { bg: 'bg-amber-200 dark:bg-amber-900/60', text: 'text-amber-900 dark:text-amber-100' },
];

function classesForUid(uid: string) {
  const idx = hashToHue(uid) % USER_COLOR_CLASSES.length;
  return USER_COLOR_CLASSES[idx];
}

export default function Grid({ rows, cols, squares, onSquareClick, teamA, teamB, teamALogo, teamBLogo, isScrambled, winningCell, selectedCell }: GridProps) {
  const showLogos = true;

  return (
    // ROOT CONTAINER: No padding! We want edge-to-edge power.
    <div className="relative w-full h-full flex flex-col">

      {/* --------------------------- */}
      {/* FLOATING TOP LABEL (Team B) */}
      {/* --------------------------- */}
      {/* Sits ON TOP of the grid header. Uses backdrop blur to be readable. */}
      <div className="absolute top-0 left-[9%] right-0 h-[9%] z-40 flex items-center justify-center pointer-events-none">
         <div className="bg-black/40 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
            <span className="font-black text-[min(4vw,1rem)] md:text-xl text-cyan-400 uppercase tracking-widest leading-none drop-shadow-md">
              {teamB}
            </span>
            {showLogos && teamBLogo && (
               <div className="relative w-4 h-4 md:w-6 md:h-6 shrink-0 opacity-90">
                 <Image src={teamBLogo} alt={teamB} fill className="object-contain" />
               </div>
            )}
         </div>
      </div>

      {/* --------------------------- */}
      {/* FLOATING LEFT LABEL (Team A) */}
      {/* --------------------------- */}
      {/* Sits ON TOP of the left column. */}
      <div className="absolute left-0 top-[9%] bottom-0 w-[9%] z-40 flex items-center justify-center pointer-events-none">
         <div className="transform -rotate-90 bg-black/40 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10 flex items-center gap-2 shadow-lg origin-center whitespace-nowrap">
            <span className="font-black text-[min(4vw,1rem)] md:text-xl text-pink-500 uppercase tracking-widest leading-none drop-shadow-md">
              {teamA}
            </span>
            {showLogos && teamALogo && (
                <div className="relative w-4 h-4 md:w-6 md:h-6 shrink-0 opacity-90 -rotate-90">
                  <Image src={teamALogo} alt={teamA} fill className="object-contain" />
                </div>
            )}
         </div>
      </div>

      {/* --------------------------- */}
      {/* THE GRID ITSELF */}
      {/* --------------------------- */}
      {/* Uses standard 11x11 grid (1 header row/col + 10x10 game) */}
      <div className="w-full h-full grid grid-cols-11 grid-rows-11 bg-[#0B0C15] select-none">
            
            {/* 1. TOP-LEFT CORNER (Logo / VS) */}
            <div className="col-span-1 row-span-1 bg-[#151725] border-r border-b border-white/10 flex items-center justify-center relative z-20">
               <div className="text-[8px] font-mono text-slate-600">VS</div>
            </div>

            {/* 2. COLUMN HEADERS (Team B Numbers) */}
            {cols.map((num, i) => (
              <div key={`col-${i}`} className="col-span-1 row-span-1 flex items-center justify-center bg-[#0B0C15] border-r border-b border-white/10 relative overflow-hidden">
                 {/* Number */}
                 <span className={`font-black text-sm md:text-2xl z-10 ${isScrambled ? 'text-cyan-400' : 'text-slate-600 blur-[2px]'}`}>
                    {isScrambled ? num : '?'}
                 </span>
                 {/* Subtle BG Logo */}
                 {!isScrambled && teamBLogo && (
                    <div className="absolute inset-0 opacity-20 grayscale p-1">
                        <Image src={teamBLogo} alt="logo" fill className="object-contain" />
                    </div>
                 )}
              </div>
            ))}

            {/* 3. ROW HEADERS & CELLS */}
            {rows.map((rowNum, rowIndex) => (
              <React.Fragment key={`row-${rowIndex}`}>
                
                {/* Row Header (Team A Numbers) */}
                <div className="col-span-1 row-span-1 flex items-center justify-center bg-[#0B0C15] border-r border-b border-white/10 relative overflow-hidden">
                   <span className={`font-black text-sm md:text-2xl z-10 ${isScrambled ? 'text-pink-500' : 'text-slate-600 blur-[2px]'}`}>
                      {isScrambled ? rowNum : '?'}
                   </span>
                   {!isScrambled && teamALogo && (
                      <div className="absolute inset-0 opacity-20 grayscale p-1">
                          <Image src={teamALogo} alt="logo" fill className="object-contain" />
                      </div>
                   )}
                </div>

                {/* GAME CELLS */}
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
                        'col-span-1 row-span-1 relative border-r border-b border-white/5 overflow-hidden transition-all duration-75',
                        // Background Logic
                        claims.length > 0 ? 'bg-slate-800/40' : 'bg-transparent hover:bg-white/5 active:bg-white/10',
                        // Selection/Winner Logic
                        isWinner && 'z-30 ring-2 ring-yellow-400 bg-yellow-400/20 shadow-[inset_0_0_20px_rgba(250,204,21,0.5)]',
                        isSelected && !isWinner && 'z-20 ring-1 ring-cyan-400 bg-cyan-400/10'
                      )}
                    >
                      {/* CELL CONTENT */}
                      {claims.length === 0 ? null : claims.length <= 3 ? (
                        // 1-3 Names (Readable Stack)
                        <div className="w-full h-full flex flex-col justify-center items-center p-[1px]">
                          {claims.map((c) => (
                            <div key={c.uid} className={cn('w-full text-center text-[min(2.5vw,10px)] md:text-[10px] leading-none font-bold truncate rounded-[1px] my-[0.5px]', classesForUid(c.uid).text)}>
                                {c.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        // 4+ Names (Pixel Density Mode)
                        <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-[1px] gap-[1px]">
                           {claims.slice(0,4).map((c) => (
                              <div key={c.uid} className={cn('flex items-center justify-center text-[min(2vw,8px)] font-bold leading-none rounded-[1px]', classesForUid(c.uid).bg, classesForUid(c.uid).text)}>
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
  );
}