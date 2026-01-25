"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  doc, onSnapshot, updateDoc, deleteDoc, setDoc, 
  collection, addDoc, serverTimestamp, arrayUnion, deleteField,
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
  participants?: string[]; // <--- NEW FIELD: Tracks everyone in the game
};

interface GameContextType {
  game: GameData | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  setGameId: (id: string) => void;
  claimSquare: (index: number) => Promise<void>;
  unclaimSquare: (index: number) => Promise<void>;
  togglePaid: (index: number, targetUserId?: string) => Promise<void>;
  updateScores: (scores: any) => Promise<void>;
  scrambleGrid: () => Promise<void>;
  resetGrid: () => Promise<void>;
  deleteGame: () => Promise<void>;
  createGame: (data: any) => Promise<string>;
  getUserGames: (userId: string) => Promise<any[]>;
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
    const unsub = onSnapshot(doc(db, "games", gameId), (doc) => {
      if (doc.exists()) {
        setGame({ id: doc.id, ...doc.data() } as GameData);
        setError(null);
      } else {
        setError("Game not found");
        setGame(null);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
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

    try {
        const currentSquare = game?.squares[index];
        
        // --- KEY FIX: Add user to 'participants' list automatically ---
        const updatePayload: any = {
            participants: arrayUnion(user.uid) 
        };

        if (Array.isArray(currentSquare)) {
            updatePayload[`squares.${index}`] = arrayUnion(newClaim);
        } else if (currentSquare) {
            updatePayload[`squares.${index}`] = [currentSquare, newClaim];
        } else {
            updatePayload[`squares.${index}`] = [newClaim];
        }

        await updateDoc(ref, updatePayload);

    } catch (e) {
        console.error("Claim Error:", e);
        throw e;
    }
  };

  const unclaimSquare = async (index: number) => {
    if (!gameId || !user || !game) return;
    const ref = doc(db, "games", gameId);
    const currentSquare = game.squares[index];

    if (Array.isArray(currentSquare)) {
        const newArray = currentSquare.filter(c => c.userId !== user.uid);
        if (newArray.length === 0) {
             await updateDoc(ref, { [`squares.${index}`]: deleteField() });
        } else {
             await updateDoc(ref, { [`squares.${index}`]: newArray });
        }
    } else {
        await updateDoc(ref, { [`squares.${index}`]: deleteField() });
    }
  };

  const togglePaid = async (index: number, targetUserId?: string) => {
    if (!gameId || !game) return;
    const ref = doc(db, "games", gameId);
    const squareData = game.squares[index];

    if (Array.isArray(squareData)) {
        const updatedSquares = squareData.map(c => {
            if (!targetUserId || c.userId === targetUserId) {
                return { ...c, paid: !c.paid };
            }
            return c;
        });
        await updateDoc(ref, { [`squares.${index}`]: updatedSquares });
    } else {
        await updateDoc(ref, { [`squares.${index}.paid`]: !squareData.paid });
    }
  };

  const createGame = async (data: any) => {
    if (!user) throw new Error("Must be logged in");
    const docRef = await addDoc(collection(db, "games"), {
      ...data,
      host: user.uid,
      squares: {},
      scores: { teamA: 0, teamB: 0 },
      isScrambled: false,
      participants: [user.uid], // Host is first participant
      createdAt: serverTimestamp(),
      pot: 0
    });
    return docRef.id;
  };

  const updateScores = async (s: any) => { if(gameId) await updateDoc(doc(db,"games",gameId), { scores: s }); };
  const scrambleGrid = async () => { 
    if(!gameId) return; 
    const row = [0,1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-.5);
    const col = [0,1,2,3,4,5,6,7,8,9].sort(()=>Math.random()-.5);
    await updateDoc(doc(db,"games",gameId), { isScrambled: true, axis: { q1:{row,col}, q2:{row,col}, q3:{row,col}, final:{row,col} } });
  };
  const resetGrid = async () => { if(gameId) await updateDoc(doc(db,"games",gameId), { isScrambled: false }); };
  const deleteGame = async () => { if(gameId) await deleteDoc(doc(db,"games",gameId)); };
  
  // --- REAL QUERY IMPLEMENTATION ---
  const getUserGames = async (uid: string) => {
     if (!uid) return [];
     try {
         // 1. Get games I Host
         const hostedQuery = query(collection(db, "games"), where("host", "==", uid));
         // 2. Get games I Joined (via participants array)
         const joinedQuery = query(collection(db, "games"), where("participants", "array-contains", uid));
         
         const [hostedSnap, joinedSnap] = await Promise.all([
             getDocs(hostedQuery),
             getDocs(joinedQuery)
         ]);

         // Merge and remove duplicates (using a Map by ID)
         const gamesMap = new Map();
         hostedSnap.forEach(doc => gamesMap.set(doc.id, { id: doc.id, ...doc.data() }));
         joinedSnap.forEach(doc => gamesMap.set(doc.id, { id: doc.id, ...doc.data() }));

         return Array.from(gamesMap.values());
     } catch (e) {
         console.error("Error fetching user games:", e);
         return [];
     }
  };

  return (
    <GameContext.Provider value={{ 
      game, loading, error, isAdmin, setGameId, 
      claimSquare, unclaimSquare, togglePaid, createGame, 
      updateScores, scrambleGrid, resetGrid, deleteGame, getUserGames
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);