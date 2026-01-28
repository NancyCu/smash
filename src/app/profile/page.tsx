"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Added missing Link
import { 
  LogOut, Trophy, Crown, ArrowLeft, ArrowRight, 
  Loader2, LayoutGrid, ChevronRight 
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

  const handleEnterGame = async (gameId: string) => {
    if (!user) return;
    await joinGame(gameId, undefined, user.uid);
    router.push("/?view=game");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl shadow-lg text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-white/5">
          Please sign in to view your profile.
        </p>
      </div>
    );
  }

  // Calculate owned games vs joined games
  const ownedGames = games.filter(g => g.host === user.uid);

  // Calculate total winnings from all games
  const totalWinnings = useMemo(() => {
    return games.reduce((total, game) => {
      const userWinnings = (game.payoutHistory || []).reduce((gameTotal: number, payout: any) => {
        return payout.winnerUserId === user.uid ? gameTotal + payout.amount : gameTotal;
      }, 0);
      return total + userWinnings;
    }, 0);
  }, [games, user.uid]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-24">
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-100 dark:border-white/5 sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" /> 
            <span className="font-bold text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-3">
             <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest hidden sm:block">My Profile</h1>
          </div>
          <button
            onClick={logOut}
            className="px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 dark:from-black dark:via-indigo-950 dark:to-black text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-white/10">
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full border-4 border-white/20 shadow-xl overflow-hidden bg-indigo-600 flex items-center justify-center shrink-0">
               {user.photoURL ? (
                  <Image src={user.photoURL} alt={user.displayName || "User"} width={80} height={80} />
               ) : (
                  <span className="text-2xl font-black">{user.email?.[0].toUpperCase()}</span>
               )}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-300 mb-1">Welcome back</p>
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl translate-y-16 -translate-x-16"></div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Your Games</h3>
             <Link href="/?view=create" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
               + Create New
             </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : sortedGames.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <LayoutGrid className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Games Yet</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-xs mx-auto">
                You haven't joined or created any games. Get started by joining a pool!
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/?view=create" className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">Create Game</Link>
                <Link href="/?view=join" className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold">Join Game</Link>
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
                    className="w-full text-left group relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-white/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-lg shadow-inner ${isHost ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {game.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {isHost && (
                              <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                                HOST
                              </span>
                            )}
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {game.teamA} vs {game.teamB}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors">
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