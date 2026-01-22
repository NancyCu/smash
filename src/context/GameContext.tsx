"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  deleteField,
  arrayUnion,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

interface Payout {
  label: string;
  amount: number;
}

interface GameSettings {
  name: string;
  pricePerSquare: number;
  payouts: Payout[];
  teamA: string;
  teamB: string;
  rows: number[];
  cols: number[];
  rules?: string;
  eventName?: string;
  eventDate?: string;
  espnGameId?: string;
  espnLeague?: string;
  payoutFrequency?: "NBA_Standard" | "NBA_Frequent" | "Manual";
  isScrambled?: boolean;
}

interface Player {
  id: string;
  name: string;
  squares: number;
  paid: boolean;
  paidAt?: number;
}

export interface PayoutLog {
  id: string; // e.g., "Q1_END", "Q1_MID"
  period: number;
  label: string;
  amount: number;
  winnerUserId: string;
  winnerName: string;
  winners?: { uid: string; name: string }[];
  timestamp: number;
  teamAScore: number;
  teamBScore: number;
  gameId?: string;
  gameName?: string;
  teamA?: string;
  teamB?: string;
  eventDate?: string;
}

export interface GameState {
  id: string;
  password?: string;
  hostUserId: string;
  hostName: string;
  createdAt: number;
  settings: GameSettings;
  playerIds?: string[];
  // Squares are stored in subcollection games/{id}/squares
  // Paid status is stored as a map for host/admin control.
  // We store timestamp (number) for paid, or false/undefined for unpaid.
  paidByUid?: Record<string, boolean | number>;
  scores: { teamA: number; teamB: number };
}

export type PropBetStatus = "OPEN" | "LOCKED" | "PAYOUT";

export interface PropBetOption {
  id: string; // "Heads", "Tails" - simple string matching
  label: string;
}

export interface PropBetWager {
  userId: string;
  userName: string;
  selectedOption: string;
  timestamp: number;
}

export interface PropBet {
  id: string;
  question: string;
  entryFee: number;
  options: string[]; // Options are simple strings
  status: PropBetStatus;
  winningOption?: string | null;
  bets: PropBetWager[];
  createdAt: number;
}

export interface LedgerTransaction {
  id: string;
  userId: string;
  type: "PROP_ENTRY" | "PROP_WIN" | "SQUARES_ENTRY" | "SQUARE_WIN";
  amount: number; // Positive for Win, Negative for Entry
  description: string;
  timestamp: number;
  relatedId?: string; // propBetId or gameId
}

type SquareClaim = {
  uid: string;
  name: string;
  claimedAt: number;
};

type SquareDoc = {
  claims?: Record<string, { name: string; claimedAt: number }>;
};

type CreateGameInput = {
  hostUserId: string;
  hostName: string;
  password?: string;
  settings: Omit<Partial<GameSettings>, "rows" | "cols">;
};

type JoinGameResult =
  | { ok: true; gameId: string }
  | { ok: false; error: string };

interface GameContextType {
  activeGameId: string | null;
  activeGame: GameState | null;
  availableGames: Array<Pick<GameState, "id" | "createdAt" | "hostName" | "settings">>;
  settings: GameSettings;
  squares: Record<string, SquareClaim[]>; // cellKey => claims
  players: Player[];
  scores: { teamA: number; teamB: number };
  createGame: (input: CreateGameInput) => Promise<string>;
  joinGame: (gameId: string, password?: string, userId?: string) => Promise<JoinGameResult>;
  leaveGame: () => void;
  resetGame: () => Promise<void>;
  claimSquare: (row: number, col: number, player: { id: string; name: string }) => Promise<void>;
  unclaimSquare: (row: number, col: number, playerId: string) => Promise<void>;
  togglePaid: (playerId: string) => Promise<void>;
  getUserGames: (uid: string) => Promise<GameState[]>;
  deletePlayer: (playerId: string) => Promise<void>;
  updateSettings: (newSettings: Partial<GameSettings>) => Promise<void>;
  updateScores: (teamA: number, teamB: number) => Promise<void>;
  scrambleGridDigits: () => Promise<void>;
  resetGridDigits: () => Promise<void>;
  logPayout: (payout: PayoutLog) => Promise<void>;
  payoutHistory: PayoutLog[];
  deleteGame: () => Promise<void>;
  
