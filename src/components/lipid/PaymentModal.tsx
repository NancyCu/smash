"use client";

import React, { useState } from "react";
import { X, Smartphone, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePaymentLink, isMobileDevice } from "@/utils/paymentLinks";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  team: "TALLOW" | "RABBIT_FOOD";
  targetValue: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  team,
  targetValue,
}: PaymentModalProps) {
  const [processing, setProcessing] = useState(false);

  const handlePay = async (provider: "venmo" | "cashapp") => {
    setProcessing(true);

    const gameName = "Lipid Lotto";
    // TODO: Update this handle to the correct host/banker for Lipid Lotto
    const paymentHandle = "@Nancy-Cu"; 

    if (provider === "venmo") {
      const link = generatePaymentLink("venmo", paymentHandle, amount, gameName);
      // Use window.location for deep links on mobile to trigger app open
      if (isMobileDevice()) {
        window.location.href = link;
      } else {
        window.open(link, "_blank");
      }
    } else {
      // Fallback or CashApp logic
      window.open(`https://cash.app/$yourcashtag/${amount}`, "_blank");
    }

    await new Promise((r) => setTimeout(r, 2000));
    setProcessing(false);
    onConfirm();
  };

  const teamNameDisplay =
    team === "TALLOW"
      ? "Team Nước Béo (Fatty Broth)"
      : "Team Khổ Qua (Bitter Melon)";
  const teamColorClass =
    team === "TALLOW" ? "text-red-500" : "text-emerald-500";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#151525] w-full max-w-md rounded-2xl border border-slate-700 overflow-hidden shadow-2xl relative"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-700 flex justify-between items-start bg-slate-900/50">
              <div>
                <h3 className="text-white font-black text-lg tracking-wide uppercase">
                  Payment Required
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  THE GREASE TAX
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="text-center mb-8 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                  Total Due
                </div>
                <div className="text-5xl font-black text-white mb-2 drop-shadow-lg">
                  ${amount.toFixed(2)}
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 inline-block border border-slate-700 mt-2">
                  <div className="text-xs text-slate-400 mb-1">
                    Your Target Selection
                  </div>
                  <div
                    className={`text-sm font-bold uppercase ${teamColorClass}`}
                  >
                    {teamNameDisplay}
                  </div>
                  <div className="text-lg font-mono font-black text-white">
                    {targetValue} mg/dL
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handlePay("venmo")}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-[#008CFF] hover:bg-[#0074d4] shadow-[0_0_20px_rgba(0,140,255,0.3)] hover:shadow-[0_0_30px_rgba(0,140,255,0.5)] transition-all group border-0 text-white font-bold tracking-wide uppercase relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Smartphone size={20} /> Pay with Venmo
                  </span>
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
                </button>

                <button
                  onClick={() => handlePay("cashapp")}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-[#00D632] hover:bg-[#00b029] shadow-[0_0_20px_rgba(0,214,50,0.3)] hover:shadow-[0_0_30px_rgba(0,214,50,0.5)] transition-all group border-0 text-white font-bold tracking-wide uppercase relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <ExternalLink size={20} /> Pay with Cash App
                  </span>
                </button>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-center">
                <p className="text-[10px] text-red-300 italic font-medium leading-relaxed">
                  &ldquo;By paying, you acknowledge that I am eating a burger
                  right now with your money.&rdquo;
                </p>
              </div>
            </div>

            {/* Processing overlay */}
            {processing && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-[#00e676] border-t-transparent rounded-full animate-spin mb-4" />
                  <div className="text-[#00e676] font-bold text-sm tracking-widest animate-pulse">
                    PROCESSING LARD...
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
