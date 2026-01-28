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

// --- STYLE SET 1: GLASS (For OTHERS - The "Fun" Texture) ---
const GLASS_THEMES = [
  { glass: 'bg-rose-500/20 border-rose-500/30 text-rose-300', ring: 'ring-rose-500' },
  { glass: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300', ring: 'ring-cyan-500' },
  { glass: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300', ring: 'ring-emerald-500' },
  { glass: 'bg-violet-500/20 border-violet-500/30 text-violet-300', ring: 'ring-violet-500' },
  { glass: 'bg-amber-500/20 border-amber-500/30 text-amber-300', ring: 'ring-amber-500' },
  { glass: 'bg-pink-500/20 border-pink-500/30 text-pink-300', ring: 'ring-pink-500' },
  { glass: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300', ring: 'ring-indigo-500' },
];

function getGlassTheme(uid: string) {
  return GLASS_THEMES[hashToHue(uid) % GLASS_THEMES.length];
}

// --- STYLE SET 2: SOLID (For ME - The "Hero" Look) ---
const SOLID_STYLES = [
  { bg: 'bg-rose-600', text: 'text-white' },
  { bg: 'bg-cyan-600', text: 'text-white' },
  { bg: 'bg-emerald-600', text: 'text-white' },
  { bg: 'bg-violet-600', text: 'text-white' },
  { bg: 'bg-amber-600', text: 'text-white' },
  { bg: 'bg-pink-600', text: 'text-white' },
  { bg: 'bg-indigo-600', text: 'text-white' },
];

function getSolidStyle(uid: string) {
  return SOLID_STYLES[hashToHue(uid) % SOLID_STYLES.length];
}

export default function Grid({ 
  rows, cols, squares, onSquareClick, 
  teamA, teamB, teamALogo, teamBLogo, 
  isScrambled, winningCell, selectedCell, 
  pendingIndices = [], currentUserId 
}: GridProps) {
  
  const showLogos = true;
  // Fallback for pending selections
  const myGlassTheme = currentUserId ? getGlassTheme(currentUserId) : GLASS_THEMES[6];
  const mySolidStyle = currentUserId ? getSolidStyle(currentUserId) : SOLID_STYLES[6];

  return (
    <div className="relative w-full h-full flex flex-col">

      {/* FLOATING LABELS (Unchanged) */}
      <div className="absolute top-0 left-[9%] right-0 h-[9%] z-40 flex items-center justify-center pointer-events-none">
         <div className="bg-black/80 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
            <span className="font-black text-[min(4vw,1rem)] md:text-xl text-cyan-400 uppercase tracking-widest leading-none drop-shadow-md">{teamB}</span>
            {showLogos && teamBLogo && <div className="relative w-4 h-4 md:w-6 md:h-6 shrink-0 opacity-90"><Image src={teamBLogo} alt={teamB} fill className="object-contain" /></div>}
         </div>
      </div>
      <div className="absolute left-0 top-[9%] bottom-0 w-[9%] z-40 flex items-center justify-center pointer-events-none">
         <div className="transform -rotate-90 bg-black/80 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10 flex items-center gap-2 shadow-xl origin-center whitespace-nowrap">
            <span className="font-black text-[min(4vw,1rem)] md:text-xl text-pink-500 uppercase tracking-widest leading-none drop-shadow-md">{teamA}</span>
            {showLogos && teamALogo && <div className="relative w-4 h-4 md:w-6 md:h-6 shrink-0 opacity-90 -rotate-90"><Image src={teamALogo} alt={teamA} fill className="object-contain" /></div>}
         </div>
      </div>

      <div className="w-full h-full grid grid-cols-11 grid-rows-11 bg-[#0B0C15] select-none">
            
            {/* CORNER */}
            <div className="col-span-1 row-span-1 bg-[#151725] border-r border-b border-white/10 flex items-center justify-center relative z-20"><div className="text-[8px] font-mono text-slate-500 font-bold">VS</div></div>

            {/* HEADERS */}
            {cols.map((num, i) => {
              const isHighlight = (winningCell && winningCell.col === i) || (selectedCell && selectedCell.col === i);
              return (
                <div key={`col-${i}`} className={cn("col-span-1 row-span-1 flex items-center justify-center border-r border-b border-white/10 relative overflow-hidden transition-all", isHighlight ? "bg-cyan-900/40 z-50 shadow-[inset_0_0_15px_rgba(34,211,238,0.3)]" : "bg-[#0B0C15]")}>
                   <span className={cn("font-black text-sm md:text-2xl z-20 transition-all", isScrambled ? (isHighlight ? "text-cyan-200 scale-125" : "text-cyan-500") : "text-slate-700 blur-[2px]")}>{isScrambled ? num : '?'}</span>
                </div>
              );
            })}
            {rows.map((rowNum, rowIndex) => {
              const isHighlight = (winningCell && winningCell.row === rowIndex) || (selectedCell && selectedCell.row === rowIndex);
              return (
                <React.Fragment key={`row-${rowIndex}`}>
                  <div className={cn("col-span-1 row-span-1 flex items-center justify-center border-r border-b border-white/10 relative overflow-hidden transition-all", isHighlight ? "bg-pink-900/40 z-50 shadow-[inset_0_0_15px_rgba(236,72,153,0.3)]" : "bg-[#0B0C15]")}>
                     <span className={cn("font-black text-sm md:text-2xl z-20 transition-all", isScrambled ? (isHighlight ? "text-pink-200 scale-125" : "text-pink-500") : "text-slate-700 blur-[2px]")}>{isScrambled ? rowNum : '?'}</span>
                  </div>

                  {/* GAME CELLS */}
                  {cols.map((colNum, colIndex) => {
                    const cellIndex = rowIndex * 10 + colIndex;
                    const key = `${rowIndex}-${colIndex}`;
                    const claims = (squares[key] ?? []).slice(0, 10);
                    
                    const isWinner = !!winningCell && winningCell.row === rowIndex && winningCell.col === colIndex;
                    const isSelected = !!selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex;
                    const isPending = pendingIndices.includes(cellIndex);
                    
                    const isMe = currentUserId && claims.some(c => c.uid === currentUserId);

                    const isCrosshair = (!!winningCell && (winningCell.row === rowIndex || winningCell.col === colIndex)) || 
                                        (!!selectedCell && (selectedCell.row === rowIndex || selectedCell.col === colIndex));

                    // --- CONTAINER STYLING ---
                    let cellStyle = "bg-transparent hover:bg-white/5"; 
                    
                    if (isWinner) {
                         // WINNER: Solid Gold Pulse
                         cellStyle = "z-30 ring-2 ring-yellow-400 bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.6)] animate-pulse";
                    } else if (isMe && claims.length > 0) {
                         // ME: SOLID COLOR (Pop)
                         const mySolid = getSolidStyle(currentUserId!);
                         cellStyle = `z-20 ring-1 ring-white/50 ${mySolid.bg} shadow-[0_0_15px_rgba(255,255,255,0.2)]`;
                    } else if (claims.length > 0) {
                         // OTHERS: GLASSY (Texture but not overwhelming)
                         // We use the first claim's theme
                         const glassTheme = getGlassTheme(claims[0].uid);
                         cellStyle = `${glassTheme.glass} border border-white/5 backdrop-blur-[1px]`;
                    } else if (isSelected) {
                         cellStyle = "z-20 ring-1 ring-cyan-400 bg-cyan-900/30";
                    } else if (isCrosshair) {
                         cellStyle = "bg-white/5";
                    }

                    // Pending Override
                    if (isPending) {
                        cellStyle = `ring-inset ring-2 ${myGlassTheme.ring} bg-black/50 animate-pulse z-30`;
                    }

                    return (
                      <div
                        key={key}
                        onClick={() => onSquareClick(rowIndex, colIndex)}
                        className={cn(
                          'col-span-1 row-span-1 relative border-r border-b border-white/5 overflow-hidden transition-all duration-75 cursor-pointer',
                          cellStyle
                        )}
                      >
                          {/* PENDING TEXT */}
                          {isPending && claims.length === 0 && (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className={cn("text-[min(3vw,12px)] font-black uppercase tracking-wider", myGlassTheme.glass.split(' ').pop())}>Pick</span>
                            </div>
                          )}

                          {/* NAMES RENDERER */}
                          {claims.length > 0 && (
                             <div className={cn(
                               "w-full h-full grid gap-[0.5px]",
                               claims.length === 1 ? "grid-cols-1 grid-rows-1" :
                               claims.length === 2 ? "grid-cols-2 grid-rows-1" :
                               claims.length <= 4 ? "grid-cols-2 grid-rows-2" :
                               "grid-cols-3 grid-rows-3"
                             )}>
                                {claims.map((c, i) => {
                                   const isThisMe = currentUserId && c.uid === currentUserId;
                                   
                                   // TEXT COLORS
                                   let textClass = "";
                                   if (isWinner) textClass = "text-black";
                                   else if (isThisMe) textClass = "text-white drop-shadow-md";
                                   else {
                                      // Others get colored text matching their glass theme
                                      const theme = getGlassTheme(c.uid);
                                      textClass = theme.glass.split(' ').pop() || "text-slate-300";
                                   }

                                   return (
                                     <div key={i} className="flex items-center justify-center overflow-hidden w-full h-full bg-transparent">
                                        <span className={cn(
                                          "font-bold leading-none truncate px-0.5",
                                          textClass,
                                          claims.length === 1 ? "text-[min(3.5vw,14px)]" : 
                                          claims.length <= 4 ? "text-[min(2.5vw,10px)]" : 
                                          "text-[min(2vw,8px)]"
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