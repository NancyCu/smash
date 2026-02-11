"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

/* ────────────────────────────────────────────────────────
   Sine-Wave Curve Math
   One shared function drives both the SVG tube shape and
   the HTML marker overlay so they always agree.
   ──────────────────────────────────────────────────────── */
const SVG_W = 600;
const SVG_H = 200;
const SVG_CENTER_Y = 100;
const SVG_AMPLITUDE = 40; // amplitude in SVG-viewBox units

/** Return the Y-offset (in SVG units) for a given x-percent 0–100 */
const getCurveY = (xPercent: number): number =>
  Math.sin((xPercent / 100) * Math.PI * 2) * SVG_AMPLITUDE;

/** Build an SVG polyline path that follows the sine wave */
const generateSinePath = (): string => {
  const pts: string[] = [];
  for (let x = 0; x <= SVG_W; x += 2) {
    const y = SVG_CENTER_Y + getCurveY((x / SVG_W) * 100);
    pts.push(x === 0 ? `M${x},${y}` : `L${x},${y}`);
  }
  return pts.join(" ");
};

const ARTERY_PATH_D = generateSinePath();

/* ────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────── */
interface ArteryVisualizerProps {
  currentValue: number;
  limitLine?: number;
  onChange: (value: number) => void;
  marker?: "sandal" | "sriracha";
}

const MIN_VAL = 100;
const MAX_VAL = 600;

