'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Ticket } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { GameData } from '@/context/GameContext';

interface ActiveGame extends Partial<GameData> {
  id: string;
  name: string;
  teamA?: string;
  teamB?: string;
  pot?: number;
  totalPot?: number;
  playerIds?: string[];
  status?: 'open' | 'active' | 'final';
  createdAt?: any;
  startTime?: string; // From ESPN integration
  isLive?: boolean; // From ESPN integration
}

interface BetTickerProps {
  games?: ActiveGame[];
}

export default function BetTicker({ games = [] }: BetTickerProps) {
  const [isCompact, setIsCompact] = useState(true);
  const { user } = useAuth();
  
  // Sort games by start time (earliest first)
  const sortedGames = useMemo(() => {
    if (!games || games.length === 0) return [];
    
    return [...games].sort((a, b) => {
      const timeA = a.startTime ? new Date(a.startTime).getTime() : 
      a.createdAt?.toDate?.() ? new Date(a.createdAt.toDate()).getTime() : 
      0;
      const timeB = b.startTime ? new Date(b.startTime).getTime() : 
      b.createdAt?.toDate?.() ? new Date(b.createdAt.toDate()).getTime() : 
      0;
      return timeA - timeB;
    });
  }, [games]);
  
  // Helper to check if user is participating
  const isUserParticipating = (game: ActiveGame): boolean => {
    if (!user || !game.playerIds) return false;
    return game.playerIds.includes(user.uid);
  };
  
  // Helper to check if game is live
  const isGameLive = (game: ActiveGame): boolean => {
    return game.isLive === true || game.status === 'active';
  };
  
  if (sortedGames.length === 0) return null;
  
  return (
    <div 
      id="tour-bet-ticker" // <--- ADD THIS ID HERE
    className="w-full flex flex-col gap-2 mb-2 transition-all duration-300 ease-in-out">
      {/* Header Row: Title + Toggle */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[#22d3ee] text-xs font-bold tracking-widest uppercase opacity-80 flex items-center gap-2">
          <Ticket className="w-3 h-3" /> Active Games
        </h3>
        <button
          onClick={() => setIsCompact(!isCompact)}
          className="text-white/50 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
          aria-label={isCompact ? 'Expand ticker' : 'Collapse ticker'}
          >
          {isCompact ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Scrollable Container */}
      <div 
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {sortedGames.map((game) => {
          const isParticipating = isUserParticipating(game);
          const isLive = isGameLive(game);
          const showLiveIndicator = isLive && isParticipating;
          const gamePot = game.totalPot || game.pot || 0;
          const gameTitle = game.name || `${game.teamA || 'Team A'} vs ${game.teamB || 'Team B'}`;
          
          return (
            <div
            key={game.id}
            className={`
              relative flex-shrink-0 transition-all duration-300 ease-spring 
              border backdrop-blur-sm snap-start
              ${isParticipating 
                ? 'border-[#22d3ee]/60 bg-[#22d3ee]/5' 
                : 'border-white/10 bg-white/5'
              }
              ${isCompact 
                ? 'h-9 px-3 flex items-center gap-3 min-w-fit hover:border-[#22d3ee]/50 rounded-xl' 
                : 'h-24 w-40 p-3 flex flex-col justify-between hover:bg-white/10 rounded-xl'
              }
              `}
              >
              {/* Compact Content (Single Line) */}
              {isCompact ? (
                <>
                  <span className="text-[10px] font-bold text-white truncate max-w-[120px]">
                    {gameTitle}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {/* Pot Amount */}
                    <span className={`text-[10px] font-mono ${gamePot > 0 ? 'text-[#22d3ee]' : 'text-white/50'}`}>
                      ${gamePot}
                    </span>
                    
                    {/* Live & Yours Indicator */}
                    {showLiveIndicator && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_#22c55e]"></span>
                      </span>
                    )}
                    
                    {/* YOU Badge */}
                    {isParticipating && (
                      <span className="text-[9px] font-bold text-[#22d3ee] px-1.5 py-0.5 rounded bg-[#22d3ee]/20 border border-[#22d3ee]/30">
                        YOU
                      </span>
                    )}
                  </div>
                </>
              ) : (
                /* Expanded Content (Full Card) */
                <>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-white leading-tight line-clamp-2 flex-1">
                        {gameTitle}
                      </span>
                      
                      {/* Live & Yours Indicator (Expanded) */}
                      {showLiveIndicator && (
                        <span className="relative flex h-2.5 w-2.5 flex-shrink-0 mt-0.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                        </span>
                      )}
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isParticipating && (
                        <span className="text-[9px] font-bold text-[#22d3ee] px-1.5 py-0.5 rounded bg-[#22d3ee]/20 border border-[#22d3ee]/30">
                          YOU
                        </span>
                      )}
                      {isLive && (
                        <span className="text-[9px] font-bold text-green-400 px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/30">
                          LIVE
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Pot Amount (Expanded) */}
                  <div className="mt-auto pt-2 border-t border-white/10">
                    <span className={`text-sm font-mono font-bold ${gamePot > 0 ? 'text-[#22d3ee]' : 'text-gray-400'}`}>
                      ${gamePot}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
