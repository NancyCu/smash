// src/lib/game-logic.ts

// The structure for our "Receipts" - transparency is key
export interface GameAxisData {
  q1: { rows: number[]; cols: number[] };
  q2: { rows: number[]; cols: number[] };
  q3: { rows: number[]; cols: number[] };
  final: { rows: number[]; cols: number[] };
  generatedAt: string;
}

// Fisher-Yates Shuffle - The standard for randomness
const shuffle = (array: number[]): number[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  
  // Ensure 0 is never at index 0 (0,0 coordinates)
  if (newArr[0] === 0) {
    // Swap with a random position that's not 0
    const swapIndex = Math.floor(Math.random() * 9) + 1; // Random index from 1-9
    [newArr[0], newArr[swapIndex]] = [newArr[swapIndex], newArr[0]];
  }
  
  return newArr;
};

// The Generator
export const generateQuarterlyNumbers = (): GameAxisData => {
  const base = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return {
    q1: { rows: shuffle(base), cols: shuffle(base) },
    q2: { rows: shuffle(base), cols: shuffle(base) },
    q3: { rows: shuffle(base), cols: shuffle(base) },
    final: { rows: shuffle(base), cols: shuffle(base) },
    generatedAt: new Date().toISOString(),
  };
};