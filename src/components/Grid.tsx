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
  pendingIndices?: number[]; 
  currentUserId?: string;    
}

function hashToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

const USER_COLOR_CLASSES = [
  { bg: 'bg-rose-500', text: 'text-rose-100', soft: 'bg-rose-500/20 text-rose-200', ring: 'ring-rose-400' },
  { bg: 'bg-cyan-500', text: 'text-cyan-100', soft: 'bg-cyan-500/20 text-cyan-200', ring: 'ring-cyan-400' },
  { bg: 'bg-emerald-500', text: 'text-emerald-100', soft: 'bg-emerald-500/20 text-emerald-200', ring: 'ring-emerald-400' },
  { bg: 'bg-violet-500', text: 'text-violet-100', soft: 'bg-violet-500/20 text-violet-200', ring: 'ring-violet-400' },
  { bg: 'bg-amber-500', text: 'text-amber-100', soft: 'bg-amber-500/20 text-amber-200', ring: 'ring-amber-400' },
  { bg: 'bg-pink-500', text: 'text-pink-100', soft: 'bg-pink-500/20 text-pink-200', ring: 'ring-pink-400' },
  { bg: 'bg-indigo-500', text: 'text-indigo-100', soft: 'bg-indigo-500/20 text-indigo-200', ring: 'ring-indigo-400' },
];

function classesForUid(uid: string) {
  const idx = hashToHue(uid) % USER_COLOR_CLASSES.length;
  return USER_COLOR_CLASSES[idx];
}

