"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  doc, onSnapshot, updateDoc, deleteDoc, setDoc, 
  collection, addDoc, serverTimestamp, arrayUnion, arrayRemove, deleteField,
  query, where, getDocs, writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { detectSportType, getSportConfig, type SportType, type PeriodKey } from "@/lib/sport-config";
import { sendPaymentConfirmation } from "@/utils/paymentNotifications";

// Task 3: Storage Cleanup Utility
export const cleanupActiveGameStorage = (gameId: string) => {
  if (typeof window !== 'undefined') {
    const storedActiveId = localStorage.getItem('activeGameId');
    if (storedActiveId === gameId) {
      console.log('[GameContext] Cleaning up game from localStorage:', gameId);
      localStorage.removeItem('activeGameId');
      setTimeout(() => {
        window.dispatchEvent(new Event('activeGameIdChanged'));
      }, 0);
    }
  }
};

// --- TYPE DEFINITIONS ---
export type SquareData = {
  userId: string;
  displayName: string;
  photoURL?: string;
  claimedAt?: any;
  paid?: boolean;
  paidAt?: any; // Timestamp when payment was confirmed
};

export type PayoutLog = {
  id: string; // Unique ID for deduplication
  quarter: string;
  winnerUserId: string;
  winnerName: string;
  amount: number;
  timestamp: any;
};

export interface GameData { // Changed 'type' to 'export interface'
  id: string;
  host: string;
  hostDisplayName?: string;
  name: string;
  operationName?: string;
  operation_name?: string;
  title?: string;
  teamA: string;
  teamB: string;
  teamALogo?: string;
  teamBLogo?: string;
  teamAColor?: string;
  teamBColor?: string;
  price: number;
  pot: number;
  totalPot?: number; // Added this optional field to fix the $0 pot bug
  squares: Record<string, SquareData | SquareData[]>;
  scores: { teamA: number; teamB: number };
  quarterScores?: {
    p1?: { teamA: number; teamB: number };
    p2?: { teamA: number; teamB: number };
    p3?: { teamA: number; teamB: number };
    final?: { teamA: number; teamB: number };
  };
  isScrambled: boolean;
  payouts: any;
  createdAt: any;
  espnGameId?: string;
  league?: string; // Store league for sport detection
  sport?: SportType; // Store detected sport type
  axis?: any;
  participants: string[]; 
  playerIds: string[];  
  payoutHistory: PayoutLog[]; 
  currentPeriod?: string;
  status: 'open' | 'active' | 'final';
  paymentLink?: string | null; // Venmo/CashApp URL
  zellePhone?: string | null; // Zelle phone number
}

interface GameContextType {
  game: GameData | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  setGameId: (id: string) => void;
  claimSquare: (index: number, displayName?: string, markPaid?: boolean) => Promise<void>;
  joinGame: (gameId: string, password?: string, userId?: string) => Promise<void>;
  unclaimSquare: (index: number) => Promise<void>;
  togglePaid: (index: number, targetUserId?: string, setPaidTo?: boolean) => Promise<void>;
  updateScores: (home: any, away?: any) => Promise<void>;
  updateQuarterScores: (gameId: string, quarterScores: any) => Promise<void>;
  scrambleGrid: () => Promise<void>;
  resetGrid: () => Promise<void>;
  deleteGame: () => Promise<void>;
  createGame: (data: any) => Promise<string>;
  togglePaymentStatus: (userId: string, isPaid: boolean) => Promise<void>;
  getUserGames: (userId: string) => Promise<GameData[]>;
  setGamePhase: (period: string) => Promise<void>;
  updatePaymentInfo: (paymentLink: string | null, zellePhone: string | null) => Promise<void>;
}

