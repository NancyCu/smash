"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useGame } from "@/context/GameContext";
import { useEspnScores } from "@/hooks/useEspnScores";
import Image from "next/image";
import { LogOut, ExternalLink, Trophy, Calendar, ArrowRight, Home, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  // FIX: Changed 'logout' to 'logOut'
  const { user, logOut } = useAuth();
  const { getUserGames } = useGame();
  const { games: liveGames } = useEspnScores();
  
  const [myGames, setMyGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    const loadGames = async () => {
      try {
        const games = await getUserGames(user.uid);
        // Sort by newest first
        const sorted = games.sort((a: any, b: any) => 
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        setMyGames(sorted);
      } catch (e) {
        console.error("Error loading games:", e);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [user, getUserGames, router]);

  const handleLogout = async () => {
    await logOut();
    router.push("/");
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown Date";
    // Handle Firebase Timestamp or standard date string
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0B0C15] text-white p-4 lg:p-8 relative overflow-hidden">
        
        {/* BACKGROUND BLOBS */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
            
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push("/")}>
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                        <Image src="/SouperBowlDark.png" alt="Logo" fill className="object-cover" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-wider leading-none">My Profile</h1>
                        <span className="text-xs text-slate-500 font-mono">SOUPER BOWL SQUARES</span>
                    </div>
                </div>
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700 hover:text-white transition-colors"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>

            {/* USER CARD */}
            <div className="bg-[#151725] border border-white/10 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-xl">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                    {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
                <div className="text-center md:text-left flex-1">
                    <h2 className="text-2xl font-bold text-white">{user.displayName || "User"}</h2>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center bg-black/20 p-3 rounded-xl border border-white/5 min-w-[100px]">
                        <span className="block text-2xl font-black text-indigo-400">{myGames.length}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Games</span>
                    </div>
                </div>
            </div>

            {/* GAMES LIST */}
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Your Games
            </h3>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
            ) : myGames.length === 0 ? (
                <div className="text-center py-20 bg-[#151725] rounded-2xl border border-dashed border-white/10">
                    <p className="text-slate-500 mb-4">You haven't joined any games yet.</p>
                    <button onClick={() => router.push("/create")} className="px-6 py-2 bg-indigo-600 rounded-xl text-white font-bold text-sm uppercase">Host a Game</button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {myGames.map((g) => (
                        <div 
                            key={g.id} 
                            onClick={() => router.push(`/game/${g.id}`)}
                            className="group bg-[#151725] border border-white/10 hover:border-indigo-500/50 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="w-4 h-4 text-indigo-400" />
                            </div>
                            
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {g.price === 0 ? "Free" : `$${g.price}`}
                                </span>
                                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {formatDate(g.createdAt)}
                                </span>
                            </div>

                            <h4 className="text-lg font-bold text-white mb-1 truncate">{g.name}</h4>
                            
                            <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-3">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="font-bold text-slate-300">{g.teamA}</span> vs <span className="font-bold text-slate-300">{g.teamB}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </main>
  );
}