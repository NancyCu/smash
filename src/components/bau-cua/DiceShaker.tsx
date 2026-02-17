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
  Suspense,
} from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
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
// Texture generation (canvas-based)
// ---------------------------------------------------------------------------

/** Render a single die face: image fills the entire face, clean and clear. */
function renderFaceCanvas(image: HTMLImageElement, label: string): HTMLCanvasElement {
  const size = 512; // Higher res for clarity
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Deep red background that shows through any transparent parts
  ctx.fillStyle = "#8B0000";
  ctx.fillRect(0, 0, size, size);

  // Draw the image to fill the ENTIRE face, edge-to-edge
  // Use object-fit "cover" logic: scale to fill, crop overflow
  const imgW = image.naturalWidth || image.width;
  const imgH = image.naturalHeight || image.height;
  const scale = Math.max(size / imgW, size / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const drawX = (size - drawW) / 2;
  const drawY = (size - drawH) / 2;

  // Ensure high quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(image, drawX, drawY, drawW, drawH);

  // NO VIGNETTE - "Clear as day" per user request. 
  // Just the raw image filling the face.

  // Label at bottom with text shadow for readability
  // Move it slightly up so it's not cut off
  ctx.font = `bold ${size * 0.12}px sans-serif`; // Slightly larger text
  ctx.fillStyle = "rgba(255,255,255,1.0)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,1.0)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fillText(label, size / 2, size * 0.88);

  return canvas;
}

function buildFaceTextures(images: HTMLImageElement[]): THREE.CanvasTexture[] {
  return images.map((img, i) => {
    const canvas = renderFaceCanvas(img, ANIMAL_LABEL[i]);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

// ---------------------------------------------------------------------------
// Sub-components (live inside <Canvas>)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Procedural Chinese Porcelain Textures (Canvas2D)
// ---------------------------------------------------------------------------

/** Draw a Greek key / meander border strip on a canvas context. */
function drawGreekKey(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  keyColor: string, bgColor: string
) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = keyColor;
  const unit = h * 0.22;
  const count = Math.floor(w / (unit * 4));
  const totalW = count * unit * 4;
  const startX = x + (w - totalW) / 2;
  for (let i = 0; i < count; i++) {
    const bx = startX + i * unit * 4;
    // Simplified key pattern
    ctx.fillRect(bx, y + unit * 0.5, unit * 3, unit);
    ctx.fillRect(bx + unit * 2, y + unit * 0.5, unit, unit * 3);
    ctx.fillRect(bx + unit, y + unit * 2.5, unit * 2, unit);
    ctx.fillRect(bx + unit, y + unit * 1.5, unit, unit * 1.5);
  }
}

/** Draw a simple chrysanthemum flower at (cx, cy). */
function drawFlower(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const petalCount = 8;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.28, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    ctx.restore();
  }
  // Center
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#C7944A';
  ctx.fill();
}

/** Draw scrollwork vines in a region. */
function drawScrollwork(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, count: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const dist = radius * (0.2 + Math.random() * 0.6);
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist;
    ctx.beginPath();
    ctx.arc(sx, sy, 4 + Math.random() * 8, 0, Math.PI * (1 + Math.random()));
    ctx.stroke();
  }
}

/** Create the plate texture (circular, top-down view). */
function createPlateTexture(): THREE.CanvasTexture {
  const size = 1024; // Increases resolution for sharper details
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2, cy = size / 2;

  // 1. Base / Outer Rim (White Porcelain)
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // 2. Yellow Band for Greek Key
  // Outer radius ~0.48, Inner ~0.42
  const outerR = size * 0.48;
  const innerR = size * 0.42;

  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD700'; // Gold/Yellow
  ctx.fill();

  // Draw Greek Key Pattern in Blue/Red over the yellow band
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.clip(); // Clip inner hole so we don't overdraw center
  // (Actually simpler to just draw the band then draw center over it)
  ctx.restore();

  // Draw simplified radial Greek Key elements
  const keyCount = 36;
  ctx.fillStyle = '#1A237E'; // Deep Blue key
  for (let i = 0; i < keyCount; i++) {
    const angle = (i / keyCount) * Math.PI * 2;
    const r = (outerR + innerR) / 2;
    ctx.save();
    ctx.translate(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.rotate(angle);
    // Draw a small "G" or square spiral shape
    ctx.fillRect(-10, -10, 20, 4);
    ctx.fillRect(-10, -10, 4, 20);
    ctx.fillRect(-10, 6, 12, 4);
    ctx.fillRect(2, -2, 4, 12);
    ctx.restore();
  }

  // 3. Center Background (Deep Pink/Red)
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#D91E36'; // Deep Pink/Red
  ctx.fill();

  // 4. White Curly Vines (Arabesque)
  // We'll draw these all over the center area
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.clip();
  drawScrollwork(ctx, cx, cy, innerR * 0.9, 120); // Denser vines
  ctx.restore();

  // 5. Stylized Flowers
  const flowerPositions = [
    [cx, cy - size * 0.22],
    [cx + size * 0.22, cy],
    [cx, cy + size * 0.22],
    [cx - size * 0.22, cy],
    // Inner diagonals
    [cx + size * 0.12, cy - size * 0.12],
    [cx - size * 0.12, cy + size * 0.12],
    [cx + size * 0.12, cy + size * 0.12],
    [cx - size * 0.12, cy - size * 0.12],
  ];
  flowerPositions.forEach(([fx, fy]) => drawFlower(ctx, fx, fy, size * 0.06));

  // 6. Medallions (White circles with Red text)
  const chars = ['萬', '福', '壽', '禄'];
  const medalR = size * 0.055;
  const medalDist = size * 0.28; // Push them out a bit
  chars.forEach((ch, i) => {
    // 4 positions: Top, Right, Bottom, Left? Or diagonals?
    // Reference image shows them in a cross or square formation.
    // Let's do diagonals for better spacing with flowers.
    const a = (i / chars.length) * Math.PI * 2 + Math.PI / 4;
    const mx = cx + Math.cos(a) * medalDist;
    const my = cy + Math.sin(a) * medalDist;

    // Circle
    ctx.beginPath();
    ctx.arc(mx, my, medalR, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    // Border
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#D91E36';
    ctx.stroke();

    // Text
    ctx.fillStyle = '#B71C1C';
    ctx.font = `bold ${medalR * 1.2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, mx, my + medalR * 0.1); // slight visual adjustment
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4; // Sharp textures at angles
  return tex;
}

/** Create the bowl wrap texture (rectangular, wraps around hemisphere). */
function createBowlTexture(): THREE.CanvasTexture {
  const w = 1024, h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 1. Base Material: White Porcelain
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  // 2. The Decorative Band (Deep Pink/Red)
  // Wrapping around the lower middle
  const bandY = h * 0.35; // Start 35% down
  const bandH = h * 0.50; // 50% height
  ctx.fillStyle = '#D91E36';
  ctx.fillRect(0, bandY, w, bandH);

  // Add Gold borders to the band
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(0, bandY, w, 6); // Top border
  ctx.fillRect(0, bandY + bandH - 6, w, 6); // Bottom border

  // 3. Patterns Inside the Band
  // We need to restrict drawing to the band area
  const centerY = bandY + bandH / 2;

  // Scrollwork Vines inside the band
  // We'll draw them in a strip
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, bandY, w, bandH);
  ctx.clip();

  ctx.strokeStyle = '#FFFFFF'; // White vines on red
  ctx.lineWidth = 1.5;
  const vineCount = 150;
  for (let i = 0; i < vineCount; i++) {
    const x = Math.random() * w;
    const y = bandY + Math.random() * bandH;
    ctx.beginPath();
    // Curly shape (approximate with arc)
    ctx.arc(x, y, 5 + Math.random() * 10, 0, Math.PI * (1 + Math.random()));
    ctx.stroke();
  }
  ctx.restore();

  // Flowers inside the Band
  const fCount = 8;
  for (let i = 0; i < fCount; i++) {
    const fx = (i / fCount) * w + w / 16;
    const fy = centerY + Math.sin(i * 2.5) * (bandH * 0.25);
    drawFlower(ctx, fx, fy, 20); // White flowers
  }

  // Medallions inside the Band
  const mChars = ['萬', '福', '壽', '禄'];
  const mCount = 4; // Repeat them twice -> 8 items? Or just 4 spaced.
  // 4 items around 360 degrees covers 90deg each.
  for (let i = 0; i < mCount; i++) {
    const mx = (i + 0.5) * (w / mCount);
    const my = centerY;
    const ch = mChars[i % mChars.length];

    ctx.beginPath();
    ctx.arc(mx, my, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#D91E36';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#B71C1C';
    ctx.font = 'bold 30px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, mx, my + 2);
  }

  // 4. Bottom Rim (Yellow & Blue Geometric)
  const rimY = h * 0.92;
  const rimH = h * 0.08;
  drawGreekKey(ctx, 0, rimY, w, rimH, '#1A237E', '#FFD700'); // Blue key on Gold bg

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  return tex;
}

// ---------------------------------------------------------------------------
// Sub-components (live inside <Canvas>)
// ---------------------------------------------------------------------------

/** The flat plate / platter the bowl sits on – Chinese red porcelain. */
function Plate() {
  const texture = useMemo(() => createPlateTexture(), []);
  return (
    <group>
      {/* Main plate disc */}
      <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.3, 64]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.15} // Glossy ceramic
          metalness={0.1}
        />
      </mesh>
      {/* Thin rim ring (gives plate depth) */}
      <mesh position={[0, -0.08, 0]} receiveShadow>
        <cylinderGeometry args={[2.3, 2.35, 0.12, 48]} />
        <meshStandardMaterial
          color="#F5F0E8"
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

/**
 * The ceramic bowl (inverted dome) – Chinese red porcelain with patterns.
 * Its Y position is animated upwards during REVEALED state.
 */
function Bowl({
  liftProgress,
  onTap,
}: {
  liftProgress: number; // 0 = closed, 1 = fully lifted
  onTap?: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const texture = useMemo(() => createBowlTexture(), []);

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
    <mesh
      ref={ref}
      castShadow
      onClick={(e) => {
        e.stopPropagation();
        onTap?.();
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'default'}
    >
      {/* Top hemisphere, opening faces down */}
      <sphereGeometry args={[1.7, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.1} // Glossy ceramic
        metalness={0.1} // Tiny bit of shine
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** A single die (cube with 6-face textures). */
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
  const cockedRotRef = useRef(new THREE.Euler());

  // 6 materials, one per face
  const materials = useMemo(
    () =>
      faceTextures.map(
        (tex) =>
          new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.4, // Smoother for glossy look
            metalness: 0.0,
          }),
      ),
    [faceTextures],
  );

  // Calculate rotations when result changes
  // IMPORTANT: We use quaternion math to separate the "which face is on top"
  // rotation from the "aesthetic Y-spin" rotation. If we naively add Y_OFFSET
  // to the Euler Y component, the XYZ rotation order causes the wrong face
  // to end up on top.
  useEffect(() => {
    if (state === "ROLLED" || state === "REVEALED") {
      const [rx, ry, rz] = RESULT_ROTATIONS[resultIndex];

      // Step 1: Quaternion for "put the correct face on top"
      const faceQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rx, ry, rz, 'XYZ')
      );
      // Step 2: Quaternion for aesthetic Y-axis spin (so dice don't all face same way)
      const ySpinQuat = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Y_OFFSETS[index]
      );
      // Combine: apply face rotation first, then spin around world Y
      const finalQuat = ySpinQuat.multiply(faceQuat);
      targetRotRef.current.setFromQuaternion(finalQuat);

      // "Cocked" rotation: final rotation + small random tilt for suspense
      const tiltAmt = (Math.random() > 0.5 ? 1 : -1) * (Math.PI * 0.15 + Math.random() * 0.1);
      const tiltQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 1.0,
          tiltAmt,
          'XYZ'
        )
      );
      const cockedQuat = finalQuat.clone().premultiply(tiltQuat);
      cockedRotRef.current.setFromQuaternion(cockedQuat);
    }
  }, [state, resultIndex, index]);

  useFrame((_, delta) => {
    if (!ref.current) return;

    const pos = DICE_POSITIONS[index];

    if (state === "SHAKING") {
      // ERRATIC SHAKE: High frequency, larger amplitude
      ref.current.position.set(
        pos[0] + (Math.random() - 0.5) * 0.4,
        pos[1] + (Math.random() - 0.5) * 0.4,
        pos[2] + (Math.random() - 0.5) * 0.4,
      );
      // Wild rotation
      ref.current.rotation.x += (Math.random() - 0.5) * 2.0;
      ref.current.rotation.y += (Math.random() - 0.5) * 2.0;
      ref.current.rotation.z += (Math.random() - 0.5) * 2.0;

    } else if (state === "ROLLED") {
      // "Settled" inside the bowl but COCKED/TILTED
      // Move quickly to the cocked position
      const speed = 15 * delta;
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, cockedRotRef.current.x, speed);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, cockedRotRef.current.y, speed);
      ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, cockedRotRef.current.z, speed);
      ref.current.position.set(pos[0], pos[1], pos[2]);

    } else if (state === "REVEALED") {
      // REVEAL ANIMATION:
      // Slowly smooth-lerp from the "cocked" position to the flat position.
      const speed = 4 * delta; // Slower settle
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, targetRotRef.current.x, speed);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetRotRef.current.y, speed);
      ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, targetRotRef.current.z, speed);

      ref.current.position.set(pos[0], pos[1], pos[2]);

    } else {
      // IDLE – rest position, upright
      ref.current.position.set(pos[0], pos[1], pos[2]);
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0, 4 * delta);
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, Y_OFFSETS[index], 4 * delta);
      ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, 0, 4 * delta);
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
  onShakeEnd,
  onBowlTap,
  disabled,
  isOpen,
  forcedResult,
}: {
  trigger: number;
  shakeType: 1 | 2;
  onRollComplete?: (results: number[]) => void;
  onShakeEnd?: () => void;
  onBowlTap?: () => void;
  disabled?: boolean;
  isOpen?: boolean;
  forcedResult?: [number, number, number];
}) {
  const [state, setState] = useState<ShakerState>("IDLE");
  const [results, setResults] = useState<[number, number, number]>([2, 4, 0]);
  const liftRef = useRef(0); // 0→1 eased
  const clockRef = useRef(0);
  const lastTrigger = useRef(trigger);
  const callbackFiredRef = useRef(false);
  const groupRef = useRef<THREE.Group>(null!);

  const { startShake, stopShake, playThud, playChime } = useShakeAudio();

  // Load user-provided images (order matches ANIMALS array)
  const images = useLoader(THREE.ImageLoader, [
    "/bau-cua/NAI.png",    // 0 Deer
    "/bau-cua/BAU.png",    // 1 Gourd
    "/bau-cua/GA.png",     // 2 Chicken
    "/bau-cua/CA.png",     // 3 Fish
    "/bau-cua/CUA.png",    // 4 Crab
    "/bau-cua/TOM.png",    // 5 Shrimp
  ]) as HTMLImageElement[];

  // Build face textures once images are loaded
  const faceTextures = useMemo(() => buildFaceTextures(images), [images]);

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
        // Use forcedResult if provided (multiplayer sync), otherwise local secureRoll
        const roll = forcedResult || secureRoll();
        setResults(roll);
        clockRef.current = 0;
        if (groupRef.current) {
          groupRef.current.position.y = 0;
          groupRef.current.rotation.set(0, 0, 0);
        }
        playThud();
        playThud();
        setState("ROLLED");
        onShakeEnd?.();
      }
    } else if (state === "ROLLED") {
      // Wait for isOpen logic
      if (isOpen) {
        if (clockRef.current >= ROLL_PAUSE) {
          clockRef.current = 0;
          setState("REVEALED");
          playChime();
        }
      } else {
        // Reset clock so we don't prematurely reveal
        clockRef.current = 0;
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
        <Bowl liftProgress={liftRef.current} onTap={onBowlTap} />
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
  /** Called when shaking animation finishes (but bowl is still closed). */
  onShakeEnd?: () => void;
  /** Called when user clicks the bowl. */
  onBowlTap?: () => void;
  /** Prevent new shakes. */
  disabled?: boolean;
  /** Whether the bowl is open/lifted. */
  isOpen?: boolean;
  /** Pre-determined dice result from the Host (for multiplayer sync). */
  forcedResult?: [number, number, number];
  /** Optional extra Tailwind classes on the wrapper div. */
  className?: string;
}

export default function DiceShaker({
  trigger,
  shakeType = 1,
  onRollComplete,
  onShakeEnd,
  onBowlTap,
  disabled,
  isOpen = true,
  forcedResult,
  className = "",
}: DiceShakerProps) {
  return (
    <div
      className={`relative w-full aspect-[4/3] max-h-[340px] md:max-h-[45vh] rounded-2xl overflow-hidden ${className}`}
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
        <Suspense fallback={null}>
          <Scene
            trigger={trigger}
            shakeType={shakeType}
            onRollComplete={onRollComplete}
            onShakeEnd={onShakeEnd}
            onBowlTap={onBowlTap}
            disabled={disabled}
            isOpen={isOpen}
            forcedResult={forcedResult}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

