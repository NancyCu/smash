"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TriangleAlert } from "lucide-react";

export default function RulesModal() {
  const [isOpen, setIsOpen] = useState(true);
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    // Countdown timer for the visual bar
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsOpen(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg bg-slate-900 border-2 border-yellow-500 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-yellow-500/10 p-6 border-b border-yellow-500/30 flex items-start gap-4">
            <div className="bg-yellow-500 p-2 rounded-full text-black">
              <TriangleAlert size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-wide">
                House Rules
              </h2>
              <p className="text-yellow-200/70 text-sm font-bold">
                LISTEN CAREFULLY. I ONLY SAY ONE TIME.
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <RuleStep number="1" text="Drag the Sriracha to guess the Cholesterol level." />
              <RuleStep number="2" text="UNDER 320 = RISKY (+150 Payout). High reward, high stress." />
              <RuleStep number="3" text="OVER 320 = SAFE (Even Payout). For those who like boring life." />
              <RuleStep number="4" text="ONE BET ONLY. No refunds. Don't cry to me." />
            </div>
          </div>

          {/* Footer / Timer */}
          <div className="p-4 bg-black/40 flex flex-col gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl rounded-lg uppercase tracking-wider transition-colors"
            >
              I Understand (Close)
            </button>
            
            {/* Countdown Bar */}
            <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-mono">
              <span>Auto-closing in {timeLeft}s</span>
              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-yellow-500"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 20, ease: "linear" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function RuleStep({ number, text }: { number: string, text: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-600 rounded-full font-bold text-white">
        {number}
      </div>
      <p className="text-lg text-slate-200 font-medium leading-tight">{text}</p>
    </div>
  );
}
