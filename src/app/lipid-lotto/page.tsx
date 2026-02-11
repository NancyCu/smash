"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Info, Wallet } from "lucide-react";
import { motion } from "framer-motion";

import LipidTicker from "@/components/lipid/Ticker";
import ArteryVisualizer from "@/components/lipid/ArteryVisualizer";
import BettingCard from "@/components/lipid/BettingCard";
import CountdownTimer from "@/components/lipid/CountdownTimer";
import PaymentModal from "@/components/lipid/PaymentModal";
import RulesModal from "@/components/lipid/RulesModal";
import TabSection, {
  type LipidTabView,
  type LipidBet,
} from "@/components/lipid/TabSection";

const ENTRY_FEE = 10;
const LIMIT_LINE = 320;
const ODDS_UNDER = 1.5;   // +150 → bet $5 win $12.50
const ODDS_OVER  = 1.0;  // EVEN  → bet $5 win $10.00
const COLLECTION_NAME = "lipid_lotto_bets";

// Target date: 3 days, 14 hours, 15 minutes from initial load
const TARGET_DATE =
  Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 15 * 60 * 1000;

export default function LipidLottoPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [cholesterolLevel, setCholesterolLevel] = useState(350);
  const [totalPot, setTotalPot] = useState(0);
  const [hasBet, setHasBet] = useState(false);
  const [currentTab, setCurrentTab] = useState<LipidTabView>("WAITING_ROOM");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bets, setBets] = useState<LipidBet[]>([]);
  const [showInfo, setShowInfo] = useState(false);

  /* ─── Firestore: subscribe to all bets (real-time pot + waiting room) ─── */
  useEffect(() => {
    const betsRef = collection(db, COLLECTION_NAME);
    const unsub = onSnapshot(betsRef, (snap) => {
      const allBets: LipidBet[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          oddsId: data.uid ?? data.userId ?? "",
          userName: data.userName ?? "Anon",
          amount: data.betAmount ?? ENTRY_FEE,
          team: data.team ?? "RABBIT_FOOD",
          targetValue: data.targetValue ?? 0,
          odds: data.odds ?? undefined,
          potentialPayout: data.potentialPayout ?? undefined,
          timestamp:
            data.timestamp instanceof Timestamp
              ? data.timestamp.toMillis()
              : Date.now(),
        };
      });
      setBets(allBets);
      setTotalPot(allBets.length * ENTRY_FEE);
    });
    return () => unsub();
  }, []);

  /* ─── Check if current user already placed a bet (One Bet Rule) ─── */
  useEffect(() => {
    if (!user) {
      setHasBet(false);
      return;
    }
    const checkExisting = async () => {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("uid", "==", user.uid)
      );
      const snap = await getDocs(q);
      setHasBet(!snap.empty);
    };
    checkExisting();
  }, [user]);

  /* ─── Background glow tied to cholesterol ─── */
  const bgOverlayOpacity = Math.max(0, (cholesterolLevel - 200) / 400);

  /* ─── Stable onChange for artery (avoids re-creating ref each render) ─── */
  const handleCholesterolChange = useCallback((v: number) => {
    setCholesterolLevel(v);
  }, []);

  /* ─── Place bet handler ─── */
  const handlePlaceBet = () => {
    if (!user) {
      alert("Please sign in first!");
      return;
    }
    if (hasBet) return;
    setIsModalOpen(true);
  };

  const handleConfirmBet = async () => {
    if (!user) return;
    const isUnder = cholesterolLevel < LIMIT_LINE;
    const team: "TALLOW" | "RABBIT_FOOD" = isUnder ? "RABBIT_FOOD" : "TALLOW";
    const odds = isUnder ? `+${ODDS_UNDER * 100}` : "EVEN";
    const potentialPayout = isUnder
      ? ENTRY_FEE + ENTRY_FEE * ODDS_UNDER
      : ENTRY_FEE + ENTRY_FEE * ODDS_OVER;

    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        uid: user.uid,
        userName: user.displayName ?? "Anon",
        betAmount: ENTRY_FEE,
        targetValue: cholesterolLevel,
        team,
        odds,
        potentialPayout,
        timestamp: serverTimestamp(),
      });
      setHasBet(true);
      setIsModalOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert("Error placing bet: " + msg);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0C15]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#00e676] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#00e676] text-sm font-mono tracking-widest">
            LOADING LIPIDS...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20 transition-colors duration-1000 ease-in-out font-sans">
      {/* Dynamic red glow background */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-500 ease-linear z-0"
        style={{
          background: `radial-gradient(circle at 50% 30%, rgba(239, 68, 68, ${bgOverlayOpacity * 0.8}) 0%, transparent 70%)`,
        }}
      />

      {/* Scanline texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
          backgroundSize: "100% 2px, 3px 100%",
        }}
      />

      <div className="relative z-10">
        {/* Ticker Tape */}
        <LipidTicker />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-6 flex justify-between items-center sticky top-0 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto">
            {/* Mascot */}
            <div className="relative group cursor-pointer w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 transition-all duration-300">
              <div className="absolute inset-0 bg-yellow-500/50 rounded-full blur-md group-hover:bg-yellow-400/80 transition-all duration-300" />
              <div className="w-full h-full rounded-full border-2 border-[#0B0C15] bg-yellow-100 flex items-center justify-center relative z-10 shadow-lg transform group-hover:scale-105 transition-transform duration-200 text-2xl sm:text-3xl md:text-4xl">
                🍜
              </div>
              <div className="absolute -bottom-1 -right-1 z-20 text-xs animate-bounce">
                🍚
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-lg md:text-xl font-bold tracking-widest text-white transition-all">
                LIPID LOTTO
              </h1>
              <div className="text-[10px] sm:text-xs text-slate-400 transition-all">
                Edition: Asian Parent
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-center pointer-events-auto">
            {/* Status badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] sm:text-xs font-bold uppercase tracking-wide transition-all ${
                hasBet
                  ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                  : "bg-red-500/10 border-red-500/50 text-red-400 animate-pulse"
              }`}
            >
              <Wallet size={14} className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{hasBet ? "INVESTOR" : user ? "DEBTOR" : "SIGN IN"}</span>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <Info size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </motion.div>

        {/* Info panel */}
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mx-4 mb-4 bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-xs text-slate-300 leading-relaxed"
          >
            <p className="font-bold text-[#00e676] mb-2">HOW IT WORKS:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                Pick Over/Under on total cholesterol (Line:{" "}
                <strong>320 mg/dL</strong>).
              </li>
              <li>
                Entry fee: <strong>$10</strong> flat.
              </li>
              <li>
                <strong className="text-emerald-400">Under 320 (+150):</strong>{" "}
                Bet $10, win <strong>$25</strong>. 🥦 Healthy Boy Bonus.
              </li>
              <li>
                <strong className="text-red-400">Over 320 (EVEN):</strong>{" "}
                Bet $10, win <strong>$20</strong>.
              </li>
              <li>One bet per person. No take-backs.</li>
            </ul>
          </motion.div>
        )}

        {/* Countdown Timer */}
        <CountdownTimer targetDate={TARGET_DATE} />

        {/* The S-Curved Artery Visualizer */}
        <ArteryVisualizer
          currentValue={cholesterolLevel}
          limitLine={LIMIT_LINE}
          onChange={handleCholesterolChange}
          marker="sandal"
        />

        {/* Betting / Pot Card */}
        <BettingCard
          totalPot={totalPot}
          entryFee={ENTRY_FEE}
          onPlaceBet={handlePlaceBet}
          isLocked={hasBet}
          currentValue={cholesterolLevel}
          limitLine={LIMIT_LINE}
        />

        {/* Tabs (Waiting Room / Lab Results) */}
        <TabSection
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          bets={bets}
          isAdmin={isAdmin}
          onDeleteBet={async (id) => {
            try {
              await deleteDoc(doc(db, COLLECTION_NAME, id));
            } catch (e) {
              console.error(e);
              alert("Failed to delete bet");
            }
          }}
        />

        {/* Payment Modal */}
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={handleConfirmBet}
          amount={ENTRY_FEE}
          team={cholesterolLevel > LIMIT_LINE ? "TALLOW" : "RABBIT_FOOD"}
          targetValue={cholesterolLevel}
        />

        {/* Rules Modal (Auto-shows on page load) */}
        <RulesModal />
      </div>
    </div>
  );
}
