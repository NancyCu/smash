"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  doc, onSnapshot, updateDoc, deleteDoc, setDoc, 
  collection, addDoc, serverTimestamp, arrayUnion, arrayRemove, deleteField,
  query, where, getDocs 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { detectSportType, getSportConfig, type SportType, type PeriodKey } from "@/lib/sport-config";

// --- TYPE DEFINITIONS ---
export type SquareData = {
  userId: string;
  displayName: string;
  photoURL?: string;
  claimedAt?: any;
  paid?: boolean;
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
}

interface GameContextType {
  game: GameData | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  setGameId: (id: string) => void;
  claimSquare: (index: number) => Promise<void>;
  joinGame: (gameId: string, password?: string, userId?: string) => Promise<void>;
  unclaimSquare: (index: number) => Promise<void>;
  togglePaid: (index: number, targetUserId?: string) => Promise<void>;
  updateScores: (home: any, away?: any) => Promise<void>;
  scrambleGrid: () => Promise<void>;
  resetGrid: () => Promise<void>;
  deleteGame: () => Promise<void>;
  createGame: (data: any) => Promise<string>;
  getUserGames: (userId: string) => Promise<GameData[]>;
  setGamePhase: (period: string) => Promise<void>;
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

  const claimSquare = async (index: number) => {
    if (!gameId || !user) return;
    const ref = doc(db, "games", gameId);
    const newClaim: SquareData = {
      userId: user.uid,
      displayName: user.displayName || "Player",
      claimedAt: new Date().toISOString(),
      paid: false
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
      
      // Check if user has any other squares in the game
      const hasOtherSquares = Object.entries(game.squares).some(([squareIndex, squareData]) => {
        // Skip the current square we're unclaiming
        if (parseInt(squareIndex) === index) return false;
        
        // Check if this square contains the user
        if (Array.isArray(squareData)) {
          return squareData.some(claim => claim.userId === user.uid);
        }
        return false;
      });
      
      if (newArray.length === 0) {
        const updates: any = { 
          [`squares.${index}`]: deleteField()
        };
        
        // Only remove from playerIds if user has no other squares
        if (!hasOtherSquares) {
          updates.playerIds = arrayRemove(user.uid);
        }
        
        await updateDoc(ref, updates);
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
      // Optional: Add a toast notification here if you have one
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

return (
    <GameContext.Provider value={{ 
      game, 
      loading, 
      error, 
      isAdmin, 
      setGameId, 
      claimSquare, 
      unclaimSquare, 
      togglePaid: async () => {}, 
      createGame, 
      updateScores, 
      scrambleGrid, 
      resetGrid, 
      deleteGame, 
      getUserGames, 
      setGamePhase,
      joinGame // <--- THIS WAS MISSING
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);