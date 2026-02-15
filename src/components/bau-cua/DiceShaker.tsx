/**
 * DiceShaker – 3D Bau Cua bowl-and-dice scene powered by @react-three/fiber.
 *
 * State machine: IDLE → SHAKING → ROLLED (hidden) → REVEALED
 *
 * Props
 * ─────
 *  trigger        — increment this number to start a new shake sequence
 *  shakeType      — 1 or 2, determines sound and perhaps nuance of animation
 *  onRollComplete — called with [n, n, n] (0-5) once the bowl is fully lifted
 *  disabled       — prevents new shakes from starting
 *
 * Usage
 * ─────
 *  const [trigger, setTrigger] = useState(0);
 *  <DiceShaker trigger={trigger} shakeType={1} onRollComplete={handleResult} />
 *  <button onClick={() => setTrigger(t => t + 1)}>SHAKE</button>
 */
"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { secureRoll } from "@/lib/secure-roll";
import { useShakeAudio } from "./useShakeAudio";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type ShakerState = "IDLE" | "SHAKING" | "ROLLED" | "REVEALED";

/** Duration of each phase (seconds). */
const SHAKE_DURATION = 3.0; // Slower, "once twice third"
const ROLL_PAUSE = 0.25; // brief pause before bowl lifts
const REVEAL_DURATION = 1.4;

/** Emoji per animal index (matches ANIMALS array in bau-cua page). */
const ANIMAL_EMOJI = ["🦌", "🍐", "🐓", "🐟", "🦀", "🦐"];
const ANIMAL_LABEL = ["Nai", "Bầu", "Gà", "Cá", "Cua", "Tôm"];

/**
 * Euler rotation (x, y, z) that places each face index on the +Y (top) side
 * of a standard THREE.BoxGeometry.
 *
 * Material mapping: [+X, -X, +Y, -Y, +Z, -Z] → indices [0..5]
 *
 * Derivation checked against Three.js rotation matrices:
 *  0 (+X → top): Z = +π/2
 *  1 (-X → top): Z = -π/2
 *  2 (+Y → top): identity
 *  3 (-Y → top): X = π
 *  4 (+Z → top): X = -π/2
 *  5 (-Z → top): X = +π/2
 */
const RESULT_ROTATIONS: [number, number, number][] = [
  [0, 0, Math.PI / 2], // 0 Deer
  [0, 0, -Math.PI / 2], // 1 Gourd
  [0, 0, 0], // 2 Chicken
  [Math.PI, 0, 0], // 3 Fish
  [-Math.PI / 2, 0, 0], // 4 Crab
  [Math.PI / 2, 0, 0], // 5 Shrimp
];

/** Small Y-axis spin per die so they don't all face the same way. */
const Y_OFFSETS = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];

/** Positions of the three dice sitting on the plate. */
const DICE_POSITIONS: [number, number, number][] = [
  [-0.7, 0.45, 0],
  [0.55, 0.45, -0.5],
  [0.35, 0.45, 0.6],
];

// ---------------------------------------------------------------------------
// Texture generation (canvas-based – no external files needed)
// ---------------------------------------------------------------------------

/** Render a single die face: black circle background with centred emoji. */
function renderFaceCanvas(emoji: string, label: string): HTMLCanvasElement {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, size, size);

  // Circular mask with gradient
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.44;

  const grad = ctx.createRadialGradient(cx, cy * 0.8, 0, cx, cy, r);
  grad.addColorStop(0, "#222222");
  grad.addColorStop(1, "#0a0a0a");

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle ring
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Emoji
  ctx.font = `${size * 0.45}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, cx, cy - 4);

  // Label
  ctx.font = `bold ${size * 0.08}px sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(label, cx, cy + r * 0.7);

  return canvas;
}

