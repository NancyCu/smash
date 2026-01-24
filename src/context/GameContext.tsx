"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "@/lib/firebase"; 
import { 
  doc, 
  getDoc,
  onSnapshot, 
  updateDoc, 
  arrayUnion,  // <--- ADD THIS WORD HERE
  deleteDoc,
  serverTimestamp,
  deleteField,
  collection,
  query,
  where,
  getDocs,
  addDoc
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
  error: string | null;
  setGameId: (id: string) => void;
  isAdmin: boolean;
  
  // -- Admin Actions --
  updateScores: (teamA: number, teamB: number) => Promise<void>;
  scrambleGrid: () => Promise<void>;
  resetGrid: () => Promise<void>;
  deleteGame: () => Promise<void>;
  manualPayout: (gameId: string, status: boolean) => Promise<void>; 
  joinGame: (gameId: string) => Promise<{ ok: boolean; error?: string }>;
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
  const [gameId, setGameId] = useState<string | null>(null);
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth(); 

  // Listener
  useEffect(() => {
    if (!gameId) {
      setGame(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(doc(db, "games", gameId), (docSnap) => {
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
        setError("Game not found");
        setGame(null);
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

    try {
      await updateDoc(doc(db, "games", gameId), {
        [`squares.${key}`]: {
          userId: user.uid,
          displayName: user.displayName || "Unknown",
          photoURL: user.photoURL || "",
          paidAt: null
        }
      });
    } catch (e) { console.error("Claim failed", e); }
  };

  const unclaimSquare = async (index: number) => {
    if (!gameId || !user) return;
    const key = index.toString();
    
    // Only allow unclaim if user owns it OR is admin
    const square = game?.squares[key];
    if (!square) return;
    if (square.userId !== user.uid && !isAdmin) return;

    try {
      // Fixed: Using deleteField() directly from top-level import
      await updateDoc(doc(db, "games", gameId), {
        [`squares.${key}`]: deleteField() 
      });
    } catch (e) { console.error("Unclaim failed", e); }
  };

  const togglePaid = async (index: number) => {
    if (!gameId || !isAdmin) return;
    const key = index.toString();
    const square = game?.squares[key];
    if (!square) return;

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
  
const joinGame = async (gameIdInput: string): Promise<{ ok: boolean; error?: string }> => {
    if (!user) return { ok: false, error: "Must be logged in" };

    try {
      // 1. clean the input
      const cleanId = gameIdInput.trim();
      
      // 2. check if game exists
      const gameRef = doc(db, "games", cleanId);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        return { ok: false, error: "Game not found. Check the code." };
      }

      // 3. check if already joined (optional optimization)
      const gData = gameSnap.data();
      const isAlreadyIn = gData.players?.some((p: any) => p.id === user.uid);

      if (!isAlreadyIn) {
        // 4. Add player to list
        await updateDoc(gameRef, {
          players: arrayUnion({
            id: user.uid,
            email: user.email,
            displayName: user.displayName || "Anonymous",
            paid: false,
            joinedAt: Date.now()
          })
        });
      }

      // 5. Update Local State
      if (typeof window !== "undefined") {
        localStorage.setItem("activeGameId", cleanId);
      }
      setGameId(cleanId);

      // --- THE IMPORTANT PART: RETURN SUCCESS ---
      return { ok: true };

    } catch (err: any) {
      console.error("Join Error:", err);
      // --- THE IMPORTANT PART: RETURN ERROR ---
      return { ok: false, error: err.message || "Failed to join" };
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