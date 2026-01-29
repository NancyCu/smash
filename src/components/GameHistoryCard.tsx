"use client";

import React from "react";
import Link from "next/link";
import { Trophy, ChevronRight, Ghost } from "lucide-react";
import { getUserColor } from "@/utils/colors";
import type { GameData, SquareData } from "@/context/GameContext";

interface QuarterResult {
  key: string;
  label: string;
  scoreA: number;
  scoreB: number;
  winners: SquareData[] | null;
  payout: number;
  isRollover: boolean;
  baseAmount?: number;
  rolloverAmount?: number;
}

interface GameHistoryCardProps {
  game: GameData;
  quarterResults?: QuarterResult[];
}

export default function GameHistoryCard({ game, quarterResults }: GameHistoryCardProps) {
  // Format date from createdAt
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown Date";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const day = date.getDate();
    const time = date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${month} ${day} • ${time}`;
  };

  // Generate team logo URL from ESPN CDN (fallback approach)
  const getTeamLogoUrl = (teamName: string) => {
    // Common team name to ESPN ID mappings for major leagues
    const teamMappings: Record<string, string> = {
      // NFL
      'chiefs': 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
      'eagles': 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
      'bills': 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
      '49ers': 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
      'cowboys': 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
      'ravens': 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
      'lions': 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png',
      'packers': 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png',
      // NBA
      'lakers': 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
      'celtics': 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png',
      'cavaliers': 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png',
      'warriors': 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png',
      'nuggets': 'https://a.espncdn.com/i/teamlogos/nba/500/den.png',
      'heat': 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png',
      'knicks': 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png',
      'bulls': 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png',
      'mavericks': 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png',
      'timberwolves': 'https://a.espncdn.com/i/teamlogos/nba/500/min.png',
      'thunder': 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png',
      'rockets': 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png',
      'grizzlies': 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png',
      'clippers': 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png',
      'suns': 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png',
      'spurs': 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png',
      'nets': 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png',
      'raptors': 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png',
      'jazz': 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png',
      'kings': 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png',
      'pelicans': 'https://a.espncdn.com/i/teamlogos/nba/500/no.png',
      'hawks': 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png',
      'magic': 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png',
      'pacers': 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png',
      'bucks': 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png',
      'pistons': 'https://a.espncdn.com/i/teamlogos/nba/500/det.png',
      'hornets': 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png',
      'wizards': 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png',
      '76ers': 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png',
      'trail blazers': 'https://a.espncdn.com/i/teamlogos/nba/500/por.png',
      'blazers': 'https://a.espncdn.com/i/teamlogos/nba/500/por.png',
      // Soccer
      'ajax': 'https://a.espncdn.com/i/teamlogos/soccer/500/139.png',
      'olympiacos': 'https://a.espncdn.com/i/teamlogos/soccer/500/319.png',
    };
    
    const normalized = teamName.toLowerCase().trim();
    for (const [key, url] of Object.entries(teamMappings)) {
      if (normalized.includes(key)) return url;
    }
    return "";
  };

  const teamALogo = getTeamLogoUrl(game.teamA || "");
  const teamBLogo = getTeamLogoUrl(game.teamB || "");

  // Calculate total pot
  const totalPot = game.totalPot || game.pot || (Object.keys(game.squares || {}).length * game.price);

  // Default quarter data if not provided
  const defaultQuarters: QuarterResult[] = [
    { key: "q1", label: "Q1", scoreA: 0, scoreB: 0, winners: null, payout: totalPot * 0.1, isRollover: false },
    { key: "q2", label: "HALF", scoreA: 0, scoreB: 0, winners: null, payout: totalPot * 0.2, isRollover: false },
    { key: "q3", label: "Q3", scoreA: 0, scoreB: 0, winners: null, payout: totalPot * 0.2, isRollover: false },
    { key: "final", label: "FINAL", scoreA: 0, scoreB: 0, winners: null, payout: totalPot * 0.5, isRollover: false },
  ];

  const quarters = quarterResults || defaultQuarters;

  return (
    <Link href={`/game/${game.id}`} className="block group">
      <div className="w-full mb-6 p-5 rounded-2xl bg-[#0B0C15]/60 backdrop-blur-xl border border-white/10 hover:border-[#22d3ee]/50 transition-all duration-300 shadow-lg shadow-black/40 relative overflow-hidden isolate">
        {/* Background Watermarks */}
        <div className="absolute inset-0 z-0 flex items-center justify-between opacity-[0.07] pointer-events-none select-none">
          {/* Team A Logo (Left) - Huge and cropped */}
          {teamALogo && (
            <img 
              src={teamALogo} 
              alt="" 
              className="h-[150%] w-auto object-contain -translate-x-1/4 mix-blend-overlay grayscale contrast-125" 
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          )}
          
          {/* VS Bolt (Center decoration) */}
          <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent transform skew-x-12" />

          {/* Team B Logo (Right) - Huge and cropped */}
          {teamBLogo && (
            <img 
              src={teamBLogo} 
              alt="" 
              className="h-[150%] w-auto object-contain translate-x-1/4 mix-blend-overlay grayscale contrast-125" 
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          )}
        </div>
        
        {/* Gradient Overlay to fade them out */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0B0C15]/40 via-transparent to-[#0B0C15]/80" />
        
        {/* Holographic shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer pointer-events-none z-[1]" />
        
        {/* Content Layer */}
        <div className="relative z-10">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col">
            {/* Matchup Title */}
            <h3 className="text-xl font-black italic text-white tracking-tight">
              {game.teamA} vs {game.teamB}
            </h3>
            {/* Total Pot Badge */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[#db2777] font-bold text-lg">${totalPot}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Total Pot</span>
            </div>
          </div>
          
          {/* Date/Time */}
          <div className="text-right">
            <span className="text-xs font-mono text-white/50">{formatDate(game.createdAt)}</span>
            {game.status === "final" && (
              <div className="mt-1">
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold uppercase tracking-wider border border-green-500/30">
                  Complete
                </span>
              </div>
            )}
          </div>
        </div>

          {/* Quarterly Breakdown Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {quarters.map((q, qIndex) => {
            const hasRollover = q.rolloverAmount && q.rolloverAmount > 0;
            const isRecipient = q.winners && q.winners.length > 0 && hasRollover;
            
            return (
            <div
              key={q.key}
              className={`bg-white/5 rounded-lg p-3 flex flex-col items-center justify-center transition-colors relative ${
                q.key === "final" 
                  ? "border-2 border-yellow-500/40 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.4)]" 
                  : q.isRollover 
                    ? "border border-amber-500/20 bg-amber-500/5" 
                    : "border border-white/5"
              }`}
            >
              {/* Connector Arrow - Shows flow to next quarter */}
              {q.isRollover && qIndex < quarters.length - 1 && (
                <div className="absolute -right-[14px] top-1/2 -translate-y-1/2 z-10">
                  <div className="w-3 h-3 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]">
                    →
                  </div>
                </div>
              )}
              
              {/* Period Label */}
              <span className={`text-[10px] uppercase tracking-widest mb-1 font-bold ${
                q.key === "final" ? "text-yellow-400" : q.isRollover ? "text-amber-500/60" : "text-white/40"
              }`}>
                {q.label}
              </span>
              
              {/* Score */}
              <span className="text-sm font-mono text-white mb-1">
                {q.scoreA} - {q.scoreB}
              </span>
              
              {/* Winner, Rollover, or Recipient */}
              {q.isRollover ? (
                <div className="flex flex-col items-center">
                  <span className="text-amber-500 font-bold text-[10px] animate-pulse uppercase">
                    Rollover
                  </span>
                  <span className="text-amber-400/70 text-[9px] font-mono">
                    +${q.payout.toFixed(0)}
                  </span>
                </div>
              ) : isRecipient ? (
                <div className="flex flex-col items-center w-full">
                  <Trophy className="w-3 h-3 text-yellow-400 mb-1" />
                  <span className="text-[#22d3ee] font-bold text-xs truncate max-w-[80px] mb-1">
                    {q.winners?.[0]?.displayName || "Winner"}
                  </span>
                  <div className="text-[8px] text-green-400 font-bold">
                    +${q.rolloverAmount} BONUS
                  </div>
                </div>
              ) : q.winners && q.winners.length > 0 ? (
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  <span className="text-[#22d3ee] font-bold text-xs drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] truncate max-w-[80px]">
                    {q.winners[0]?.displayName || "Winner"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Ghost className="w-3 h-3 text-white/30" />
                  <span className="text-white/30 text-[10px]">Pending</span>
                </div>
              )}
            </div>
            );
          })}
        </div>

          {/* Footer with View Arrow */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-3">
            {/* Winner Avatars */}
            {quarters.some(q => q.winners && q.winners.length > 0) && (
              <div className="flex -space-x-2">
                {quarters
                  .filter(q => q.winners && q.winners.length > 0)
                  .slice(0, 4)
                  .map((q, idx) => {
                    const winner = q.winners?.[0];
                    const color = getUserColor(winner?.displayName || "");
                    return (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#0B0C15] shadow-md"
                        style={{ backgroundColor: color }}
                        title={winner?.displayName}
                      >
                        {winner?.displayName?.[0] || "?"}
                      </div>
                    );
                  })}
              </div>
            )}
            <span className="text-[10px] text-white/40 font-medium uppercase tracking-wide">
              {Object.keys(game.squares || {}).length} Squares Claimed
            </span>
          </div>
          
            {/* View Grid Arrow */}
            <div className="flex items-center gap-1 text-white/40 group-hover:text-[#22d3ee] transition-colors">
              <span className="text-[10px] font-bold uppercase tracking-wider">View Grid</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
