import React from 'react';

interface ScoreboardProps {
  scores: {
    q1: { home: number; away: number };
    q2: { home: number; away: number };
    q3: { home: number; away: number };
    final: { home: number; away: number };
  };
  teamA: string; // Vertical Team
  teamB: string; // Horizontal Team
}

export default function Scoreboard({ scores, teamA, teamB }: ScoreboardProps) {
  
  return (
    <div className="w-full max-w-md mx-auto mb-2">
      <div className="grid grid-cols-4 gap-1">
        {/* Quarter 1 */}
        <div className="bg-slate-900/50 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center">
          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">Q1</span>
          <div className="text-white font-mono leading-none text-sm mt-1">
            <span className="text-pink-400">{scores?.q1?.home ?? '-'}</span>
            <span className="mx-1 text-slate-500">:</span>
            <span className="text-cyan-400">{scores?.q1?.away ?? '-'}</span>
          </div>
        </div>

        {/* Quarter 2 */}
        <div className="bg-slate-900/50 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center">
          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">Q2</span>
          <div className="text-white font-mono leading-none text-sm mt-1">
            <span className="text-pink-400">{scores?.q2?.home ?? '-'}</span>
            <span className="mx-1 text-slate-500">:</span>
            <span className="text-cyan-400">{scores?.q2?.away ?? '-'}</span>
          </div>
        </div>

        {/* Quarter 3 */}
        <div className="bg-slate-900/50 border border-white/10 rounded-lg p-2 flex flex-col items-center justify-center">
          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">Q3</span>
          <div className="text-white font-mono leading-none text-sm mt-1">
            <span className="text-pink-400">{scores?.q3?.home ?? '-'}</span>
            <span className="mx-1 text-slate-500">:</span>
            <span className="text-cyan-400">{scores?.q3?.away ?? '-'}</span>
          </div>
        </div>

        {/* Final - Special Styling */}
        <div className="bg-slate-900/80 border border-pink-500/50 rounded-lg p-2 flex flex-col items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 bg-pink-500/10" />
          <span className="text-[9px] text-pink-400 font-bold uppercase tracking-widest relative z-10">FINAL</span>
          <div className="text-white font-mono leading-none text-sm mt-1 relative z-10">
            <span className="text-pink-400">{scores?.final?.home ?? '-'}</span>
            <span className="mx-1 text-slate-500">:</span>
            <span className="text-cyan-400">{scores?.final?.away ?? '-'}</span>
          </div>
        </div>
      </div>
      
      {/* Legend (Optional - Helps users know which color is which team) */}
      <div className="flex justify-between px-2 mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">
        <span className="text-pink-500">{teamA}</span>
        <span className="text-cyan-500">{teamB}</span>
      </div>
    </div>
  );
}