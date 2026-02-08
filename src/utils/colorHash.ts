export const getNeonColor = (name: string, isMe: boolean) => {
  if (isMe) return 'bg-cyan-500/60 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)]'; // Hero Color

  // Hashing Logic: Sum char codes to pick a stable color index
  const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palettes = [
    'bg-fuchsia-600/60 border-fuchsia-400 text-white shadow-[0_0_10px_rgba(192,38,211,0.5)]', // Deep Pink
    'bg-violet-600/60 border-violet-400 text-white shadow-[0_0_10px_rgba(124,58,237,0.5)]',   // Electric Purple
    'bg-lime-500/60 border-lime-400 text-white shadow-[0_0_10px_rgba(132,204,22,0.5)]',     // Toxic Green
    'bg-orange-500/60 border-orange-400 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]',  // Safety Orange
    'bg-rose-600/60 border-rose-400 text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]',      // Red
  ];

  return palettes[sum % palettes.length];
};

export const getDistinctColor = (username: string) => {
  if (!username) return '#1f2937'; // Default gray for empty

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }

  // HUE: 0 to 360 (The variety)
  const h = Math.abs(hash) % 360; 
  
  // SATURATION: Fixed at 65% (Keeps it vibrant/neon like current theme)
  const s = 65; 
  
  // LIGHTNESS: Fixed at 45% (Ensures white text is always readable)
  const l = 45; 

  return `hsl(${h}, ${s}%, ${l}%)`;
};
