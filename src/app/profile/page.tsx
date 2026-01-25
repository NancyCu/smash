"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useRouter } from 'next/navigation';
import { LogOut, Trophy, Crown, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, logOut } = useAuth();
  const { getUserGames } = useGame(); // <--- This now fetches Joined games too!
  const router = useRouter();
  
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      if (user) {
        const userGames = await getUserGames(user.uid);
        // Sort by newest first
        const sorted = userGames.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setGames(sorted);
      }
      setLoading(false);
    }
    fetchGames();
  }, [user, getUserGames]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0B0C15] p-4 lg:p-8 relative overflow-hidden pb-24">
       
       {/* Background Ambience */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[100px]" />
       </div>

       <div className="max-w-md mx-auto relative z-10 space-y-6">
           
           {/* HEADER */}
           <div className="flex justify-between items-center">
               <div>
                   <h1 className="text-xl font-black text-white uppercase tracking-widest">My Profile</h1>
                   <p className="text-slate-500 text-xs tracking-wider">SOUPER BOWL SQUARES</p>
               </div>
               <button 
                  onClick={logOut} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/50 transition-all"
               >
                  <LogOut className="w-3 h-3" /> SIGN OUT
               </button>
           </div>

           {/* PROFILE CARD */}
           <div className="bg-[#151725] border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               
               <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 p-1 mb-4 shadow-lg shadow-indigo-500/30">
                  <div className="w-full h-full rounded-full bg-[#151725] flex items-center justify-center overflow-hidden">
                      {user.photoURL ? (
                          <Image src={user.photoURL} alt="User" width={80} height={80} className="object-cover" />
                      ) : (
                          <span className="text-2xl font-black text-white">{user.displayName?.[0] || "U"}</span>
                      )}
                  </div>
               </div>
               
               <h2 className="text-xl font-bold text-white mb-1">{user.displayName || "Player One"}</h2>
               <p className="text-slate-500 text-sm mb-6">{user.email}</p>

               <div className="w-full grid grid-cols-1 gap-3">
                   <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-center">
                       <span className="block text-2xl font-black text-white">{games.length}</span>
                       <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Active Games</span>
                   </div>
               </div>
           </div>

           {/* GAMES LIST */}
           <div className="space-y-4">
               <div className="flex items-center gap-2">
                   <Trophy className="w-4 h-4 text-yellow-500" />
                   <h3 className="text-sm font-bold text-white uppercase tracking-widest">Your Games</h3>
               </div>

               {loading ? (
                   <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500"/></div>
               ) : games.length > 0 ? (
                   <div className="grid gap-3">
                       {games.map((g) => (
                           <button 
                                key={g.id}
                                onClick={() => router.push(`/game/${g.id}`)}
                                className="w-full text-left bg-[#151725] hover:bg-[#1a1d2d] border border-white/5 rounded-2xl p-4 transition-all group relative overflow-hidden"
                           >
                               <div className="flex justify-between items-start mb-2 relative z-10">
                                   <div>
                                       <div className="flex items-center gap-2">
                                           <h4 className="font-bold text-white text-sm">{g.name}</h4>
                                           {g.host === user.uid && <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-[9px] font-bold text-indigo-300 uppercase">Host</span>}
                                       </div>
                                       <p className="text-xs text-slate-500 font-mono mt-1">{g.teamA} vs {g.teamB}</p>
                                   </div>
                                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                       <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
                                   </div>
                               </div>
                               
                               {/* Progress Bar (Fake Pot visualization) */}
                               <div className="relative z-10 mt-2">
                                   <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                       <span>Price: ${g.price}</span>
                                       <span>Pot: ${g.pot || (Object.keys(g.squares || {}).length * g.price)}</span>
                                   </div>
                                   <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                                       <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 w-3/4" />
                                   </div>
                               </div>
                           </button>
                       ))}
                   </div>
               ) : (
                   <div className="text-center py-12 bg-[#151725] rounded-3xl border border-dashed border-white/10">
                       <p className="text-slate-500 text-sm mb-4">You haven't joined any games yet.</p>
                       <button onClick={() => router.push('/create')} className="px-6 py-3 bg-indigo-600 rounded-xl text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 transition-transform">
                           Host a Game
                       </button>
                   </div>
               )}
           </div>

       </div>
    </main>
  );
}