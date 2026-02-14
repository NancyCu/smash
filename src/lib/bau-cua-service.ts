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
    increment
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
}

// --- CONSTANTS ---
const PLAYERS_COL = "bau_cua_players";
const TRANSACTIONS_COL = "bau_cua_transactions";

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
    // Only increment loss if it's a pure loss event, 
    // but usually in Bau Cua, a non-win round is a loss.
    if (isLoss) updates.losses = increment(1);

    await updateDoc(playerRef, updates);
};

export const setPlayerBalance = async (playerId: string, newBalance: number) => {
    const playerRef = doc(db, PLAYERS_COL, playerId);
    await updateDoc(playerRef, {
        balance: newBalance,
        lastActive: serverTimestamp()
    });
};


/**
 * Logs a financial transaction.
 */
export const addTransaction = async (
    playerId: string,
    playerName: string,
    type: Transaction['type'],
    amount: number,
    description: string
) => {
    await addDoc(collection(db, TRANSACTIONS_COL), {
        playerId,
        playerName,
        type,
        amount,
        description,
        timestamp: serverTimestamp()
    });
};

// --- SUBSCRIPTIONS ---

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
