"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, DollarSign, Users, Info, ChevronRight, Share2, Trash2, Calendar } from "lucide-react";
import { EspnScoreData } from "@/hooks/useEspnScores";

const LeagueIcon = ({ league }: { league?: string }) => {
  if (!league) return <Trophy className="w-5 h-5 text-indigo-400" />;
  const l = league.toLowerCase();
  if (l.includes("nfl") || l.includes("football")) return <Trophy className="w-5 h-5 text-amber-600" />;
  return <Trophy className="w-5 h-5 text-indigo-400" />;
};

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
  eventLeague?: string;
  eventDate?: string;
  selectedEventId?: string;
  onSelectEvent?: (game: EspnScoreData | null) => void;
}

export default function GameInfo({ 
  gameId, 
  gameName, 
  host, 
  pricePerSquare, 
  totalPot, 
  payouts = [], 
  matchup, 
  scores, 
  isAdmin, 
  onUpdateScores, 
  onDeleteGame, 
  onScrambleGridDigits, 
  onResetGridDigits, 
  isScrambled, 
  availableGames = [], 
  eventName, 
  eventLeague, 
  eventDate, 
  selectedEventId, 
  onSelectEvent 
}: GameInfoProps) {
  
  const [teamAScore, setTeamAScore] = useState(scores?.teamA ?? 0);
  const [teamBScore, setTeamBScore] = useState(scores?.teamB ?? 0);
  const [localEventId, setLocalEventId] = useState<string>(selectedEventId ?? "");
  const isLiveSyncActive = !!selectedEventId;

  useEffect(() => { 
    if (scores) { 
      setTeamAScore(scores.teamA); 
      setTeamBScore(scores.teamB); 
    } 
  }, [scores?.teamA, scores?.teamB]);

  useEffect(() => { 
    setLocalEventId(selectedEventId ?? ""); 
  }, [selectedEventId]);

  const handleShare = async () => {
    if (!gameId) return;
    const url = `${window.location.origin}/game/${gameId}`;
    try {
      if (navigator.share) await navigator.share({ title: gameName, text: `Join Square Royale: ${gameId}`, url });
      else { await navigator.clipboard.writeText(url); alert("Link copied!"); }
    } catch (err) { console.error(err); }
  };

  const handleEventChange = (eId: string) => {
    setLocalEventId(eId);
    if (!onSelectEvent) return;
    if (eId === "") onSelectEvent(null);
    else { const selected = availableGames.find(g => g.id === eId); if (selected) onSelectEvent(selected); }
  };

  // Format Date Helper
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
  }) : null;

  return (
    <div className="bg-[#151725] border border-white/10 rounded-2xl shadow-2xl p-6 text-slate-200 flex flex-col w-full h-fit">
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight leading-none">{gameName}</h2>
          <p className="text-sm text-slate-400 mt-1">Hosted by <span className="font-bold text-cyan-400">@{host}</span></p>
          {gameId && (
            <div className="flex items-center gap-2 mt-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <span className="font-mono font-bold text-indigo-300 text-xs tracking-wider">{gameId}</span>
              </div>
              <button onClick={handleShare} className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:text-white transition-colors"><Share2 className="w-4 h-4" /></button>
            </div>
          )}
        </div>
        <div className="bg-white/5 p-2 rounded-xl border border-white/5"><LeagueIcon league={eventLeague} /></div>
      </div>

      <div className="flex flex-col border-b border-white/5 pb-4 mb-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">
          {eventName || "Manual Matchup"}
        </div>
        {formattedDate && (
           <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <Calendar className="w-3 h-3 text-indigo-400" />
              {formattedDate}
           </div>
        )}
      </div>

      <div className="space-y-4">
          {/* SCORES CARD */}
          {scores && (
            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
               <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isLiveSyncActive ? "Live Sync Active" : "Manual Score Input"}</span>
                  {isLiveSyncActive && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"/>}
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <div className="text-[10px] font-bold text-slate-500 uppercase truncate mb-1">{matchup.teamA}</div>
                   <input aria-label={`Score for ${matchup.teamA}`} type="number" min={0} className="w-full p-2 bg-[#0B0C15] border border-white/10 rounded-lg font-black text-pink-500 text-2xl text-center focus:ring-2 focus:ring-pink-500/50 outline-none transition-all" value={teamAScore} onChange={(e) => setTeamAScore(Number(e.target.value))} disabled={!isAdmin || isLiveSyncActive} />
                 </div>
                 <div>
                   <div className="text-[10px] font-bold text-slate-500 uppercase truncate mb-1">{matchup.teamB}</div>
                   <input aria-label={`Score for ${matchup.teamB}`} type="number" min={0} className="w-full p-2 bg-[#0B0C15] border border-white/10 rounded-lg font-black text-cyan-400 text-2xl text-center focus:ring-2 focus:ring-cyan-400/50 outline-none transition-all" value={teamBScore} onChange={(e) => setTeamBScore(Number(e.target.value))} disabled={!isAdmin || isLiveSyncActive} />
                 </div>
               </div>
               {isAdmin && !isLiveSyncActive && onUpdateScores && (
                 <button onClick={() => onUpdateScores(teamAScore, teamBScore)} className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all">Update Scores</button>
               )}
            </div>
          )}

          {/* ADMIN CONTROLS */}
          {isAdmin && (
             <div className="space-y-3">
                {onSelectEvent && (
                  <select aria-label="Select Game Matchup" value={localEventId} onChange={(e) => handleEventChange(e.target.value)} className="w-full bg-[#0B0C15] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors">
                    <option value="">Manual Matchup (No Sync)</option>
                    {availableGames.map(g => (
                        <option key={g.id} value={g.id}>{g.shortName || g.name || g.id}</option>
                    ))}
                  </select>
                )}
                {onScrambleGridDigits && (
                   <div className="flex items-center gap-2">
                      {onResetGridDigits && !isScrambled && (
                        <button onClick={onResetGridDigits} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors">123...</button>
                      )}
                      <button onClick={onScrambleGridDigits} disabled={isScrambled} className={`flex-1 py-2 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all ${isScrambled ? "bg-slate-700/50 text-slate-500 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"}`}>
                        {isScrambled ? "Grid Locked" : "Scramble Grid"}
                      </button>
                   </div>
                )}
             </div>
          )}
          
          {/* STATS */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
               <div className="flex items-center gap-2 text-emerald-400 mb-1">
                 <DollarSign className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Entry</span>
               </div>
               <div className="text-xl font-black text-emerald-400">${pricePerSquare}</div>
             </div>
             <div className="bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/20">
               <div className="flex items-center gap-2 text-cyan-400 mb-1">
                 <Users className="w-4 h-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Pot</span>
               </div>
               <div className="text-xl font-black text-cyan-400">${totalPot}</div>
             </div>
          </div>

          <Link href="/payments" className="flex items-center justify-between p-3 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 rounded-xl group transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20"><DollarSign className="w-4 h-4" /></div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase text-indigo-300 tracking-wider">Payment Ledger</span>
                <span className="text-[10px] text-slate-500">View Details</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* PAYOUTS */}
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-2 text-slate-500">
               <Info className="w-3 h-3" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Projected Payouts</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {payouts.map((p, i) => (
                <div key={i} className="flex flex-col p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{p.label}</span>
                  <span className="text-lg font-black text-slate-200">${p.amount}</span>
                </div>
              ))}
            </div>
          </div>
      </div>

      {isAdmin && onDeleteGame && (
        <button onClick={onDeleteGame} className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all group">
          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" /><span className="text-xs font-black uppercase tracking-widest">Delete Game</span>
        </button>
      )}
    </div>
  );
}
