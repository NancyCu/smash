"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Gamepad2, ArrowRight, Loader2, Search, Sparkles, UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import WormholeLoader from "@/components/ui/WormholeLoader";

export default function PlayHubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isWarping, setIsWarping] = useState(false);
  const [gameCode, setGameCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameCode.trim()) return;

    setIsJoining(true);
    setIsWarping(true);
    
    // Show wormhole for 1.5 seconds before navigating
    setTimeout(() => {
      router.push(`/game/${gameCode.trim()}`);
    }, 1500);
  };

  return (
    <>
      {/* Wormhole Loader Overlay */}
      {isWarping && <WormholeLoader />}

      <main className="min-h-screen bg-[#0B0C15] relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto p-4 lg:p-8 pb-32">
          {/* User Identity Badge */}
          {user && (
            <div className="flex items-center justify-center gap-2 mb-6 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <UserCircle className="w-4 h-4 text-cyan-400" />
                <span className="text-white/60 text-xs font-medium">Logged in as</span>
                <span className="text-white font-bold text-sm">{user.displayName || user.email}</span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-4 pt-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-cyan-400 animate-pulse" />
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-pink-500 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]" style={{ fontFamily: "'Russo One', sans-serif" }}>
              Play Hub
            </h1>
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-pink-400 animate-pulse" />
          </div>
          <p className="text-white/40 text-xs md:text-sm font-medium uppercase tracking-widest">Choose Your Entry Point</p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
          
          {/* Card 1: JOIN A GAME */}
          <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 bg-[#0B0C15]/60 backdrop-blur-xl shadow-2xl hover:border-cyan-500/50 transition-all duration-500 hover:scale-[1.02]">
            {/* Gradient Glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            
            {/* Card Content */}
            <div className="relative p-6 md:p-8">
              {/* Icon Badge */}
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.4)] group-hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] transition-all">
                <Search className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider text-center mb-1 md:mb-2 drop-shadow-md">
                Join a Game
              </h2>
              <p className="text-white/50 text-xs md:text-sm text-center mb-4 md:mb-6 font-medium">
                Enter a game code to jump into the action
              </p>

              {/* Join Form - Integrated */}
              <form onSubmit={handleJoinGame} className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value)}
                    placeholder="e.g. 7f8a9b..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isJoining || !gameCode}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Find Game <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Decorative Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Card 2: HOST NEW GAME */}
          <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 bg-[#0B0C15]/60 backdrop-blur-xl shadow-2xl hover:border-pink-500/50 transition-all duration-500 hover:scale-[1.02]">
            {/* Gradient Glow */}
            <div className="absolute -inset-1 bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
            
            {/* Card Content */}
            <div className="relative p-6 md:p-8">
              {/* Icon Badge */}
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(219,39,119,0.4)] group-hover:shadow-[0_0_40px_rgba(219,39,119,0.6)] transition-all">
                <Trophy className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider text-center mb-1 md:mb-2 drop-shadow-md">
                Host New Game
              </h2>
              <p className="text-white/50 text-xs md:text-sm text-center mb-4 md:mb-6 font-medium">
                Create a squares grid and invite your friends
              </p>

              {/* Action Button */}
              <button
                onClick={() => router.push('/create')}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(219,39,119,0.3)] hover:shadow-[0_0_30px_rgba(219,39,119,0.5)] transition-all flex items-center justify-center gap-2 group/btn"
              >
                <span>Start Hosting</span>
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </button>

              {/* Feature Pills - Compact */}
              <div className="mt-4 md:mt-6 flex flex-wrap gap-1.5 md:gap-2 justify-center max-w-xs mx-auto">
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  Live Sync
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  Auto Payouts
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                  Easy Share
                </span>
              </div>

              {/* Decorative Element */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 md:mt-12 text-center">
          <p className="text-white/30 text-xs uppercase tracking-widest font-bold">
            Ready to compete? Pick your path above
          </p>
        </div>
      </div>
    </main>
    </>
  );
}
