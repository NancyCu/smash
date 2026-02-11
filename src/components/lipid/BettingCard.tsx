"use client";

import React from "react";
import { Coins, Lock, TrendingUp, Flame } from "lucide-react";

interface BettingCardProps {
  totalPot: number;
  entryFee: number;
  onPlaceBet: () => void;
  isLocked: boolean;
  currentValue?: number;
  limitLine?: number;
}

export default function BettingCard({
  totalPot,
  entryFee,
  onPlaceBet,
  isLocked,
  currentValue = 300,
  limitLine = 320,
}: BettingCardProps) {
  const isUnder = currentValue < limitLine;
  const odds = isUnder ? "+150" : "EVEN";
  const payout = isUnder ? (entryFee + entryFee * 1.5).toFixed(2) : (entryFee * 2).toFixed(2);

  return (
    <div className={`mx-4 mt-3 mb-2 p-0.5 rounded-2xl transition-all duration-500 ${
      isUnder
        ? "bg-gradient-to-br from-emerald-500/60 via-green-500/30 to-emerald-500/60 shadow-[0_0_40px_-5px_rgba(16,185,129,0.5)]"
        : "bg-gradient-to-br from-red-500/40 via-orange-500/20 to-yellow-500/40 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]"
    }`}>
      <div className="bg-[#151525] rounded-[0.9rem] p-4 relative overflow-hidden">
        {/* Shine blob */}
        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full pointer-events-none transition-colors duration-500 ${
          isUnder ? "bg-emerald-600/15" : "bg-red-600/10"
        }`} />

        <div className="flex justify-between items-start mb-4">
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

        {/* ── Dynamic Odds Banner ── */}
        <div className={`mb-4 p-3 rounded-xl border transition-all duration-500 ${
          isUnder
            ? "bg-emerald-500/10 border-emerald-500/40 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]"
            : "bg-yellow-500/5 border-yellow-500/20"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isUnder ? (
                <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
              ) : (
                <TrendingUp className="w-4 h-4 text-yellow-400" />
              )}
              <span className={`text-xs font-black uppercase tracking-wider ${
                isUnder ? "text-emerald-300" : "text-yellow-300/80"
              }`}>
                {isUnder ? "🥦 HEALTHY BOY BONUS ACTIVE" : "Standard Payout"}
              </span>
            </div>
            <span className={`text-sm font-black font-mono px-2 py-0.5 rounded ${
              isUnder
                ? "bg-emerald-500/20 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : "bg-yellow-500/10 text-yellow-400/80"
            }`}>
              {odds}
            </span>
          </div>
          <div className={`mt-2 flex items-baseline gap-1.5 ${
            isUnder ? "" : ""
          }`}>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Potential Payout:</span>
            <span className={`text-2xl font-black font-mono tracking-tight ${
              isUnder ? "text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]" : "text-yellow-300"
            }`}>
              ${payout}
            </span>
          </div>
        </div>

        <button
          onClick={onPlaceBet}
          disabled={isLocked}
          className={`w-full group relative overflow-hidden rounded-lg p-4 transition-all duration-300 border-2 ${
            isLocked
              ? "bg-slate-800 border-slate-700 cursor-not-allowed opacity-80"
              : isUnder
                ? "bg-emerald-500 border-emerald-400 hover:bg-emerald-600 hover:border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]"
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
              {isLocked ? "BET LOCKED: PREPARE FOR DOOM" : isUnder ? `LOCK IN: HEALTHY BOY ($${payout})` : `LOCK IN MY LARD ($${payout})`}
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
