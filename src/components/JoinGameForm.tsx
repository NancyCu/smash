"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, LogIn, Lock, Search } from "lucide-react";
import { useGame } from "@/context/GameContext";

interface JoinGameFormProps {
  onSuccess?: () => void;
  initialGameId?: string;
}

export default function JoinGameForm({ onSuccess, initialGameId = "" }: JoinGameFormProps) {
  const { joinGame } = useGame();
  const [gameId, setGameId] = useState(initialGameId);

  useEffect(() => {
    if (initialGameId) {
      setGameId(initialGameId);
    }
  }, [initialGameId]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsJoining(true);

    try {
      const result = await joinGame(gameId, password);
      if (!result.ok) {
        setError(result.error);
        setIsJoining(false);
        return;
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError("Failed to join game. Please try again.");
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 transition-colors duration-300">
        <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Enter The Arena</h2>
            <p className="text-cyan-100 font-bold text-xs uppercase tracking-widest mt-1">Join an existing game</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <KeyRound className="w-3 h-3 text-cyan-600 dark:text-cyan-500" />
                Game Code
              </label>
              <div className="relative">
                <input
                  required
                  type="text"
                  name="gameId"
                  placeholder="e.g. 8F2K9JQW"
                  className="w-full p-3 pl-11 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all uppercase font-mono font-bold tracking-wider"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value.toUpperCase())}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>
              <p className="text-[9px] text-slate-500 font-bold ml-1">Ask the host for their unique game ID.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-3 h-3 text-pink-600 dark:text-pink-500" />
                Game Password (if set)
              </label>
              <input
                type="password"
                name="password"
                placeholder="Optional"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-rose-500 text-xs font-bold bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200 dark:border-rose-500/20">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isJoining}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
          >
            {isJoining ? (
              <span>Joining...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Join Game
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
