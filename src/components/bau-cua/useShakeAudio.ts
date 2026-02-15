/**
 * useShakeAudio – Web Audio API synthesiser for the Bau Cua shaker.
 *
 * Generates three sounds entirely in-code (no external audio files):
 *   1. Shaking  – band-passed white noise loop (rattling dice in a bowl)
 *   2. Chime    – layered sine-wave harmonics with smooth decay (reveal)
 *   3. Thud     – low-frequency transient (bowl hitting plate)
 */
"use client";

import { useRef, useCallback, useEffect } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a buffer of white noise (1 second, mono). */
function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate; // 1s
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useShakeAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const noiseRef = useRef<AudioBuffer | null>(null);
  const shakeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const shakeGainRef = useRef<GainNode | null>(null);

  // Lazy-init AudioContext (must be triggered by user gesture on mobile)
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

  /** Start the looped "dice rattling" noise. */
  const startShake = useCallback(() => {
    const ctx = getCtx();

    // Create noise buffer once
    if (!noiseRef.current) {
      noiseRef.current = createNoiseBuffer(ctx);
    }

    // Source
    const src = ctx.createBufferSource();
    src.buffer = noiseRef.current;
    src.loop = true;

    // Band-pass filter to sound like clatter (1200-3400 Hz)
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2200;
    bp.Q.value = 1.4;

    // Gain (volume)
    const gain = ctx.createGain();
    gain.gain.value = 0.35;

    src.connect(bp).connect(gain).connect(ctx.destination);
    src.start();

    shakeSourceRef.current = src;
    shakeGainRef.current = gain;
  }, [getCtx]);

  /** Stop the shaking noise with a quick fade-out. */
  const stopShake = useCallback(() => {
    const ctx = ctxRef.current;
    const gain = shakeGainRef.current;
    const src = shakeSourceRef.current;
    if (!ctx || !gain || !src) return;

    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
    setTimeout(() => {
      try { src.stop(); } catch { /* already stopped */ }
      shakeSourceRef.current = null;
      shakeGainRef.current = null;
    }, 200);
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

    // Three harmonious tones
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { shakeSourceRef.current?.stop(); } catch { /* noop */ }
      try { ctxRef.current?.close(); } catch { /* noop */ }
    };
  }, []);

  return { startShake, stopShake, playThud, playChime };
}
