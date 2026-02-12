"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle2 } from "lucide-react";

export default function WeightGame({
  onComplete,
  savedValue,
}: {
  onComplete?: (weight: number) => void;
  savedValue?: number | null;
}) {
  const [weight, setWeight] = useState(savedValue ?? 180);
  const [isLocked, setIsLocked] = useState(!!savedValue);

  const adjust = (delta: number) => {
    if (isLocked) return;
    setWeight((prev) => Math.max(80, Math.min(350, prev + delta)));
  };

  const handleLockIn = () => {
    if (isLocked) return;
    setIsLocked(true);
    onComplete?.(weight);
  };

  const pct = ((weight - 80) / (350 - 80)) * 100;

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-[#02040a] rounded-xl border-2 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.15)] relative overflow-hidden font-mono text-[#00f0ff]">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,240,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />

      <div className="relative z-10 text-center mb-6">
        <h2 className="font-black text-lg tracking-widest uppercase mb-1">
          LEVEL 5: BIOMASS AUDIT
        </h2>
        <div className="text-[10px] text-white/50 uppercase">
          {isLocked ? "Weight Locked In ✓" : "What's the gravitational load? Use +/- to guess."}
        </div>
      </div>

      {/* Weight Display */}
      <div className="relative z-10 text-center mb-6">
        <span className={`text-8xl font-black tabular-nums tracking-tighter transition-colors ${isLocked ? "text-[#00f0ff]" : "text-white"}`}>
          {weight}
        </span>
        <div className="text-sm text-slate-500 font-bold tracking-widest uppercase mt-1">
          LBS
        </div>
      </div>

      {/* Control Buttons */}
      {!isLocked && (
        <div className="relative z-10 grid grid-cols-4 gap-2 max-w-xs mx-auto mb-4">
          <button onClick={() => adjust(-5)} className="py-3 rounded-lg font-black text-lg transition-all active:scale-90 bg-pink-500/10 border border-pink-500/30 text-pink-500 hover:bg-pink-500/20">-5</button>
          <button onClick={() => adjust(-1)} className="py-3 rounded-lg font-black text-lg transition-all active:scale-90 bg-pink-500/10 border border-pink-500/30 text-pink-500 hover:bg-pink-500/20">-1</button>
          <button onClick={() => adjust(1)} className="py-3 rounded-lg font-black text-lg transition-all active:scale-90 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20">+1</button>
          <button onClick={() => adjust(5)} className="py-3 rounded-lg font-black text-lg transition-all active:scale-90 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20">+5</button>
        </div>
      )}

      {/* Visual Scale */}
      <div className="relative z-10 flex justify-center mb-2">
        <div className="relative w-full max-w-xs h-3 bg-slate-800 rounded-full border border-slate-700 overflow-hidden">
          <motion.div
            className="h-full bg-cyan-400 rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>
      <div className="flex justify-between max-w-xs mx-auto text-[10px] text-slate-600 font-bold mb-6">
        <span>80 lbs</span>
        <span>350 lbs</span>
      </div>

      {/* Lock In / Locked State */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        {!isLocked ? (
          <button
            onClick={handleLockIn}
            className="w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
          >
            <Lock size={16} />
            LOCK IN WEIGHT
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-[#00f0ff]/10 border-2 border-[#00f0ff] rounded-full flex items-center justify-center">
              <CheckCircle2 size={28} className="text-[#00f0ff]" />
            </div>
            <span className="text-[#00f0ff] text-xs font-bold uppercase tracking-widest">
              {weight} lbs — Locked
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
