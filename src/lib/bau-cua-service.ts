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
    getDocs,
    runTransaction
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
    status: 'BETTING' | 'ROLLING' | 'RESULT' | 'PROCESSING' | 'COMPLETED';
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
 * Atomically updates a player's balance, stats, and logs the transaction in a single batch.
 * This ensures the ledger and balance never drift apart.
 */
export const logTransactionAndStats = async (
    playerId: string,
    playerName: string,
    balanceChange: number,
    type: Transaction['type'],
    description: string,
    newBalance?: number,
    sessionId?: string
) => {
    const batch = writeBatch(db);

    // 1. Update Player Balance and Stats
    const playerRef = doc(db, PLAYERS_COL, playerId);
    const updates: any = {
        balance: increment(balanceChange),
        lastActive: serverTimestamp()
    };
    if (balanceChange > 0) updates.wins = increment(1);
    if (balanceChange < 0) updates.losses = increment(1);
    batch.update(playerRef, updates);

    // 2. Insert Transaction Ledger Entry
    const txRef = doc(collection(db, TRANSACTIONS_COL));
    batch.set(txRef, {
        playerId,
        playerName,
        type,
        amount: Math.abs(balanceChange), // Ensure positive amount for ledger readability
        description,
        timestamp: serverTimestamp(),
        ...(newBalance !== undefined && { newBalance }),
        ...(sessionId && { sessionId })
    });

    await batch.commit();
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
 * Single Source of Truth Payload: Fetches the player's true balance and active bets directly from DB.
 */
export const getCurrentGameState = async (playerId: string): Promise<{ balance: number, pendingBets: Record<string, number> } | null> => {
    try {
        const playerRef = doc(db, PLAYERS_COL, playerId);
        const betRef = doc(db, BETS_COL, playerId);

        // Fetch securely in parallel
        const [playerSnap, betSnap] = await Promise.all([
            getDoc(playerRef),
            getDoc(betRef)
        ]);

        if (!playerSnap.exists()) {
            return null; // Player does not exist
        }

        const balance = playerSnap.data().balance || 0;
        let pendingBets: Record<string, number> = {};

        if (betSnap.exists()) {
            pendingBets = (betSnap.data() as PlayerBet).bets || {};
        }

        return { balance, pendingBets };
    } catch (error) {
        console.error("Failed to fetch SSOT Game State:", error);
        return null;
    }
};

/**
 * ACID Transaction: Safely place a bet by locking the player's balance.
 * Validates the session is in BETTING state before committing.
 */
export const placeBetTransaction = async (
    playerId: string,
    playerName: string,
    animalId: string,
    amount: number,
    sessionId?: string
): Promise<boolean> => {
    try {
        await runTransaction(db, async (transaction) => {
            const sessionRef = doc(db, SESSION_COL, SESSION_DOC_ID);
            const playerRef = doc(db, PLAYERS_COL, playerId);
            const betRef = doc(db, BETS_COL, playerId);
            const txRef = doc(collection(db, TRANSACTIONS_COL));

            // 0. Read session status — reject bet if round is not open
            const [sessionDoc, playerDoc, betDoc] = await Promise.all([
                transaction.get(sessionRef),
                transaction.get(playerRef),
                transaction.get(betRef)
            ]);

            if (!sessionDoc.exists()) throw new Error("Session not found.");
            const sessionStatus = sessionDoc.data()?.status;
            if (sessionStatus !== 'BETTING') {
                throw new Error(`Cannot bet during session status: ${sessionStatus}`);
            }

            // 1. Read Balance (Lock)
            if (!playerDoc.exists()) {
                throw new Error("Player does not exist!");
            }

            const currentBalance = playerDoc.data().balance || 0;

            // 2. Validate Funds
            if (currentBalance < amount) {
                throw new Error("Insufficient funds to place bet.");
            }

            // 3. Read Current Bets
            let currentBets: Record<string, number> = {};
            if (betDoc.exists()) {
                currentBets = (betDoc.data() as PlayerBet).bets || {};
            }

            // 4. Calculate New States
            const newBalance = currentBalance - amount;
            currentBets[animalId] = (currentBets[animalId] || 0) + amount;

            // 5. Execute Writes Atomically
            transaction.update(playerRef, {
                balance: newBalance,
                lastActive: serverTimestamp()
            });

            // Set or Update bets (using set with merge allows creating if missing)
            transaction.set(betRef, {
                playerId,
                playerName,
                bets: currentBets,
                timestamp: serverTimestamp()
            }, { merge: true });

            // Create Ledger Entry
            transaction.set(txRef, {
                playerId,
                playerName,
                type: 'BET',
                amount: amount,
                description: `Placed bet on ${animalId}`,
                timestamp: serverTimestamp(),
                newBalance: newBalance,
                ...(sessionId && { sessionId })
            });
        });
        return true;
    } catch (error) {
        console.warn("Bet transaction rejected: ", error);
        return false;
    }
};

/**
 * ACID Transaction: Safely clear bets and refund balance.
 */
export const clearBetTransaction = async (
    playerId: string,
    playerName: string,
    sessionId?: string
): Promise<boolean> => {
    try {
        await runTransaction(db, async (transaction) => {
            const playerRef = doc(db, PLAYERS_COL, playerId);
            const betRef = doc(db, BETS_COL, playerId);
            const txRef = doc(collection(db, TRANSACTIONS_COL));

            // 1. Read Current Bets (Lock)
            const betDoc = await transaction.get(betRef);
            if (!betDoc.exists()) {
                throw new Error("No active bets to clear."); // Nothing to do
            }

            const currentBets = (betDoc.data() as PlayerBet).bets || {};
            let totalRefund = 0;
            Object.values(currentBets).forEach(amt => totalRefund += amt);

            if (totalRefund === 0) return; // Nothing to refund

            // 2. Read Balance
            const playerDoc = await transaction.get(playerRef);
            const currentBalance = playerDoc.exists() ? (playerDoc.data().balance || 0) : 0;
            const newBalance = currentBalance + totalRefund;

            // 3. Execute Writes Atomically
            transaction.update(playerRef, {
                balance: newBalance,
                lastActive: serverTimestamp()
            });

            // Delete active bets
            transaction.delete(betRef);

            // Create Ledger Entry
            transaction.set(txRef, {
                playerId,
                playerName,
                type: 'WIN', // Or 'REFUND' if added to types
                amount: totalRefund,
                description: `Cleared board refund`,
                timestamp: serverTimestamp(),
                newBalance: newBalance,
                ...(sessionId && { sessionId })
            });
        });
        return true;
    } catch (error) {
        console.error("Clear bet transaction failed: ", error);
        return false;
    }
};


/**
 * Logs a financial transaction.
 * Usually logTransactionAndStats is preferred to keep balances in sync. 
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

/**
 * Highly Secure, Idempotent Server-Side Settlement
 * Executes the entire round's financial resolution as a single ACID Database Transaction.
 * Guarantees that neither players nor the dealer can be double-charged or double-paid.
 *
 * IMPORTANT: Firestore `runTransaction` does NOT allow `getDocs` (collection queries) inside it.
 * We use a two-phase approach:
 *   Phase 1 (outside transaction): Discover all bet documents via `getDocs`.
 *   Phase 2 (inside transaction): Lock all individual player docs and commit atomically.
 */
export const secureSettleRoundTransaction = async (
    hostId: string,
    hostName: string,
    result: string[]
): Promise<boolean> => {
    if (result.length !== 3) return false;

    try {
        // --- PHASE 1: DISCOVER BETS (outside transaction, collection queries allowed here) ---
        const betsQuery = query(collection(db, BETS_COL));
        const betsDocs = await getDocs(betsQuery);

        if (betsDocs.empty) {
            // No bets — just close the round
            const sessionRef = doc(db, SESSION_COL, SESSION_DOC_ID);
            await updateDoc(sessionRef, { status: 'COMPLETED' });
            console.log("No bets placed, round closed cleanly.");
            return true;
        }

        const allBets: { id: string, data: PlayerBet }[] = [];
        betsDocs.forEach(d => allBets.push({ id: d.id, data: d.data() as PlayerBet }));

        // --- PHASE 2: ATOMIC UPDATE (inside transaction, individual doc reads only) ---
        await runTransaction(db, async (transaction) => {
            const sessionRef = doc(db, SESSION_COL, SESSION_DOC_ID);

            // 1. IDEMPOTENCY CHECK — Read session status atomically
            const sessionDoc = await transaction.get(sessionRef);
            if (!sessionDoc.exists()) throw new Error("Session not found");
            const sessionData = sessionDoc.data() as GameSession;

            if (sessionData.status === 'COMPLETED' || sessionData.status === 'PROCESSING') {
                console.log("Round already settled or currently settling. Aborting.");
                return; // Graceful abort
            }

            // Lock the session to PROCESSING to prevent concurrent settlement attempts
            transaction.update(sessionRef, { status: 'PROCESSING', result });

            // 2. LOCK all individual player docs — required by Firestore before writes
            const playerRefs = allBets.map(b => doc(db, PLAYERS_COL, b.id));
            const hostRef = doc(db, PLAYERS_COL, hostId);

            // All reads must happen before any writes
            const allPlayerDocs = await Promise.all(playerRefs.map(ref => transaction.get(ref)));
            const hostDoc = await transaction.get(hostRef);

            let dealerNetBalanceChange = 0;
            const hostBalance = hostDoc.exists() ? (hostDoc.data()?.balance || 0) : 0;
            const updatesMap: Map<string, any> = new Map();
            const ledgerEntries: { ref: any, data: any }[] = [];

            // 3. CALCULATE PAYOUTS PER PLAYER
            for (let i = 0; i < allBets.length; i++) {
                const betDoc = allBets[i];
                const pId = betDoc.id;
                const pName = betDoc.data.playerName;
                const bets = betDoc.data.bets || {};

                const playerDoc = allPlayerDocs[i];
                if (!playerDoc.exists()) continue;
                let currentBalance = playerDoc.data()?.balance || 0;

                let playerWon = 0;
                let playerReturn = 0;
                let playerLost = 0;

                Object.entries(bets).forEach(([animalId, amount]) => {
                    const numAmount = Number(amount);
                    const normAnimalId = animalId.toLowerCase().trim();
                    const matches = result.filter(r => r.toLowerCase().trim() === normAnimalId).length;
                    console.log(`[PAYOUT DEBUG] Player: ${pName} | Bet: ${normAnimalId} ($${numAmount}) | Result: ${JSON.stringify(result)} | Matches: ${matches}`);
                    if (matches === 0) {
                        playerLost += numAmount;
                        dealerNetBalanceChange += numAmount; // Dealer keeps losing bets
                    } else {
                        playerReturn += Number(numAmount); // Return original bet
                        const winnings = Number(numAmount) * Number(matches);
                        playerWon += winnings;
                        dealerNetBalanceChange -= (Number(numAmount) + Number(winnings)); // Dealer pays out bet + winnings
                    }
                });
                console.log(`[PAYOUT DEBUG] Player: ${pName} | Won: $${playerWon} | Lost: $${playerLost} | Return: $${playerReturn}`);

                // Prepare Player Balance & Ledger
                if (playerWon > 0) {
                    const totalPayout = playerReturn + playerWon;
                    const newBalance = currentBalance + totalPayout;
                    updatesMap.set(pId, {
                        balance: newBalance,
                        wins: increment(1),
                        lastActive: serverTimestamp()
                    });
                    ledgerEntries.push({
                        ref: doc(collection(db, TRANSACTIONS_COL)),
                        data: {
                            playerId: pId, playerName: pName, type: 'WIN',
                            amount: playerWon,
                            description: `Won $${playerWon} — got back $${playerReturn} bet + $${playerWon} winnings`,
                            timestamp: serverTimestamp(), newBalance, sessionId: sessionData.historyId
                        }
                    });
                } else {
                    // Player lost — bet was already deducted on placement, just log it
                    updatesMap.set(pId, {
                        losses: increment(1),
                        lastActive: serverTimestamp()
                    });
                    ledgerEntries.push({
                        ref: doc(collection(db, TRANSACTIONS_COL)),
                        data: {
                            playerId: pId, playerName: pName, type: 'LOSS',
                            amount: playerLost,
                            description: `Lost $${playerLost} on ${result.join(', ')}`,
                            timestamp: serverTimestamp(), newBalance: currentBalance, sessionId: sessionData.historyId
                        }
                    });
                }

                // Delete the bet document — round is now settled for this player
                transaction.delete(doc(db, BETS_COL, pId));
            }

            // 4. APPLY DEALER UPDATES
            if (dealerNetBalanceChange !== 0 && hostDoc.exists()) {
                const newHostBalance = Number(hostBalance) + Number(dealerNetBalanceChange);
                console.log(`[PAYOUT DEBUG] Dealer: ${hostName} | hostBalance: $${hostBalance} | Net: $${dealerNetBalanceChange} | New: $${newHostBalance}`);
                const isWin = dealerNetBalanceChange > 0;
                updatesMap.set(hostId, {
                    balance: newHostBalance,
                    wins: isWin ? increment(1) : increment(0),
                    losses: !isWin ? increment(1) : increment(0),
                    lastActive: serverTimestamp()
                });
                ledgerEntries.push({
                    ref: doc(collection(db, TRANSACTIONS_COL)),
                    data: {
                        playerId: hostId, playerName: hostName,
                        type: isWin ? 'WIN' : 'LOSS',
                        amount: Math.abs(dealerNetBalanceChange),
                        description: `Dealer ${isWin ? 'Collected' : 'Paid'} $${Math.abs(dealerNetBalanceChange)} (Round Result)`,
                        timestamp: serverTimestamp(), newBalance: newHostBalance, sessionId: sessionData.historyId
                    }
                });
            }

            // 5. COMMIT ALL WRITES (after all reads above)
            updatesMap.forEach((updates, pId) => {
                transaction.update(doc(db, PLAYERS_COL, pId), updates);
            });
            ledgerEntries.forEach(entry => {
                transaction.set(entry.ref, entry.data);
            });
            // Finalize — mark session COMPLETED to prevent any re-runs
            transaction.update(sessionRef, { status: 'COMPLETED' });
        });

        console.log("Round successfully settled via secure transaction.");
        return true;
    } catch (error) {
        console.error("Secure Settlement Transaction Failed. Rolling back:", error);
        return false;
    }
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
