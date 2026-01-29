"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { useEspnScores } from "@/hooks/useEspnScores";
import { Calendar, Trophy, DollarSign, ArrowRight, Loader2, Gamepad, Shield, Link } from "lucide-react";
import CyberInput from "@/components/ui/CyberInput";
import TeamCombobox, { type TeamSelection } from "@/components/ui/TeamCombobox";

export default function CreateGameForm() {
  const router = useRouter();
  const { createGame } = useGame();
  const { games: liveGames } = useEspnScores();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: "",
    teamA: "",
    teamB: "",
    teamALogo: "",
    teamBLogo: "",
    teamAColor: "",
    teamBColor: "",
    price: 10,
    espnGameId: "",
    paymentLink: "",
  });

  const [selectedGame, setSelectedGame] = useState<any>(null);

  // Auto-fill teams if live game selected
  useEffect(() => {
    if (selectedGame) {
      const c = selectedGame.competitors;
      const homeLogo = c[0].team.logo || '';
      const awayLogo = c[1].team.logo || '';
      const homeColor = c[0].team.color ? `#${c[0].team.color}` : '';
      const awayColor = c[1].team.color ? `#${c[1].team.color}` : '';
      
      setFormData(prev => ({
        ...prev,
        teamA: c[0].team.name, // Home
        teamB: c[1].team.name, // Away
        teamALogo: homeLogo,
        teamBLogo: awayLogo,
        teamAColor: homeColor,
        teamBColor: awayColor,
        espnGameId: selectedGame.id,
        name: selectedGame.name
      }));
    }
  }, [selectedGame]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isInvalid = (field: keyof typeof formData) => {
    // Price checks for <= 0? Or just empty? Assuming required fields.
    // Price starts at 10 so likely not empty. paymentLink optional? 
    // User didn't say if payment link is required. I'll make it optional but visually distinct if needed. 
    // Prompt: "If a field is invalid (touched + empty)..."
    if (field === 'paymentLink') return false; // Usually optional
    if (field === 'price') return touched.price && (!formData.price || Number(formData.price) < 0);
    return touched[field] && !formData[field];
  };

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
        teamALogo: formData.teamALogo || null,
        teamBLogo: formData.teamBLogo || null,
        teamAColor: formData.teamAColor || null,
        teamBColor: formData.teamBColor || null,
        espnGameId: formData.espnGameId || null,
        paymentLink: formData.paymentLink || null, // Ensure saved
        league: selectedGame?.league || null,
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
    <div className="w-full max-w-md mx-auto backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* PROGRESS BAR */}
        <div className="flex gap-2 mb-8">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-cyan-500 shadow-[0_0_10px_#22d3ee]" : "bg-white/10"}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-cyan-500 shadow-[0_0_10px_#22d3ee]" : "bg-white/10"}`} />
        </div>

        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#db2777] to-[#22d3ee] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(219,39,119,0.4)]">
                <Trophy className="w-8 h-8 text-white drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">Host A Game</h1>
            <p className="text-slate-400 text-sm mt-1">Set the stakes and invite your crew.</p>
        </div>

        {/* STEP 1: SELECT MATCH */}
        {step === 1 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {liveGames.map((g: any) => (
                    <button 
                        key={g.id} 
                        onClick={() => handleLiveSelect(g)}
                        className="w-full text-left p-4 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-500 hover:bg-cyan-950/30 transition-all group relative overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-1 relative z-10">
                            <span className="text-xs font-bold text-slate-400 group-hover:text-cyan-300 flex items-center gap-1">
                                <Calendar className="w-3 h-3"/> 
                                {new Date(g.date).toLocaleDateString()} 
                                <span className="text-slate-600 px-1">•</span>
                                <span className="text-white">{formatGameTime(g.date)}</span>
                            </span>
                            
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 border border-white/5">{g.shortName}</span>
                        </div>
                        <div className="font-bold text-white text-sm relative z-10">{g.name}</div>
                        
                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
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
            <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-4 duration-500">
                
                <CyberInput
                    label="OPERATION NAME"
                    icon={<Gamepad className="w-5 h-5" />}
                    placeholder="e.g. Super Bowl Party 2026"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    onBlur={() => handleBlur('name')}
                    required
                    className={isInvalid('name') ? "border-red-500 animate-pulse text-red-200" : ""}
                />

                <div className="grid grid-cols-2 gap-4">
                    <TeamCombobox
                        label="VERTICAL TEAM"
                        icon={<Shield className="w-5 h-5 -rotate-90" />}
                        placeholder="Search home team..."
                        value={formData.teamA}
                        selectedLogo={formData.teamALogo}
                        onSelect={(team: TeamSelection) => setFormData(prev => ({
                          ...prev,
                          teamA: team.name,
                          teamALogo: team.logo,
                          teamAColor: team.color
                        }))}
                        onClear={() => setFormData(prev => ({
                          ...prev,
                          teamA: "",
                          teamALogo: "",
                          teamAColor: ""
                        }))}
                    />
                    <TeamCombobox
                        label="HORIZONTAL TEAM"
                        icon={<Shield className="w-5 h-5" />}
                        placeholder="Search away team..."
                        value={formData.teamB}
                        selectedLogo={formData.teamBLogo}
                        onSelect={(team: TeamSelection) => setFormData(prev => ({
                          ...prev,
                          teamB: team.name,
                          teamBLogo: team.logo,
                          teamBColor: team.color
                        }))}
                        onClear={() => setFormData(prev => ({
                          ...prev,
                          teamB: "",
                          teamBLogo: "",
                          teamBColor: ""
                        }))}
                    />
                </div>

                <CyberInput
                    label="BUY-IN PRICE"
                    icon={<DollarSign className="w-5 h-5" />}
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    onBlur={() => handleBlur('price')}
                    required
                    className={isInvalid('price') ? "border-red-500 animate-pulse" : ""}
                />
                
                <CyberInput
                    label="PAYMENT LINK"
                    icon={<Link className="w-5 h-5" />}
                    placeholder="Venmo/CashApp URL (Optional)"
                    value={formData.paymentLink}
                    onChange={e => setFormData({...formData, paymentLink: e.target.value})}
                />

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#db2777] to-[#22d3ee] hover:opacity-90 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(219,39,119,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mt-4 active:scale-95"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Create Game <ArrowRight className="w-5 h-5" /></>}
                </button>
                
                <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="w-full text-center text-xs text-slate-500 hover:text-white mt-4 tracking-wider uppercase font-bold transition-colors"
                >
                    Back to Selection
                </button>

            </form>
        )}
    </div>
  );
}