import React from 'react';
import { EspnScoreData } from '@/hooks/useEspnScores';

interface LiveGameClockProps {
  game: EspnScoreData | null | undefined;
}

export default function LiveGameClock({ game }: LiveGameClockProps) {
  // Debug log to see what data we're receiving
  if (game) {
    console.log('[LiveGameClock] Game Data:', {
      name: game.name,
      isLive: game.isLive,
      period: game.period,
      clock: game.clock,
      status: game.status,
      statusDetail: game.statusDetail,
    });
  }

  if (!game) return <div className="text-slate-500 text-[10px] font-bold tracking-widest uppercase">Offline</div>;
  
  const { isLive, clock, period, statusDetail, league } = game;

  // STREET SMART LOGIC: 
  // Soccer uses "1st/2nd". American Sports use "Q1/Q2".
  const soccerLeagues = ['EPL', 'UCL', 'ESP', 'GER', 'ITA', 'MEX', 'MLS'];
  const isSoccer = soccerLeagues.includes(league);

  const getPeriodLabel = () => {
      if (isSoccer) {
          if (period === 1) return "1st";
          if (period === 2) return "2nd";
          if (period > 2) return "ET"; // Extra Time
          return "Half";
      }
      // Default for NFL/NBA
      return `Q${period}`;
  };

  // If Game is not live (Final or Scheduled), show status text
  if (!isLive) {
     return (
       <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
         <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest text-shadow-sm">{statusDetail}</span>
       </div>
     );
  }

  return (
    <div className="flex items-center gap-2 bg-red-500/10 backdrop-blur-md border border-red-500/30 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)] mb-2 animate-in fade-in">
      {/* Pulsing Dot */}
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_5px_#ef4444]"></span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1 font-mono font-bold text-xs text-white">
        <span className="text-red-300 uppercase drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]">{getPeriodLabel()}</span>
        <span className="text-white/20">•</span>
        <span className="text-white/90 drop-shadow-sm">{clock}</span>
      </div>
    </div>
  );
}