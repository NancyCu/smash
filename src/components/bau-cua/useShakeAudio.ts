"use client";

import { useRef, useCallback, useEffect } from "react";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useShakeAudio() {
  const shake1Ref = useRef<HTMLAudioElement | null>(null);
  const shake2Ref = useRef<HTMLAudioElement | null>(null);
  const chimeRef = useRef<HTMLAudioElement | null>(null);
  const thudRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload audio
    shake1Ref.current = new Audio("/sounds/Shake_1.m4a");
    shake2Ref.current = new Audio("/sounds/Shake_2.m4a");

    // We can keep synthesized chime/thud or replace them. 
    // The prompt only mentioned changing the shake sound. 
    // But since we are here, let's just keep the synthesized ones as fallbacks 
    // or use the original synthesized code for thud/chime if the user didn't provide files for those.
    // The prompt says "I want to change the sound that you have now for the shaking".
    // So we will keep thud and chime as synthesized or maybe just silence them if the shake audio includes everything?
    // "Shake one and then shake two... the dealer can push any button... animation to be more slowly like you're picking up the entire plate and shaking it once, twice, and third."
    // Usually these clips might have the "thud" at the end? 
    // Let's assume the shake files are just the shaking sound. 
    // I'll stick to the plan: modify to play shake 1 or 2.

    // Re-implementing simplified synthesized Thud/Chime for consistency if needed, 
    // but the file-based approach is cleaner for the main shakes.
  }, []);

  const ctxRef = useRef<AudioContext | null>(null);

  // Lazy-init AudioContext for Thud/Chime (legacy/backup)
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);


  // ------------------------------- Shake -----------------------------------

  /** Play one of the two shake sounds. */
  const startShake = useCallback((type: 1 | 2 = 1) => {
    const audio = type === 1 ? shake1Ref.current : shake2Ref.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.warn("Audio play failed", e));
    }
  }, []);

  /** Stop the shaking noise (fade out or cut). */
  const stopShake = useCallback(() => {
    // For file based, we might just let it finish or pause it?
    // The user said "Shake one and then shake two... each time it calls a random function to shake shake shake... animation to be more slowly... picking up the entire plate and shaking it once, twice, and third."
    // The audio probably matches the "once, twice, third" length. 
    // If we stop it abruptly it might sound bad. 
    // But the original code had a stopShake. 
    // Let's pause and reset.
    [shake1Ref.current, shake2Ref.current].forEach(a => {
      if (a) {
        a.pause();
        a.currentTime = 0;
      }
    });
  }, []);

  // ------------------------------- Thud ------------------------------------

  /** One-shot "bowl hits plate" low thud. */
  const playThud = useCallback(() => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }, [getCtx]);

  // ------------------------------- Chime -----------------------------------

  /** One-shot "celestial success" chime. */
  const playChime = useCallback(() => {
    const ctx = getCtx();
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.3);
    });
  }, [getCtx]);

  // Cleanup
  useEffect(() => {
    return () => {
      try { ctxRef.current?.close(); } catch { /* noop */ }
    };
  }, []);

  return { startShake, stopShake, playThud, playChime };
}

