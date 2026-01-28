'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  getDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { generateQuarterlyNumbers, type GameAxisData } from "@/lib/game-logic";

// --- Types ---

export interface Player {
  id: string;
  name: string;
  squares: number; // Count of squares owned
  paid: boolean;
  paidAt?: number; // Timestamp when payment was made
}

export interface PayoutEvent {
  id: string;
  period: number | string; // 1, 2, 3, 4 or "Final"
  label: string; // "Q1 Winner", "Touchdown", etc.
  amount: number;
  winnerUserId: string;
  winnerName: string;
  timestamp: number;
  teamAScore: number;
  teamBScore: number;
  // Metadata for global history
  gameId?: string;
  gameName?: string;
  teamA?: string;
  teamB?: string;
  eventDate?: string;
  winners?: { uid: string; name: string }[]; // For shared pots
}

export type PayoutLog = PayoutEvent;

export interface GameSettings {
  name: string;
  teamA: string;
  teamB: string;
  pricePerSquare: number;
  rows: number[]; // The 0-9 digits for Team A (Vertical usually)
  cols: number[]; // The 0-9 digits for Team B (Horizontal usually)
  isScrambled: boolean; // Have the digits been randomized yet?
  payouts: { label: string; amount: number }[]; // Custom payout structure (optional)
  espnGameId?: string; // Linked Live Game ID
  eventName?: string; // "Super Bowl LIX"
  espnLeague?: string; // "nfl", "nba"
  eventDate?: string; // ISO date string
  payoutFrequency?: "Standard" | "NBA_Frequent" | "Manual";
  
  axisValues?: GameAxisData; 
}

export interface SquareClaim {
  uid: string;
  name: string;
  claimedAt: number; 
}

export interface GameState {
  id: string;
  hostUserId: string;
  hostName: string;
  createdAt: number;
  settings: GameSettings;
  squares: Record<string, SquareClaim[]>; // key: "rowIndex-colIndex" -> [{uid, name}]
  players: Player[];
  playerIds: string[]; // Array of user IDs for efficient querying
  scores: { teamA: number; teamB: number }; // Manual score tracking
  payoutHistory: PayoutEvent[];
}

