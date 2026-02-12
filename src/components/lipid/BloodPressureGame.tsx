"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle2 } from "lucide-react";

export default function BloodPressureGame({
  onComplete,
  savedValue,
}: {
  onComplete?: (score: number) => void;
  savedValue?: number | null;
}) {
  const [pressure, setPressure] = useState(savedValue ?? 100);
  const [isLocked, setIsLocked] = useState(!!savedValue);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const decayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Decay: slowly drop BP when not pumping (only when not locked)
  useEffect(() => {
    if (isLocked) return;
    decayRef.current = setInterval(() => {
      setPressure((prev) => Math.max(100, prev - 1));
    }, 150);
    return () => {
      if (decayRef.current) clearInterval(decayRef.current);
    };
  }, [isLocked]);

  const startPump = useCallback(() => {
    if (isLocked) return;
    if (decayRef.current) clearInterval(decayRef.current);
    intervalRef.current = setInterval(() => {
      setPressure((prev) => Math.min(240, prev + 3));
    }, 50);
  }, [isLocked]);

  const stopPump = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isLocked) return;
    decayRef.current = setInterval(() => {
      setPressure((prev) => Math.max(100, prev - 1));
    }, 150);
  }, [isLocked]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (decayRef.current) clearInterval(decayRef.current);
    };
  }, []);

  const handleLockIn = () => {
    if (isLocked || pressure <= 100) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (decayRef.current) clearInterval(decayRef.current);
    setIsLocked(true);
    onComplete?.(Math.floor(pressure));
  };

  const fillHeight = Math.min(100, Math.max(0, (pressure - 100) / 1.4));
  const isDanger = pressure > 160;
  const isCritical = pressure > 200;

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-[#02040a] rounded-xl border-2 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.15)] relative overflow-hidden font-mono">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(0deg,transparent_24%,#00f0ff_25%,#00f0ff_26%,transparent_27%,transparent_74%,#00f0ff_75%,#00f0ff_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,#00f0ff_25%,#00f0ff_26%,transparent_27%,transparent_74%,#00f0ff_75%,#00f0ff_76%,transparent_77%,transparent)] bg-[size:30px_30px]" />

      {/* Header */}
      <div className="relative z-10 text-center mb-4">
        <h2 className="text-[#00f0ff] font-black text-lg tracking-widest uppercase mb-1">
          LEVEL 2: HEMODYNAMIC STRESS
        </h2>
        <div className="h-0.5 w-1/2 mx-auto bg-[#00f0ff] mb-2" />
        <p className="text-[#00f0ff]/60 text-[10px] uppercase">
          {isLocked ? "Reading Locked In ✓" : "Pump it up. Lock in at your guess."}
        </p>
      </div>

      {/* Vertical Pressure Bar */}
      <div className="relative z-10 flex justify-center mb-6">
        <div className="relative w-16 h-56 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <motion.div
            className={`absolute bottom-0 left-0 right-0 rounded-b-xl transition-colors duration-200 ${
              isCritical ? "bg-[#ff0055]" : isDanger ? "bg-[#ff0055]/80" : "bg-[#00f0ff]"
            }`}
            animate={{ height: `${fillHeight}%` }}
            transition={{ type: "tween", duration: 0.05 }}
          />
          {[120, 140, 160, 180, 200, 220].map((tick) => {
            const tickPct = ((tick - 100) / (240 - 100)) * 100;
            return (
              <div key={tick} className="absolute left-0 w-full flex items-center" style={{ bottom: `${tickPct}%` }}>
                <div className="w-3 h-px bg-slate-600" />
                <span className="text-[8px] text-slate-500 ml-1">{tick}</span>
              </div>
            );
          })}
          <div className="absolute left-0 w-full h-px bg-[#ff0055]/50 border-t border-dashed border-[#ff0055]/30" style={{ bottom: `${((160 - 100) / (240 - 100)) * 100}%` }} />
        </div>

        <div className="ml-4 flex flex-col justify-center gap-1">
          <div className={`text-xs font-bold ${isDanger ? "text-[#ff0055]" : "text-[#00f0ff]"}`}>SYS: {Math.floor(pressure)}</div>
          <div className={`text-xs font-bold ${isDanger ? "text-[#ff0055]/70" : "text-[#00f0ff]/70"}`}>DIA: {Math.floor(pressure * 0.65)}</div>
        </div>
      </div>

      {isDanger && !isLocked && (
        <div className="relative z-10 text-center text-[#ff0055] text-xs font-bold uppercase tracking-widest mb-3 animate-pulse">
          ⚠ VESSEL INTEGRITY COMPROMISED
        </div>
      )}

      {/* Controls */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        {!isLocked ? (
          <>
            <button
              onMouseDown={startPump}
              onMouseUp={stopPump}
              onMouseLeave={stopPump}
              onTouchStart={startPump}
              onTouchEnd={stopPump}
              className="w-24 h-24 rounded-full bg-[#003333] border-4 border-[#00f0ff] text-[#00f0ff] font-bold shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-90 active:bg-[#00f0ff] active:text-black transition-all flex items-center justify-center relative overflow-hidden group select-none touch-none"
            >
              <span className="relative z-10 font-black">PUMP</span>
            </button>
            <p className="text-white/50 text-xs text-center">
              Hold to raise. Release to let it fall.
            </p>
            <button
              onClick={handleLockIn}
              disabled={pressure <= 100}
              className="w-full py-3 rounded-xl bg-[#00f0ff] hover:bg-[#00d4e6] disabled:bg-slate-700 disabled:text-slate-500 text-black font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
            >
              <Lock size={16} />
              LOCK IN READING
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-[#00f0ff]/10 border-2 border-[#00f0ff] rounded-full flex items-center justify-center">
              <CheckCircle2 size={28} className="text-[#00f0ff]" />
            </div>
            <span className="text-[#00f0ff] text-xs font-bold uppercase tracking-widest">Reading Locked</span>
          </div>
        )}
      </div>

      {/* Display Score */}
      <div className="mt-4 text-center border-t border-[#00f0ff]/30 pt-4">
        <div className="text-[10px] tracking-widest text-[#00f0ff]">{isLocked ? "LOCKED READING" : "CURRENT READING"}</div>
        <div className={`text-3xl font-black mix-blend-screen ${isLocked ? "text-[#00f0ff]" : "text-white"}`}>
          {Math.floor(pressure)} <span className="text-sm text-gray-500">mmHg</span>
        </div>
      </div>
    </div>
  );
}
