/**
 * Selection Suitcase - Utility for preserving square selections during authentication
 * Task 1 & 2: Save and restore pending selections across auth redirects
 */

const STORAGE_PREFIX = 'pending_claims_';

export interface PendingSelection {
  gameId: string;
  squares: number[];
  timestamp: number;
}

/**
 * Task 1: Save pending selections to localStorage
 */
export const savePendingSelections = (gameId: string, squares: number[]): void => {
  if (typeof window === 'undefined') return;
  
  const key = `${STORAGE_PREFIX}${gameId}`;
  const data: PendingSelection = {
    gameId,
    squares,
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log('[Suitcase] Saved pending selections:', { gameId, count: squares.length, squares });
  } catch (error) {
    console.error('[Suitcase] Error saving selections:', error);
  }
};

/**
 * Task 2: Load pending selections from localStorage
 */
export const loadPendingSelections = (gameId: string): number[] | null => {
  if (typeof window === 'undefined') return null;
  
  const key = `${STORAGE_PREFIX}${gameId}`;
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const data: PendingSelection = JSON.parse(stored);
    
    // Validate the data
    if (data.gameId !== gameId) return null;
    if (!Array.isArray(data.squares)) return null;
    
    // Check if data is too old (more than 30 minutes)
    const age = Date.now() - data.timestamp;
    const MAX_AGE = 30 * 60 * 1000; // 30 minutes
    
    if (age > MAX_AGE) {
      console.log('[Suitcase] Selections expired, cleaning up');
      clearPendingSelections(gameId);
      return null;
    }
    
    console.log('[Suitcase] Loaded pending selections:', { gameId, count: data.squares.length, squares: data.squares });
    return data.squares;
  } catch (error) {
    console.error('[Suitcase] Error loading selections:', error);
    return null;
  }
};

/**
 * Task 2: Clear pending selections after successful restoration
 */
export const clearPendingSelections = (gameId: string): void => {
  if (typeof window === 'undefined') return;
  
  const key = `${STORAGE_PREFIX}${gameId}`;
  
  try {
    localStorage.removeItem(key);
    console.log('[Suitcase] Cleared pending selections for game:', gameId);
  } catch (error) {
    console.error('[Suitcase] Error clearing selections:', error);
  }
};

/**
 * Task 4: Check which squares are still available
 */
export const findConflicts = (
  pendingSquares: number[],
  currentSquares: Record<string, unknown>
): { available: number[]; conflicts: number[] } => {
  const available: number[] = [];
  const conflicts: number[] = [];
  
  pendingSquares.forEach(index => {
    const row = Math.floor(index / 10);
    const col = index % 10;
    const key = `${row}-${col}`;
    
    const owners = currentSquares[key];
    const isOccupied = owners && (Array.isArray(owners) ? owners.length > 0 : true);
    
    if (isOccupied) {
      conflicts.push(index);
    } else {
      available.push(index);
    }
  });
  
  return { available, conflicts };
};
