"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Skull, Scale, Stethoscope, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import ToothGame from "./ToothGame";
import BloodPressureGame from "./BloodPressureGame";
import WeightGame from "./WeightGame";

type SystemLevel = 2 | 3 | 5;
const LEVELS: SystemLevel[] = [2, 3, 5];
const COLLECTION_NAME = "lipid_bets";

interface SavedAnswers {
  bp: number | null;
  teethMissing: number | null;
  weight: number | null;
}

export default function SystemFailureView() {
  const { user } = useAuth();
  const [level, setLevel] = useState<SystemLevel>(2);
  const [answers, setAnswers] = useState<SavedAnswers>({ bp: null, teethMissing: null, weight: null });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingDocId, setExistingDocId] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  // Load existing answers from Firestore on mount
  useEffect(() => {
    if (!user) {
      setLoadingExisting(false);
      return;
    }
    const loadExisting = async () => {
      try {
        const q = query(collection(db, COLLECTION_NAME), where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0];
          const data = docData.data();
          setExistingDocId(docData.id);
          setAnswers({
            bp: data.bp ?? null,
            teethMissing: data.teethMissing ?? null,
            weight: data.weight ?? null,
          });
          // If all answers exist, mark as saved
          if (data.bp != null && data.teethMissing != null && data.weight != null) {
            setSaved(true);
          }
        }
      } catch (e) {
        console.error("Failed to load existing answers:", e);
      } finally {
        setLoadingExisting(false);
      }
    };
    loadExisting();
  }, [user]);

  // Save/update to Firestore whenever an answer is locked in
  const saveAnswers = async (updatedAnswers: SavedAnswers) => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        uid: user.uid,
        userName: user.displayName ?? "Anonymous",
        bp: updatedAnswers.bp,
        teethMissing: updatedAnswers.teethMissing,
        weight: updatedAnswers.weight,
        updatedAt: serverTimestamp(),
      };

      if (existingDocId) {
        await updateDoc(doc(db, COLLECTION_NAME, existingDocId), payload);
      } else {
        const ref = await addDoc(collection(db, COLLECTION_NAME), {
          ...payload,
          timestamp: serverTimestamp(),
        });
        setExistingDocId(ref.id);
      }

      // Check if all answers are complete
      if (updatedAnswers.bp != null && updatedAnswers.teethMissing != null && updatedAnswers.weight != null) {
        setSaved(true);
      }
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleBpComplete = (val: number) => {
    const updated = { ...answers, bp: val };
    setAnswers(updated);
    saveAnswers(updated);
  };

  const handleTeethComplete = (val: number) => {
    const updated = { ...answers, teethMissing: val };
    setAnswers(updated);
    saveAnswers(updated);
  };

  const handleWeightComplete = (val: number) => {
    const updated = { ...answers, weight: val };
    setAnswers(updated);
    saveAnswers(updated);
  };

  const getLevelTitle = (lvl: SystemLevel) => {
    switch (lvl) {
      case 2: return "HEMODYNAMIC STRESS";
      case 3: return "SURGICAL REVIEW";
      case 5: return "BIOMASS AUDIT";
      default: return "UNKNOWN";
    }
  };

  const isLevelComplete = (lvl: SystemLevel) => {
    switch (lvl) {
      case 2: return answers.bp != null;
      case 3: return answers.teethMissing != null;
      case 5: return answers.weight != null;
      default: return false;
    }
  };

  const completedCount = [answers.bp, answers.teethMissing, answers.weight].filter(v => v != null).length;

  const goNext = () => {
    const idx = LEVELS.indexOf(level);
    if (idx < LEVELS.length - 1) setLevel(LEVELS[idx + 1]);
  };
  const goPrev = () => {
    const idx = LEVELS.indexOf(level);
    if (idx > 0) setLevel(LEVELS[idx - 1]);
  };

  if (loadingExisting) {
    return (
      <div className="bg-[#0b0c15] min-h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#0b0c15] min-h-[500px] border-t-2 border-red-900/50">
      {/* Level Navigation Bar */}
      <div className="bg-black/40 border-b border-white/5 p-2 flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={level === LEVELS[0]}
          className="p-2 text-red-500 disabled:opacity-20 hover:bg-white/5 rounded"
          title="Previous level"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-red-500 font-bold tracking-[0.2em] uppercase mb-0.5">
            SYSTEM DIAGNOSTIC
          </span>
          <span className="text-white font-mono font-black text-sm flex items-center gap-2">
            LVL {level}: {getLevelTitle(level)}
            {isLevelComplete(level) && <CheckCircle2 size={14} className="text-green-400" />}
          </span>
        </div>

        <button
          onClick={goNext}
          disabled={level === LEVELS[LEVELS.length - 1]}
          className="p-2 text-red-500 disabled:opacity-20 hover:bg-white/5 rounded"
          title="Next level"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
            Progress: {completedCount}/3
          </span>
          {saving && <Loader2 size={10} className="text-cyan-400 animate-spin" />}
          {saved && <span className="text-[10px] text-green-400 font-bold">ALL LOCKED ✓</span>}
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Not signed in warning */}
      {!user && (
        <div className="mx-4 mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-200 text-xs font-bold text-center">
          ⚠ Sign in to save your answers
        </div>
      )}

      {/* Game Container */}
      <div className="p-4 md:p-6">
        {level === 2 && (
          <BloodPressureGame
            onComplete={handleBpComplete}
            savedValue={answers.bp}
          />
        )}

        {level === 3 && (
          <ToothGame
            onComplete={handleTeethComplete}
            savedValue={answers.teethMissing}
          />
        )}

        {level === 5 && (
          <WeightGame
            onComplete={handleWeightComplete}
            savedValue={answers.weight}
          />
        )}

        {/* Auto-advance hint */}
        {isLevelComplete(level) && level !== LEVELS[LEVELS.length - 1] && (
          <button
            onClick={goNext}
            className="w-full mt-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border border-white/10"
          >
            Next Level <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Quick Jump Footer */}
      <div className="grid grid-cols-3 gap-1 p-2 border-t border-white/5 bg-black/20">
        <LevelIcon lvl={2} active={level === 2} complete={answers.bp != null} icon={<Stethoscope size={14} />} onClick={() => setLevel(2)} label="BP" />
        <LevelIcon lvl={3} active={level === 3} complete={answers.teethMissing != null} icon={<Skull size={14} />} onClick={() => setLevel(3)} label="TEETH" />
        <LevelIcon lvl={5} active={level === 5} complete={answers.weight != null} icon={<Scale size={14} />} onClick={() => setLevel(5)} label="MASS" />
      </div>
    </div>
  );
}

function LevelIcon({ active, complete, icon, onClick, label }: { lvl: number; active: boolean; complete: boolean; icon: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded transition-colors relative ${
        active
          ? "bg-red-500/20 text-red-400 border border-red-500/50"
          : "text-slate-600 hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="text-[9px] font-bold mt-1 tracking-wider">{label}</span>
      {complete && (
        <div className="absolute top-1 right-1">
          <CheckCircle2 size={10} className="text-green-400" />
        </div>
      )}
    </button>
  );
}
