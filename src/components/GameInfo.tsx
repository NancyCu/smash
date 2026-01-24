"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, DollarSign, Users, Info, ChevronRight, Share2, Trash2 } from "lucide-react";
import { EspnScoreData } from "@/hooks/useEspnScores";

interface GameInfoProps {
  gameId?: string;
  gameName: string;
  host: string;
  pricePerSquare: number;
  totalPot: number;
  payouts: { label: string; amount: number }[];
  matchup: { teamA: string; teamB: string };
  scores?: { teamA: number; teamB: number };
  isAdmin?: boolean;
  onUpdateScores?: (teamA: number, teamB: number) => void;
  onManualPayout?: (teamA: number, teamB: number) => void;
  onDeleteGame?: () => void;
  onScrambleGridDigits?: () => void;
  onResetGridDigits?: () => void;
  isScrambled?: boolean;
  availableGames?: EspnScoreData[];
  eventName?: string;
  currentUserName?: string;
  currentUserRole?: string;

  eventLeague?: string;
  eventDate?: string;
  selectedEventId?: string;
  onSelectEvent?: (game: EspnScoreData | null) => void;
}

// SVG Icons
const FootballIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <path d="M12 2v20" />
    <path d="M2 12h20" />
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" className="opacity-0" />
    <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(45 12 12)" />
    <path d="M16.2 7.8l-8.4 8.4" />
    <path d="M10.8 7.2l3 3" />
    <path d="M8.4 9.6l3 3" />
    <path d="M6 12l3 3" />
    <path d="M12 6l3 3" />
  </svg>
);

const BasketballIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M5.65 17.65a22.13 22.13 0 0012.7 0" />
    <path d="M5.65 6.35a22.13 22.13 0 0112.7 0" />
    <path d="M12 2v20" />
    <path d="M2 12h20" />
  </svg>
);

const SoccerBallIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 7l-2.6 1.5.3 2.9 2.3 1.3 2.3-1.3.3-2.9L12 7z" />
    <path d="M12 7V3" />
    <path d="M9.4 8.5L7 5" />
    <path d="M14.6 8.5L17 5" />
    <path d="M9.7 11.4L7 13" />
    <path d="M14.3 11.4L17 13" />
    <path d="M12 12.7V16" />
  </svg>
);

const LeagueIcon = ({ league }: { league?: string }) => {
  if (!league) return <Trophy className="w-6 h-6 text-indigo-400" />;
  const l = league.toLowerCase();
  if (l.includes("nfl") || l.includes("football")) return <FootballIcon className="w-6 h-6 text-amber-600" />;
  if (l.includes("nba") || l.includes("basketball")) return <BasketballIcon className="w-6 h-6 text-orange-500" />;
  if (l.includes("soccer") || l.includes("mls")) return <SoccerBallIcon className="w-6 h-6 text-emerald-500" />;
  return <Trophy className="w-6 h-6 text-indigo-400" />;
};

