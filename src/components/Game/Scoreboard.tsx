"use client";

import React from "react";

interface ScoreboardProps {
  scores: {
    q1: { home: number; away: number };
    q2: { home: number; away: number };
    q3: { home: number; away: number };
    final: { home: number; away: number };
  };
  teamA: string;
  teamB: string;
}

// FIX: Define helper components OUTSIDE the main component
const QStat = ({ label, h, a }: { label: string; h: number; a: number }) => (
  <div className="flex flex-col items-center px-2 sm:px-3 border-r border-white/10 last:border-0">
    <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-500 tracking-widest leading-none mb-1">
      {label}
    </span>
    <div className="text-[10px] sm:text-xs font-bold text-white font-mono leading-none">
      <span className="text-cyan-400">{a}</span>
      <span className="mx-0.5 text-slate-600">:</span>
      <span className="text-pink-500">{h}</span>
    </div>
  </div>
);

export default function Scoreboard({ scores, teamA, teamB }: ScoreboardProps) {
  // Calculate distinct total if needed
  const currentHome = scores.final.home;
  const currentAway = scores.final.away;

  return (
    <div className="w-full flex items-center justify-between bg-[#0B0C15]/90 border border-white/10 rounded-lg px-3 py-2 shadow-xl mb-4 backdrop-blur-md">
      
      {/* 1. LEFT: Matchup Text */}
      <div className="flex items-center gap-2 border-r border-white/10 pr-3 mr-3 shrink-0">
        <span className="text-[10px] sm:text-xs font-black text-cyan-500 uppercase tracking-widest truncate max-w-[60px] sm:max-w-[100px] text-right">{teamB}</span>
        <span className="text-[8px] text-slate-600 font-bold">VS</span>
        <span className="text-[10px] sm:text-xs font-black text-pink-500 uppercase tracking-widest truncate max-w-[60px] sm:max-w-[100px] text-left">{teamA}</span>
      </div>

      {/* 2. CENTER: THE BIG SCORE */}
      <div className="flex-1 flex items-center justify-center gap-3">
         <span className="text-xl sm:text-2xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
            {currentAway}
         </span>
         <span className="h-4 w-px bg-white/10"></span>
         <span className="text-xl sm:text-2xl font-black text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">
            {currentHome}
         </span>
      </div>

      {/* 3. RIGHT: Quarter Stats */}
      <div className="flex items-center gap-0 shrink-0">
        <QStat label="Q1" h={scores.q1.home} a={scores.q1.away} />
        <QStat label="Q2" h={scores.q2.home} a={scores.q2.away} />
        <QStat label="Q3" h={scores.q3.home} a={scores.q3.away} />
      </div>
    </div>
  );
}