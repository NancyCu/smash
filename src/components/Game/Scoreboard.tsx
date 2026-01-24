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
  <div className="flex flex-col items-center px-3 border-r border-white/5 last:border-0">
    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest leading-none mb-1">
      {label}
    </span>
    <div className="text-xs font-bold text-white font-mono leading-none">
      <span className="text-cyan-400">{a}</span>
      <span className="mx-0.5 text-slate-700">:</span>
      <span className="text-pink-500">{h}</span>
    </div>
  </div>
);

export default function Scoreboard({ scores, teamA, teamB }: ScoreboardProps) {
  const currentHome = scores.final.home;
  const currentAway = scores.final.away;

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      
      {/* 1. MATCHUP & TOTAL SCORE CONTAINER */}
      <div className="w-full max-w-sm bg-[#121421] border border-white/10 rounded-2xl p-2 shadow-lg flex flex-col items-center justify-center gap-1 relative overflow-hidden">
         {/* Glow effects */}
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/20 via-transparent to-pink-500/20"></div>
         
         {/* Team Names */}
         <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-slate-400">
            <span className="text-cyan-500 drop-shadow-sm">{teamB}</span>
            <span className="text-slate-700">VS</span>
            <span className="text-pink-500 drop-shadow-sm">{teamA}</span>
         </div>

         {/* BIG SCORES */}
        <div className="flex items-center gap-5 mt-0">
          <span className="text-3xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] leading-none">
              {currentAway}
            </span>
            <div className="h-8 w-px bg-white/5 rotate-12"></div>
          <span className="text-3xl font-black text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.4)] leading-none">
              {currentHome}
            </span>
         </div>
      </div>

      {/* 2. QUARTER STATS CONTAINER */}
      <div className="w-full max-w-xs bg-[#121421]/80 backdrop-blur-md border border-white/5 rounded-xl py-1.5 px-3 shadow-md flex items-center justify-center gap-1">
        <QStat label="Q1" h={scores.q1.home} a={scores.q1.away} />
        <QStat label="Q2" h={scores.q2.home} a={scores.q2.away} />
        <QStat label="Q3" h={scores.q3.home} a={scores.q3.away} />
      </div>

    </div>
  );
}