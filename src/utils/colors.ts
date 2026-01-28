// src/utils/colors.ts

const PALETTE = [
  '#22d3ee', // Cyan
  '#db2777', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
];

export const getUserColor = (name: string): string => {
  if (!name) return '#475569'; // Default Slate
  
  // Simple hash to pick a consistent index from the palette
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};