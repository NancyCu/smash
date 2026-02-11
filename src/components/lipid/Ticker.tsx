"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

const TICKER_MESSAGES = [
  "MÁ LA (MOM IS SCREAMING)",
  "WHY YOU SO FAT?",
  "DELICIOUS, BUT SPEEDS UP THE INHERITANCE PROCESS",
  "GẶP ÔNG BÀ SOON",
  "DRINK SOME TEA, YOU'LL BE FINE",
  "ANCESTORS ARE WATCHING YOUR DIET",
  "EAT MORE BITTER MELON",
  "BLOOD TYPE: FISH SAUCE",
  "DISAPPOINTMENT LEVEL: HIGH",
  "ONLY B+? WHY NOT A+?",
  "REMEMBER TO BOW TO YOUR ANCESTORS",
  "YOUR COUSIN TIMMY IS A DOCTOR",
  "RICE IS LIFE, BUT THIS IS TOO MUCH",
  "Current status: Emotional Damage",
];

export default function LipidTicker() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContentWidth(containerRef.current.scrollWidth / 3);
    }
  }, []);

  return (
    <div className="w-full bg-slate-900/80 border-b border-slate-800 h-10 overflow-hidden flex items-center relative z-20">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0B0C15] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0B0C15] to-transparent z-10" />

      <motion.div
        ref={containerRef}
        className="flex items-center whitespace-nowrap"
        animate={{ x: contentWidth > 0 ? [-1, -contentWidth] : 0 }}
        transition={{
          x: { repeat: Infinity, repeatType: "loop", duration: 60, ease: "linear" },
        }}
      >
        {/* Triple the messages for seamless looping */}
        {[...TICKER_MESSAGES, ...TICKER_MESSAGES, ...TICKER_MESSAGES].map(
          (msg, i) => (
            <div
              key={i}
              className="flex items-center mx-8 text-xs font-mono text-[#00e676]"
            >
              <Activity className="w-3 h-3 mr-2 animate-pulse" />
              <span className="uppercase tracking-widest">{msg}</span>
            </div>
          )
        )}
      </motion.div>
    </div>
  );
}