function buildFaceTextures(): THREE.CanvasTexture[] {
  return ANIMAL_EMOJI.map((emoji, i) => {
    const canvas = renderFaceCanvas(emoji, ANIMAL_LABEL[i]);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

// ---------------------------------------------------------------------------
// Sub-components (live inside <Canvas>)
// ---------------------------------------------------------------------------

/** The flat plate / platter the bowl sits on. */
function Plate() {
  return (
    <mesh position={[0, -0.08, 0]} receiveShadow>
      <cylinderGeometry args={[2.2, 2.3, 0.16, 48]} />
      <meshStandardMaterial
        color="#5C3A1E"
        roughness={0.35}
        metalness={0.1}
      />
    </mesh>
  );
}

/**
 * The ceramic bowl (inverted dome). Its Y position is animated upwards
 * during REVEALED state.
 */
function Bowl({
  liftProgress,
}: {
  liftProgress: number; // 0 = closed, 1 = fully lifted
}) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (!ref.current) return;
    // Lift + tilt animation (relative to the group)
    const y = THREE.MathUtils.lerp(0.05, 3.8, liftProgress);
    const tiltX = THREE.MathUtils.lerp(0, -0.45, liftProgress);
    const tiltZ = THREE.MathUtils.lerp(0, 0.2, liftProgress);

    ref.current.position.set(0, y, 0);
    ref.current.rotation.set(tiltX, 0, tiltZ);
  });

  return (
    <mesh ref={ref} castShadow>
      {/* Top hemisphere, opening faces down */}
      <sphereGeometry args={[1.7, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial
        color="#F0EBE0"
        roughness={0.18}
        metalness={0.35}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** A single die (cube with 6-face textures). */
function Die({
  index,
  resultIndex,
  state,
  faceTextures,
}: {
  index: number;
  resultIndex: number;
  state: ShakerState;
  faceTextures: THREE.CanvasTexture[];
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const targetRotRef = useRef(new THREE.Euler());

  // 6 materials, one per face
  const materials = useMemo(
    () =>
      faceTextures.map(
        (tex) =>
          new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.65,
            metalness: 0.05,
          }),
      ),
    [faceTextures],
  );

  // Snap target rotation when entering ROLLED
  useEffect(() => {
    if (state === "ROLLED" || state === "REVEALED") {
      const [rx, ry, rz] = RESULT_ROTATIONS[resultIndex];
      targetRotRef.current.set(rx, ry + Y_OFFSETS[index], rz);
    }
  }, [state, resultIndex, index]);

  useFrame((_, delta) => {
    if (!ref.current) return;

    const pos = DICE_POSITIONS[index];

    if (state === "SHAKING") {
      // Random jitter INSIDE the bowl (relative to plate)
      // Since the whole group moves, we just need small local rattle
      ref.current.position.set(
        pos[0] + (Math.random() - 0.5) * 0.1,
        pos[1] + (Math.random() - 0.5) * 0.1,
        pos[2] + (Math.random() - 0.5) * 0.1,
      );
      ref.current.rotation.x += (Math.random() - 0.5) * 0.8;
      ref.current.rotation.y += (Math.random() - 0.5) * 0.8;
      ref.current.rotation.z += (Math.random() - 0.5) * 0.8;
    } else if (state === "ROLLED" || state === "REVEALED") {
      // Smoothly interpolate to target rotation
      const speed = 12 * delta;
      ref.current.rotation.x = THREE.MathUtils.lerp(
        ref.current.rotation.x,
        targetRotRef.current.x,
        speed,
      );
      ref.current.rotation.y = THREE.MathUtils.lerp(
        ref.current.rotation.y,
        targetRotRef.current.y,
        speed,
      );
      ref.current.rotation.z = THREE.MathUtils.lerp(
        ref.current.rotation.z,
        targetRotRef.current.z,
        speed,
      );
      ref.current.position.set(pos[0], pos[1], pos[2]);
    } else {
      // IDLE – rest position, upright
      ref.current.position.set(pos[0], pos[1], pos[2]);
      ref.current.rotation.x = THREE.MathUtils.lerp(
        ref.current.rotation.x,
        0,
        4 * delta,
      );
      ref.current.rotation.y = THREE.MathUtils.lerp(
        ref.current.rotation.y,
        Y_OFFSETS[index],
        4 * delta,
      );
      ref.current.rotation.z = THREE.MathUtils.lerp(
        ref.current.rotation.z,
        0,
        4 * delta,
      );
    }
  });

  return (
    <mesh ref={ref} material={materials} castShadow>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Scene (orchestrates state machine and animations)
// ---------------------------------------------------------------------------

function Scene({
  trigger,
  shakeType,
  onRollComplete,
  disabled,
}: {
  trigger: number;
  shakeType: 1 | 2;
  onRollComplete?: (results: number[]) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<ShakerState>("IDLE");
  const [results, setResults] = useState<[number, number, number]>([2, 4, 0]);
  const liftRef = useRef(0); // 0→1 eased
  const clockRef = useRef(0);
  const lastTrigger = useRef(trigger);
  const callbackFiredRef = useRef(false);
  const groupRef = useRef<THREE.Group>(null!);

  const { startShake, stopShake, playThud, playChime } = useShakeAudio();

  // Build face textures once
  const faceTextures = useMemo(() => buildFaceTextures(), []);

  // Watch trigger changes to start a new shake
  useEffect(() => {
    if (trigger !== lastTrigger.current && trigger > 0 && !disabled) {
      lastTrigger.current = trigger;
      clockRef.current = 0;
      liftRef.current = 0;
      callbackFiredRef.current = false;
      setState("SHAKING");
      startShake(shakeType);
    }
  }, [trigger, disabled, startShake, shakeType]);

  // Per-frame state machine
  useFrame((_, delta) => {
    clockRef.current += delta;

    if (state === "SHAKING") {
      // "Once, twice, third" animation
      // We want 3 peaks.
      // Total duration ~3.0s. 
      // Lift up: 0.3s
      // Shake: 3 cycles.
      // Slam down: last 0.2s.

      const t = clockRef.current;
      const progress = Math.min(t / SHAKE_DURATION, 1);

      // Vertical lift: Go up and stay up while shaking, then drop
      // Lift phase
      let y = 0;
      if (progress < 0.1) {
        y = THREE.MathUtils.lerp(0, 1.5, progress / 0.1);
      } else if (progress > 0.9) {
        y = THREE.MathUtils.lerp(1.5, 0, (progress - 0.9) / 0.1);
      } else {
        y = 1.5;
        // Add the "shake" on top of the lift
        // 3 distinct shakes. 
        // Sin wave with frequency matched to give 3 peaks in remaining time (0.1 to 0.9 = 0.8 total time? No, need more time)
        // Let's use specific sin waves.
        const shakeContent = (progress - 0.1) / 0.8; // 0 to 1 during the hold phase
        // 3 full sine waves: 3 * 2PI
        const shakeY = Math.sin(shakeContent * Math.PI * 6) * 0.3;
        y += shakeY;
      }

      if (groupRef.current) {
        groupRef.current.position.y = y;
        // Add some rotation shake
        groupRef.current.rotation.z = Math.sin(clockRef.current * 15) * 0.05;
        groupRef.current.rotation.x = Math.cos(clockRef.current * 12) * 0.05;
      }

      if (clockRef.current >= SHAKE_DURATION) {
        // Transition → ROLLED
        stopShake();
        const roll = secureRoll();
        setResults(roll);
        clockRef.current = 0;
        if (groupRef.current) {
          groupRef.current.position.y = 0;
          groupRef.current.rotation.set(0, 0, 0);
        }
        playThud();
        setState("ROLLED");
      }
    } else if (state === "ROLLED") {
      if (clockRef.current >= ROLL_PAUSE) {
        clockRef.current = 0;
        setState("REVEALED");
        playChime();
      }
    } else if (state === "REVEALED") {
      // Ease-out lift
      const t = Math.min(clockRef.current / REVEAL_DURATION, 1);
      // Cubic ease-out
      liftRef.current = 1 - Math.pow(1 - t, 3);

      if (t >= 1 && !callbackFiredRef.current) {
        callbackFiredRef.current = true;
        onRollComplete?.(results);
      }
    } else {
      // IDLE
      if (groupRef.current) {
        groupRef.current.position.y = 0;
        groupRef.current.rotation.set(0, 0, 0);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight
        position={[3, 8, 4]}
        angle={0.5}
        penumbra={0.6}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-3, 4, -2]} intensity={0.4} color="#ffe4c4" />
      <Environment preset="city" />

      {/* Group the whole assembly for the "pickup" animation */}
      <group ref={groupRef}>
        <Plate />
        <Bowl liftProgress={liftRef.current} />
        {([0, 1, 2] as const).map((i) => (
          <Die
            key={i}
            index={i}
            resultIndex={results[i]}
            state={state}
            faceTextures={faceTextures}
          />
        ))}
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export interface DiceShakerProps {
  /** Increment to start a new shake. */
  trigger: number;
  /** 1 or 2 */
  shakeType?: 1 | 2;
  /** Called with [n, n, n] (0-5) once the bowl is fully lifted. */
  onRollComplete?: (results: number[]) => void;
  /** Prevent new shakes. */
  disabled?: boolean;
  /** Optional extra Tailwind classes on the wrapper div. */
  className?: string;
}

export default function DiceShaker({
  trigger,
  shakeType = 1,
  onRollComplete,
  disabled,
  className = "",
}: DiceShakerProps) {
  return (
    <div
      className={`relative w-full aspect-[4/3] max-h-[340px] md:max-h-[400px] rounded-2xl overflow-hidden ${className}`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 120%, #1a1428 0%, #0B0C15 70%)",
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 5.5, 5.5], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene
          trigger={trigger}
          shakeType={shakeType}
          onRollComplete={onRollComplete}
          disabled={disabled}
        />
      </Canvas>
    </div>
  );
}

