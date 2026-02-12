"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WeightGame({
  onComplete,
}: {
  onComplete?: (weight: number) => void;
}) {
  const [foods, setFoods] = useState<string[]>([]);
  
  // Weights in "units"
  const ITEM_WEIGHTS: Record<string, number> = {
    RICE: 5,
    PORK: 2,
    SUGAR: 1,
  };

  const currentLoad = foods.reduce((acc, item) => acc + ITEM_WEIGHTS[item], 0);
  
  // Visual tilt calculation (clamped -15 to 15 degrees)
  // Target might be e.g. 180lbs. We simulate a balance scale.
  // Visual only: Left pan has fixed "User Weight" (heavy), Right pan has "Food".
  // Initially Left is down (User heavy). As food adds up, Right goes down.
  const tilt = Math.max(-15, Math.min(15, (150 - currentLoad * 5) / 10)); 

  const addFood = (type: string) => {
    setFoods([...foods, type]);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-[#02040a] rounded-xl border-2 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.15)] relative overflow-hidden font-mono text-[#00f0ff]">
       {/* Background Grid */}
       <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,240,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />

      <div className="relative z-10 text-center mb-6">
        <h2 className="font-black text-lg tracking-widest uppercase mb-1">
          LEVEL 5: BIOMASS AUDIT
        </h2>
        <div className="text-[10px] text-white/50 uppercase">
          Gravitational Load Calculation
        </div>
      </div>

      {/* SCALE VISUALIZATION */}
      <div className="relative h-48 w-full mb-8">
        
        {/* Scale Base & Pillar (Static) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-32 bg-[#00f0ff]/30 border border-[#00f0ff]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-[#00f0ff]" />

        {/* The Beam (Rotates) */}
        <motion.div 
          className="absolute top-16 left-1/2 w-64 h-2 bg-[#00f0ff] origin-center"
          style={{ x: "-50%" }}
          animate={{ rotate: tilt }}
          transition={{ type: "spring", stiffness: 60, damping: 10 }}
        >
             {/* Left Pan Hanger (User) */}
             <div className="absolute left-0 top-0 w-[1px] h-20 bg-[#00f0ff]/50 origin-top" style={{ transform: `rotate(${-tilt}deg)` }}>
                {/* Pan Base */}
                <div className="absolute -bottom-1 -left-6 w-12 h-1 bg-[#00f0ff]" />
                {/* User Block */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1 w-8 h-12 bg-[#ff0055]/20 border border-[#ff0055] flex items-center justify-center">
                    <span className="text-[8px] text-[#ff0055] font-bold rotate-90">DAD</span>
                </div>
             </div>

             {/* Right Pan Hanger (Food) */}
             <div className="absolute right-0 top-0 w-[1px] h-20 bg-[#00f0ff]/50 origin-top" style={{ transform: `rotate(${-tilt}deg)` }}>
                {/* Pan Base */}
                <div className="absolute -bottom-1 -left-6 w-12 h-1 bg-[#00f0ff]" />
                
                {/* Food Stack (Grows Upwards) */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center w-12 gap-[1px]">
                   <AnimatePresence>
                    {foods.map((food, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`w-full border text-[6px] text-black font-bold flex items-center justify-center
                          ${food === 'RICE' ? 'h-4 bg-yellow-200 border-yellow-400' : 
                            food === 'PORK' ? 'h-3 bg-red-300 border-red-500' : 
                            'h-2 bg-white border-gray-300'}
                        `}
                      >
                         {food[0]}
                      </motion.div>
                    ))}
                   </AnimatePresence>
                </div>
             </div>
        </motion.div>
      
        {/* Needle / Readout Center */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#02040a] border-2 border-[#00f0ff] rounded-full z-20" />
      </div>

      {/* Controls */}
      <div className="relative z-10 grid grid-cols-3 gap-2 mb-4">
        <button onClick={() => addFood("RICE")} className="p-2 border border-yellow-400/50 bg-yellow-900/20 text-yellow-200 text-xs hover:bg-yellow-900/40 rounded flex flex-col items-center">
             <span>🍚</span>
             <span className="font-bold mt-1">RICE</span>
             <span className="text-[8px] opacity-60">+5 LB</span>
        </button>
        <button onClick={() => addFood("PORK")} className="p-2 border border-red-400/50 bg-red-900/20 text-red-200 text-xs hover:bg-red-900/40 rounded flex flex-col items-center">
             <span>🍖</span>
             <span className="font-bold mt-1">PORK</span>
             <span className="text-[8px] opacity-60">+2 LB</span>
        </button>
        <button onClick={() => addFood("SUGAR")} className="p-2 border border-white/50 bg-white/10 text-white text-xs hover:bg-white/20 rounded flex flex-col items-center">
             <span>🧋</span>
             <span className="font-bold mt-1">SUGAR</span>
             <span className="text-[8px] opacity-60">+1 LB</span>
        </button>
      </div>

      {/* Stats */}
      <div className="text-center">
         <div className="text-[10px] text-white/50 mb-1">CURRENT LOAD</div>
         <div className="text-3xl font-black text-white">{currentLoad} <span className="text-sm font-normal text-gray-500">units</span></div>
      </div>

    </div>
  );
}
