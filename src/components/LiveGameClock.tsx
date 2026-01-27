// components/LiveGameClock.tsx
import React from 'react';
import { EspnScoreData } from '@/hooks/useEspnScores'; // Import your interface

interface LiveGameClockProps {
  game: EspnScoreData | null | undefined;
}

export default function LiveGameClock({ game }: LiveGameClockProps) {
  // 1. Safety Check
  if (!game) return <div className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Offline</div>;
  
  // 2. Use the Clean Data from your Hook
  const { isLive, clock, period, statusDetail } = game;

  // 3. If Game is not live (Final or Scheduled), show status text
  if (!isLive) {
     return (
       <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
         <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{statusDetail}</span>
       </div>
     );
  }

  // 4. Live Clock UI
  return (
    <div className="flex items-center gap-2 bg-black/60 border border-red-500/30 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.2)] mb-2 animate-in fade-in">
      {/* Pulsing Dot */}
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 font-mono font-bold text-xs text-white">
        <span className="text-red-400">Q{period}</span>
        <span className="text-white/20">•</span>
        <span>{clock}</span>
      </div>
    </div>
  );
}