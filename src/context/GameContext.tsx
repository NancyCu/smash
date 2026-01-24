"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "@/lib/firebase"; 
import { 
  doc, 
  getDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext"; 

// --- 1. DEFINITIONS ---
export interface SquareData {
  userId: string;
  displayName: string;
  photoURL?: string;
  paidAt?: number | object | null;
}

export interface PayoutLog {
  id?: string;
  gameName?: string;
  gameId?: string;
  winnerName: string;
  teamA?: string;
  teamB?: string;
  label: string;
  period?: string | number;
  timestamp: number | string;
  amount: number;
  teamAScore: number;
  teamBScore: number;
}

export interface GameData {
  id: string;
  name: string;
  host: string;
  hostId: string;
  price: number;
  pot: number;
  teamA: string;
  teamB: string;
  espnGameId?: string; // Added for ESPN integration
  createdAt?: any; 
  scores: {
    q1: { home: number; away: number };
    q2: { home: number; away: number };
    q3: { home: number; away: number };
    final: { home: number; away: number };
    teamA: number; 
    teamB: number; 
  };
  payouts: Array<{ label: string; amount: number }>;
  isScrambled: boolean;
  isPaidOut?: boolean; // Added optional field for types
  axis: {
    q1: { row: number[]; col: number[] };
    q2: { row: number[]; col: number[] };
    q3: { row: number[]; col: number[] };
    final: { row: number[]; col: number[] };
  };
  squares: Record<string, SquareData>; 
}

// 2. The Context Interface (The Contract)
interface GameContextType {
  game: GameData | null;
  loading: boolean;
  createGame: (name: string, price: number, teamA: string, teamB: string, espnGameId?: string, eventDate?: string, eventName?: string, espnLeague?: string) => Promise<string>;
  joinGame: (gameId: string) => Promise<{ ok: boolean; error?: string }>;
  leaveGame: () => void;
  claimSquare: (row: number, col: number, user: { id: string; name: string }) => Promise<void>;
  unclaimSquare: (row: number, col: number, userId: string) => Promise<void>;
  togglePaid: (playerId: string) => Promise<void>;
  deletePlayer: (playerId: string) => Promise<void>;
  updateScores: (teamA: number, teamB: number) => Promise<void>;
  scrambleGrid: () => Promise<void>;
  resetGrid: () => Promise<void>;
  deleteGame: () => Promise<void>;
  manualPayout: (gameId: string, status: boolean) => Promise<void>; 
  joinGame: (gameId: string) => Promise<void>;
  createGame: (name: string, price: number, teamA: string, teamB: string, espnGameId?: string, eventDate?: string, eventName?: string, espnLeague?: string) => Promise<string>;
  getUserGames: (userId: string) => Promise<GameData[]>;

  // -- Player Actions --
  claimSquare: (index: number) => Promise<void>;
  unclaimSquare: (index: number) => Promise<void>;
  togglePaid: (index: number) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// 3. The Provider
export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const initialGameId = typeof window === "undefined" ? null : localStorage.getItem("activeGameId");
  const [activeGameId, setActiveGameIdState] = useState<string | null>(initialGameId);
  const [activeGame, setActiveGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !!initialGameId);

  const setActiveGameId = (id: string | null) => {
    setActiveGameIdState(id);
    if (id) {
      setLoading(true);
    } else {
      setLoading(false);
      setActiveGame(null);
    }
  };

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
    if (!activeGameId) return;

    const unsub = onSnapshot(doc(db, "games", activeGameId), (docSnap) => {
      setLoading(false);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGame({
          id: docSnap.id,
          ...data,
          scores: data.scores || { q1:{home:0,away:0}, q2:{home:0,away:0}, q3:{home:0,away:0}, final:{home:0,away:0}, teamA:0, teamB:0 },
          axis: data.axis || { q1:{row:[],col:[]}, q2:{row:[],col:[]}, q3:{row:[],col:[]}, final:{row:[],col:[]} },
          squares: data.squares || {},
        } as GameData);
      } else {
        setActiveGameId(null);
      }
    }, (err) => {
      console.error(err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsub();
  }, [gameId]);

  const isAdmin = user?.uid === game?.hostId;

  // -- IMPLEMENTATION OF ACTIONS --

  const claimSquare = async (index: number) => {
    if (!gameId || !user) return;
    const key = index.toString();
    // Optimistic check
    if (game?.squares[key]) return; 

  const joinGame = async (gameId: string) => {
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
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(newSettings)) {
        updates[`settings.${key}`] = value;
    }
    await updateDoc(doc(db, "games", activeGame.id), updates);
  };

  const claimSquare = async (row: number, col: number, claimant: { id: string; name: string }) => {
    if (!activeGame) return;
    
    const key = `${row}-${col}`;
    const updates: Record<string, unknown> = {};
    updates[`squares.${key}`] = arrayUnion({ 
      uid: claimant.id, 
      name: claimant.name, 
      claimedAt: Date.now() 
    }); 

    const playerIndex = activeGame.players.findIndex(p => p.id === claimant.id);
    if (playerIndex === -1) {
        updates["players"] = arrayUnion({ id: claimant.id, name: claimant.name, squares: 1, paid: false });
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

    const updates: Record<string, unknown> = {};
    updates[`squares.${key}`] = arrayRemove(claimToRemove);

    const playerIndex = activeGame.players.findIndex(p => p.id === userId);
    if (playerIndex !== -1) {
        const updatedPlayers = [...activeGame.players];
        const newCount = Math.max(0, updatedPlayers[playerIndex].squares - 1);
        if (newCount === 0) {
            // Remove player if they have no squares left
            updates["players"] = arrayRemove(updatedPlayers[playerIndex]);
        } else {
            updatedPlayers[playerIndex].squares = newCount;
            updates["players"] = updatedPlayers;
        }
      });
    } catch (e) { console.error("Claim failed", e); }
  };

  const togglePaid = async (playerId: string) => {
    if (!activeGame) return;
    const playerIndex = activeGame.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const updatedPlayers = [...activeGame.players];
    updatedPlayers[playerIndex].paid = !updatedPlayers[playerIndex].paid;
    // ✅ CORRECT (Uses undefined instead of null)
    updatedPlayers[playerIndex].paidAt = updatedPlayers[playerIndex].paid ? Date.now() : undefined;
    await updateDoc(doc(db, "games", activeGame.id), { players: updatedPlayers });
  };

  const deletePlayer = async (playerId: string) => {
      if (!activeGame) return;
      const newSquares = { ...activeGame.squares };
        Object.keys(newSquares).forEach(key => {
          newSquares[key] = newSquares[key].filter(c => c.uid !== playerId);
          if (newSquares[key].length === 0) delete newSquares[key];
        });

    const newValue = square.paidAt ? null : serverTimestamp();
    try {
      await updateDoc(doc(db, "games", gameId), {
        [`squares.${key}.paidAt`]: newValue
      });
    } catch (e) { console.error("Toggle paid failed", e); }
  };

  const updateScores = async (teamA: number, teamB: number) => {
      if (!gameId || !isAdmin) return;
      await updateDoc(doc(db, "games", gameId), { "scores.teamA": teamA, "scores.teamB": teamB });
  };

  const scrambleGrid = async () => {
      if (!gameId || !isAdmin) return;
      // Simple shuffle generator
      const shuffle = () => [0,1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
      
      await updateDoc(doc(db, "games", gameId), {
          isScrambled: true,
          axis: { 
            q1:{row:shuffle(),col:shuffle()}, 
            q2:{row:shuffle(),col:shuffle()}, 
            q3:{row:shuffle(),col:shuffle()}, 
            final:{row:shuffle(),col:shuffle()} 
          }
      });
  };

  const resetGrid = async () => {
      if (!gameId || !isAdmin) return;
      await updateDoc(doc(db, "games", gameId), { 
        isScrambled: false, 
        axis: { q1:{row:[],col:[]}, q2:{row:[],col:[]}, q3:{row:[],col:[]}, final:{row:[],col:[]} } 
      });
  };

  const deleteGame = async () => {
      if (!gameId || !isAdmin) return;
      await deleteDoc(doc(db, "games", gameId));
  };
  
  const joinGame = async (gId: string) => {
    const docRef = doc(db, "games", gId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error("Game not found");
    }
  };
  const createGame = async (
    name: string,
    price: number,
    teamA: string,
    teamB: string,
    espnGameId?: string,
    eventDate?: string,
    eventName?: string,
    espnLeague?: string
  ) => {
      if (!user) throw new Error("Must be logged in");

      // Basic game structure
      const newGame = {
          name,
          price,
          teamA,
          teamB,
          host: user.displayName || "Unknown",
          hostId: user.uid,
          createdAt: serverTimestamp(),
          pot: 0,
          scores: { 
            q1:{home:0,away:0}, q2:{home:0,away:0}, q3:{home:0,away:0}, final:{home:0,away:0}, 
            teamA:0, teamB:0 
          },
          payouts: [],
          isScrambled: false,
          axis: { q1:{row:[],col:[]}, q2:{row:[],col:[]}, q3:{row:[],col:[]}, final:{row:[],col:[]} },
          squares: {},
          espnGameId: espnGameId || null,
          espnLeague: espnLeague || null,
      };

      const docRef = await addDoc(collection(db, "games"), newGame);
      return docRef.id;
  };

  const getUserGames = async (userId: string) => {
    try {
      // Currently only fetching games hosted by user due to schema limitations
      const q = query(collection(db, "games"), where("hostId", "==", userId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          scores: data.scores || { q1:{home:0,away:0}, q2:{home:0,away:0}, q3:{home:0,away:0}, final:{home:0,away:0}, teamA:0, teamB:0 },
          axis: data.axis || { q1:{row:[],col:[]}, q2:{row:[],col:[]}, q3:{row:[],col:[]}, final:{row:[],col:[]} },
          squares: data.squares || {},
        } as GameData;
      });
    } catch (error) {
      console.error("Error fetching user games:", error);
      return [];
    }
  };

  // Fixed: manualPayout is now defined in the correct scope
  const manualPayout = async (gameId: string, status: boolean) => {
    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        isPaidOut: status,
        paidAt: status ? serverTimestamp() : null 
      });
    } catch (err) {
      console.error("Payout failed:", err);
    }
  };

  return (
    <GameContext.Provider
      value={{
        game,
        loading,
        error,
        setGameId,
        isAdmin,
        updateScores,
        scrambleGrid,
        resetGrid,
        deleteGame,
        manualPayout, 
        joinGame,
        getUserGames,
        createGame,
        claimSquare,
        unclaimSquare,
        togglePaid
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) throw new Error("useGame must be used within a GameProvider");
  return context;
}