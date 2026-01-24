"use client";

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// ... (Types and helpers remain the same) ...
type SquareClaim = { uid: string; name: string; claimedAt: number; };
interface GridProps {
  rows: number[]; cols: number[]; squares: Record<string, SquareClaim[]>;
  onSquareClick: (row: number, col: number) => void;
  teamA: string; teamB: string; teamALogo?: string; teamBLogo?: string;
  isScrambled?: boolean; winningCell?: { row: number; col: number } | null; selectedCell?: { row: number; col: number } | null;
}

function hashToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash % 360;
}

const USER_COLOR_CLASSES = [
  { bg: 'bg-rose-900/60', text: 'text-rose-100', border: 'border-rose-500/60' },
  { bg: 'bg-red-900/60', text: 'text-red-100', border: 'border-red-500/60' },
  { bg: 'bg-orange-900/60', text: 'text-orange-100', border: 'border-orange-500/60' },
  { bg: 'bg-amber-900/60', text: 'text-amber-100', border: 'border-amber-500/60' },
  { bg: 'bg-yellow-900/60', text: 'text-yellow-100', border: 'border-yellow-500/60' },
  { bg: 'bg-lime-900/60', text: 'text-lime-100', border: 'border-lime-500/60' },
  { bg: 'bg-green-900/60', text: 'text-green-100', border: 'border-green-500/60' },
  { bg: 'bg-emerald-900/60', text: 'text-emerald-100', border: 'border-emerald-500/60' },
  { bg: 'bg-teal-900/60', text: 'text-teal-100', border: 'border-teal-500/60' },
  { bg: 'bg-cyan-900/60', text: 'text-cyan-100', border: 'border-cyan-500/60' },
  { bg: 'bg-sky-900/60', text: 'text-sky-100', border: 'border-sky-500/60' },
  { bg: 'bg-blue-900/60', text: 'text-blue-100', border: 'border-blue-500/60' },
  { bg: 'bg-indigo-900/60', text: 'text-indigo-100', border: 'border-indigo-500/60' },
  { bg: 'bg-violet-900/60', text: 'text-violet-100', border: 'border-violet-500/60' },
  { bg: 'bg-purple-900/60', text: 'text-purple-100', border: 'border-purple-500/60' },
  { bg: 'bg-fuchsia-900/60', text: 'text-fuchsia-100', border: 'border-fuchsia-500/60' },
  { bg: 'bg-pink-900/60', text: 'text-pink-100', border: 'border-pink-500/60' },
];

function classesForUid(uid: string) {
  const idx = hashToHue(uid) % USER_COLOR_CLASSES.length;
  return USER_COLOR_CLASSES[idx];
}

export default function Grid({ rows, cols, squares, onSquareClick, teamA, teamB, teamALogo, teamBLogo, isScrambled, winningCell, selectedCell }: GridProps) {
  const showLogos = !isScrambled;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center pt-8 pl-8 md:pt-10 md:pl-12">

      {/* TEAM B HEADER (Top) */}
      <div className="absolute top-2 left-0 right-0 pl-8 md:pl-12 flex items-center justify-center gap-3 z-30 pointer-events-none">
        {showLogos && teamBLogo && (
          <div className="relative w-8 h-8 md:w-12 md:h-12 shrink-0">
            <Image src={teamBLogo} alt={teamB} fill className="object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
          </div>
        )}
        <span className="text-center font-black text-2xl md:text-4xl text-cyan-400 uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
          {teamB}
        </span>
      </div>

      {/* TEAM A HEADER (Left) */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center z-30 pointer-events-none -translate-x-1/4">
        <div className="transform -rotate-90 flex items-center gap-3 whitespace-nowrap origin-center">
            {/* FIX: Removed 'rotate-90' here. Now it rotates WITH the container (-90deg), pointing left. */}
            {showLogos && teamALogo && (
                <div className="relative w-8 h-8 md:w-12 md:h-12 shrink-0">
                  <Image src={teamALogo} alt={teamA} fill className="object-contain drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
                </div>
            )}
            <span className="font-black text-2xl md:text-4xl text-pink-500 uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(236,72,153,0.6)]">
              {teamA}
            </span>
        </div>
      </div>

      {/* GRID */}
      <div className="relative w-full aspect-square rounded-xl shadow-2xl bg-slate-700/50 border border-slate-700/50 p-0.5 md:p-1">
        <div className="grid grid-cols-11 w-full h-full bg-slate-900">
            <div className="aspect-square bg-black shadow-md border-b border-r border-white/10"></div>
            {cols.map((num) => (
              <div key={`col-${num}`} className="aspect-square flex items-center justify-center bg-black border-b border-r border-white/10 text-cyan-400 font-black text-lg sm:text-xl md:text-3xl shadow-sm">
                {num}
              </div>
            ))}
            {rows.map((rowNum, rowIndex) => (
              <React.Fragment key={`row-${rowNum}`}>
                <div className="aspect-square flex items-center justify-center bg-black border-r border-b border-white/10 text-pink-500 font-black text-lg sm:text-xl md:text-3xl shadow-sm">
                  {rowNum}
                </div>
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
                        'aspect-square relative w-full h-full border-[0.5px] border-white/5 overflow-hidden group',
                        claims.length > 0 ? 'bg-slate-800/60' : 'bg-slate-900/40 hover:bg-slate-800/80',
                        isFull ? 'cursor-not-allowed' : 'cursor-pointer',
                        isWinner && 'ring-2 ring-yellow-400 bg-yellow-400/20 animate-pulse z-20',
                        isSelected && !isWinner && 'ring-2 ring-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.4)] z-20'
                      )}
                    >
                      {claims.length === 0 ? (
                          <div className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-cyan-500/50 transition-colors" />
                      ) : claims.length === 1 ? (
                        <div className={cn("w-full h-full flex items-center justify-center p-0.5", classesForUid(claims[0].uid).bg)}>
                           <span className={cn("text-[10px] sm:text-xs font-black truncate max-w-full px-1", classesForUid(claims[0].uid).text)}>
                             {claims[0].name}
                           </span>
                        </div>
                      ) : (
                        <div className="w-full h-full grid grid-cols-2 grid-rows-2 content-center items-center">
                          {claims.slice(0, 4).map((c) => (
                            <div key={c.uid} className={cn("flex items-center justify-center text-[7px] sm:text-[9px] font-bold h-full leading-none truncate px-0.5", classesForUid(c.uid).bg, classesForUid(c.uid).text)}>
                              {c.name.substring(0, 3)}
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