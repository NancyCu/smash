"use client";

import React from "react";
import { Coins, Lock } from "lucide-react";

interface BettingCardProps {
  totalPot: number;
  entryFee: number;
  onPlaceBet: () => void;
  isLocked: boolean;
}

export default function BettingCard({
  totalPot,
  entryFee,
  onPlaceBet,
  isLocked,
}: BettingCardProps) {
  return (
    <div className="mx-4 mt-6 mb-6 p-0.5 rounded-2xl bg-gradient-to-br from-purple-500/40 via-cyan-500/20 to-pink-500/40 shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]">
      <div className="bg-[#151525] rounded-[0.9rem] p-5 relative overflow-hidden">
        {/* Shine blob */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-slate-300 text-xs font-bold tracking-[0.2em] uppercase mb-1">
              Total Pot
            </h2>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white tracking-tight">
                ${totalPot.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-xs font-medium mb-1">
              Entry Fee
            </div>
            <div className="text-white font-bold text-xl text-[#00e676]">
              ${entryFee}
            </div>
          </div>
        </div>

        <button
          onClick={onPlaceBet}
          disabled={isLocked}
          className={`w-full group relative overflow-hidden rounded-lg p-4 transition-all duration-300 border-2 ${
            isLocked
              ? "bg-slate-800 border-slate-700 cursor-not-allowed opacity-80"
              : "bg-[#00e676] border-[#00e676] hover:bg-[#00c853] hover:border-[#00c853] shadow-[0_0_20px_rgba(0,230,118,0.4)] hover:shadow-[0_0_30px_rgba(0,230,118,0.6)]"
          }`}
        >
          <div className="relative z-10 flex items-center justify-center gap-2">
            {isLocked ? (
              <Lock className="w-5 h-5 text-red-500" />
            ) : (
              <Coins className="w-5 h-5 text-black" />
            )}
            <span
              className={`font-black tracking-wider uppercase text-sm ${isLocked ? "text-red-500" : "text-black"}`}
            >
              {isLocked ? "BET LOCKED: PREPARE FOR DOOM" : "LOCK IN MY LARD"}
            </span>
          </div>

          {/* Shimmer */}
          {!isLocked && (
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
          )}
        </button>
      </div>
    </div>
  );
}
