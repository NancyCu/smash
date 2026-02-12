"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function BloodPressureGame({
  onComplete,
}: {
  onComplete?: (score: number) => void;
}) {
  const [pressure, setPressure] = useState(100); // Start normal-ish
  const [pumps, setPumps] = useState(0);

  const handlePump = () => {
    setPumps((p) => p + 1);
    setPressure((prev) => Math.min(prev + 15, 220));
  };

  // Leak pressure slowly over time
  useEffect(() => {
    const timer = setInterval(() => {
      setPressure((prev) => Math.max(100, prev - 2));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const fillHeight = Math.min(100, Math.max(0, (pressure - 100) / 1.2));
  const isDanger = pressure > 160;

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-[#02040a] rounded-xl border-2 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.15)] relative overflow-hidden font-mono">
      {/* Background Grid/details */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(0deg,transparent_24%,#00f0ff_25%,#00f0ff_26%,transparent_27%,transparent_74%,#00f0ff_75%,#00f0ff_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,#00f0ff_25%,#00f0ff_26%,transparent_27%,transparent_74%,#00f0ff_75%,#00f0ff_76%,transparent_77%,transparent)] bg-[size:30px_30px]" />

      {/* Header */}
      <div className="relative z-10 text-center mb-4">
        <h2 className="text-[#00f0ff] font-black text-lg tracking-widest uppercase mb-1">
          LEVEL 2: HEMODYNAMIC STRESS
        </h2>
        <div className="h-0.5 w-1/2 mx-auto bg-[#00f0ff] mb-2" />
        <p className="text-[#00f0ff]/60 text-[10px] uppercase">
          Warning: Vessel Integrity Compromised
        </p>
      </div>

      {/* Main Visual: The Head */}
      <div className="relative z-10 w-48 h-56 mx-auto mb-6">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-lg">
          <defs>
            <clipPath id="skullClip">
              <path d="M50,10 C25,10 10,35 15,65 C15,85 30,110 50,110 C70,110 85,85 85,65 C90,35 75,10 50,10 Z" />
            </clipPath>
          </defs>

          {/* Skull Outline */}
          <path
            d="M50,10 C25,10 10,35 15,65 C15,85 30,110 50,110 C70,110 85,85 85,65 C90,35 75,10 50,10 Z"
            fill="#0a1a2a"
            stroke="#00f0ff"
            strokeWidth="1.5"
            className="opacity-80"
          />

          {/* Jaw */}
          <rect
            x="32"
            y="75"
            width="36"
            height="40"
            rx="5"
            fill="#0a1a2a"
            stroke="#00f0ff"
            strokeWidth="1.5"
            className="opacity-60"
          />

          {/* Brain Fluid Fill */}
          <g clipPath="url(#skullClip)">
            <motion.rect
              x="0"
              y={110 - fillHeight * 1.1} // Grow upwards
              width="100"
              height="120"
              fill={isDanger ? "#ff0055" : "#00f0ff"}
              initial={false}
              animate={{
                y: 110 - fillHeight * 1.1,
                fill: isDanger ? "#ff0055" : "#00f0ff",
              }}
              className="opacity-60 transition-colors duration-300"
            />
          </g>

          {/* Stress Lines (Veins) */}
          {pressure > 140 && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={isDanger ? "animate-pulse" : ""}
            >
              <path
                d="M25,30 L30,40 L25,50"
                fill="none"
                stroke="#ff0055"
                strokeWidth="1"
              />
              <path
                d="M75,30 L70,40 L75,50"
                fill="none"
                stroke="#ff0055"
                strokeWidth="1"
              />
            </motion.g>
          )}

          {/* Eyes */}
          <ellipse cx="35" cy="50" rx="6" ry="4" fill="#02040a" stroke="#00f0ff" strokeWidth="0.5" />
          <ellipse cx="65" cy="50" rx="6" ry="4" fill="#02040a" stroke="#00f0ff" strokeWidth="0.5" />
        </svg>

        {/* Floating Stats */}
        <div className="absolute top-10 -left-6 text-[#ff0055] font-mono text-xs font-bold leading-tight">
          <div>SYS: {Math.floor(pressure)}</div>
          <div>DIA: {Math.floor(pressure * 0.65)}</div>
        </div>

        {isDanger && (
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#ff0055] font-black text-xl tracking-widest opacity-80 animate-pulse whitespace-nowrap">
             CRITICAL
           </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <button
          onClick={handlePump}
          className="w-20 h-20 rounded-full bg-[#003333] border-4 border-[#00f0ff] text-[#00f0ff] font-bold shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95 active:bg-[#00f0ff] active:text-black transition-all flex items-center justify-center relative overflow-hidden group"
        >
          <span className="relative z-10">PUMP</span>
          <div className="absolute inset-0 bg-[#00f0ff] opacity-0 group-hover:opacity-10 transition-opacity" />
        </button>
        
        <p className="text-white/60 text-xs text-center">
          Tap repeatedly to raise pressure.<br/>Stop at the target.
        </p>
      </div>

      {/* Display Score if locked (simulated) */}
      <div className="mt-4 text-center border-t border-[#00f0ff]/30 pt-4">
         <div className="text-[10px] tracking-widest text-[#00f0ff]">CURRENT READING</div>
         <div className="text-3xl font-black text-white mix-blend-screen">{Math.floor(pressure)} <span className="text-sm text-gray-500">mmHg</span></div>
      </div>
    </div>
  );
}
