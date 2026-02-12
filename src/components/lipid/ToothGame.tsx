"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle2 } from "lucide-react";

export default function ToothGame({
  onComplete,
  savedValue,
}: {
  onComplete?: (count: number) => void;
  savedValue?: number | null;
}) {
  const totalTeeth = 5;
  const hasSaved = savedValue != null;

  // Initialize teeth state from saved value
  const [teeth, setTeeth] = useState<boolean[]>(() => {
    if (hasSaved) {
      // Reconstruct: first N teeth removed (false), rest present (true)
      const arr = Array(totalTeeth).fill(true);
      for (let i = 0; i < (savedValue ?? 0) && i < totalTeeth; i++) arr[i] = false;
      return arr;
    }
    return Array(totalTeeth).fill(true);
  });
  const [isLocked, setIsLocked] = useState(hasSaved);

  const removedCount = teeth.filter((t) => !t).length;

  const handleToothClick = (index: number) => {
    if (isLocked) return;
    const newTeeth = [...teeth];
    newTeeth[index] = !newTeeth[index]; // Toggle: click to remove or restore
    setTeeth(newTeeth);
  };

  const handleLockIn = () => {
    if (isLocked) return;
    setIsLocked(true);
    onComplete?.(removedCount);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-[#1a1a2e] rounded-xl border-2 border-[#00ffcc] shadow-[0_0_20px_rgba(0,255,204,0.2)]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-[#00ffcc] font-black text-xl tracking-wider mb-1">
          LEVEL 3: THE TOOTH TOLL
        </h2>
        <p className="text-white/60 text-xs italic">
          {isLocked ? "Extraction complete. Results locked." : "\"High BP caused some grinding...\" — Tap teeth to extract them."}
        </p>
      </div>

      {/* Teeth Row */}
      <div className="flex justify-center gap-3 mb-6">
        {teeth.map((isPresent, i) => (
          <motion.button
            key={i}
            onClick={() => handleToothClick(i)}
            whileTap={!isLocked ? { scale: 0.85 } : {}}
            disabled={isLocked}
            className={`relative w-14 h-20 rounded-md border-2 transition-all duration-200 flex items-center justify-center text-2xl font-black ${
              isPresent
                ? isLocked
                  ? "bg-[#00ffcc]/5 border-[#00ffcc]/30 text-[#00ffcc]/50 cursor-default"
                  : "bg-[#00ffcc]/10 border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc]/20 shadow-[0_0_10px_rgba(0,255,204,0.2)] cursor-pointer"
                : isLocked
                  ? "bg-pink-500/5 border-pink-500/30 text-pink-500/50 cursor-default"
                  : "bg-pink-500/10 border-pink-500 text-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)] cursor-pointer"
            }`}
          >
            {isPresent ? (
              <span className="text-3xl">🦷</span>
            ) : (
              <span className="text-3xl">✕</span>
            )}
            <span className="absolute bottom-1 text-[8px] opacity-50">#{i + 1}</span>
          </motion.button>
        ))}
      </div>

      {/* Counter */}
      <div className="text-center mb-4">
        <div className="inline-block bg-[#333] border-2 border-[#00ffcc] rounded-lg p-3 min-w-[120px]">
          <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
            Teeth Removed
          </div>
          <div className={`text-2xl font-mono font-black ${removedCount > 0 ? "text-pink-500" : "text-white"}`}>
            {removedCount}
          </div>
        </div>
      </div>

      {!isLocked && (
        <p className="text-gray-500 text-xs text-center mb-4">
          Tap to remove or restore teeth. Lock in when ready.
        </p>
      )}

      {/* Lock In / Locked State */}
      <div className="flex flex-col items-center gap-3">
        {!isLocked ? (
          <button
            onClick={handleLockIn}
            className="w-full py-3 rounded-xl bg-[#00ffcc] hover:bg-[#00e6b8] text-black font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,204,0.3)]"
          >
            <Lock size={16} />
            LOCK IN EXTRACTION
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-[#00ffcc]/10 border-2 border-[#00ffcc] rounded-full flex items-center justify-center">
              <CheckCircle2 size={28} className="text-[#00ffcc]" />
            </div>
            <span className="text-[#00ffcc] text-xs font-bold uppercase tracking-widest">
              {removedCount} Teeth Extracted — Locked
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
