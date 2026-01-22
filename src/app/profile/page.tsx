"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useGame, GameState } from "@/context/GameContext";
import { ArrowLeft, UserCircle, LayoutGrid, Trophy, Calendar, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEspnScores } from "@/hooks/useEspnScores";
import { useMemo } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { getUserGames, joinGame, activeGame } = useGame();
  const { games: liveGames } = useEspnScores();
  
  const [myGames, setMyGames] = useState<GameState[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    let mounted = true;
    async function fetchGames() {
      const games = await getUserGames(user!.uid);
      if (mounted) {
        setMyGames(games);
        setLoadingGames(false);
      }
    }
    
    fetchGames();
    return () => { mounted = false; };
  }, [user, getUserGames]);

  const sortedGames = useMemo(() => {
    const list = myGames.map(game => {
      const liveInfo = liveGames.find(lg => lg.id === game.settings.espnGameId);
      return {
        ...game,
        isLive: liveInfo?.isLive ?? false,
        statusDetail: liveInfo?.statusDetail,
        isStarted: game.settings.isScrambled,
        isPost: liveInfo?.status === "post"
      };
    });

    return list.sort((a, b) => {
      // 1. Live games first
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;

      // 2. Started (scrambled) games second (that aren't already live)
      if (a.isStarted && !b.isStarted) return -1;
      if (!a.isStarted && b.isStarted) return 1;

      // 3. Descending recency
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [myGames, liveGames]);

  const handleEnterGame = async (gameId: string) => {
    if (!user) return;
    // We pass user.uid to bypass password since they are already in the list
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
  const ownedGames = myGames.filter(g => g.hostUserId === user.uid);

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
            onClick={logout}
            className="px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* User Stats Card */}
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
                   {myGames.length} Games Total
                 </div>
                 <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider">
                   {ownedGames.length} Hosted
                 </div>
              </div>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl translate-y-16 -translate-x-16"></div>
        </section>

        {/* Games List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Your Games</h3>
             <Link href="/?view=create" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
               + Create New
             </Link>
          </div>

          {loadingGames ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : myGames.length === 0 ? (
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
                const isHost = game.hostUserId === user.uid;
                const isActive = activeGame?.id === game.id;
                
                return (
                  <button
                    key={game.id}
                    onClick={() => handleEnterGame(game.id)}
                    className={`w-full text-left group relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isActive ? "border-indigo-500 ring-1 ring-indigo-500 shadow-indigo-500/10" : "border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30"} ${game.isLive ? 'border-red-500/50 dark:border-red-500/30 bg-red-50/10 dark:bg-red-500/5' : ''}`}
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-lg shadow-inner ${game.isLive ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : isHost ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {game.isLive ? (
                            <div className="relative flex h-5 w-5">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 flex items-center justify-center">
                                  <Trophy className="w-3 h-3 text-white" />
                               </span>
                            </div>
                          ) : isHost ? <Trophy className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {game.settings.name}
                            </h4>
                            {game.isLive && (
                              <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
                                LIVE
                              </span>
                            )}
                            {game.isStarted && !game.isLive && !game.isPost && (
                              <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                IN PROGRESS
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {isHost && (
                              <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                                HOST
                              </span>
                            )}
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {game.settings.teamA} vs {game.settings.teamB}
                            </span>
                            {game.statusDetail && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase hidden sm:inline">
                                • {game.statusDetail}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors">
                           <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">Enter</span>
                           <ChevronRight className="w-4 h-4" />
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {game.id}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) }
        </section>
      </main>
    </div>
  );
}

