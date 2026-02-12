"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import {
  Play,
  Lock,
  Heart,
  Skull,
  Scale,
  Activity,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

/* ─────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────── */
type Level = "intro" | "cholesterol" | "bp" | "teeth" | "weight" | "summary";

interface Answers {
  cholesterol: number;
  bp: number;
  teethMissing: number;
  weight: number;
}

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */
export default function LipidLotto({ userId, userName }: { userId?: string; userName?: string }) {
  const [level, setLevel] = useState<Level>("intro");
  const [answers, setAnswers] = useState<Answers>({
    cholesterol: 250,
    bp: 120,
    teethMissing: 0,
    weight: 180,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const next = (nextLevel: Level) => setLevel(nextLevel);

  /* ── Auto-reset if admin kicks user (deletes from waiting_room) ── */
  useEffect(() => {
    if (!userId || userId === "anon") return;
    const docRef = doc(db, "waiting_room", userId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (!snap.exists()) {
        // Admin deleted this user — reset to intro
        setLevel("intro");
        setAnswers({ cholesterol: 250, bp: 120, teethMissing: 0, weight: 180 });
        setSaved(false);
      }
    });
    return () => unsub();
  }, [userId]);

  /* ── Submit to Firestore (setDoc with uid for upsert) ── */
  const handleSubmit = async () => {
    setSaving(true);
    try {
      const docId = userId ?? "anon";
      await setDoc(doc(db, "bets", docId), {
        uid: docId,
        userName: userName ?? "Anonymous",
        cholesterol: answers.cholesterol,
        bp: answers.bp,
        teethMissing: answers.teethMissing,
        weight: answers.weight,
        timestamp: serverTimestamp(),
      });
      setSaved(true);
      next("summary");
    } catch (e) {
      console.error("Firestore save error:", e);
      alert("Failed to save bet. Try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Render Current Level ── */
  return (
    <div className="min-h-screen bg-slate-900 text-white font-mono relative overflow-hidden">
      {/* Scan-line texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.02),rgba(0,0,255,0.04))] bg-[size:100%_2px,3px_100%]" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {level === "intro" && (
            <FadeIn key="intro">
              <IntroScreen onStart={() => next("cholesterol")} />
            </FadeIn>
          )}
          {level === "cholesterol" && (
            <FadeIn key="chol">
              <CholesterolLevel
                value={answers.cholesterol}
                onChange={(v) => setAnswers((a) => ({ ...a, cholesterol: v }))}
                onNext={() => next("bp")}
              />
            </FadeIn>
          )}
          {level === "bp" && (
            <FadeIn key="bp">
              <BloodPressureLevel
                value={answers.bp}
                onChange={(v) => setAnswers((a) => ({ ...a, bp: v }))}
                onNext={() => next("teeth")}
              />
            </FadeIn>
          )}
          {level === "teeth" && (
            <FadeIn key="teeth">
              <TeethLevel
                missing={answers.teethMissing}
                onChange={(v) => setAnswers((a) => ({ ...a, teethMissing: v }))}
                onNext={() => next("weight")}
              />
            </FadeIn>
          )}
          {level === "weight" && (
            <FadeIn key="weight">
              <WeightLevel
                value={answers.weight}
                onChange={(v) => setAnswers((a) => ({ ...a, weight: v }))}
                onSubmit={handleSubmit}
                saving={saving}
              />
            </FadeIn>
          )}
          {level === "summary" && (
            <FadeIn key="summary">
              <SummaryScreen
                answers={answers}
                onEdit={(target: Level) => setLevel(target)}
              />
            </FadeIn>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   SHARED COMPONENTS
   ═════════════════════════════════════════════ */

function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  );
}

function LevelHeader({
  number,
  title,
  subtitle,
  icon,
}: {
  number: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
        {icon}
        LEVEL {number}
      </div>
      <h2 className="text-2xl font-black text-white tracking-wider uppercase">
        {title}
      </h2>
      <p className="text-slate-400 text-sm mt-1 italic">{subtitle}</p>
    </div>
  );
}

function NextButton({ onClick, label = "LOCK IN →" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full mt-8 py-4 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-black text-lg rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
    >
      {label}
      <ChevronRight size={20} />
    </button>
  );
}

/* ═════════════════════════════════════════════
   INTRO
   ═════════════════════════════════════════════ */

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      {/* Glowing skull */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-pink-500/30 blur-3xl rounded-full" />
        <div className="relative w-24 h-24 bg-slate-800 border-2 border-pink-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.3)]">
          <Skull size={48} className="text-pink-500" />
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent mb-2">
        LIPID LOTTO
      </h1>
      <h2 className="text-xl font-black text-pink-500 tracking-widest uppercase mb-4">
        SYSTEM FAILURE
      </h2>
      <p className="text-slate-400 text-sm max-w-xs leading-relaxed mb-2">
        A multi-level diagnostic of one man&apos;s health. Guess right, win the pot.
        Guess wrong, buy him soup.
      </p>
      <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-10">
        Entry Fee: $2.00 &bull; Winner Takes All
      </p>

      <button
        onClick={onStart}
        className="group relative px-10 py-4 bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-black text-lg rounded-lg uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:shadow-[0_0_50px_rgba(0,240,255,0.5)]"
      >
        <Play size={20} className="inline mr-2" />
        BEGIN DIAGNOSTIC
      </button>
    </div>
  );
}

/* ═════════════════════════════════════════════
   LEVEL 1 — CHOLESTEROL (Range Slider)
   ═════════════════════════════════════════════ */

function CholesterolLevel({
  value,
  onChange,
  onNext,
}: {
  value: number;
  onChange: (v: number) => void;
  onNext: () => void;
}) {
  const pct = ((value - 150) / (400 - 150)) * 100;
  const isDanger = value > 320;

  return (
    <div>
      <LevelHeader
        number={1}
        title="THE GREASE GAUGE"
        subtitle="How clogged are the pipes?"
        icon={<Activity size={12} />}
      />

      {/* Big Number */}
      <div className="text-center mb-8">
        <span
          className={`text-8xl font-black tabular-nums tracking-tighter transition-colors duration-300 ${
            isDanger ? "text-pink-500" : "text-cyan-400"
          }`}
        >
          {value}
        </span>
        <div className="text-sm text-slate-500 font-bold tracking-widest uppercase mt-1">
          mg/dL Total Cholesterol
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mb-4">
        <motion.div
          className={`h-full rounded-full transition-colors duration-300 ${
            isDanger ? "bg-pink-500" : "bg-cyan-400"
          }`}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
        {/* Line marker at 320 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
          style={{ left: `${((320 - 150) / (400 - 150)) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-600 font-bold mb-6">
        <span>150</span>
        <span className="text-yellow-400">LINE: 320</span>
        <span>400</span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={150}
        max={400}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 appearance-none bg-slate-700 rounded-full cursor-pointer accent-cyan-400
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(0,240,255,0.6)] [&::-webkit-slider-thumb]:cursor-grab"
      />

      <NextButton onClick={onNext} />
    </div>
  );
}

/* ═════════════════════════════════════════════
   LEVEL 2 — BLOOD PRESSURE (Pump Button)
   ═════════════════════════════════════════════ */

function BloodPressureLevel({
  value,
  onChange,
  onNext,
}: {
  value: number;
  onChange: (v: number) => void;
  onNext: () => void;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const decayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Decay: slowly drop BP when not pumping
  useEffect(() => {
    decayRef.current = setInterval(() => {
      const next = Math.max(100, valueRef.current - 1);
      onChange(next);
    }, 150);
    return () => {
      if (decayRef.current) clearInterval(decayRef.current);
    };
  }, [onChange]);

  const startPump = useCallback(() => {
    // Pause decay while pumping
    if (decayRef.current) clearInterval(decayRef.current);

    intervalRef.current = setInterval(() => {
      const next = Math.min(240, valueRef.current + 3);
      onChange(next);
    }, 50);
  }, [onChange]);

  const stopPump = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Resume decay
    decayRef.current = setInterval(() => {
      const next = Math.max(100, valueRef.current - 1);
      onChange(next);
    }, 150);
  }, [onChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (decayRef.current) clearInterval(decayRef.current);
    };
  }, []);

  const pct = ((value - 100) / (240 - 100)) * 100;
  const isDanger = value > 160;
  const isCritical = value > 200;

  return (
    <div>
      <LevelHeader
        number={2}
        title="HEMODYNAMIC STRESS"
        subtitle="Pump it up. Stop at your guess."
        icon={<Heart size={12} />}
      />

      {/* BP Number */}
      <div className="text-center mb-6">
        <span
          className={`text-8xl font-black tabular-nums tracking-tighter transition-colors duration-200 ${
            isCritical
              ? "text-pink-500 animate-pulse"
              : isDanger
                ? "text-pink-400"
                : "text-cyan-400"
          }`}
        >
          {value}
        </span>
        <div className="text-sm text-slate-500 font-bold tracking-widest uppercase mt-1">
          Systolic mmHg
        </div>
      </div>

      {/* Vertical Pressure Bar */}
      <div className="flex justify-center mb-8">
        <div className="relative w-16 h-64 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {/* Fill */}
          <motion.div
            className={`absolute bottom-0 left-0 right-0 rounded-b-xl transition-colors duration-200 ${
              isCritical ? "bg-pink-500" : isDanger ? "bg-pink-400/80" : "bg-cyan-400"
            }`}
            animate={{ height: `${pct}%` }}
            transition={{ type: "tween", duration: 0.05 }}
          />
          {/* Tick marks */}
          {[120, 140, 160, 180, 200, 220].map((tick) => {
            const tickPct = ((tick - 100) / (240 - 100)) * 100;
            return (
              <div
                key={tick}
                className="absolute left-0 w-full flex items-center"
                style={{ bottom: `${tickPct}%` }}
              >
                <div className="w-3 h-px bg-slate-600" />
                <span className="text-[8px] text-slate-600 ml-1">{tick}</span>
              </div>
            );
          })}
          {/* Danger zone marker */}
          <div
            className="absolute left-0 w-full h-px bg-pink-500/50 border-t border-dashed border-pink-500/30"
            style={{ bottom: `${((160 - 100) / (240 - 100)) * 100}%` }}
          />
        </div>
      </div>

      {/* Warning Text */}
      {isDanger && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-pink-500 text-xs font-bold uppercase tracking-widest mb-4 animate-pulse"
        >
          ⚠ VESSEL INTEGRITY COMPROMISED
        </motion.div>
      )}

      {/* Pump Button */}
      <div className="flex justify-center mb-4">
        <button
          onMouseDown={startPump}
          onMouseUp={stopPump}
          onMouseLeave={stopPump}
          onTouchStart={startPump}
          onTouchEnd={stopPump}
          className="w-28 h-28 rounded-full bg-slate-800 border-4 border-cyan-400 text-cyan-400 font-black text-lg shadow-[0_0_30px_rgba(0,240,255,0.3)] active:scale-90 active:bg-cyan-400 active:text-slate-900 transition-all select-none touch-none"
        >
          PUMP
        </button>
      </div>
      <p className="text-center text-slate-500 text-xs mb-2">
        Hold to raise. Release to let it fall. Lock in at the right moment.
      </p>

      <NextButton onClick={onNext} label="LOCK IN READING →" />
    </div>
  );
}

/* ═════════════════════════════════════════════
   LEVEL 3 — TEETH (Toggle Missing)
   ═════════════════════════════════════════════ */

function TeethLevel({
  missing,
  onChange,
  onNext,
}: {
  missing: number;
  onChange: (v: number) => void;
  onNext: () => void;
}) {
  const [teeth, setTeeth] = useState([true, true, true, true, true]); // true = healthy

  const toggleTooth = (i: number) => {
    const next = [...teeth];
    next[i] = !next[i];
    setTeeth(next);
    onChange(next.filter((t) => !t).length);
  };

  return (
    <div>
      <LevelHeader
        number={3}
        title="SURGICAL REVIEW"
        subtitle="The stress made me grind. The dentist saw dollar signs."
        icon={<Skull size={12} />}
      />

      <p className="text-center text-slate-400 text-sm mb-8">
        Tap a tooth to extract it. How many did the dentist take?
      </p>

      {/* Teeth Row */}
      <div className="flex justify-center gap-3 mb-8">
        {teeth.map((healthy, i) => (
          <motion.button
            key={i}
            onClick={() => toggleTooth(i)}
            whileTap={{ scale: 0.85 }}
            className={`relative w-14 h-20 rounded-md border-2 transition-all duration-200 flex items-center justify-center text-2xl font-black ${
              healthy
                ? "bg-cyan-400/10 border-cyan-400 text-cyan-400 hover:bg-cyan-400/20 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                : "bg-pink-500/10 border-pink-500 text-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)]"
            }`}
          >
            {healthy ? (
              <span className="text-3xl">🦷</span>
            ) : (
              <span className="text-3xl">✕</span>
            )}
            {/* Tooth number */}
            <span className="absolute bottom-1 text-[8px] opacity-50">
              #{i + 1}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Counter */}
      <div className="text-center mb-4">
        <div className="inline-block bg-slate-800 border border-slate-700 rounded-xl px-8 py-4">
          <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">
            UNITS EXTRACTED
          </div>
          <span
            className={`text-5xl font-black tabular-nums ${
              missing > 0 ? "text-pink-500" : "text-cyan-400"
            }`}
          >
            {missing}
          </span>
        </div>
      </div>

      <NextButton onClick={onNext} />
    </div>
  );
}

/* ═════════════════════════════════════════════
   LEVEL 4 — WEIGHT (+/- Buttons)
   ═════════════════════════════════════════════ */

function WeightLevel({
  value,
  onChange,
  onSubmit,
  saving,
}: {
  value: number;
  onChange: (v: number) => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  const adjust = (delta: number) => {
    onChange(Math.max(80, Math.min(350, value + delta)));
  };

  return (
    <div>
      <LevelHeader
        number={4}
        title="BIOMASS AUDIT"
        subtitle="What's the gravitational load?"
        icon={<Scale size={12} />}
      />

      {/* Weight Display */}
      <div className="text-center mb-8">
        <span className="text-8xl font-black tabular-nums tracking-tighter text-white">
          {value}
        </span>
        <div className="text-sm text-slate-500 font-bold tracking-widest uppercase mt-1">
          LBS
        </div>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto mb-4">
        <WeightBtn label="-5" onClick={() => adjust(-5)} variant="down" />
        <WeightBtn label="-1" onClick={() => adjust(-1)} variant="down" />
        <WeightBtn label="+1" onClick={() => adjust(1)} variant="up" />
        <WeightBtn label="+5" onClick={() => adjust(5)} variant="up" />
      </div>

      {/* Visual Scale */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-xs h-3 bg-slate-800 rounded-full border border-slate-700 overflow-hidden">
          <motion.div
            className="h-full bg-cyan-400 rounded-full"
            animate={{ width: `${((value - 80) / (350 - 80)) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>
      <div className="flex justify-between max-w-xs mx-auto text-[10px] text-slate-600 font-bold mb-8">
        <span>80 lbs</span>
        <span>350 lbs</span>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={saving}
        className="w-full py-4 bg-pink-500 hover:bg-pink-400 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black text-lg rounded-lg uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] flex items-center justify-center gap-2"
      >
        <Lock size={20} />
        {saving ? "SUBMITTING..." : "SUBMIT BET — FINAL ANSWER"}
      </button>
    </div>
  );
}

function WeightBtn({
  label,
  onClick,
  variant,
}: {
  label: string;
  onClick: () => void;
  variant: "up" | "down";
}) {
  return (
    <button
      onClick={onClick}
      className={`py-3 rounded-lg font-black text-lg transition-all active:scale-90 ${
        variant === "up"
          ? "bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20"
          : "bg-pink-500/10 border border-pink-500/30 text-pink-500 hover:bg-pink-500/20"
      }`}
    >
      {label}
    </button>
  );
}

/* ═════════════════════════════════════════════
   SUMMARY / RECEIPT
   ═════════════════════════════════════════════ */

function SummaryScreen({ answers, onEdit }: { answers: Answers; onEdit?: (level: Level) => void }) {
  const rows: { label: string; value: string; icon: string; editLevel: Level }[] = [
    { label: "Cholesterol", value: `${answers.cholesterol} mg/dL`, icon: "🩸", editLevel: "cholesterol" },
    { label: "Blood Pressure", value: `${answers.bp} mmHg`, icon: "💉", editLevel: "bp" },
    { label: "Teeth Lost", value: `${answers.teethMissing}`, icon: "🦷", editLevel: "teeth" },
    { label: "Weight", value: `${answers.weight} lbs`, icon: "⚖️", editLevel: "weight" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="mb-6"
      >
        <div className="w-20 h-20 bg-cyan-400/10 border-2 border-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)]">
          <CheckCircle2 size={40} className="text-cyan-400" />
        </div>
      </motion.div>

      <h2 className="text-2xl font-black text-cyan-400 tracking-wider uppercase mb-1">
        BET RECORDED
      </h2>
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-8">
        System Failure Diagnostic Complete
      </p>

      {/* Receipt Card */}
      <div className="w-full max-w-sm bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden">
        <div className="bg-slate-800 px-5 py-3 border-b border-slate-700">
          <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
            PATIENT RECEIPT
          </div>
        </div>
        <div className="divide-y divide-slate-700/50">
          {rows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{row.icon}</span>
                <span className="text-sm text-slate-300 font-medium">
                  {row.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white font-mono">
                  {row.value}
                </span>
                {onEdit && (
                  <button
                    onClick={() => onEdit(row.editLevel)}
                    className="text-[10px] font-bold text-cyan-400 border border-cyan-400/40 px-2 py-0.5 rounded hover:bg-cyan-400/10 transition-colors uppercase tracking-wider"
                  >
                    EDIT
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="bg-slate-800 px-5 py-3 border-t border-slate-700 text-center">
          <span className="text-[10px] text-slate-500 italic">
            Good luck. You&apos;ll need it.
          </span>
        </div>
      </div>
    </div>
  );
}
