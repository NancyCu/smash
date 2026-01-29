"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search } from "lucide-react";

interface JoinGameFormProps {
  onSuccess?: () => void;
  initialGameId?: string;
}

export default function JoinGameForm({ onSuccess, initialGameId = "" }: JoinGameFormProps) {
  const router = useRouter();
  const [gameId, setGameId] = useState(initialGameId);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId.trim()) return;

    setIsJoining(true);
    
    // In the new architecture, "Joining" simply means navigating to the page.
    // The GamePage itself handles loading the data.
    router.push(`/game/${gameId.trim()}`);
    
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleJoin} className="flex flex-col gap-4 w-full max-w-md">
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">
          Enter Game Code
        </label>
        <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="e.g. 7f8a9b..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
        </div>
      </div>

      <button
        type="submit"
        disabled={isJoining || !gameId}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
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
  );
}