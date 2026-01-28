// src/utils/colors.ts

// A curated list of bright neon pastel colors
const NEON_PASTEL_PALETTE = [
  '#FF9FF3', // Neon Pink
  '#F368E0', // Magenta
  '#54A0FF', // Electric Blue
  '#2E86DE', // Deep Sky
  '#00D2D3', // Cyan
  '#1DD1A1', // Neo Mint
  '#Feca57', // Pastel Orange
  '#FF6B6B', // Pastel Red
  '#48DBFB', // Bright Sky
  '#A3CB38', // Lime
  '#9B59B6', // Amethyst
  '#FDA7DF', // Bubblegum
];

export const getUserColor = (name: string): string => {
  if (!name) return '#334155'; // Default Slate for empty/system
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the larger palette length for better distribution
  const index = Math.abs(hash) % NEON_PASTEL_PALETTE.length;
  return NEON_PASTEL_PALETTE[index];
};