interface GameContextType {
  activeGame: GameState | null;
  settings: GameSettings;
  squares: Record<string, SquareClaim[]>;
  players: Player[];
  scores: { teamA: number; teamB: number };
  payoutHistory: PayoutEvent[];
  loading: boolean;
  createGame: (name: string, price: number, teamA: string, teamB: string, espnGameId?: string, eventDate?: string, eventName?: string, espnLeague?: string) => Promise<string>;
  joinGame: (gameId: string, password?: string, userId?: string) => Promise<{ ok: boolean; error?: string }>;
  leaveGame: () => void;
  claimSquare: (row: number, col: number, user: { id: string; name: string }) => Promise<void>;
  unclaimSquare: (row: number, col: number, userId: string) => Promise<void>;
  togglePaid: (playerId: string) => Promise<void>;
  deletePlayer: (playerId: string) => Promise<void>;
  updateScores: (teamA: number, teamB: number) => Promise<void>;
  scrambleGridDigits: () => Promise<void>;
  resetGridDigits: () => Promise<void>;
  resetGame: () => Promise<void>;
  updateSettings: (newSettings: Partial<GameSettings>) => Promise<void>;
  getUserGames: (userId: string) => Promise<GameState[]>;
  logPayout: (event: PayoutEvent) => Promise<void>;
  deleteGame: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);

  // Restore activeGameId from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('activeGameId');
    if (saved) setActiveGameId(saved);
  }, []);

  // Save activeGameId to localStorage when it changes
  useEffect(() => {
    if (activeGameId) {
      localStorage.setItem('activeGameId', activeGameId);
    } else {
      localStorage.removeItem('activeGameId');
    }
  }, [activeGameId]);

  const defaultSettings: GameSettings = {
    name: "",
    teamA: "Team A",
    teamB: "Team B",
    pricePerSquare: 0,
    rows: [],
    cols: [],
    isScrambled: false,
    payouts: [],
    payoutFrequency: "Standard"
  };

  useEffect(() => {
    if (!activeGameId) {
      setActiveGame(null);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(doc(db, "games", activeGameId), (docSnap) => {
      setLoading(false);
      if (docSnap.exists()) {
        const data = docSnap.data() as GameState;
        if (!data.squares) data.squares = {};
        if (!data.players) data.players = [];
        if (!data.playerIds) data.playerIds = [];
        if (!data.payoutHistory) data.payoutHistory = [];
        data.payoutHistory.sort((a, b) => b.timestamp - a.timestamp);
        
        setActiveGame({ ...data, id: docSnap.id });
      } else {
        setActiveGameId(null);
        setActiveGame(null);
      }
    }, (err) => {
      console.error("Game sync error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [activeGameId]);

  const createGame = async (name: string, price: number, teamA: string, teamB: string, espnGameId?: string, eventDate?: string, eventName?: string, espnLeague?: string) => {
    if (!user) throw new Error("Must be logged in");

    const newGame: Omit<GameState, "id"> = {
      hostUserId: user.uid,
      hostName: user.displayName || "Host",
      createdAt: Date.now(),
      settings: {
        name,
        pricePerSquare: price,
        teamA,
        teamB,
        rows: [], 
        cols: [],
        isScrambled: false,
        payouts: [],
        payoutFrequency: "Standard",
        espnGameId,
        eventDate,
        eventName,
        espnLeague
      },
      squares: {},
      players: [],
      playerIds: [],
      scores: { teamA: 0, teamB: 0 },
      payoutHistory: []
    };

    const docRef = doc(collection(db, "games"));
    await setDoc(docRef, newGame);
    setActiveGameId(docRef.id);
    return docRef.id;
  };

  const joinGame = async (gameId: string, password?: string, userId?: string) => {
    try {
      const gameDoc = await getDoc(doc(db, "games", gameId));
      if (gameDoc.exists()) {
         setActiveGameId(gameId);
         return { ok: true };
      } else {
         return { ok: false, error: "Game not found" };
      }
    } catch (error) {
       console.error("Error joining game:", error);
       return { ok: false, error: "Failed to join game" };
    }
  };

  const leaveGame = () => {
    setActiveGameId(null);
    setActiveGame(null);
  };

  const updateSettings = async (newSettings: Partial<GameSettings>) => {
    if (!activeGame) return;
    const updates: Record<string, any> = {};
    for (const [key, value] of Object.entries(newSettings)) {
        updates[`settings.${key}`] = value;
    }
    await updateDoc(doc(db, "games", activeGame.id), updates);
  };

  const claimSquare = async (row: number, col: number, claimant: { id: string; name: string }) => {
    if (!activeGame) return;
    
    const key = `${row}-${col}`;
    const updates: Record<string, any> = {};
    updates[`squares.${key}`] = arrayUnion({ 
      uid: claimant.id, 
      name: claimant.name, 
      claimedAt: Date.now() 
    }); 

    const playerIndex = activeGame.players.findIndex(p => p.id === claimant.id);
    if (playerIndex === -1) {
        updates["players"] = arrayUnion({ id: claimant.id, name: claimant.name, squares: 1, paid: false });
        updates["playerIds"] = arrayUnion(claimant.id);
    } else {
        const updatedPlayers = [...activeGame.players];
        updatedPlayers[playerIndex].squares += 1;
        updates["players"] = updatedPlayers;
    }

    await updateDoc(doc(db, "games", activeGame.id), updates);
  };

  const unclaimSquare = async (row: number, col: number, userId: string) => {
    if (!activeGame) return;
    const key = `${row}-${col}`;
    const claims = activeGame.squares[key] || [];
    const claimToRemove = claims.find(c => c.uid === userId);
    
    if (!claimToRemove) return;

    const updates: Record<string, any> = {};
    updates[`squares.${key}`] = arrayRemove(claimToRemove);

    const playerIndex = activeGame.players.findIndex(p => p.id === userId);
    if (playerIndex !== -1) {
        const updatedPlayers = [...activeGame.players];
        const newCount = Math.max(0, updatedPlayers[playerIndex].squares - 1);
        if (newCount === 0) {
            // Remove player if they have no squares left
            updates["players"] = arrayRemove(updatedPlayers[playerIndex]);
            updates["playerIds"] = arrayRemove(userId);
        } else {
            updatedPlayers[playerIndex].squares = newCount;
            updates["players"] = updatedPlayers;
        }
    }

    await updateDoc(doc(db, "games", activeGame.id), updates);
  };

  const togglePaid = async (playerId: string) => {
    if (!activeGame) return;
    const playerIndex = activeGame.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const updatedPlayers = [...activeGame.players];
    updatedPlayers[playerIndex].paid = !updatedPlayers[playerIndex].paid;
    updatedPlayers[playerIndex].paidAt = updatedPlayers[playerIndex].paid ? Date.now() : undefined;
    
    await updateDoc(doc(db, "games", activeGame.id), { players: updatedPlayers });
  };

  const deletePlayer = async (playerId: string) => {
      if (!activeGame) return;
      const newSquares = { ...activeGame.squares };
      Object.keys(newSquares).forEach(key => {
          const originalLen = newSquares[key].length;
          newSquares[key] = newSquares[key].filter(c => c.uid !== playerId);
          if (newSquares[key].length === 0) delete newSquares[key];
      });

      const newPlayers = activeGame.players.filter(p => p.id !== playerId);
      const newPlayerIds = activeGame.playerIds?.filter(id => id !== playerId) || [];

      await updateDoc(doc(db, "games", activeGame.id), {
          players: newPlayers,
          playerIds: newPlayerIds,
          squares: newSquares
      });
  };

  const updateScores = async (teamA: number, teamB: number) => {
    if (!activeGame) return;
    await updateDoc(doc(db, "games", activeGame.id), {
        scores: { teamA, teamB }
    });
  };

  const scrambleGridDigits = async () => {
    if (!activeGame) return;
    const newAxisData = generateQuarterlyNumbers();
    const newRows = newAxisData.q1.rows;
    const newCols = newAxisData.q1.cols;

    const updates = {
      "settings.isScrambled": true,
      "settings.rows": newRows,
      "settings.cols": newCols,
      "settings.axisValues": newAxisData, 
    };

    await updateDoc(doc(db, "games", activeGame.id), updates);
  };

  const resetGridDigits = async () => {
    if (!activeGame) return;
    await updateDoc(doc(db, "games", activeGame.id), {
        "settings.rows": [],
        "settings.cols": [],
        "settings.isScrambled": false,
        "settings.axisValues": null
    });
  };
  
  const resetGame = async () => {
      if (!activeGame) return;
      await updateDoc(doc(db, "games", activeGame.id), {
          "settings.rows": [],
          "settings.cols": [],
          "settings.isScrambled": false,
          "settings.axisValues": null,
          squares: {},
          players: [],
          playerIds: [],
          scores: { teamA: 0, teamB: 0 },
          payoutHistory: []
      });
  };

  const getUserGames = async (userId: string): Promise<GameState[]> => {
    // Query for games where user is the host
    const qHost = query(collection(db, "games"), where("hostUserId", "==", userId));
    const snapHost = await getDocs(qHost);
    const hostedGames = snapHost.docs.map(d => ({ ...d.data(), id: d.id } as GameState));
    
    // Query for games where user is a player
    const qPlayer = query(collection(db, "games"), where("playerIds", "array-contains", userId));
    const snapPlayer = await getDocs(qPlayer);
    const participatedGames = snapPlayer.docs.map(d => ({ ...d.data(), id: d.id } as GameState));
    
    // Combine and deduplicate by game ID
    const allGames = [...hostedGames];
    const hostedGameIds = new Set(hostedGames.map(g => g.id));
    
    participatedGames.forEach(game => {
      if (!hostedGameIds.has(game.id)) {
        allGames.push(game);
      }
    });
    
    return allGames;
  };

  // --- MODIFIED: This function now writes to two places ---
  const logPayout = async (event: PayoutEvent) => {
    if (!activeGame) return;
    if (!event.id) {
        console.error("Payout event is missing a unique ID.");
        return;
    }

    // 1. Add to the specific game's payoutHistory array (for in-game UI)
    const gameDocRef = doc(db, "games", activeGame.id);
    await updateDoc(gameDocRef, {
        payoutHistory: arrayUnion(event)
    });

    // 2. Add to the top-level 'payouts' collection (for global winners page)
    const payoutDocRef = doc(db, "payouts", event.id);
    await setDoc(payoutDocRef, event);
  };

  const deleteGame = async () => {
      if (!activeGame) return;
      await deleteDoc(doc(db, "games", activeGame.id));
      setActiveGameId(null);
      setActiveGame(null);
  };

  return (
    <GameContext.Provider value={{
      activeGame,
      settings: activeGame?.settings || defaultSettings,
      squares: activeGame?.squares || {},
      players: activeGame?.players || [],
      scores: activeGame?.scores || { teamA: 0, teamB: 0 },
      payoutHistory: activeGame?.payoutHistory || [],
      loading,
      createGame,
      joinGame,
      leaveGame,
      claimSquare,
      unclaimSquare,
      togglePaid,
      deletePlayer,
      updateScores,
      scrambleGridDigits,
      resetGridDigits,
      resetGame,
      updateSettings,
      getUserGames,
      logPayout,
      deleteGame
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}
