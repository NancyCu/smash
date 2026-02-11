"use client";

import React from "react";
import { Leaf, Drumstick } from "lucide-react";

interface SurvivorSplitProps {
  totalPot: number;
}

export default function SurvivorSplit({ totalPot }: SurvivorSplitProps) {
  const winnerSplit = Math.floor(totalPot * 0.95); // House takes 5%

  return (
    <div className="mx-4 mb-8">
      <h3 className="flex items-center gap-2 text-[#facc15] font-bold text-xs uppercase tracking-widest mb-3">
        <span className="w-1 h-4 bg-[#facc15] rounded-full" />
        The Survivor&apos;s Split
      </h3>

      <div className="bg-[#facc15]/10 border border-[#facc15]/30 rounded-lg p-4 mb-4 flex gap-3 items-start">
        <div className="text-[#facc15] text-lg">⚠️</div>
        <p className="text-[#facc15] text-xs leading-relaxed">
          <span className="font-bold">MEDICAL DISCLAIMER:</span> If Q1 or Q2
          result in a cardiac event, the pot rolls over to the next of kin.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Under Card */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 relative overflow-hidden group hover:border-[#00e676] transition-colors">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Leaf size={48} />
          </div>
          <div className="text-[#00e676] text-[10px] font-bold uppercase tracking-wider mb-1">
            Result: Under 385
          </div>
          <div className="text-2xl font-black text-white mb-1">
            ${winnerSplit}
          </div>
          <div className="text-slate-400 text-xs">
            &ldquo;The Leaf-Eaters&rdquo; Split
          </div>
          <div className="w-2 h-2 rounded-full bg-[#00e676] absolute top-3 right-3 animate-pulse" />
        </div>

        {/* Over Card */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 relative overflow-hidden group hover:border-[#ef4444] transition-colors">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Drumstick size={48} />
          </div>
          <div className="text-[#ef4444] text-[10px] font-bold uppercase tracking-wider mb-1">
            Result: Over 385
          </div>
          <div className="text-2xl font-black text-white mb-1">
            ${winnerSplit}
          </div>
          <div className="text-slate-400 text-xs">
            &ldquo;The Lard-Lovers&rdquo; Split
          </div>
          <div className="w-2 h-2 rounded-full bg-[#ef4444] absolute top-3 right-3 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
