/**
 * Cryptographically secure dice roll for Bau Cua.
 *
 * Uses `window.crypto.getRandomValues` (Web Crypto API) instead of
 * `Math.random()` so the RNG cannot be predicted or replayed.
 *
 * Returns an array of 3 numbers in the range [0, 5], each mapping to
 * an animal index in the ANIMALS constant:
 *   0 = Deer (Nai)
 *   1 = Gourd (Bầu)
 *   2 = Chicken (Gà)
 *   3 = Fish (Cá)
 *   4 = Crab (Cua)
 *   5 = Shrimp (Tôm)
 */
export function secureRoll(): [number, number, number] {
  const array = new Uint32Array(3);
  crypto.getRandomValues(array);
  // Map 32-bit unsigned integers to the 0-5 range
  return [array[0] % 6, array[1] % 6, array[2] % 6];
}

/** Map a numeric result index (0-5) to the ANIMALS `id` string. */
export const ANIMAL_IDS = [
  "deer",
  "gourd",
  "chicken",
  "fish",
  "crab",
  "shrimp",
] as const;

export type AnimalIndex = 0 | 1 | 2 | 3 | 4 | 5;

export function indicesToAnimalIds(
  indices: [number, number, number],
): [string, string, string] {
  return [
    ANIMAL_IDS[indices[0]],
    ANIMAL_IDS[indices[1]],
    ANIMAL_IDS[indices[2]],
  ];
}
