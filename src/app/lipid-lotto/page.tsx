"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
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
import SurvivorSplit from "@/components/lipid/SurvivorSplit";
import CountdownTimer from "@/components/lipid/CountdownTimer";
import PaymentModal from "@/components/lipid/PaymentModal";
import TabSection, {
  type LipidTabView,
  type LipidBet,
} from "@/components/lipid/TabSection";

const ENTRY_FEE = 5;
const LIMIT_LINE = 385;
const COLLECTION_NAME = "lipid_lotto_bets";

// Target date: 3 days, 14 hours, 15 minutes from initial load
const TARGET_DATE =
  Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 15 * 60 * 1000;

export default function LipidLottoPage() {
  const { user, loading: authLoading } = useAuth();

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
    const team: "TALLOW" | "RABBIT_FOOD" =
      cholesterolLevel > LIMIT_LINE ? "TALLOW" : "RABBIT_FOOD";

    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        uid: user.uid,
        userName: user.displayName ?? "Anon",
        betAmount: ENTRY_FEE,
        targetValue: cholesterolLevel,
        team,
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
          className="px-4 py-4 flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            {/* Mascot */}
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-yellow-500/50 rounded-full blur-md group-hover:bg-yellow-400/80 transition-all duration-300" />
              <div className="w-12 h-12 rounded-full border-2 border-[#0B0C15] bg-yellow-100 flex items-center justify-center relative z-10 shadow-lg transform group-hover:scale-105 transition-transform duration-200 text-2xl">
                🍜
              </div>
              <div className="absolute -bottom-1 -right-1 z-20 text-xs animate-bounce">
                🍚
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest text-white">
                LIPID LOTTO
              </h1>
              <div className="text-[10px] text-slate-400">
                Edition: Asian Parent
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            {/* Status badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide transition-all ${
                hasBet
                  ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                  : "bg-red-500/10 border-red-500/50 text-red-400 animate-pulse"
              }`}
            >
              <Wallet size={12} />
              {hasBet ? "INVESTOR" : user ? "DEBTOR" : "SIGN IN"}
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Info size={20} />
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
                Pick Over/Under on a total cholesterol result (Target:{" "}
                <strong>385 mg/dL</strong>).
              </li>
              <li>
                Entry fee: <strong>$5</strong> flat.
              </li>
              <li>One bet per person. No take-backs.</li>
              <li>
                Winners split the pot 50/50 (minus 5% house fee for emotional
                damages).
              </li>
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
        />

        {/* Survivor's Split */}
        <SurvivorSplit totalPot={totalPot} />

        {/* Tabs (Waiting Room / Lab Results) */}
        <TabSection
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          bets={bets}
        />

        {/* Payment Modal */}
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmBet}
          amount={ENTRY_FEE}
          team={cholesterolLevel > LIMIT_LINE ? "TALLOW" : "RABBIT_FOOD"}
          targetValue={cholesterolLevel}
        />
      </div>
    </div>
  );
}