export default function GameInfo({ gameId, gameName, host, pricePerSquare, totalPot, payouts, matchup, scores, isAdmin, onUpdateScores, onManualPayout, onDeleteGame, onScrambleGridDigits, onResetGridDigits, isScrambled, availableGames, eventName, eventLeague, eventDate, selectedEventId, onSelectEvent, currentUserName, currentUserRole }: GameInfoProps) {
  const [teamAScore, setTeamAScore] = useState(scores?.teamA ?? 0);
  const [teamBScore, setTeamBScore] = useState(scores?.teamB ?? 0);
  const [localEventId, setLocalEventId] = useState<string>(selectedEventId ?? "");
  
  // Track synced scores to update state when props change
  const [lastSynced, setLastSynced] = useState({ a: scores?.teamA, b: scores?.teamB });
  
  if (scores && (scores.teamA !== lastSynced.a || scores.teamB !== lastSynced.b)) {
    setLastSynced({ a: scores.teamA, b: scores.teamB });
    setTeamAScore(scores.teamA);
    setTeamBScore(scores.teamB);
  }

  const [timeUntilGame, setTimeUntilGame] = useState<number | null>(null);
  
  const isLiveSyncActive = !!selectedEventId;

  useEffect(() => {
    if (!scores) return;
    setTeamAScore(scores.teamA);
    setTeamBScore(scores.teamB);
  }, [scores?.teamA, scores?.teamB]);


  const handleShare = async () => {
    if (!gameId) return;
    const joinLink = typeof window !== 'undefined' ? `${window.location.origin}/?view=join&code=${gameId}` : ''; 
    const shareData = {
      title: `Join my Squares Game: ${gameName}`,
      text: `Join the pool! Entry: $${pricePerSquare}. Host: ${host}. Code: ${gameId}`,
      url: joinLink,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        alert("Game link copied to clipboard!"); 
      }
    } catch (err) { console.error("Error sharing:", err); }
  };

  const { nflGames, otherGames } = useMemo(() => {
    const base = availableGames ?? [];
    const filtered = base; // Show all games (including finished/post games)
    
    const nfl: EspnScoreData[] = [];
    const other: EspnScoreData[] = [];

    filtered.forEach((game) => {
      if (game.league?.toLowerCase().includes("nfl")) {
        nfl.push(game);
      } else {
        other.push(game);
      }
    });

    const sortByDate = (a: EspnScoreData, b: EspnScoreData) => new Date(a.date).getTime() - new Date(b.date).getTime();
    return { nflGames: nfl.sort(sortByDate), otherGames: other.sort(sortByDate) };
  }, [availableGames]);

  const allSelectableGames = [...nflGames, ...otherGames];

  const formatEventDate = (value?: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const handleEventChange = (gameId: string) => {
    const selected = allSelectableGames.find((game) => game.id === gameId);
    onSelectEvent?.(selected ?? null);
  };

  const currentEventLabel = eventName ? `${eventLeague ? `${eventLeague.toUpperCase()} · ` : ""}${eventName}` : `${matchup.teamA} @ ${matchup.teamB}`;

return (
    // FIX: Added 'h-full flex flex-col' to allow pushing content to the bottom
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl p-4 space-y-4 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 transition-colors duration-300 h-full flex flex-col">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{gameName}</h2>
          <p className="text-slate-500 dark:text-slate-400">Hosted by <span className="font-bold text-cyan-600 dark:text-cyan-400">@{host}</span></p>
          {(currentUserName || gameId) && (
            <div className="flex items-center gap-2 mt-2">
              {currentUserName && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">User</span>
                  <span className="font-semibold text-white selection:bg-indigo-500">{currentUserName}</span>
                  {currentUserRole && (
                    <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{currentUserRole}</span>
                  )}
                </div>
              )}
              {gameId && (
                <button 
                  onClick={handleShare}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 hover:text-white transition-colors"
                  aria-label="Share game"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
        <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
          <LeagueIcon league={eventLeague} />
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 border-b border-slate-200 dark:border-white/5 pb-4">
        {currentEventLabel}
        {eventDate && <span className="text-[9px] font-semibold ml-2 text-slate-600 dark:text-slate-400">{formatEventDate(eventDate)}</span>}
      </div>

      {/* --- SCROLLABLE CONTENT AREA (Scores, Inputs, Stats) --- */}
      <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* SCORES CARD */}
          {scores && (
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-inner">
               {/* ... (Keep existing Score Input logic) ... */}
               <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isLiveSyncActive ? "bg-red-500 animate-pulse" : "bg-slate-400"}`}></span>
                  {isLiveSyncActive ? "Live Score" : "Manual Score"}
                </span>
                {isLiveSyncActive && <span className="text-[9px] text-red-500 font-bold bg-red-100 dark:bg-red-500/10 px-2 py-0.5 rounded">Sync Active</span>}
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <div className="text-[10px] font-black text-slate-500 uppercase">{matchup.teamA.split(" ").pop()}</div>
                   <input title="Team A Score" type="number" min={0} className={`w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg font-black text-pink-600 dark:text-pink-500 text-2xl focus:ring-2 focus:ring-pink-500/50 outline-none transition-all ${isLiveSyncActive ? "opacity-50 cursor-not-allowed" : ""}`} value={teamAScore} onChange={(e) => setTeamAScore(Number(e.target.value))} disabled={!isAdmin || isLiveSyncActive} />
                 </div>
                 <div>
                   <div className="text-[10px] font-black text-slate-500 uppercase">{matchup.teamB.split(" ").pop()}</div>
                   <input title="Team B Score" type="number" min={0} className={`w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-lg font-black text-cyan-600 dark:text-cyan-500 text-2xl focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all ${isLiveSyncActive ? "opacity-50 cursor-not-allowed" : ""}`} value={teamBScore} onChange={(e) => setTeamBScore(Number(e.target.value))} disabled={!isAdmin || isLiveSyncActive} />
                 </div>
               </div>
               {isAdmin && onUpdateScores && !isLiveSyncActive && (
                 <div className="mt-3 space-y-2">
                   <button type="button" onClick={() => onUpdateScores(teamAScore, teamBScore)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20">Update Score</button>
                   {onManualPayout && (
                     <button type="button" onClick={() => { if (confirm("Log payout?")) onManualPayout(teamAScore, teamBScore); }} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                       <Trophy className="w-3 h-3" /> END QUARTER & LOG WINNER
                     </button>
                   )}
                 </div>
               )}
            </div>
          )}

          {/* ADMIN EVENT SELECTOR */}
          {isAdmin && allSelectableGames.length > 0 && (
             <div className="space-y-2 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-slate-800/50 px-4 py-3">
                {/* ... (Keep existing Selector logic) ... */}
                <select title="Select Game" value={selectedEventId ?? ""} onChange={(e) => handleEventChange(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-900/20 outline-none">
                  <option value="">Manual matchup</option>
                  {nflGames.length > 0 && (
                    <optgroup label="🏈 NFL Games" className="font-bold text-amber-600 bg-amber-50 dark:bg-slate-800">
                      {nflGames.map((game) => <option key={game.id} value={game.id} className="font-black text-black dark:text-white">{game.awayTeam.name} @ {game.homeTeam.name} ({formatEventDate(game.date)})</option>)}
                    </optgroup>
                  )}
                  {otherGames.length > 0 && (
                    <optgroup label="Other Sports">
                      {otherGames.map((game) => <option key={game.id} value={game.id}>[{game.league}] {game.awayTeam.name} @ {game.homeTeam.name} ({formatEventDate(game.date) || game.status})</option>)}
                    </optgroup>
                  )}
                </select>
             </div>
          )}

          {/* SCRAMBLE */}
          {isAdmin && onScrambleGridDigits && (
             <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-slate-800/50 px-4 py-3 text-xs uppercase tracking-widest text-slate-500">
                <div className="flex flex-col">
                  <span>Randomize Grid</span>
                  {isScrambled ? <span className="text-[10px] text-red-500 font-bold">Locked - Already Scrambled</span> : null}
                </div>
                <div className="flex gap-2">
                  {onResetGridDigits && !isScrambled && (
                    <button type="button" onClick={onResetGridDigits} disabled={timeUntilGame !== null && timeUntilGame <= 2 * 60 * 1000} className={`px-3 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white font-black text-[10px] tracking-[0.2em] transition-colors border border-slate-300 dark:border-white/10`}>
                      123...
                    </button>
                  )}
                  <button type="button" onClick={onScrambleGridDigits} disabled={isScrambled || (timeUntilGame !== null && (timeUntilGame > 10 * 60 * 1000 || timeUntilGame <= 2 * 60 * 1000))} className={`px-3 py-1 rounded-lg font-black text-[10px] tracking-[0.2em] transition-colors border ${isScrambled ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 shadow-md shadow-indigo-500/20"}`}>
                    {isScrambled ? "LOCKED" : "Scramble"}
                  </button>
                </div>
             </div>
          )}
          
          {/* STATS */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-emerald-500/10 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20 relative overflow-hidden group">
               <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
               <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1 relative z-10">
                 <DollarSign className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Entry</span>
               </div>
               <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 relative z-10">${pricePerSquare}</div>
             </div>
             <div className="bg-cyan-500/10 dark:bg-cyan-900/20 p-4 rounded-xl border border-cyan-500/20 relative overflow-hidden group">
               <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors"></div>
               <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-1 relative z-10">
                 <Users className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Pot</span>
               </div>
               <div className="text-2xl font-black text-cyan-700 dark:text-cyan-300 relative z-10">${totalPot}</div>
             </div>
          </div>

            {otherGames.length > 0 && (
              <optgroup label="Other Sports">
                {otherGames.map((game) => (
                  <option key={game.id} value={game.id}>
                    [{game.league}] {game.awayTeam.name} @ {game.homeTeam.name} ({formatEventDate(game.date) || game.status})
                  </option>
                ))}
              </optgroup>
            )}
            
          </select>
          <p className="text-[10px] text-slate-600">Selecting an event updates the grid labels for everyone.</p>
        </div>
      )}

      {isAdmin && onScrambleGridDigits && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-slate-800/50 px-4 py-3 text-xs uppercase tracking-widest text-slate-500">
            <div className="flex flex-col">
              <span>Randomize Grid</span>
            {isScrambled ? (
              <span className="text-[10px] text-red-500 font-bold">Locked - Already Scrambled</span>
            ) : null}
          </div>
          <div className="flex gap-2">
            {onResetGridDigits && !isScrambled && (
              <button
                type="button"
                onClick={onResetGridDigits}
                className={`px-3 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-white font-black text-[10px] tracking-[0.2em] transition-colors border border-slate-300 dark:border-white/10 ${
                  "hover:bg-slate-50 dark:hover:bg-slate-600"
                }`}
              >
                123...
              </button>
            )}
            <button
              type="button"
              onClick={onScrambleGridDigits}
              disabled={isScrambled}
              className={`px-3 py-1 rounded-lg font-black text-[10px] tracking-[0.2em] transition-colors border ${
                isScrambled
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500 shadow-md shadow-indigo-500/20"
              }`}
            >
              {isScrambled ? "LOCKED" : "Scramble"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-500/10 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1 relative z-10">
            <DollarSign className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Entry</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 relative z-10 text-shadow-glow">${pricePerSquare}</div>
        </div>
        <div className="bg-cyan-500/10 dark:bg-cyan-900/20 p-4 rounded-xl border border-cyan-500/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors"></div>
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-1 relative z-10">
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Pot</span>
          </div>
          <div className="text-2xl font-black text-cyan-700 dark:text-cyan-300 relative z-10 text-shadow-glow">${totalPot}</div>
        </div>
      </div>

      <Link 
        href="/payments"
        className="flex items-center justify-between p-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/20 rounded-xl transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
             <span className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-300 tracking-wider">Payment Ledger</span>
             <span className="text-[10px] text-slate-500">View Status & Details</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
      </Link>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <h3>Payouts</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {payouts.map((payout, index) => (
            <div key={index} className="flex flex-col p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{payout.label}</span>
              <span className="text-lg font-black text-slate-800 dark:text-white">${payout.amount}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* PAYOUTS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" />
              <h3>Payouts</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {payouts.map((payout, index) => (
                <div key={index} className="flex flex-col p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{payout.label}</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white">${payout.amount}</span>
                </div>
              ))}
            </div>
          </div>
      </div>

      {/* FOOTER: DELETE BUTTON (Pushed to bottom) */}
      {isAdmin && onDeleteGame && (
        <div className="pt-4 mt-auto border-t border-slate-200 dark:border-white/5">
          <button onClick={onDeleteGame} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl transition-all group">
            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Delete Game</span>
          </button>
        </div>
      )}
    </div>
  );
}