  // Prop Bets
  propBets: PropBet[];
  createPropBet: (question: string, entryFee: number, options: string[]) => Promise<void>;
  placePropBet: (propId: string, option: string, user: { uid: string; displayName: string }) => Promise<void>;
  settlePropBet: (propId: string, winningOption: string) => Promise<void>;
  deletePropBet: (propId: string) => Promise<void>;
  
  // Ledger
  ledger: LedgerTransaction[]; // Global ledger for admin/all? or filtered? We'll load all for now.
  getUserLedger: (uid: string) => LedgerTransaction[];
}

const BASE_DIGITS = Array.from({ length: 10 }, (_, i) => i);

function numericDigits(): number[] {
  return [...BASE_DIGITS];
}

const defaultSettings: GameSettings = {
  name: "Season Opener 2024",
  pricePerSquare: 50,
  payouts: [
    { label: "Q1 Winner", amount: 500 },
    { label: "Q2 Winner", amount: 500 },
    { label: "Q3 Winner", amount: 500 },
    { label: "Final Winner", amount: 1000 },
  ],
  teamA: "Baltimore Ravens",
  teamB: "Kansas City Chiefs",
  eventName: "Baltimore Ravens @ Kansas City Chiefs",
  eventDate: new Date().toISOString(),
  espnGameId: "",
  espnLeague: "NFL",
  rows: numericDigits(),
  cols: numericDigits(),
  isScrambled: false,
  payoutFrequency: "Manual",
};

function shuffleDigits(): number[] {
  const digits = Array.from({ length: 10 }, (_, i) => i);
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits;
}