export default function ArteryVisualizer({
  currentValue,
  limitLine = 385,
  onChange,
  marker = "sandal",
}: ArteryVisualizerProps) {
  /* ── refs & measured size ── */
  const containerRef = useRef<HTMLDivElement>(null);
  const [cSize, setCSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setCSize({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── auto-scan yoyo ── */
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!isAutoPlaying) {
      cancelAnimationFrame(animRef.current);
      return;
    }
    const tick = () => {
      const t = Date.now() / 2000;
      const n = (Math.sin(t) + 1) / 2;
      onChange(Math.round(MIN_VAL + n * (MAX_VAL - MIN_VAL)));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isAutoPlaying, onChange]);

  const handleStart = () => {
    setIsAutoPlaying(false);
    setIsInteracting(true);
  };
  const handleEnd = () => setIsInteracting(false);

  /* ── derived values ── */
  const percentage = Math.max(
    0,
    Math.min((currentValue - MIN_VAL) / (MAX_VAL - MIN_VAL), 1)
  );
  const isDanger = currentValue > 400;
  const isWarning = currentValue > 250 && currentValue <= 400;

  const maxStroke = 80;
  const bloodStrokeWidth = Math.max(5, maxStroke - percentage * (maxStroke - 2));

  const wallColorMain = isDanger
    ? "#450a0a"
    : isWarning
      ? "#7f1d1d"
      : "#691e2c";
  const wallColorHighlight = isDanger
    ? "#991b1b"
    : isWarning
      ? "#b91c1c"
      : "#be123c";

  const plateletBase = isDanger ? 12 : 4;

  /* ── status copy ── */
  let statusMsg = "";
  let riskLabel = "";
  if (percentage < 0.3) {
    statusMsg = "You eat it, you suffer, but you live. 'Cools the blood'.";
    riskLabel = "Safe (Khổ Qua)";
  } else if (percentage < 0.6) {
    statusMsg = "Delicious, but it speeds up the inheritance process.";
    riskLabel = "Risky (Nước Béo)";
  } else {
    statusMsg =
      "Your blood has the consistency of cold gravy. Say hi to Grandpa.";
    riskLabel = "GẶP ÔNG BÀ SOON";
  }

  /* ────────────────────────────────────────────────────
     Marker position (pixel-perfect on the sine curve)
     Maps the SVG viewBox to the container's actual size,
     accounting for preserveAspectRatio="xMidYMid meet".
     ──────────────────────────────────────────────────── */
  const markerPos = useMemo(() => {
    if (cSize.w === 0) return { x: 0, y: 0 };

    const svgAspect = SVG_W / SVG_H; // 3
    const boxAspect = cSize.w / cSize.h;

    let rw: number, rh: number, ox: number, oy: number;
    if (boxAspect > svgAspect) {
      // height-limited
      rh = cSize.h;
      rw = rh * svgAspect;
      ox = (cSize.w - rw) / 2;
      oy = 0;
    } else {
      // width-limited (common on phones)
      rw = cSize.w;
      rh = rw / svgAspect;
      ox = 0;
      oy = (cSize.h - rh) / 2;
    }

    const svgX = percentage * SVG_W;
    const svgY = SVG_CENTER_Y + getCurveY(percentage * 100);

    return {
      x: ox + (svgX / SVG_W) * rw,
      y: oy + (svgY / SVG_H) * rh,
    };
  }, [percentage, cSize]);

  /* ────────────────────────────────────────────────────
     Limit Line Position (Static 385)
     ──────────────────────────────────────────────────── */
  const limitPos = useMemo(() => {
    if (cSize.w === 0) return { x: 0, y: 0 };

    const svgAspect = SVG_W / SVG_H;
    const boxAspect = cSize.w / cSize.h;
    let rw: number, rh: number, ox: number, oy: number;
    
    if (boxAspect > svgAspect) {
      rh = cSize.h; rw = rh * svgAspect; ox = (cSize.w - rw) / 2; oy = 0;
    } else {
      rw = cSize.w; rh = rw / svgAspect; ox = 0; oy = (cSize.h - rh) / 2;
    }

    const p = Math.max(0, Math.min((limitLine - MIN_VAL) / (MAX_VAL - MIN_VAL), 1));
    const svgX = p * SVG_W;
    const svgY = SVG_CENTER_Y + getCurveY(p * 100);

    return {
      x: ox + (svgX / SVG_W) * rw,
      y: oy + (svgY / SVG_H) * rh,
    };
  }, [limitLine, cSize]);

  /* ── edge-awareness for the info bubble ── */
  const isLeftEdge = percentage < 0.15;
  const isRightEdge = percentage > 0.85;

  const markerEmoji = marker === "sriracha" ? "🌶️" : "🩴";

  /* ────────────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────────────── */
  return (
    <div className="w-full px-4 py-2 select-none relative z-10">
      <div className="w-full bg-[#0B0C15] rounded-xl border border-white/10 shadow-2xl font-sans relative overflow-visible pb-6 z-10">
        {/* BIG BACKGROUND NUMBER */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-[0.15] flex flex-col items-center">
          <span
            className={`text-8xl font-black tabular-nums tracking-tighter transition-colors duration-300 ${isDanger ? "text-red-500" : "text-white"}`}
          >
            {currentValue}
          </span>
          <span className="text-sm font-bold uppercase tracking-widest text-white/50">
            mg/dL
          </span>
        </div>

        {/* Header: Team labels */}
        <div className="flex justify-between items-end px-4 pt-4 pb-0 tracking-wide font-black uppercase z-20 relative pointer-events-none">
          <div className="text-emerald-400 text-xs flex flex-col">
            <span className="opacity-50 text-[10px] italic">
              Bitter Melon (Suffering Past)
            </span>
            <span className="text-sm">TEAM KHỔ QUA</span>
          </div>
          <div className="text-red-500 text-xs flex flex-col items-end">
            <span className="opacity-50 text-[10px] italic">
              Fatty Broth (Guilty Pleasure)
            </span>
            <span className="text-sm">TEAM NƯỚC BÉO</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            ARTERY CONTAINER  (extra height + padding so
            the marker + bubble are never clipped)
            ════════════════════════════════════════════════ */}
        <div
          ref={containerRef}
          className="relative w-full mt-6 mb-2 overflow-visible"
          style={{ height: 220, paddingLeft: 12, paddingRight: 12 }}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Lumpy crusty plaque */}
              <filter
                id="plaqueTexture"
                x="-10%"
                y="-10%"
                width="120%"
                height="120%"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.15"
                  numOctaves="4"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="12"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
              {/* Organic vein texture */}
              <filter id="veinTexture">
                <feTurbulence
                  type="turbulence"
                  baseFrequency="0.05"
                  numOctaves="2"
                  result="turbulence"
                />
                <feDisplacementMap
                  in2="turbulence"
                  in="SourceGraphic"
                  scale="5"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
              {/* Jagged torn edges */}
              <clipPath id="jaggedEnds">
                <path d="M10,0 L600,0 L590,20 L600,40 L590,60 L600,80 L590,100 L600,120 L590,140 L600,160 L590,180 L600,200 L0,200 L10,180 L0,160 L10,140 L0,120 L10,100 L0,80 L10,60 L0,40 L10,20 L0,0 Z" />
              </clipPath>
              <path id="arteryPath" d={ARTERY_PATH_D} fill="none" />
            </defs>

            <g clipPath="url(#jaggedEnds)">
              {/* Outer walls */}
              <g
                className={
                  isDanger
                    ? "animate-[pulse_0.2s_ease-in-out_infinite]"
                    : "animate-[pulse_3s_ease-in-out_infinite]"
                }
              >
                <use
                  href="#arteryPath"
                  stroke={wallColorMain}
                  strokeWidth="110"
                  strokeLinecap="butt"
                  filter="url(#veinTexture)"
                  className="opacity-90 transition-colors duration-500"
                />
                <use
                  href="#arteryPath"
                  stroke={wallColorHighlight}
                  strokeWidth="100"
                  strokeLinecap="butt"
                  className="opacity-40 transition-colors duration-500"
                />
              </g>

              {/* Yellow crusty plaque */}
              <use
                href="#arteryPath"
                stroke="#facc15"
                strokeWidth={90}
                strokeLinecap="butt"
                filter="url(#plaqueTexture)"
                className="drop-shadow-lg"
              />

              {/* Blood flow */}
              <use
                href="#arteryPath"
                stroke="#7f1d1d"
                strokeWidth={bloodStrokeWidth}
                strokeLinecap="round"
                className="transition-[stroke-width] duration-75 ease-linear"
              />

              {/* Platelets & blood cells */}
              <g>
                {[...Array(6)].map((_, i) => (
                  <circle
                    key={`rbc-${i}`}
                    r={4 + (i % 3)}
                    fill="#ef4444"
                    opacity="0.8"
                  >
                    <animateMotion
                      dur={`${plateletBase + i}s`}
                      repeatCount="indefinite"
                      path={ARTERY_PATH_D}
                      begin={`-${i * 1.5}s`}
                      keyPoints="0;1"
                      keyTimes="0;1"
                      calcMode="linear"
                    />
                  </circle>
                ))}
                {[...Array(4)].map((_, i) => (
                  <ellipse
                    key={`wbc-${i}`}
                    rx="4"
                    ry="3"
                    fill="#fecaca"
                    opacity="0.6"
                  >
                    <animateMotion
                      dur={`${plateletBase + 2 + i}s`}
                      repeatCount="indefinite"
                      path={ARTERY_PATH_D}
                      begin={`-${i * 2}s`}
                      rotate="auto"
                      keyPoints="0;1"
                      keyTimes="0;1"
                      calcMode="linear"
                    />
                  </ellipse>
                ))}
              </g>
            </g>
          </svg>

          {/* ════════════════════════════════════════════
              LIMIT LINE INDICATOR (Static 385 Mark)
              ════════════════════════════════════════════ */}
          {cSize.w > 0 && (
            <div
              className="absolute pointer-events-none flex flex-col items-center"
              style={{
                left: limitPos.x,
                top: limitPos.y,
                transform: "translate(-50%, -50%)",
                zIndex: 35, // Below marker (50) but above tube text
              }}
            >
              {/* Vertical Dashed Line */}
              <div className="w-px h-32 bg-gradient-to-b from-white/0 via-yellow-400/50 to-white/0 dashed-line" />
              
              {/* Limit Label Bubble */}
              <div className="absolute top-[-30px] flex flex-col items-center">
                 <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/50 px-2 py-0.5 rounded text-[9px] font-bold text-yellow-200 uppercase tracking-wider shadow-lg whitespace-nowrap">
                   LIMIT: {limitLine}
                 </div>
                 <div className="w-px h-8 border-l border-dashed border-yellow-500/50 mt-1"></div>
                 {/* Dot on the line */}
                 <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)] mt-[-5px]"></div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════
              MARKER — rides the sine curve, z-50
              ════════════════════════════════════════════ */}
          {cSize.w > 0 && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: markerPos.x,
                top: markerPos.y,
                transform: "translate(-50%, -50%)",
                zIndex: 50,
              }}
            >
              {/* ── info bubble (above marker) ── */}
              <div
                className={`absolute bottom-full mb-3 min-w-[130px] p-2.5 rounded-xl border-2 backdrop-blur-md transition-all duration-200 ${
                  isLeftEdge
                    ? "left-0"
                    : isRightEdge
                      ? "right-0"
                      : "left-1/2 -translate-x-1/2"
                } ${
                  isDanger
                    ? "bg-black/90 border-red-500 shadow-[0_8px_30px_-5px_rgba(239,68,68,0.4)]"
                    : "bg-black/90 border-emerald-500 shadow-[0_8px_30px_-5px_rgba(16,185,129,0.4)]"
                }`}
              >
                <div
                  className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isDanger ? "text-red-400" : "text-emerald-400"}`}
                >
                  {!isAutoPlaying && !isInteracting
                    ? "BET LOCKED"
                    : "ANALYZING..."}
                </div>
                <div className="flex items-baseline gap-1 text-white">
                  <span className="text-2xl font-black font-mono tracking-tighter leading-none">
                    {currentValue}
                  </span>
                  <span className="text-[9px] font-bold opacity-60">mg/dL</span>
                </div>
                {!isAutoPlaying && !isInteracting && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[9px] font-medium text-white/80">
                    {isDanger
                      ? "WARNING: MÁ IS WATCHING."
                      : "CONFIRM THIS NUMBER?"}
                  </div>
                )}
                {/* Pointer triangle */}
                <div
                  className={`absolute bottom-[-7px] w-3.5 h-3.5 bg-black border-r-2 border-b-2 rotate-45 ${
                    isDanger ? "border-red-500" : "border-emerald-500"
                  } ${isLeftEdge ? "left-5" : isRightEdge ? "right-5" : "left-1/2 -translate-x-1/2"}`}
                />
              </div>

              {/* ── glowing marker circle + icon ── */}
              <motion.div
                className="relative w-12 h-12 flex items-center justify-center"
                animate={
                  isDanger
                    ? {
                        x: [0, -5, 5, -4, 4, -2, 2, 0],
                        rotate: [0, -12, 12, -8, 8, -4, 4, 0],
                      }
                    : { x: 0, rotate: 0 }
                }
                transition={
                  isDanger
                    ? {
                        repeat: Infinity,
                        duration: 0.15,
                        ease: "easeInOut",
                      }
                    : { duration: 0.3 }
                }
              >
                {/* Outer glow */}
                <div
                  className={`absolute inset-[-6px] rounded-full blur-lg transition-colors duration-300 ${isDanger ? "bg-red-500/50" : "bg-emerald-500/40"}`}
                />
                {/* Inner circle */}
                <div
                  className={`relative w-12 h-12 rounded-full border-[3px] flex items-center justify-center text-2xl shadow-xl transition-all duration-300 ${
                    isDanger
                      ? "bg-red-950 border-red-500 shadow-red-500/50"
                      : "bg-emerald-950 border-emerald-400 shadow-emerald-400/50"
                  }`}
                >
                  {markerEmoji}
                </div>
              </motion.div>

              {/* ── dashed guideline below marker ── */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                <div
                  className={`w-px h-8 ${isDanger ? "border-l-2 border-dashed border-red-500/50" : "border-l-2 border-dashed border-emerald-400/50"}`}
                />
                <div
                  className={`mt-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                    isDanger
                      ? "bg-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                      : "bg-emerald-500/20 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                  }`}
                >
                  {currentValue} mg/dL
                </div>
              </div>
            </div>
          )}

          {/* ── Hidden range input (on top for touch/drag) ── */}
          <input
            type="range"
            min={MIN_VAL}
            max={MAX_VAL}
            value={currentValue}
            onChange={(e) => onChange(Number(e.target.value))}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            onMouseUp={handleEnd}
            onTouchEnd={handleEnd}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
            style={{ zIndex: 200 }}
          />
        </div>

        {/* Status Footer */}
        <div className="px-4 mt-2 text-center pointer-events-none relative z-20">
          <div className="mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded transition-all duration-300 ${
                percentage < 0.3
                  ? "bg-emerald-500/20 text-emerald-400"
                  : percentage < 0.6
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-900 text-red-100 animate-pulse border border-red-500"
              }`}
            >
              STATUS: {riskLabel}
            </span>
          </div>
          <p
            className={`text-sm font-medium italic transition-colors duration-300 ${isDanger ? "text-red-400 font-black drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "text-slate-400"}`}
          >
            &ldquo;{statusMsg}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
