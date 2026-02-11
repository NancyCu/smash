"use client";

import React, { useState, useEffect, useCallback } from "react";

interface CountdownTimerProps {
  targetDate: number;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const calculateTimeLeft = useCallback(() => {
    const diff = targetDate - Date.now();
    if (diff > 0) {
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const f = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center justify-center my-6">
      <div className="flex items-center gap-2 mb-2 animate-pulse">
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
        <span className="text-[10px] text-red-200 font-bold tracking-[0.1em] uppercase drop-shadow-md">
          TIME UNTIL CARDIAC EVENT (Or Lab Results)
        </span>
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
      </div>

      <div className="flex items-start gap-1 sm:gap-2 font-mono text-3xl sm:text-4xl font-black text-white tabular-nums tracking-widest bg-[#151525] px-6 py-3 rounded-xl border border-red-500/20 shadow-[0_0_30px_-5px_rgba(239,68,68,0.2)] relative overflow-hidden group">
        {/* Scanline overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent bg-[length:100%_4px] opacity-20 pointer-events-none" />

        <div className="flex flex-col items-center z-10">
          <span className="leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            {f(timeLeft.days)}
          </span>
          <span className="text-[8px] text-slate-500 font-sans tracking-widest mt-1">
            DAYS
          </span>
        </div>
        <span className="text-red-500/50 animate-pulse relative -top-1">:</span>
        <div className="flex flex-col items-center z-10">
          <span className="leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            {f(timeLeft.hours)}
          </span>
          <span className="text-[8px] text-slate-500 font-sans tracking-widest mt-1">
            HRS
          </span>
        </div>
        <span className="text-red-500/50 animate-pulse relative -top-1">:</span>
        <div className="flex flex-col items-center z-10">
          <span className="leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            {f(timeLeft.minutes)}
          </span>
          <span className="text-[8px] text-slate-500 font-sans tracking-widest mt-1">
            MIN
          </span>
        </div>
        <span className="text-red-500/50 animate-pulse relative -top-1">:</span>
        <div className="flex flex-col items-center z-10">
          <span className="text-red-500 leading-none drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]">
            {f(timeLeft.seconds)}
          </span>
          <span className="text-[8px] text-red-500/60 font-sans tracking-widest mt-1">
            SEC
          </span>
        </div>
      </div>
    </div>
  );
}
