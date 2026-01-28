"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  doc, onSnapshot, updateDoc, deleteDoc, setDoc, 
  collection, addDoc, serverTimestamp, arrayUnion, arrayRemove, deleteField,
  query, where, getDocs 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

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

type GameData = {
  id: string;
  host: string;
  name: string;
  teamA: string;
  teamB: string;
  price: number;
  pot: number;
  squares: Record<string, SquareData | SquareData[]>;
  scores: { teamA: number; teamB: number };
  isScrambled: boolean;
  payouts: any;
  createdAt: any;
  espnGameId?: string;
  axis?: any;
  participants: string[]; // Keep for existing logic
  playerIds: string[];    // New: Efficient history querying
  payoutHistory: PayoutLog[]; // New: The "Winnings" ledger
  currentPeriod?: string;
  status: 'open' | 'active' | 'final';
};

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
  updateScores: (scores: any) => Promise<void>;
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
    const docRef = await addDoc(collection(db, "games"), {
      ...data,
      host: user.uid,
      squares: {},
      participants: [user.uid],
      playerIds: [user.uid],
      payoutHistory: [],
      createdAt: serverTimestamp(),
      isScrambled: false,
    });
    return docRef.id;
  };

  const updateScores = async (s: any) => {
  if (gameId) {
    await updateDoc(doc(db, "games", gameId), { scores: s });
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
  const scrambleGrid = async () => {/* existing scramble logic */}
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