function generateGameId(): string {
  // Simple random 8-char code. Conflict handling is minimal here but sufficient for small scale.
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<GameState | null>(null);
  const [squares, setSquares] = useState<Record<string, SquareClaim[]>>({});
  const [participants, setParticipants] = useState<Omit<Player, "paid" | "paidAt">[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutLog[]>([]);
  const [propBets, setPropBets] = useState<PropBet[]>([]);
  const [ledger, setLedger] = useState<LedgerTransaction[]>([]);

  // Derived state to combine participants with paid status, preventing race conditions
  const players: Player[] = React.useMemo(() => {
    const paidByUid = activeGame?.paidByUid ?? {};
    return participants.map((p) => {
      const paymentInfo = paidByUid[p.id];
      return {
        ...p,
        paid: !!paymentInfo,
        paidAt: typeof paymentInfo === "number" ? paymentInfo : undefined,
      };
    });
  }, [participants, activeGame?.paidByUid]);

  // Subscribe to the active game in Firestore
  useEffect(() => {
    if (!activeGameId) {
      setActiveGame(null);
      setSquares({});
      setParticipants([]);
      return;
    }

    const docRef = doc(db, "games", activeGameId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setActiveGame(snap.data() as GameState);
      } else {
        // Document deleted or doesnt exist
        setActiveGame(null);
        setActiveGameId(null);
      }
    });

    return () => unsubscribe();
  }, [activeGameId]);

  // Subscribe to square claims for the active game
  useEffect(() => {
    if (!activeGameId) return;

    const squaresRef = collection(db, "games", activeGameId, "squares");
    const unsubscribe = onSnapshot(squaresRef, (snap) => {
      const nextSquares: Record<string, SquareClaim[]> = {};
      const byUid: Record<string, { id: string; name: string; squares: number }> = {};

      snap.forEach((d) => {
        const data = d.data() as SquareDoc;
        const claimsMap = data?.claims ?? {};
        const claims: SquareClaim[] = Object.entries(claimsMap)
          .map(([uid, claim]) => ({
            uid,
            name: (claim?.name ?? "").trim() || "Anonymous",
            claimedAt: Number(claim?.claimedAt ?? 0),
          }))
          .filter((c) => !!c.uid)
          .sort((a, b) => a.claimedAt - b.claimedAt);

        if (claims.length === 0) return;
        nextSquares[d.id] = claims;

        for (const c of claims) {
          if (!byUid[c.uid]) {
            byUid[c.uid] = { id: c.uid, name: c.name, squares: 0 };
          }
          byUid[c.uid].squares += 1;
          const claimedName = (c.name ?? "").trim();
          if (claimedName) byUid[c.uid].name = claimedName;
        }
      });
      
      // We need activeGame to check paid status
      // But we can't reference activeGame in the snapshot callback easily without causing dependencies issues
      // Update: We now decouple this. We only set the basic participant structure here.
      // The `players` memo above will merge in the payment info from `activeGame`.
      
      const nextParticipants = Object.values(byUid);
      
      setSquares(nextSquares);
      setParticipants(nextParticipants);
    });

    return () => unsubscribe();
  }, [activeGameId]);

  // Subscribe to Prop Bets
  useEffect(() => {
    if (!activeGameId) {
      setPropBets([]);
      return;
    }
    const q = query(collection(db, "games", activeGameId, "prop_bets"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const props: PropBet[] = [];
      snap.forEach(d => props.push({ id: d.id, ...d.data() } as PropBet));
      props.sort((a, b) => b.createdAt - a.createdAt); // Newest first
      setPropBets(props);
    });
    return () => unsubscribe();
  }, [activeGameId]);

  // Subscribe to Ledger
  useEffect(() => {
    if (!activeGameId) {
      setLedger([]);
      return;
    }
    const q = query(collection(db, "games", activeGameId, "ledger"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const txs: LedgerTransaction[] = [];
      snap.forEach(d => txs.push({ id: d.id, ...d.data() } as LedgerTransaction));
      txs.sort((a, b) => b.timestamp - a.timestamp);
      setLedger(txs);
    });
    return () => unsubscribe();
  }, [activeGameId]);

  // SCRAMBLE CHECKER: 2 Minutes Before Game Check
  useEffect(() => {
    if (!activeGame || !activeGameId) return;
    
    // Check every 30 seconds
    const interval = setInterval(() => {
      const { settings } = activeGame;
      if (settings.isScrambled) return; // Already done
      if (!settings.eventDate) return;  // No date set

      const eventTime = new Date(settings.eventDate).getTime();
      const now = Date.now();
      const timeUntilStart = eventTime - now;

      // Logic: If within 2 minutes (120000ms) AND strictly before start (positive value)
      // We also add a buffer so we don't scramble days after. E.g. within [0, 2 mins]
      if (timeUntilStart > 0 && timeUntilStart <= 2 * 60 * 1000) {
         console.log("Auto-scrambling grid due to 2-minute fail-safe...");
         scrambleGridDigits();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeGame, activeGameId]); // Depend on activeGame to get fresh settings/isScrambled status

  // AUTO-
  // AUTO-REPAIR: If current user is in participants but not in playerIds, fix it.
  useEffect(() => {
    if (!activeGameId || !user || !activeGame) return;
    
    // Check if user has any claims (derived from participants which comes from squares snapshot)
    const isParticipant = participants.some(p => p.id === user.uid);
    // Check if user is officially recorded in the game doc
    const isRecorded = activeGame.playerIds?.includes(user.uid);
    
    if (isParticipant && !isRecorded) {
       console.log("Repairing playerIds for user", user.uid);
       const docRef = doc(db, "games", activeGameId);
       // Use arrayUnion to safely add without overwriting
       updateDoc(docRef, {
         playerIds: arrayUnion(user.uid)
       }).catch(err => console.error("Failed to repair playerIds", err));
    }
  }, [activeGameId, user, activeGame, participants]);

  // Keep paid flags in sync when activeGame changes
  // REMOVED: Synchronization is now handled by the `players` useMemo.

  const createGame = async (input: CreateGameInput) => {
    const id = generateGameId();
    const settings: GameSettings = {
      ...defaultSettings,
      ...input.settings,
      rows: numericDigits(),
      cols: numericDigits(),
    };

    const newGame: GameState = {
      id,
      password: input.password?.trim() || "",
      playerIds: [input.hostUserId],
      hostUserId: input.hostUserId,
      hostName: input.hostName,
      createdAt: Date.now(),
      settings,
      paidByUid: {},
      scores: { teamA: 0, teamB: 0 },
    };

    try {
      console.log("Attempting to create game in Firestore...", newGame);
      
      // Timeout after 15s - if it hangs here, the DB likely doesn't exist
      await Promise.race([
        setDoc(doc(db, "games", id), newGame),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Connection timeout. PLEASE ACTION: Go to Firebase Console -> Build -> Firestore Database and click 'Create Database'.")), 15000)
        )
      ]);
      
      console.log("Game created successfully!");
      setActiveGameId(id);
      return id;
    } catch (error) {
      console.error("Error creating game:", error);
      throw error;
    }
  };

  const joinGame = async (gameId: string, password?: string, userId?: string): Promise<JoinGameResult> => {
    const trimmedId = gameId.trim().toUpperCase();
    const docRef = doc(db, "games", trimmedId);
    const snap = await getDoc(docRef);
    
    if (!snap.exists()) {
      return { ok: false, error: "Game not found. Check the code." };
    }

    const gameData = snap.data() as GameState;
    const isParticipant = userId && gameData.playerIds?.includes(userId);

    if (!isParticipant && gameData.password && (password ?? "").trim() !== gameData.password) {
      return { ok: false, error: "Incorrect game password." };
    }

    // Add user to playerIds if they're not already in the list
    if (userId && !isParticipant) {
      await updateDoc(docRef, {
        playerIds: arrayUnion(userId)
      });
    }

    setActiveGameId(trimmedId);
    return { ok: true, gameId: trimmedId };
  };

  const leaveGame = () => {
    setActiveGameId(null);
    setActiveGame(null);
  };

  const resetGame = async () => {
    if (!activeGameId) return;
    const gameRef = doc(db, "games", activeGameId);
    const squaresRef = collection(db, "games", activeGameId, "squares");
    const snap = await getDocs(squaresRef);

    let batch = writeBatch(db);
    let opCount = 0;
    for (const d of snap.docs) {
      batch.delete(d.ref);
      opCount += 1;
      if (opCount >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }
    if (opCount > 0) await batch.commit();

    await updateDoc(gameRef, {
      paidByUid: {},
      scores: { teamA: 0, teamB: 0 },
    });
  };

  const claimSquare = async (row: number, col: number, player: { id: string; name: string }) => {
    if (!activeGameId || !activeGame) return;
    
    // Check locked status
    // If not scrambled/locked, players can claim. But if scrambled and locked, no new claims?
    // Usually squares are closed once grid is generated.
    if (activeGame.settings.isScrambled) {
       alert("Game is locked! Cannot change squares after grid is scrambled.");
       return;
    }

    if (!player?.id) {
      console.error("claimSquare: missing player id", { row, col, player });
      return;
    }

    const safeName = (player.name ?? "").trim() || "Anonymous";
    const key = `${row}-${col}`;

    const existingClaims = squares[key] ?? [];
    if (existingClaims.some((c) => c.uid === player.id)) return;
    if (existingClaims.length >= 10) return;

    const gameRef = doc(db, "games", activeGameId);
    const squareRef = doc(db, "games", activeGameId, "squares", key);

    try {
      await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) throw "Game does not exist!";

        const squareDoc = await transaction.get(squareRef);
        const current = (squareDoc.exists() ? (squareDoc.data() as SquareDoc) : null) ?? {};
        const claims = current.claims ?? {};

        if (claims[player.id]) return;
        const claimantIds = Object.keys(claims);
        if (claimantIds.length >= 10) return;

        const nextClaims: NonNullable<SquareDoc["claims"]> = {
          ...claims,
          [player.id]: {
            name: safeName,
            claimedAt: Date.now(),
          },
        };

        transaction.set(squareRef, { claims: nextClaims }, { merge: true });
        
        // Add player to playerIds if not already there
        const gameData = gameDoc.data() as GameState;
        if (!gameData.playerIds?.includes(player.id)) {
          transaction.update(gameRef, {
            playerIds: arrayUnion(player.id)
          });
        }
      });
    } catch (e) {
      console.error("Transaction failed: ", e);
    }
  };

  const unclaimSquare = async (row: number, col: number, playerId: string) => {
    if (!activeGameId || !activeGame) return;
    
    if (activeGame.settings.isScrambled) {
       alert("Game is locked! Cannot remove squares after grid is scrambled.");
       return;
    }

    const key = `${row}-${col}`;
    const squareRef = doc(db, "games", activeGameId, "squares", key);

    try {
      await updateDoc(squareRef, {
        [`claims.${playerId}`]: deleteField()
      });
    } catch (e) {
      console.error("Unclaim failed: ", e);
    }
  };

  const togglePaid = async (playerId: string) => {
    if (!activeGameId || !activeGame) return;
    // Authorization to update paidByUid is enforced by Firestore security rules.
    const currentVal = (activeGame.paidByUid ?? {})[playerId];
    const isPaid = !!currentVal;
    
    const docRef = doc(db, "games", activeGameId);
    // If paid, remove the field (unpay). If unpaid, set to timestamp.
    await updateDoc(docRef, { [`paidByUid.${playerId}`]: isPaid ? deleteField() : Date.now() });
  };

  const deletePlayer = async (playerId: string) => {
    if (!activeGameId) return;

    const squaresRef = collection(db, "games", activeGameId, "squares");
    const snap = await getDocs(squaresRef);

    let batch = writeBatch(db);
    let opCount = 0;
    for (const d of snap.docs) {
      const data = d.data() as SquareDoc;
      const claims = data?.claims ?? {};
      if (!claims[playerId]) continue;
      batch.update(d.ref, { [`claims.${playerId}`]: deleteField() });
      opCount += 1;
      if (opCount >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }
    if (opCount > 0) await batch.commit();

    const docRef = doc(db, "games", activeGameId);
    await updateDoc(docRef, { [`paidByUid.${playerId}`]: deleteField() });
  };

  const updateSettings = async (newSettings: Partial<GameSettings>) => {
    if (!activeGameId || !activeGame) return;
    const nextSettings = { ...activeGame.settings, ...newSettings };
    const docRef = doc(db, "games", activeGameId);
    await updateDoc(docRef, { settings: nextSettings });
  };

  const updateScores = async (teamA: number, teamB: number) => {
    if (!activeGameId) return;
    const docRef = doc(db, "games", activeGameId);
    await updateDoc(docRef, { scores: { teamA, teamB } });
  };

  const scrambleGridDigits = async () => {
    if (!activeGameId || !activeGame) return;
    
    // Prevent re-scramble if already scrambled (double check safety)
    if (activeGame.settings.isScrambled) {
      console.warn("Grid is already scrambled and locked.");
      return;
    }

    const nextSettings = {
      ...activeGame.settings,
      rows: shuffleDigits(),
      cols: shuffleDigits(),
      isScrambled: true,
    };
    const docRef = doc(db, "games", activeGameId);
    await updateDoc(docRef, { settings: nextSettings });
  };
  const resetGridDigits = async () => {
    if (!activeGameId || !activeGame) return;
    const nextSettings = {
      ...activeGame.settings,
      rows: numericDigits(),
      cols: numericDigits(),
      isScrambled: false,
    };
    const docRef = doc(db, "games", activeGameId);
    await updateDoc(docRef, { settings: nextSettings });
  };

  const getUserGames = async (uid: string) => {
    try {
      const q = query(collection(db, "games"), where("playerIds", "array-contains", uid));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as GameState);
    } catch (error) {
      console.error("Error fetching user games:", error);
      return [];
    }
  };

  const logPayout = async (payout: PayoutLog) => {
    if (!activeGameId) return;
    const payoutsRef = collection(db, "games", activeGameId, "payouts");
    // Use payout.id as doc ID to prevent duplicates if logic runs multiple times
    const docRef = doc(payoutsRef, payout.id); 
    await setDoc(docRef, payout);
  };

  const deleteGame = async () => {
    if (!activeGameId) return;

    let batch = writeBatch(db);
    let opCount = 0;

    // Helper to process subcollection deletion
    const deleteSubcollection = async (sub: string) => {
      const colRef = collection(db, "games", activeGameId, sub);
      const snap = await getDocs(colRef);
      for (const d of snap.docs) {
        batch.delete(d.ref);
        opCount++;
        if (opCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }
    };

    // 1. Delete squares
    await deleteSubcollection("squares");
    
    // 2. Delete payouts
    await deleteSubcollection("payouts");

    // 3. Delete prop_bets
    await deleteSubcollection("prop_bets");

    // 4. Delete ledger
    await deleteSubcollection("ledger");

    // 5. Delete Game Document
    const gameRef = doc(db, "games", activeGameId);
    batch.delete(gameRef);

    await batch.commit();
    setActiveGameId(null);
    setActiveGame(null);
  };
  // Prop Bet Functions
  const createPropBet = async (question: string, entryFee: number, options: string[]) => {
    if (!activeGameId) return;
    const propsRef = collection(db, "games", activeGameId, "prop_bets");
    const newProp: Omit<PropBet, "id"> = {
      question,
      entryFee,
      options,
      status: "OPEN",
      winningOption: null,
      bets: [],
      createdAt: Date.now(),
    };
    await setDoc(doc(propsRef), newProp);
  };

  const placePropBet = async (propId: string, option: string, user: { uid: string; displayName: string }) => {
    if (!activeGameId) return;
    const propRef = doc(db, "games", activeGameId, "prop_bets", propId);
    const ledgerRef = collection(db, "games", activeGameId, "ledger");
    
    const propSnap = await getDoc(propRef);
    if (!propSnap.exists()) return;
    const propData = propSnap.data() as PropBet;
    
    if (propData.status !== "OPEN") throw new Error("Betting is closed for this prop.");
    if (propData.bets.some(b => b.userId === user.uid)) throw new Error("You already placed a bet on this prop.");

    const wager: PropBetWager = {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        selectedOption: option,
        timestamp: Date.now()
    };

    await runTransaction(db, async (transaction) => {
        const gameRef = doc(db, "games", activeGameId);
        
        // Firestore requires all reads before writes
        const pDoc = await transaction.get(propRef);
        const gameDoc = await transaction.get(gameRef);

        if (!pDoc.exists()) throw "Prop does not exist";
        const pData = pDoc.data() as PropBet;
        
        if (pData.status !== "OPEN") throw "Betting Closed";
        if (pData.bets.some(b => b.userId === user.uid)) throw "Already bet";
        
        transaction.update(propRef, {
            bets: arrayUnion(wager)
        });

        const ledgerId = `${propId}_${user.uid}_ENTRY`;
        const ledgerEntry: LedgerTransaction = {
            id: ledgerId,
            userId: user.uid,
            type: "PROP_ENTRY",
            amount: -propData.entryFee,
            description: `Bet on: ${propData.question} (${option})`,
            timestamp: Date.now(),
            relatedId: propId
        };
        transaction.set(doc(ledgerRef, ledgerId), ledgerEntry);
        
        const gData = gameDoc.data() as GameState;
        if (!gData.playerIds?.includes(user.uid)) {
             transaction.update(gameRef, { playerIds: arrayUnion(user.uid) });
        }
    });
  };

  const settlePropBet = async (propId: string, winningOption: string) => {
    if (!activeGameId) return;
    const propRef = doc(db, "games", activeGameId, "prop_bets", propId);
    
    await runTransaction(db, async (transaction) => {
        const pDoc = await transaction.get(propRef);
        if (!pDoc.exists()) throw "Prop does not exist";
        const pData = pDoc.data() as PropBet;
        
        if (pData.status === "PAYOUT") throw "Already settled";

        const winners = pData.bets.filter(b => b.selectedOption === winningOption);
        const totalPot = pData.bets.length * pData.entryFee;
        
        const payoutPerWinner = winners.length > 0 ? Math.floor(totalPot / winners.length) : 0;
        
        transaction.update(propRef, {
            status: "PAYOUT",
            winningOption
        });

        const ledgerRef = collection(db, "games", activeGameId, "ledger");
        
        winners.forEach(winner => {
            const txId = `${propId}_${winner.userId}_WIN`;
            const tx: LedgerTransaction = {
                id: txId,
                userId: winner.userId,
                type: "PROP_WIN",
                amount: payoutPerWinner,
                description: `Won Prop: ${pData.question}`,
                timestamp: Date.now(),
                relatedId: propId
            };
            transaction.set(doc(ledgerRef, txId), tx);
        });
    });
  };

  const deletePropBet = async (propId: string) => {
      if (!activeGameId) return;
      await deleteDoc(doc(db, "games", activeGameId, "prop_bets", propId));
  };

  const getUserLedger = (uid: string) => {
    return ledger.filter(l => l.userId === uid);
  };  

  
  // Subscribe to payout history
  useEffect(() => {
    if (!activeGameId) {
      setPayoutHistory([]);
      return;
    }
    const payoutsRef = collection(db, "games", activeGameId, "payouts");
    const unsubscribe = onSnapshot(payoutsRef, (snap) => {
      const history: PayoutLog[] = [];
      snap.forEach(d => history.push(d.data() as PayoutLog));
      history.sort((a, b) => b.timestamp - a.timestamp);
      setPayoutHistory(history);
    });
    return () => unsubscribe();
  }, [activeGameId]);

  const settings = activeGame?.settings ?? defaultSettings;
  const scores = activeGame?.scores ?? { teamA: 0, teamB: 0 };
  const availableGames: GameContextType["availableGames"] = []; // Not used in this version

  return (
    <GameContext.Provider
      value={{
        activeGameId,
        activeGame,
        getUserGames,
        availableGames,
        settings,
        squares,
        players,
        resetGridDigits,
        scores,
        createGame,
        joinGame,
        leaveGame,
        resetGame,
        claimSquare,
        unclaimSquare,
        togglePaid,
        deletePlayer,
        updateSettings,
        updateScores,
        scrambleGridDigits,
        logPayout,
        payoutHistory,
        deleteGame,
        propBets,
        createPropBet,
        placePropBet,
        settlePropBet,
        deletePropBet,
        ledger,
        getUserLedger
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
