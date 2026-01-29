"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Added missing Link
import { 
  Trophy, ArrowLeft, LayoutGrid, ChevronRight 
} from 'lucide-react'; // Added missing Icons
import Image from 'next/image';

export default function ProfilePage() {
  const { user, logOut } = useAuth();
  const { getUserGames, joinGame } = useGame(); 
  const router = useRouter();
  
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      if (user) {
        const userGames = await getUserGames(user.uid);
        // Sort by newest first using Firebase seconds
        const sorted = userGames.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setGames(sorted);
      }
      setLoading(false);
    }
    fetchGames();
  }, [user, getUserGames]);

  const sortedGames = useMemo(() => {
    return games.map(game => ({
      ...game,
      isLive: false,
      statusDetail: undefined,
      isStarted: game.isScrambled || false,
      isPost: false
    })).sort((a, b) => {
      if (a.isStarted && !b.isStarted) return -1;
      if (!a.isStarted && b.isStarted) return 1;
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
  }, [games]);

  // Calculate total winnings from all games (MOVED UP FOR HOOK RULES)
  const userId = user?.uid;
  const totalWinnings = useMemo(() => {
    if (!userId) return 0;
    return games.reduce((total, game) => {
      const userWinnings = (game.payoutHistory || []).reduce((gameTotal: number, payout: any) => {
        return payout.winnerUserId === userId ? gameTotal + payout.amount : gameTotal;
      }, 0);
      return total + userWinnings;
    }, 0);
  }, [games, userId]);

const handleEnterGame = async (gameId: string) => {
  if (!user) return;
  
  try {
    // 1. Still join the game in the DB to be safe
    await joinGame(gameId, undefined, user.uid);
    
    // 2. Drive straight to the dynamic route
    // This bypasses the lobby/wormhole logic entirely
    router.push(`/game/${gameId}`); 
  } catch (error) {
    console.error("Failed to enter game:", error);
  }
};

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center">
        <p className="bg-[#0B0C15]/60 backdrop-blur-xl px-6 py-4 rounded-2xl shadow-lg text-slate-300 font-semibold border border-white/10">
          Please sign in to view your profile.
        </p>
      </div>
    );
  }

  // Calculate owned games vs joined games
  const ownedGames = games.filter(g => g.host === user.uid);

  return (
    <div className="min-h-screen bg-[#0B0C15] text-slate-100 transition-colors duration-300">
      <header className="bg-[#0B0C15]/90 backdrop-blur border-b border-white/10 sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" /> 
            <span className="font-bold text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-3">
             <h1 className="text-lg font-black text-white uppercase tracking-widest hidden sm:block">My Profile</h1>
          </div>
          <button
            onClick={logOut}
            className="px-4 py-2 rounded-full border border-white/10 text-xs font-black uppercase tracking-wider text-slate-400 hover:bg-white/5 transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-24">
        <section className="bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-cyan-900/40 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-white/10">
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full border-4 border-white/20 shadow-xl overflow-hidden bg-indigo-600 flex items-center justify-center shrink-0">
               {user.photoURL ? (
                  <Image src={user.photoURL} alt={user.displayName || "User"} width={80} height={80} />
               ) : (
                  <span className="text-2xl font-black">{user.email?.[0].toUpperCase()}</span>
               )}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 mb-1">Welcome back</p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{user.displayName || user.email?.split('@')[0] || "Player"}</h2>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                 <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider">
                   {games.length} Games Total
                 </div>
                 <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider">
                   {ownedGames.length} Hosted
                 </div>
                 {totalWinnings > 0 && (
                   <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                     ${totalWinnings} Won
                   </div>
                 )}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl translate-y-16 -translate-x-16"></div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Your Games</h3>
             <Link href="/?view=create" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
               + Create New
             </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : sortedGames.length === 0 ? (
            <div className="text-center py-12 bg-[#0B0C15]/60 backdrop-blur-xl rounded-3xl border border-white/10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <LayoutGrid className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Games Yet</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                You haven't joined or created any games. Get started by joining a pool!
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/?view=create" className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-sm font-bold transition-all">Create Game</Link>
                <Link href="/?view=join" className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all border border-white/10">Join Game</Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {sortedGames.map((game) => {
                const isHost = game.host === user.uid;
                return (
                  <button
                    key={game.id}
                    onClick={() => handleEnterGame(game.id)}
                    className="w-full text-left group relative overflow-hidden bg-[#0B0C15]/60 backdrop-blur-xl p-5 rounded-2xl border border-white/10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-cyan-500/50"
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-lg shadow-inner ${isHost ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-white leading-tight group-hover:text-cyan-400 transition-colors">
                            {game.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {isHost && (
                              <span className="bg-pink-500/20 text-pink-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide border border-pink-500/30">
                                HOST
                              </span>
                            )}
                            <span className="text-xs text-slate-400 font-medium">
                              {game.teamA} vs {game.teamB}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-slate-500 group-hover:text-cyan-400 transition-colors">
                           <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">Enter</span>
                           <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}