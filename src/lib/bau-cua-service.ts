import { db } from "./firebase";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy,
    limit,
    setDoc,
    getDoc,
    deleteDoc,
    where,
    increment,
    writeBatch,
    getDocs
} from "firebase/firestore";

// --- TYPES ---
export interface Player {
    id: string;
    name: string;
    balance: number;
    wins: number;
    losses: number;
    lastActive: any; // Firestore Timestamp
}

export interface Transaction {
    id?: string;
    playerId: string;
    playerName: string;
    type: 'DEPOSIT' | 'WITHDRAW' | 'BET' | 'WIN' | 'LOSS';
    amount: number;
    description: string;
    timestamp: any;
    newBalance?: number;
    sessionId?: string;
}

export interface GameSession {
    isActive: boolean;
    hostId: string | null;
    hostName: string | null;
    status: 'BETTING' | 'ROLLING' | 'RESULT';
    timerEnd: any; // Timestamp
    result: string[]; // [deer, gourd, crab]
    historyId: string; // ID to group transactions for archiving
    shakeCount: number; // Incremented to trigger shakes
    shakeType: 1 | 2; // 1 = Normal, 2 = Luck
    rollIndices: number[]; // Pre-rolled dice indices from Host
    bowlOpen: boolean; // Whether the bowl is lifted
    soundCount: number; // Incremented each time a sound emote is triggered
    soundType: string; // 'troioi' | 'chetme'
    soundBy: string; // Who triggered the sound
    roundStartTime?: number; // Server-side timestamp for timer sync
}

export interface PlayerBet {
    playerId: string;
    playerName: string;
    bets: Record<string, number>; // { deer: 10, crab: 50... }
    updatedAt: any;
}

// --- CONSTANTS ---
const PLAYERS_COL = "bau_cua_players";
const TRANSACTIONS_COL = "bau_cua_transactions";
const SESSION_COL = "bau_cua_session";
const BETS_COL = "bau_cua_bets"; // New collection for real-time bets
const SESSION_DOC_ID = "live_game";

