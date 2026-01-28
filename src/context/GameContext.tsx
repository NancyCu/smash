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

// --- RESTORED THIS MISSING EXPORT ---
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
<<<<<<< ours
  price: number;
  pot: number;
  squares: Record<string, SquareData | SquareData[]>;
  scores: { teamA: number; teamB: number };
  isScrambled: boolean;
  payouts: any;
  createdAt: any;
  espnGameId?: string;
  axis?: any;
  participants?: string[];
  currentPeriod?: string;
};
=======
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
>>>>>>> theirs

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
<<<<<<< ours
    const unsub = onSnapshot(doc(db, "games", gameId), (doc) => {
      if (doc.exists()) {
        setGame({ id: doc.id, ...doc.data() } as GameData);
        setError(null);
=======
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
>>>>>>> theirs
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

<<<<<<< ours
    const newClaim: SquareData = {
      userId: user.uid,
      displayName: user.displayName || "Player",
      claimedAt: new Date().toISOString(),
      paid: false
=======
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
>>>>>>> theirs
    };

    try {
        const currentSquare = game?.squares[index];
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

<<<<<<< ours
  const unclaimSquare = async (index: number) => {
    if (!gameId || !user || !game) return;
    const ref = doc(db, "games", gameId);
    const currentSquare = game.squares[index];

    if (Array.isArray(currentSquare)) {
        const newArray = currentSquare.filter(c => c.userId !== user.uid);
        if (newArray.length === 0) {
             await updateDoc(ref, { [`squares.${index}`]: deleteField() });
=======
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
>>>>>>> theirs
        } else {
             await updateDoc(ref, { [`squares.${index}`]: newArray });
        }
    } else {
        await updateDoc(ref, { [`squares.${index}`]: deleteField() });
    }
<<<<<<< ours
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
=======

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
>>>>>>> theirs
  };

  const createGame = async (data: any) => {
    if (!user) throw new Error("Must be logged in");
    const docRef = await addDoc(collection(db, "games"), {
      ...data,
      host: user.uid,
      squares: {},
      scores: { teamA: 0, teamB: 0 },
      isScrambled: false,
      participants: [user.uid],
      currentPeriod: 'q1',
      createdAt: serverTimestamp(),
      pot: 0
    });
    return docRef.id;
  };

  const updateScores = async (s: any) => { if(gameId) await updateDoc(doc(db,"games",gameId), { scores: s }); };
  
  // --- HOST CONTROL ---
  const setGamePhase = async (period: string) => {
      if(!gameId) return;
      await updateDoc(doc(db, "games", gameId), { currentPeriod: period });
  };

  const scrambleGrid = async () => { 
    if(!gameId) return; 
    const generateAxis = () => [0,1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
    const axis = {
        q1: { row: generateAxis(), col: generateAxis() },
        q2: { row: generateAxis(), col: generateAxis() },
        q3: { row: generateAxis(), col: generateAxis() },
        final: { row: generateAxis(), col: generateAxis() }
    };
    await updateDoc(doc(db,"games",gameId), { isScrambled: true, axis: axis });
  };

  const resetGrid = async () => { if(gameId) await updateDoc(doc(db,"games",gameId), { isScrambled: false }); };
  const deleteGame = async () => { if(gameId) await deleteDoc(doc(db,"games",gameId)); };
  
<<<<<<< ours
  const getUserGames = async (uid: string) => {
     if (!uid) return [];
     try {
         const hostedQuery = query(collection(db, "games"), where("host", "==", uid));
         const joinedQuery = query(collection(db, "games"), where("participants", "array-contains", uid));
         const [hostedSnap, joinedSnap] = await Promise.all([getDocs(hostedQuery), getDocs(joinedQuery)]);
         const gamesMap = new Map();
         hostedSnap.forEach(doc => gamesMap.set(doc.id, { id: doc.id, ...doc.data() }));
         joinedSnap.forEach(doc => gamesMap.set(doc.id, { id: doc.id, ...doc.data() }));
         return Array.from(gamesMap.values());
     } catch (e) {
         console.error("Error fetching user games:", e);
         return [];
     }
=======
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
>>>>>>> theirs
  };

  return (
    <GameContext.Provider value={{ 
      game, loading, error, isAdmin, setGameId, 
      claimSquare, unclaimSquare, togglePaid, createGame, 
      updateScores, scrambleGrid, resetGrid, deleteGame, getUserGames,
      setGamePhase
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);