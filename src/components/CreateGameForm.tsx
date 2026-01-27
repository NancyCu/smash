"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { useEspnScores } from "@/hooks/useEspnScores";
import { Calendar, Trophy, DollarSign, Target, ArrowRight, Loader2 } from "lucide-react";

export default function CreateGameForm() {
  const router = useRouter();
  const { createGame } = useGame();
  const { games: liveGames } = useEspnScores();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    teamA: "",
    teamB: "",
    price: 10,
    espnGameId: "",
  });

  const [selectedGame, setSelectedGame] = useState<any>(null);

  // Auto-fill teams if live game selected
  useEffect(() => {
    if (selectedGame) {
      const c = selectedGame.competitors;
      setFormData(prev => ({
        ...prev,
        teamA: c[0].team.name, // Home
        teamB: c[1].team.name, // Away
        espnGameId: selectedGame.id,
        name: selectedGame.name
      }));
    }
  }, [selectedGame]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.teamA || !formData.teamB) return;

    setLoading(true);
    try {
      const price = Number(formData.price);
      const gameId = await createGame({
        name: formData.name,
        price: price,
        teamA: formData.teamA,
        teamB: formData.teamB,
        espnGameId: formData.espnGameId || null,
        payouts: {
            q1: price * 10,   
            q2: price * 20,
            q3: price * 20,
            final: price * 50
        }
      });
      
      router.push(`/game/${gameId}`);
    } catch (error) {
      console.error("Failed to create game", error);
    } finally {
      setLoading(false);
    }
  };

  // --- HELPERS ---
  const handleLiveSelect = (g: any) => {
      setSelectedGame(g);
      setStep(2);
  };

  const formatGameTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-[#151725] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        
        {/* PROGRESS BAR */}
        <div className="flex gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-indigo-500" : "bg-white/10"}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-indigo-500" : "bg-white/10"}`} />
        </div>

        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">Host A Game</h1>
            <p className="text-slate-400 text-sm mt-1">Set the stakes and invite your crew.</p>
        </div>

        {/* STEP 1: SELECT MATCH */}
        {step === 1 && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {liveGames.map((g: any) => (
                    <button 
                        key={g.id} 
                        onClick={() => handleLiveSelect(g)}
                        className="w-full text-left p-4 rounded-xl bg-black/20 border border-white/5 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all group"
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-300 flex items-center gap-1">
                                <Calendar className="w-3 h-3"/> 
                                {new Date(g.date).toLocaleDateString()} 
                                <span className="text-slate-600 px-1">•</span>
                                <span className="text-white">{formatGameTime(g.date)}</span>
                            </span>
                            
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300">{g.shortName}</span>
                        </div>
                        <div className="font-bold text-white text-sm">{g.name}</div>
                    </button>
                ))}
                
                <button 
                     onClick={() => setStep(2)}
                     className="w-full text-center p-3 text-xs font-bold text-slate-500 hover:text-white border border-dashed border-white/10 rounded-xl hover:border-white/30 transition-colors"
                >
                    Skip / Custom Matchup
                </button>
            </div>
        )}

        {/* STEP 2: DETAILS */}
        {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4">
                
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Game Name</label>
                    <div className="relative">
                        <Target className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                        <input 
                            required 
                            type="text" 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="e.g. Super Bowl Party 2026"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Team A (Vertical)</label>
                        <input 
                            required 
                            type="text" 
                            value={formData.teamA}
                            onChange={e => setFormData({...formData, teamA: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-pink-500 transition-colors"
                            placeholder="Home Team"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Team B (Horizontal)</label>
                        <input 
                            required 
                            type="text" 
                            value={formData.teamB}
                            onChange={e => setFormData({...formData, teamB: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                            placeholder="Away Team"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Price Per Square</label>
                    <div className="relative">
                        <DollarSign className="absolute left-4 top-3.5 w-5 h-5 text-green-500" />
                        <input 
                            required 
                            type="number" 
                            min="0"
                            value={formData.price}
                            onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-green-500 transition-colors"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 mt-4"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Create Game <ArrowRight className="w-5 h-5" /></>}
                </button>
                
                <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="w-full text-center text-xs text-slate-500 hover:text-white mt-2"
                >
                    Back to Selection
                </button>

            </form>
        )}
    </div>
  );
}