const GameContext = createContext<GameContextType>({} as GameContextType);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [gameId, setGameId] = useState<string | null>(null);
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user && game ? user.uid === game.host : false;

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    const unsub = onSnapshot(doc(db, "games", gameId), (docSnap) => {
      setLoading(false);
      if (docSnap.exists()) {
        const data = docSnap.data() as GameData;
        // Apply defaults for backward compatibility
        if (!data.playerIds) data.playerIds = [];
        if (!data.payoutHistory) data.payoutHistory = [];
        setGame({ ...data, id: docSnap.id });
        setError(null);
      } else {
        setError("Game not found");
        setGame(null);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });
    return () => unsub();
  }, [gameId]);

  const claimSquare = async (index: number, displayName?: string, markPaid?: boolean) => {
    if (!gameId || !user) return;
    const ref = doc(db, "games", gameId);
    const newClaim: SquareData = {
      userId: user.uid,
      displayName: displayName || user.displayName || "Player",
      claimedAt: new Date().toISOString(),
      paid: markPaid || false
    };

    const updates: any = {
      participants: arrayUnion(user.uid),
      playerIds: arrayUnion(user.uid)
    };

    const currentSquare = game?.squares[index];
    if (Array.isArray(currentSquare)) {
      updates[`squares.${index}`] = arrayUnion(newClaim);
    } else if (currentSquare) {
      updates[`squares.${index}`] = [currentSquare, newClaim];
    } else {
      updates[`squares.${index}`] = [newClaim];
    }
    await updateDoc(ref, updates);
  };

  const unclaimSquare = async (index: number) => {
    if (!gameId || !user || !game) return;
    const ref = doc(db, "games", gameId);
    const currentSquare = game.squares[index];

    if (Array.isArray(currentSquare)) {
      const newArray = currentSquare.filter(c => c.userId !== user.uid);
      if (newArray.length === 0) {
        await updateDoc(ref, { 
          [`squares.${index}`]: deleteField(),
          playerIds: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(ref, { [`squares.${index}`]: newArray });
      }
    }
  };

  const getUserGames = async (userId: string): Promise<GameData[]> => {
    // Query both for hosted games AND participated games
    const qHost = query(collection(db, "games"), where("host", "==", userId));
    const qPlayer = query(collection(db, "games"), where("playerIds", "array-contains", userId));
    
    const [snapHost, snapPlayer] = await Promise.all([getDocs(qHost), getDocs(qPlayer)]);
    const gamesMap = new Map();
    
    snapHost.forEach(d => gamesMap.set(d.id, { ...d.data(), id: d.id }));
    snapPlayer.forEach(d => gamesMap.set(d.id, { ...d.data(), id: d.id }));
    
    return Array.from(gamesMap.values()) as GameData[];
  };

  // Helper functions
  const createGame = async (data: any) => {
    if (!user) throw new Error("Logged in only");
    
    // Detect sport type from league if espnGameId is provided
    const sportType = data.league ? detectSportType(data.league) : 'default';
    
    const docRef = await addDoc(collection(db, "games"), {
      ...data,
      host: user.uid,
      hostDisplayName: user.displayName || "Host",
      sport: sportType,
      squares: {},
      participants: [user.uid],
      playerIds: [user.uid],
      payoutHistory: [],
      createdAt: serverTimestamp(),
      isScrambled: false,
    });
    return docRef.id;
  };

// REPLACE YOUR EXISTING updateScores FUNCTION WITH THIS:

const updateScores = async (home: any, away?: any) => {
  if (!gameId) return;

  // 1. Determine if we received (7, 3) or ({teamA: 7, teamB: 3})
  let newScores;
  
  // Check if the first argument is already the full object
  if (typeof home === 'object' && home !== null && 'teamA' in home) {
      newScores = home;
  } 
  // Otherwise, treat arguments as (Home, Away) numbers
  else {
      newScores = { 
          teamA: Number(home), 
          teamB: Number(away || 0) // Default to 0 if away is missing
      };
  }

  try {
      await updateDoc(doc(db, "games", gameId), { scores: newScores });
      console.log("✅ Scores updated manually:", newScores);
  } catch (err) {
      console.error("❌ Failed to update scores:", err);
  }
};

  const updateQuarterScores = async (targetGameId: string, quarterScores: any) => {
    try {
      await updateDoc(doc(db, "games", targetGameId), { 
        quarterScores,
        scores: quarterScores.final || { teamA: 0, teamB: 0 }
      });
      console.log("✅ Quarter scores updated:", quarterScores);
    } catch (err) {
      console.error("❌ Failed to update quarter scores:", err);
    }
  };

  const setGamePhase = async (period: string) => {
  if (gameId) {
    await updateDoc(doc(db, "games", gameId), { currentPeriod: period });
  }
};
  const deleteGame = async () => {
    if (gameId) {
      await deleteDoc(doc(db, "games", gameId));
      
      // Task 3: Storage Cleanup - Remove from localStorage if it was the active game
      cleanupActiveGameStorage(gameId);
    }
  };
  const scrambleGrid = async () => {
      if (!gameId || !game) return;
      
      const shuffle = (array: number[]) => {
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
      
      // Get sport type and create axes for all periods
      const sportType = game.sport || 'default';
      const config = getSportConfig(sportType);
      
      const newAxis: Record<string, { row: number[]; col: number[] }> = {};
      config.periods.forEach(period => {
        newAxis[period] = {
          row: shuffle([0,1,2,3,4,5,6,7,8,9]),
          col: shuffle([0,1,2,3,4,5,6,7,8,9])
        };
      });
  
      await updateDoc(doc(db, "games", gameId), { 
          isScrambled: true, 
          axis: newAxis 
      });
  };
  const resetGrid = async () => { 
  if (gameId) {
    // This removes the scrambled axes and sets the flag back to false
    await updateDoc(doc(db, "games", gameId), { 
      isScrambled: false,
      axis: deleteField() 
    }); 
  }
};

const joinGame = async (gameId: string, password?: string, userId?: string) => {
    if (!gameId) return;
    const ref = doc(db, "games", gameId);
    
    // We update both participants and playerIds for legacy and new history logic
    await updateDoc(ref, {
      participants: arrayUnion(userId || user?.uid),
      playerIds: arrayUnion(userId || user?.uid)
    });
  };

  const togglePaid = async (gridIndex: number, targetUserId?: string, setPaidTo?: boolean) => {
    if (!gameId || !game || !targetUserId) {
      console.error('❌ togglePaid: Missing gameId, game, or targetUserId');
      return;
    }
    
    try {
      const ref = doc(db, "games", gameId);
      const squareKey = String(gridIndex); // Ensure we're using string key
      const square = game.squares[squareKey];
      
      if (!square) {
        console.error(`❌ togglePaid: No square found at index ${gridIndex}`);
        return;
      }
      
      const updates: Record<string, unknown> = {};
      let currentPaidStatus = false;
      let foundClaim = false;
      
      // Handle both single and array claims
      if (Array.isArray(square)) {
        const updatedSquares = square.map(claim => {
          if (claim.userId === targetUserId) {
            foundClaim = true;
            // Set to specific value if provided, otherwise toggle
            const newPaidStatus = setPaidTo !== undefined ? setPaidTo : !claim.paid;
            currentPaidStatus = newPaidStatus;
            return {
              ...claim,
              paid: newPaidStatus,
              paidAt: newPaidStatus ? new Date().toISOString() : null
            };
          }
          return claim;
        });
        if (foundClaim) {
          updates[`squares.${squareKey}`] = updatedSquares;
        }
      } else if (square.userId === targetUserId) {
        foundClaim = true;
        // Set to specific value if provided, otherwise toggle
        currentPaidStatus = setPaidTo !== undefined ? setPaidTo : !square.paid;
        updates[`squares.${squareKey}`] = {
          ...square,
          paid: currentPaidStatus,
          paidAt: currentPaidStatus ? serverTimestamp() : null
        };
      }
      
      if (!foundClaim) {
        console.error(`❌ togglePaid: User ${targetUserId} not found in square ${gridIndex}`);
        return;
      }
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(ref, updates);
        console.log(`✅ Payment toggled for square ${gridIndex}, user ${targetUserId}: ${currentPaidStatus ? 'PAID' : 'UNPAID'}`);
        
        // Send notification when payment is confirmed
        if (currentPaidStatus) {
          await sendPaymentConfirmation(targetUserId, gameId, game.price || 0, game.name);
        }
      }
    } catch (error) {
      console.error('❌ Error in togglePaid:', error);
    }
  };

  const updatePaymentInfo = async (paymentLink: string | null, zellePhone: string | null) => {
    if (!gameId) throw new Error("No active game selected");
    await updateDoc(doc(db, "games", gameId), { 
        paymentLink,
        zellePhone
    });
    console.log("✅ Payment info updated");
  };

  const togglePaymentStatus = async (targetUserId: string, isPaid: boolean) => {
    if (!gameId || !game) return;
    
    const batch = writeBatch(db);
    const ref = doc(db, "games", gameId);
    
    // Find all squares owned by the target user
    const updates: Record<string, unknown> = {};
    let squareCount = 0;
    
    for (let i = 0; i < 100; i++) {
      const square = game.squares[i];
      if (!square) continue;
      
      // Handle both single and array claims
      if (Array.isArray(square)) {
        const updatedSquares = square.map(claim => {
          if (claim.userId === targetUserId) {
            squareCount++;
            return {
              ...claim,
              paid: isPaid,
              paidAt: isPaid ? new Date().toISOString() : null
            };
          }
          return claim;
        });
        updates[`squares.${i}`] = updatedSquares;
      } else if (square.userId === targetUserId) {
        squareCount++;
        updates[`squares.${i}`] = {
          ...square,
          paid: isPaid,
          paidAt: isPaid ? new Date().toISOString() : null
        };
      }
    }
    
    // Apply all updates in a single batch
    batch.update(ref, updates);
    await batch.commit();
    console.log(`✅ Payment status updated for user ${targetUserId}: ${isPaid ? 'PAID' : 'UNPAID'}`);
    
    // Send notification when payment is confirmed
    if (isPaid && squareCount > 0) {
      const totalAmount = squareCount * (game.price || 0);
      await sendPaymentConfirmation(targetUserId, gameId, totalAmount, game.name);
    }
  };

return (
    <GameContext.Provider value={{ 
      game, 
      loading, 
      error, 
      isAdmin, 
      setGameId, 
      claimSquare, 
      unclaimSquare, 
      togglePaid,
      createGame, 
      updateScores, 
      updateQuarterScores,
      scrambleGrid, 
      resetGrid, 
      deleteGame, 
      getUserGames, 
      setGamePhase,
      joinGame,
      togglePaymentStatus,
      updatePaymentInfo
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);