export default function Grid({ 
  rows, cols, squares, onSquareClick, 
  teamA, teamB, teamALogo, teamBLogo, 
  isScrambled, winningCell, selectedCell, 
  pendingIndices = [], currentUserId 
}: GridProps) {
  
  const showLogos = true;
  const myColor = currentUserId ? classesForUid(currentUserId) : USER_COLOR_CLASSES[6];

  return (
    <div className="relative w-full h-full flex flex-col">

      {/* FLOATING LABELS */}
      <div className="absolute top-0 left-[9%] right-0 h-[9%] z-40 flex items-center justify-center pointer-events-none">
         <div className="bg-black/40 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
            <span className="font-black text-[min(4vw,1rem)] md:text-xl text-cyan-400 uppercase tracking-widest leading-none drop-shadow-md">{teamB}</span>
            {showLogos && teamBLogo && <div className="relative w-4 h-4 md:w-6 md:h-6 shrink-0 opacity-90"><Image src={teamBLogo} alt={teamB} fill className="object-contain" /></div>}
         </div>
      </div>
      <div className="absolute left-0 top-[9%] bottom-0 w-[9%] z-40 flex items-center justify-center pointer-events-none">
         <div className="transform -rotate-90 bg-black/40 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10 flex items-center gap-2 shadow-lg origin-center whitespace-nowrap">
            <span className="font-black text-[min(4vw,1rem)] md:text-xl text-pink-500 uppercase tracking-widest leading-none drop-shadow-md">{teamA}</span>
            {showLogos && teamALogo && <div className="relative w-4 h-4 md:w-6 md:h-6 shrink-0 opacity-90 -rotate-90"><Image src={teamALogo} alt={teamA} fill className="object-contain" /></div>}
         </div>
      </div>

      <div className="w-full h-full grid grid-cols-11 grid-rows-11 bg-[#0B0C15] select-none">
            
            {/* CORNER */}
            <div className="col-span-1 row-span-1 bg-[#151725] border-r border-b border-white/10 flex items-center justify-center relative z-20"><div className="text-[8px] font-mono text-slate-600">VS</div></div>

            {/* HEADERS */}
            {cols.map((num, i) => {
              // FIX: Highlight if Winning OR Selected
              const isHighlight = (winningCell && winningCell.col === i) || (selectedCell && selectedCell.col === i);
              return (
                <div key={`col-${i}`} className={cn("col-span-1 row-span-1 flex items-center justify-center border-r border-b border-white/10 relative overflow-hidden transition-all", isHighlight ? "bg-cyan-500/20 z-50 shadow-[inset_0_0_10px_rgba(34,211,238,0.5)]" : "bg-[#0B0C15]")}>
                   <span className={cn("font-black text-sm md:text-2xl z-20 transition-all", isScrambled ? (isHighlight ? "text-white scale-125 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "text-cyan-400") : "text-slate-600 blur-[2px]")}>{isScrambled ? num : '?'}</span>
                </div>
              );
            })}
            {rows.map((rowNum, rowIndex) => {
              // FIX: Highlight if Winning OR Selected
              const isHighlight = (winningCell && winningCell.row === rowIndex) || (selectedCell && selectedCell.row === rowIndex);
              return (
                <React.Fragment key={`row-${rowIndex}`}>
                  <div className={cn("col-span-1 row-span-1 flex items-center justify-center border-r border-b border-white/10 relative overflow-hidden transition-all", isHighlight ? "bg-pink-500/20 z-50 shadow-[inset_0_0_10px_rgba(236,72,153,0.5)]" : "bg-[#0B0C15]")}>
                     <span className={cn("font-black text-sm md:text-2xl z-20 transition-all", isScrambled ? (isHighlight ? "text-white scale-125 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" : "text-pink-500") : "text-slate-600 blur-[2px]")}>{isScrambled ? rowNum : '?'}</span>
                  </div>

                  {/* GAME CELLS */}
                  {cols.map((colNum, colIndex) => {
                    const cellIndex = rowIndex * 10 + colIndex;
                    const key = `${rowIndex}-${colIndex}`;
                    const claims = (squares[key] ?? []).slice(0, 10);
                    
                    const isWinner = !!winningCell && winningCell.row === rowIndex && winningCell.col === colIndex;
                    const isSelected = !!selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex;
                    const isPending = pendingIndices.includes(cellIndex);
                    
                    // FIX: Activate Crosshair for BOTH Winning Cell and Selected Cell
                    const isCrosshair = (!!winningCell && (winningCell.row === rowIndex || winningCell.col === colIndex)) || 
                                        (!!selectedCell && (selectedCell.row === rowIndex || selectedCell.col === colIndex));

                    return (
                      <div
                        key={key}
                        onClick={() => onSquareClick(rowIndex, colIndex)}
                        className={cn(
                          'col-span-1 row-span-1 relative border-r border-b border-white/5 overflow-hidden transition-all duration-75 cursor-pointer',
                          claims.length > 0 ? 'bg-slate-800/40' : 'bg-transparent hover:bg-white/5',
                          
                          isPending && `ring-inset ring-2 ${myColor.ring} ${myColor.soft} animate-pulse z-30`,
                          
                          // Crosshair Logic
                          isCrosshair && !isWinner && !isSelected && "bg-white/5",

                          // Winner Logic
                          isWinner && 'z-30 ring-2 ring-yellow-400 bg-yellow-400/20 shadow-[inset_0_0_20px_rgba(250,204,21,0.5)]',
                          
                          // Selected Logic (Blue Ring)
                          isSelected && !isWinner && !isPending && 'z-20 ring-1 ring-cyan-400 bg-cyan-400/10'
                        )}
                      >
                         {/* PENDING OVERLAY */}
                         {isPending && claims.length === 0 && (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className={cn("text-[min(3vw,12px)] font-black uppercase tracking-wider", myColor.text)}>Pick</span>
                            </div>
                         )}

                         {/* CONTENT RENDERER */}
                         {claims.length > 0 && (
                             <div className={cn(
                               "w-full h-full grid gap-[0.5px]",
                               claims.length === 1 ? "grid-cols-1 grid-rows-1" :
                               claims.length === 2 ? "grid-cols-2 grid-rows-1" :
                               claims.length <= 4 ? "grid-cols-2 grid-rows-2" :
                               claims.length <= 9 ? "grid-cols-3 grid-rows-3" :
                               "grid-cols-3 grid-rows-4"
                             )}>
                                {claims.map((c, i) => {
                                   const styles = classesForUid(c.uid);
                                   return (
                                     <div key={i} className={cn("flex items-center justify-center overflow-hidden", styles.bg)}>
                                        <span className={cn(
                                          "font-bold leading-none truncate px-0.5",
                                          styles.text,
                                          claims.length === 1 ? "text-[min(3vw,12px)]" : 
                                          claims.length <= 4 ? "text-[min(2.5vw,9px)]" : 
                                          "text-[min(2vw,7px)]"
                                        )}>
                                           {claims.length <= 2 ? c.name : c.name.slice(0,3).toUpperCase()}
                                        </span>
                                     </div>
                                   )
                                })}
                             </div>
                         )}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
      </div>
    </div>
  );
}