const generateHistoryId = () => {
    return 'history_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// --- SERVICE FUNCTIONS ---

/**
 * Creates or retrieves a player profile.
 * If ID exists, returns it. If not, creates new.
 */
export const identifyPlayer = async (id: string, name: string): Promise<Player> => {
    const playerRef = doc(db, PLAYERS_COL, id);
    const snap = await getDoc(playerRef);

    if (snap.exists()) {
        // Update name and active time just in case
        await updateDoc(playerRef, {
            name,
            lastActive: serverTimestamp()
        });
        return { id: snap.id, ...snap.data() } as Player;
    } else {
        // Create new
        const newPlayer = {
            name,
            balance: 0,
            wins: 0,
            losses: 0,
            lastActive: serverTimestamp()
        };
        await setDoc(playerRef, newPlayer);
        return { id, ...newPlayer } as Player;
    }
};

/**
 * Updates a player's balance and optionally stats.
 */
export const updatePlayerStats = async (
    playerId: string,
    balanceChange: number,
    isWin: boolean = false,
    isLoss: boolean = false
) => {
    const playerRef = doc(db, PLAYERS_COL, playerId);

    const updates: any = {
        balance: increment(balanceChange),
        lastActive: serverTimestamp()
    };

    if (isWin) updates.wins = increment(1);
    if (isLoss) updates.losses = increment(1);

    await updateDoc(playerRef, updates);
};

export const setPlayerBalance = async (playerId: string, newBalance: number, reason: string = 'Unknown Update') => {
    console.warn(`[Firestore Write] setPlayerBalance - ID: ${playerId}, New Balance: $${newBalance}, Reason: ${reason}`);
    const playerRef = doc(db, PLAYERS_COL, playerId);
    await updateDoc(playerRef, {
        balance: newBalance,
        lastActive: serverTimestamp()
    });
};

export const getPlayerBets = async (playerId: string): Promise<Record<string, number> | null> => {
    const docRef = doc(db, BETS_COL, playerId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data() as PlayerBet;
        return data.bets;
    }
    return null;
};


/**
 * Logs a financial transaction.
 */
export const addTransaction = async (
    playerId: string,
    playerName: string,
    type: Transaction['type'],
    amount: number,
    description: string,
    newBalance?: number,
    sessionId?: string
) => {
    await addDoc(collection(db, TRANSACTIONS_COL), {
        playerId,
        playerName,
        type,
        amount,
        description,
        timestamp: serverTimestamp(),
        ...(newBalance !== undefined && { newBalance }),
        ...(sessionId && { sessionId })
    });
};

// --- SESSION MANAGEMENT ---

export const getGameSession = async (): Promise<GameSession | null> => {
    const snap = await getDoc(doc(db, SESSION_COL, SESSION_DOC_ID));
    if (snap.exists()) return snap.data() as GameSession;
    return null;
};

export const initGameSession = async () => {
    const ref = doc(db, SESSION_COL, SESSION_DOC_ID);
    const initialSession: GameSession = {
        isActive: true,
        hostId: null,
        hostName: null,
        status: 'BETTING',
        timerEnd: null,
        result: [],
        historyId: generateHistoryId(),
        shakeCount: 0,
        shakeType: 1,
        rollIndices: [],
        bowlOpen: true,
        soundCount: 0,
        soundType: '',
        soundBy: '',
        roundStartTime: Date.now()
    };
    await setDoc(ref, initialSession);
};

export const updateSessionStatus = async (status: GameSession['status'], result: string[] = [], startTime?: number) => {
    const ref = doc(db, SESSION_COL, SESSION_DOC_ID);
    const updates: any = { status, result };
    if (startTime) updates.roundStartTime = startTime;
    await updateDoc(ref, updates);
};

export const triggerShake = async (type: 1 | 2, rollIndices: number[]) => {
    const ref = doc(db, SESSION_COL, SESSION_DOC_ID);
    await updateDoc(ref, {
        status: 'ROLLING',
        shakeCount: increment(1),
        shakeType: type,
        rollIndices,
        bowlOpen: false
    });
};

/** Host opens the bowl for ALL players */
export const openBowl = async () => {
    const ref = doc(db, SESSION_COL, SESSION_DOC_ID);
    await updateDoc(ref, { bowlOpen: true });
};

/** Any player triggers a sound emote for ALL players */
export const triggerSound = async (soundType: string, playerName: string) => {
    const ref = doc(db, SESSION_COL, SESSION_DOC_ID);
    await updateDoc(ref, {
        soundCount: increment(1),
        soundType,
        soundBy: playerName
    });
};

export const setSessionHost = async (hostId: string, hostName: string) => {
    const ref = doc(db, SESSION_COL, SESSION_DOC_ID);
    await updateDoc(ref, { hostId, hostName });
};

export const endLiveGame = async () => {
    // 1. Delete Session
    const sessionRef = doc(db, SESSION_COL, SESSION_DOC_ID);
    await deleteDoc(sessionRef);

    // 2. Clear Active Bets
    await clearAllBets();

    // Note: We deliberately do NOT delete players from the DB anymore.
    // Balances will persist.
};


// --- SUBSCRIPTIONS ---

export const subscribeToSession = (callback: (session: GameSession | null) => void) => {
    return onSnapshot(doc(db, SESSION_COL, SESSION_DOC_ID), (doc) => {
        if (doc.exists()) {
            callback(doc.data() as GameSession);
        } else {
            callback(null);
        }
    });
};

export const subscribeToPlayers = (callback: (players: Player[]) => void) => {
    const q = query(
        collection(db, PLAYERS_COL),
        orderBy("balance", "desc"),
        limit(50)
    ); // Top 50 rich list

    return onSnapshot(q, (snapshot) => {
        const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
        callback(players);
    });
};

export const subscribeToTransactions = (callback: (txs: Transaction[]) => void) => {
    const q = query(
        collection(db, TRANSACTIONS_COL),
        orderBy("timestamp", "desc"),
        limit(50)
    );
    return onSnapshot(q, (snapshot) => {
        const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        callback(txs);
    });
};

const HISTORY_COL = "bau_cua_history";

export const archiveGameRound = async (result: string[], players: Player[], hostName: string) => {
    await addDoc(collection(db, HISTORY_COL), {
        timestamp: serverTimestamp(),
        result,
        hostName,
        playersSnapshot: players.map(p => ({
            name: p.name,
            balance: p.balance,
            wins: p.wins,
            losses: p.losses
        }))
    });
};

export const subscribeToHistory = (callback: (history: any[]) => void) => {
    const q = query(
        collection(db, HISTORY_COL),
        orderBy("timestamp", "desc"),
        limit(50)
    );
    return onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(history);
    });
};

// --- BETTING SYNC ---

/**
 * Updates a player's current bets in the shared collection.
 */
export const updateBet = async (playerId: string, playerName: string, bets: Record<string, number>) => {
    // If bets are empty, we can either delete the doc or set to empty. keeping doc is fine.
    await setDoc(doc(db, BETS_COL, playerId), {
        playerId,
        playerName,
        bets,
        updatedAt: serverTimestamp()
    });
};

/**
 * Subscribes to ALL active bets for the current round.
 */
export const subscribeToBets = (callback: (bets: PlayerBet[]) => void) => {
    // Listen to the whole collection. It should be small (just active players).
    // In a real app we might filter by sessionId, but we only have one live game.
    const q = query(collection(db, BETS_COL));
    return onSnapshot(q, (snap) => {
        const bets = snap.docs.map(d => d.data() as PlayerBet);
        callback(bets);
    });
};

/**
 * Clears all bets (Host Action).
 * This should be called when starting a new round.
 */
export const clearAllBets = async () => {
    // Get all bet docs and delete them
    const snap = await getDocs(collection(db, BETS_COL));
    const batch = writeBatch(db);
    snap.docs.forEach(d => {
        batch.delete(d.ref);
    });
    await batch.commit();
};
