import React, { useState } from "react";
import { Copy, Check, Trophy, Trash2, Edit2, Shuffle, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface GameInfoProps {
  gameId: string;
  gameName: string;
  host: string;
  pricePerSquare: number;
  totalPot: number;
  payouts: any; 
  matchup: { teamA: string; teamB: string };
  scores: any;
  isAdmin: boolean;
  isScrambled: boolean;
  eventDate: string;
  onUpdateScores: (scores: any) => Promise<void>;
  onDeleteGame: () => Promise<void>;
  onScrambleGridDigits: () => Promise<void>;
  onResetGridDigits: () => Promise<void>;
  selectedEventId?: string;
  availableGames?: any[];
}

export default function GameInfo({
  gameId, gameName, host, pricePerSquare, totalPot,
  payouts, matchup, scores, isAdmin, isScrambled,
  eventDate, onUpdateScores, onDeleteGame,
  onScrambleGridDigits, onResetGridDigits
}: GameInfoProps) {
  
  const { user } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isEditingScores, setIsEditingScores] = useState(false);
  
  const [editScores, setEditScores] = useState({ 
     teamA: scores?.teamA || 0, 
     teamB: scores?.teamB || 0 
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveScores = async () => {
    await onUpdateScores(editScores);
    setIsEditingScores(false);
  };

  // --- DYNAMIC PAYOUT RENDERER ---
  // Now relies on the 'payouts' prop passed from GamePage, which handles the rollover logic.
  const renderPayouts = () => {
      // Default to standard split if no specific data passed
      let displayPayouts = [
          { label: "Q1", amount: Math.floor(totalPot * 0.10) },
          { label: "Half", amount: Math.floor(totalPot * 0.20) },
          { label: "Q3", amount: Math.floor(totalPot * 0.20) },
          { label: "Final", amount: totalPot - (Math.floor(totalPot * 0.10) + Math.floor(totalPot * 0.20) * 2) },
      ];

      // If parent calculated rollovers, use those instead
      if (payouts && typeof payouts.q1 === 'number') {
          displayPayouts = [
              { label: "Q1", amount: payouts.q1 },
              { label: "Half", amount: payouts.q2 },
              { label: "Q3", amount: payouts.q3 },
              { label: "Final", amount: payouts.final },
          ];
      }

      return (
        <div className="grid grid-cols-4 gap-2 mt-2">
            {displayPayouts.map((p, i) => {
                // Highlight rollover (0 prize means it moved)
                const isRollover = p.amount === 0; 
                return (
                    <div key={i} className={`flex flex-col items-center rounded-lg p-2 border relative overflow-hidden group transition-all ${
                        isRollover 
                        ? "bg-red-900/10 border-red-500/20 opacity-60" 
                        : "bg-black/20 border-white/5"
                    }`}>
                        <div className={`absolute top-0 left-0 w-full h-1 ${isRollover ? "bg-red-500" : "bg-gradient-to-r from-indigo-500 to-cyan-500"} opacity-20`} />
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">{p.label}</span>
                        <span className={`text-sm font-black transition-colors ${isRollover ? "text-slate-500 line-through" : "text-white group-hover:text-indigo-400"}`}>
                            ${p.amount}
                        </span>
                    </div>
                );
            })}
        </div>
      );
  };

  return (
    <div className="bg-[#151725] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* GAME HEADER */}
        <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wide leading-none">{gameName}</h2>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-mono">
                <span>ID: {gameId.slice(0, 8)}...</span>
                <button onClick={handleCopy} className="hover:text-white transition-colors">
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
            </div>
            <div className="mt-1 text-xs text-slate-500">
                Host: <span className="text-slate-300 font-bold">{host === user?.uid ? "You" : "User"}</span>
            </div>
        </div>

        {/* POT INFO */}
        <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 rounded-xl p-4 border border-indigo-500/20">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Total Pot</span>
                <span className="text-3xl font-black text-white">${totalPot}</span>
            </div>
            <div className="text-xs text-slate-400 flex justify-between border-t border-white/5 pt-2 mt-1">
                <span>Price per Square:</span>
                <span className="text-white font-bold">${pricePerSquare}</span>
            </div>
        </div>

        {/* PAYOUTS */}
        <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Trophy className="w-3 h-3 text-yellow-500" /> Payout Schedule
            </h3>
            {renderPayouts()}
        </div>

        {/* ADMIN TOOLS */}
        {isAdmin && (
            <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-2">Host Controls</span>
                
                {/* SCRAMBLE TOGGLE */}
                <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4 text-pink-500" />
                        <span className="text-xs font-bold text-slate-300">Lock & Scramble</span>
                    </div>
                    <button 
                        onClick={isScrambled ? onResetGridDigits : onScrambleGridDigits}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full transition-colors ${isScrambled ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
                    >
                        {isScrambled ? "Locked" : "Open"}
                    </button>
                </div>

                {/* SCORE KEEPER */}
                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Edit2 className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold text-slate-300">Manual Scores</span>
                        </div>
                        <button onClick={() => isEditingScores ? handleSaveScores() : setIsEditingScores(true)} className="text-xs text-indigo-400 hover:text-white">
                            {isEditingScores ? <Save className="w-4 h-4" /> : "Edit"}
                        </button>
                    </div>
                    {isEditingScores ? (
                        <div className="flex gap-2">
                             <input type="number" value={editScores.teamA} onChange={e => setEditScores({...editScores, teamA: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-center font-mono" placeholder="Team A"/>
                             <input type="number" value={editScores.teamB} onChange={e => setEditScores({...editScores, teamB: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-center font-mono" placeholder="Team B"/>
                        </div>
                    ) : (
                        <div className="flex justify-between text-xs text-slate-500 font-mono px-2">
                            <span>{matchup.teamA}: {scores.teamA}</span>
                            <span>{matchup.teamB}: {scores.teamB}</span>
                        </div>
                    )}
                </div>

                {/* DELETE */}
                <button onClick={onDeleteGame} className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete Game
                </button>
            </div>
        )}

        {/* NAVIGATION LINKS */}
        <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={() => router.push('/winners')} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 uppercase">View Winners</button>
            <button onClick={() => router.push('/payments')} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 uppercase">Payment Ledger</button>
        </div>

    </div>
  );
}