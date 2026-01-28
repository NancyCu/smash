// src/utils/colors.ts

// A curated list of bright, distinct neon/pastel colors suited for dark mode
const NEON_PALETTE = [
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFD700', // Gold
  '#FF4500', // Orange Red
  '#32CD32', // Lime Green
  '#1E90FF', // Dodger Blue
  '#FF1493', // Deep Pink
  '#00FA9A', // Medium Spring Green
  '#9370DB', // Medium Purple
  '#FF6347', // Tomato
  '#40E0D0', // Turquoise
  '#DA70D6', // Orchid
  '#7FFF00', // Chartreuse
  '#8A2BE2', // Blue Violet
  '#FF8C00', // Dark Orange
];

export const getUserColor = (name: string): string => {
  if (!name) return '#334155'; // Default Slate for empty/system
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the larger palette length for better distribution
  const index = Math.abs(hash) % NEON_PALETTE.length;
  return NEON_PALETTE[index];
};

// Helper to convert Hex to RGBA for glassy effect
export const hexToRgba = (hex: string, opacity: number) => {
    let c: any;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+opacity+')';
    }
    return `rgba(255,255,255,${opacity})`; // Fallback
}