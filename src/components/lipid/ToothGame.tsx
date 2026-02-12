"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ToothGame({
  onComplete,
}: {
  onComplete?: (count: number) => void;
}) {
  const [teeth, setTeeth] = useState([true, true, true, true, true]); // 5 teeth
  const [removedCount, setRemovedCount] = useState(0);

  const handleToothClick = (index: number) => {
    if (!teeth[index]) return;

    const newTeeth = [...teeth];
    newTeeth[index] = false;
    setTeeth(newTeeth);
    setRemovedCount((prev) => prev + 1);
    
    // Optional: Trigger completion or callback
    if (onComplete) onComplete(removedCount + 1);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-[#1a1a2e] rounded-xl border-2 border-[#00ffcc] shadow-[0_0_20px_rgba(0,255,204,0.2)]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-[#00ffcc] font-black text-xl tracking-wider mb-1">
          LEVEL 3: THE TOOTH TOLL
        </h2>
        <p className="text-white/60 text-xs italic">
          "High BP caused some grinding..."
        </p>
      </div>

      {/* The Face Visualization */}
      <div className="relative aspect-square w-full max-w-[300px] mx-auto mb-6">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-2xl"
        >
          {/* Face Base */}
          <circle cx="50" cy="60" r="30" fill="#f5d0a9" stroke="#d4a373" strokeWidth="1" />
          
          {/* Blush/Stress Cheeks */}
          <circle cx="35" cy="55" r="5" fill="#ff9999" opacity="0.5" />
          <circle cx="65" cy="55" r="5" fill="#ff9999" opacity="0.5" />

          {/* Squinting Eyes (Stress) */}
          <path d="M 35 65 L 45 65" stroke="black" strokeWidth="2" strokeLinecap="round" />
          <path d="M 55 65 L 65 65" stroke="black" strokeWidth="2" strokeLinecap="round" />

          {/* Sweat Drop */}
          <motion.ellipse 
            cx="72" cy="75" rx="2" ry="4" 
            fill="#00d2ff" 
            transform="rotate(20 72 75)"
            animate={{ y: [0, 2, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />

          {/* Mouth (Open Wide) */}
          <ellipse cx="50" cy="45" rx="15" ry="8" fill="#660000" stroke="black" strokeWidth="0.5" />

          {/* Teeth Container - Positioned over mouth */}
        </svg>

        {/* Interactive Teeth Layer (HTML overlay for better click handling/animation) */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[30%] h-[10%] flex justify-between items-center px-1">
            <AnimatePresence>
              {teeth.map((isPresent, i) => (
                <div key={i} className="relative w-4 h-6">
                  {isPresent ? (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToothClick(i)}
                      className="w-full h-full bg-white border border-gray-300 rounded-sm shadow-sm cursor-pointer hover:bg-yellow-50"
                      layoutId={`tooth-${i}`}
                    />
                  ) : (
                    <motion.div
                      initial={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                      animate={{ 
                        opacity: 0, 
                        scale: 0.5, 
                        y: -100, 
                        x: (Math.random() - 0.5) * 100,
                        rotate: Math.random() * 360 
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-0 w-full h-full bg-white border border-gray-300 rounded-sm pointer-events-none z-50"
                    >
                        {/* Tooth root visuals */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-2 bg-yellow-100/50"></div>
                    </motion.div>
                  )}
                  
                  {/* Gum/Socket (Always visible underneath) */}
                  {!isPresent && (
                    <div className="absolute bottom-0 left-0 w-full h-2 bg-[#330000] rounded-b-sm animate-pulse" />
                  )}
                </div>
              ))}
            </AnimatePresence>
        </div>
      </div>

      {/* Controls / Instructions */}
      <div className="text-center space-y-4">
        <h3 className="text-[#ffcc00] font-black text-lg animate-pulse">
          TAP TO EXTRACT
        </h3>
        
        <div className="bg-[#333] border-2 border-[#00ffcc] rounded-lg p-3 inline-block min-w-[120px]">
          <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
            Teeth Removed
          </div>
          <div className="text-2xl font-mono font-black text-white">
            {removedCount}
          </div>
        </div>

        <p className="text-gray-500 text-xs mt-2">
          Guess: How many did the dentist take?
        </p>
      </div>
    </div>
  );
}
