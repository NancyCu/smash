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

const QStat = ({ label, h, a }: { label: string; h: number; a: number }) => (
  <div className="flex flex-col items-center px-3 border-r border-white/10 last:border-0">
    <span className="text-[9px] uppercase font-bold text-white/60 tracking-widest leading-none mb-1 shadow-[0_0_2px_rgba(0,0,0,0.5)]">
      {label}
    </span>
    <div className="text-xs font-bold text-white font-mono leading-none drop-shadow-md">
      <span className="text-cyan-200">{a}</span>
      <span className="mx-0.5 text-white/40">:</span>
      <span className="text-pink-200">{h}</span>
    </div>
  </div>
);

export default function Scoreboard({ scores, teamA, teamB }: ScoreboardProps) {
  const currentHome = scores.final.home;
  const currentAway = scores.final.away;

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      
      {/* 1. MATCHUP & TOTAL SCORE CONTAINER */}
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-lg flex flex-col items-center justify-center gap-1 relative overflow-hidden ring-1 ring-white/10">
         {/* Glow effects */}
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400/50 via-white/50 to-pink-400/50"></div>
         
         {/* Team Names */}
         <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-white/80 shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
            <span className="text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">{teamB}</span>
            <span className="text-white/40 font-thin">VS</span>
            <span className="text-pink-100 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">{teamA}</span>
         </div>

         {/* BIG SCORES */}
        <div className="flex items-center gap-5 mt-0">
          <span className="text-3xl font-black text-cyan-200 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] leading-none stroke-cyan-500">
              {currentAway}
            </span>
            <div className="h-8 w-px bg-white/20 rotate-12"></div>
          <span className="text-3xl font-black text-pink-200 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] leading-none">
              {currentHome}
            </span>
         </div>
      </div>

      {/* 2. QUARTER STATS CONTAINER */}
      <div className="w-full max-w-xs bg-white/5 backdrop-blur-md border border-white/10 rounded-xl py-1.5 px-3 shadow-md flex items-center justify-center gap-1">
        <QStat label="Q1" h={scores.q1.home} a={scores.q1.away} />
        <QStat label="Q2" h={scores.q2.home} a={scores.q2.away} />
        <QStat label="Q3" h={scores.q3.home} a={scores.q3.away} />
      </div>

    </div>
  );
}