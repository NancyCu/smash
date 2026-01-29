// src/utils/colors.ts

// The "Bright Pastel Neon" Palette
const PASTEL_NEON_PALETTE = [
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
  if (!name) return '#334155'; // Default Slate
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % PASTEL_NEON_PALETTE.length;
  return PASTEL_NEON_PALETTE[index];
};

// Helper for glassy effect
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
    return `rgba(255,255,255,${opacity})`;
}