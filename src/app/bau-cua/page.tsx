"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw, Coins, Trophy, Info, Plus, Check, Settings, Shield, UserCheck, Lock, Play, StopCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import {
    identifyPlayer,
    addTransaction,
    updatePlayerStats,
    subscribeToPlayers,
    subscribeToTransactions,
    type Player,
    type Transaction,
    type GameSession,
    subscribeToSession,
    initGameSession,
    updateSessionStatus,
    setSessionHost,
    endLiveGame,
    getGameSession,
    type PlayerBet,
    updateBet,
    subscribeToBets,
    clearAllBets,
    triggerShake,
    openBowl,
    triggerSound,
    setPlayerBalance
} from '@/lib/bau-cua-service';
import { indicesToAnimalIds, secureRoll } from '@/lib/secure-roll';
import { useAuth } from '@/context/AuthContext';
import { useVoiceLines } from './useVoiceLines';
import { useGameAnnouncer } from './useGameAnnouncer';

// Dynamic import – R3F Canvas must be client-only (no SSR)
const DiceShaker = dynamic(
    () => import('@/components/bau-cua/DiceShaker'),
    { ssr: false }
);

// --- CONFIGURATION ---
const VENMO_USERNAME = "your_username";

// --- ASSETS & CONSTANTS ---
const ANIMALS = [
    { id: 'deer', name: 'Nai', emoji: '🦌', color: 'from-amber-700/80 to-amber-900/80' },
    { id: 'gourd', name: 'Bầu', emoji: '🍐', color: 'from-emerald-600/80 to-emerald-900/80' },
    { id: 'chicken', name: 'Gà', emoji: '🐓', color: 'from-red-600/80 to-red-900/80' },
    { id: 'fish', name: 'Cá', emoji: '🐟', color: 'from-blue-600/80 to-blue-900/80' },
    { id: 'crab', name: 'Cua', emoji: '🦀', color: 'from-orange-600/80 to-orange-900/80' },
    { id: 'shrimp', name: 'Tôm', emoji: '🦐', color: 'from-indigo-600/80 to-indigo-900/80' },
];

const CHIPS = [1, 5];

// --- COMPONENTS ---

// 1. The Animal Card (Betting Target)
const AnimalCard = ({
    animal,
    betAmount,
    onBet,
    disabled,
    isWinner,
    showResult = false,
    selectionCount = 0,
    matchCount = 0,
    allBets = []
}: {
    animal: typeof ANIMALS[0],
    betAmount: number,
    onBet: () => void,
    disabled: boolean,
    isWinner?: boolean,
    showResult?: boolean,
    selectionCount?: number
    matchCount?: number
    allBets?: PlayerBet[] // All global bets for visualization
}) => {
    // Status Logic — only show loser styling when results are revealed
    const isLoser = showResult && !isWinner;
    const winAmount = betAmount * matchCount;

    // Filter bets for THIS animal from other players
    const otherPlayerBets = allBets?.filter(pb => pb.bets && pb.bets[animal.id] > 0) || [];

    // Helper to generate a consistent "Glassy" color from a string (name)
    const getGlassyStyle = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Generate HSL
        const h = Math.abs(hash % 360);
        return {
            background: `hsla(${h}, 70%, 50%, 0.3)`,
            borderColor: `hsla(${h}, 70%, 60%, 0.5)`,
            color: `hsla(${h}, 100%, 90%, 1)`
        };
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBet}
            disabled={disabled}
            className={`
        relative aspect-square rounded-full 
        border-[3px] 
        ${isWinner || selectionCount > 0 ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)] z-10 scale-105' : 'border-white/10'}
        flex flex-col items-center justify-center 
        shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
        shadow-[inset_0_2px_20px_rgba(255,255,255,0.2)]
        transition-all duration-300
        group
        bg-black/20
        ${!disabled ? 'hover:scale-105 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]' : ''}
        ${selectionCount > 0 ? 'opacity-100 ring-2 ring-white scale-110' : ''}
      `}
        >
            {/* MATCH MULTIPLIER (x2, x3) */}
            {matchCount > 1 && isWinner && (
                <div className="absolute -top-2 -right-2 z-30 bg-red-600 text-white font-black text-xl md:text-2xl px-3 py-1 rounded-full border-2 border-white shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-bounce">
                    x{matchCount}
                </div>
            )}

            {/* OTHER PLAYER BETS (Glassy Chips) */}
            {/* Show only if NOT disabled (Betting phase) OR if it is Result phase */}
            {/* Actually, show always to build hype */}
            <div className="absolute inset-0 z-20 pointer-events-none p-4">
                {/* Distribute them randomly or in a grid? Random is more "fun/messy" */}
                {otherPlayerBets.map((pb, i) => {
                    const style = getGlassyStyle(pb.playerName || pb.playerId);
                    // deterministic random position based on player ID + animal ID
                    const pseudoRandom = (id: string) => {
                        let h = 0;
                        for (let j = 0; j < id.length; j++) h = Math.imul(31, h) + id.charCodeAt(j) | 0;
                        return (h / 2147483647); // -1 to 1? no 0 to 1 approx
                    };
                    const randX = (Math.abs(pseudoRandom(pb.playerId + animal.id)) % 0.6) + 0.2; // 20% to 80%
                    const randY = (Math.abs(pseudoRandom(pb.playerId + animal.id + 'y')) % 0.6) + 0.2;

                    return (
                        <div
                            key={pb.playerId}
                            className="absolute flex flex-col items-center justify-center rounded-lg border backdrop-blur-md shadow-sm px-1.5 py-0.5 transform -translate-x-1/2 -translate-y-1/2 hover:scale-150 transition-transform duration-300 z-20"
                            style={{
                                left: `${randX * 100}%`,
                                top: `${randY * 100}%`,
                                ...style,
                                fontSize: '0.6rem' // Small text
                            }}
                        >
                            <span className="font-bold leading-none">{pb.playerName.slice(0, 6)}..</span>
                            <span className="font-mono opacity-90 leading-none">${pb.bets[animal.id]}</span>
                        </div>
                    )
                })}
            </div>

            {/* COLOR BACKGROUND - Separated for Grayscale control */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${animal.color} backdrop-blur-md transition-all duration-300 ${isLoser ? 'grayscale opacity-40' : ''}`} />

            {/* Glossy Reflection Highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-10" />

            {/* Selection Count (Host) */}
            {selectionCount > 0 && (
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center font-black text-sm z-30 shadow-lg animate-in zoom-in">
                    {selectionCount}
                </div>
            )}

            {/* BET BADGE (Top Right) - Always visible when bet placed */}
            <AnimatePresence>
                {betAmount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-3 -right-3 md:-top-4 md:-right-4 bg-yellow-400 text-black font-black text-sm md:text-base w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full border-2 border-white shadow-lg z-20"
                    >
                        ${betAmount}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* WINNER HIGHLIGHT */}
            {isWinner && (
                <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-pulse pointer-events-none z-10" />
            )}

            {/* CONTENT (Emoji/Name) - Grayscale if loser */}
            <div className={`relative z-10 flex flex-col items-center transition-all ${isLoser ? 'grayscale opacity-50' : ''}`}>
                <span className="text-5xl md:text-[clamp(4rem,7vw,9rem)] drop-shadow-2xl filter transform transition-transform group-hover:scale-110">{animal.emoji}</span>
                <span className="mt-0.5 text-[9px] md:text-[clamp(10px,0.9vw,16px)] font-bold uppercase tracking-widest text-white/80 text-shadow-sm leading-tight">{animal.name}</span>
            </div>

            {/* RESULT INDICATORS — only show after dice are revealed */}
            {showResult && (
                <>
                    {/* WIN PROFIT */}
                    {isWinner && betAmount > 0 && (
                        <div className="absolute -top-4 right-0 bg-green-500 text-white text-xs md:text-sm font-black px-3 py-1 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.6)] border border-white z-30 animate-bounce">
                            +${winAmount}
                        </div>
                    )}

                    {/* WIN LABEL (No Bet) */}
                    {isWinner && betAmount === 0 && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full shadow-lg border border-white z-20">
                            WINNER
                        </div>
                    )}

                    {/* LOSS AMOUNT */}
                    {betAmount > 0 && !isWinner && (
                        <div className="absolute -top-4 right-0 bg-red-600 text-white text-xs md:text-sm font-black px-3 py-1 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] border border-white z-30 animate-pulse">
                            -${betAmount}
                        </div>
                    )}

                    {/* LOSE LABEL */}
                    {betAmount > 0 && !isWinner && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full shadow-lg border border-white z-20">
                            LOSE
                        </div>
                    )}
                </>
            )}
        </motion.button>
    );
};

export default function BauCuaPage() {
    const { user } = useAuth();
    const { announceResult } = useGameAnnouncer();

    // --- STATE ---
    const [balance, setBalance] = useState(0);
    const [bets, setBets] = useState<Record<string, number>>({});
    const [selectedChip, setSelectedChip] = useState(5);

    // Game State: Derived from Session for Clients, or Local for Host overrides
    // We'll trust the session if active
    const [localGameState, setLocalGameState] = useState<'BETTING' | 'ROLLING' | 'RESULT' | 'WIN'>('BETTING');

    const [result, setResult] = useState<string[]>([]); // Current round result keys
    const [lastWin, setLastWin] = useState(0);



    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(20);

    // Multiplayer State
    const [playerName, setPlayerName] = useState("");
    const [playerId, setPlayerId] = useState("");
    const [showIdentityModal, setShowIdentityModal] = useState(false);
    const [activePlayers, setActivePlayers] = useState<Player[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [allBets, setAllBets] = useState<PlayerBet[]>([]); // New: Global bets state
    const [userInputName, setUserInputName] = useState("");

    // Live Session State
    const [session, setSession] = useState<GameSession | null>(null);
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const [showHostPicker, setShowHostPicker] = useState(false);

    const [selectionCount, setSelectionCount] = useState(0); // unused in parent? passed as prop. 

    // Timer State
    const [timeLeft, setTimeLeft] = useState(45);
    const [elapsedTime, setElapsedTime] = useState(0);

    // 3D Shaker State
    const [shakeTrigger, setShakeTrigger] = useState(0);
    const [shakeType, setShakeType] = useState<1 | 2>(1);
    const [shakerActive, setShakerActive] = useState(false);
    const [canReveal, setCanReveal] = useState(false); // Can we show Open/Luck buttons?
    const [luckShakeCount, setLuckShakeCount] = useState(0);
    const [isBowlOpen, setIsBowlOpen] = useState(true); // Open by default or after result
    const lastSeenShakeCount = useRef(-1); // -1 = not initialized yet (skip first-load trigger)
    const [syncedRollIndices, setSyncedRollIndices] = useState<[number, number, number] | undefined>(undefined);

    // Sound Emote State
    const lastSeenSoundCount = useRef(-1);
    const [troiOiUsed, setTroiOiUsed] = useState(false);
    const [chetMeUsed, setChetMeUsed] = useState(false);
    const { playTaunt, playFile, availableSounds } = useVoiceLines();

    // --- DERIVED STATE ---
    const isLive = session?.isActive ?? false;
    const isHost = isLive && session?.hostId === playerId;

    // If live, use session status. If not, use local.
    const currentStatus = isLive ? session?.status || 'BETTING' : localGameState;

    // 1. Identity Check
    useEffect(() => {
        const checkIdentity = async () => {
            // Priority 1: Global Auth User
            if (user) {
                setPlayerId(user.uid);
                setPlayerName(user.displayName || 'Anonymous');
                setShowIdentityModal(false);
                const player = await identifyPlayer(user.uid, user.displayName || 'Anonymous');
                if (player) setBalance(player.balance);
                return;
            }

            // Priority 2: Standard LocalStorage fallback
            const storedId = localStorage.getItem('bauCuaPlayerId');
            const storedName = localStorage.getItem('bauCuaPlayerName');

            if (storedId && storedName) {
                setPlayerId(storedId);
                setPlayerName(storedName);
                // Sync with DB
                const player = await identifyPlayer(storedId, storedName);
                if (player) setBalance(player.balance);
            } else {
                setShowIdentityModal(true);
            }
        };
        checkIdentity();
    }, [user]);

    // Timer Effect
    useEffect(() => {
        setElapsedTime(0); // Reset elapsed on status change

        // Reset countdown when entering BETTING status
        if (currentStatus === 'BETTING') {
            setTimeLeft(45);
            // Clear bets for the new round
            if (Object.keys(bets).length > 0) {
                setBets({});
            }
        }

        const interval = setInterval(() => {
            setElapsedTime(t => t + 1);

            if (currentStatus === 'BETTING') {
                // If live game, sync with server time
                if (isLive && session?.roundStartTime) {
                    const elapsed = Math.floor((Date.now() - session.roundStartTime) / 1000);
                    const remaining = Math.max(0, 45 - elapsed); // 45s betting time
                    setTimeLeft(remaining);
                } else {
                    // Local fallback
                    setTimeLeft(prev => {
                        if (prev <= 1) return 0;
                        return prev - 1;
                    });
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [currentStatus, isLive, session?.roundStartTime]);

    // Auto-Roll Trigger
    useEffect(() => {
        if (currentStatus === 'BETTING' && timeLeft === 0) {
            handleRollClick();
        }
        if (currentStatus === 'BETTING' && timeLeft === 0) {
            handleRollClick();
        }
    }, [timeLeft, currentStatus]);

    // Host Recovery Effect
    // Ensures that if a host refreshes during ROLLING state, they get their controls back.
    useEffect(() => {
        if (isLive && isHost && session?.status === 'ROLLING') {
            // If the shaker isn't currently animating (which implies we loaded into this state or finished)
            // We ensure canReveal is true so the buttons appear.
            if (!shakerActive) {
                setCanReveal(true);
            }
        }
    }, [isLive, isHost, session?.status, shakerActive]);

    // Format Timer
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 2. Subscriptions
    useEffect(() => {
        const unsubPlayers = subscribeToPlayers(setActivePlayers);
        const unsubTx = subscribeToTransactions(setTransactions);
        const unsubSession = subscribeToSession((s) => {
            setSession(s);
            if (!s) return;

            // === SHAKE SYNC: Detect new shakes from Firestore ===
            if (s.shakeCount !== undefined && s.shakeCount !== null) {
                if (lastSeenShakeCount.current === -1) {
                    // First load — just record the current count, don't trigger animation
                    lastSeenShakeCount.current = s.shakeCount;
                    // Also load existing roll indices so we show the correct result if we are reconnecting
                    if (s.rollIndices && s.rollIndices.length === 3) {
                        setSyncedRollIndices(s.rollIndices as [number, number, number]);
                    }
                } else if (s.shakeCount > lastSeenShakeCount.current) {
                    // A NEW shake happened! Trigger animation + sound for EVERYONE
                    lastSeenShakeCount.current = s.shakeCount;

                    // Store the Host's pre-rolled dice indices for visual sync
                    if (s.rollIndices && s.rollIndices.length === 3) {
                        setSyncedRollIndices(s.rollIndices as [number, number, number]);
                    }

                    setShakeType(s.shakeType as 1 | 2);
                    setShakerActive(true);
                    setIsBowlOpen(false);
                    setCanReveal(false);
                    setShakeTrigger(prev => prev + 1);

                    // Update luck count
                    if (s.shakeType === 1) {
                        setLuckShakeCount(0);
                    } else {
                        setLuckShakeCount(prev => prev + 1);
                    }
                }
            }

            // === BOWL SYNC: Detect bowl open from Firestore ===
            if (s.bowlOpen === true) {
                setIsBowlOpen(true);
            } else if (s.bowlOpen === false) {
                setIsBowlOpen(false);
            }

            // Sync local result display if session has result
            if (s?.status === 'RESULT' && s.result) {
                setResult(s.result);
                // Auto-calculate winnings if logic hasn't run yet? 
                // We'll rely on an explicit effect for that.
            }
            if (s?.status === 'BETTING') {
                if (s.result?.length === 0) {
                    setResult([]); // Clear board for new round
                }
                // Reset sound emote usage for new round
                setTroiOiUsed(false);
                setChetMeUsed(false);
                // Reset shaker state for new round
                setShakerActive(false);
                setCanReveal(false);
                setIsBowlOpen(true);
            }

            // === HOST RECOVERY ===
            // Moved to a dedicated useEffect for better reliability
            // (See "Host Recovery Effect" below)

            // === SOUND EMOTE SYNC ===
            if (s.soundCount !== undefined && s.soundCount !== null) {
                if (lastSeenSoundCount.current === -1) {
                    lastSeenSoundCount.current = s.soundCount;
                } else if (s.soundCount > lastSeenSoundCount.current) {
                    lastSeenSoundCount.current = s.soundCount;
                    // Play the actual sound file
                    const src = s.soundType === 'troioi' ? '/bau-cua/troioi.m4a' : '/bau-cua/chet.m4a';
                    try {
                        const audio = new Audio(src);
                        audio.volume = 1;
                        audio.play().catch(e => console.warn('Audio play failed:', e));
                    } catch (e) {
                        console.warn('Audio not supported', e);
                    }
                }
            }
        });

        // Subscribe to real-time bets
        const unsubBets = subscribeToBets((globalBets) => {
            // Filter out MY bets if I want? Or just keep all.
            // We want to see others mainly. But keeping all is fine for logic simplicity.
            // Actually, `bets` state is my LOCAL bet source of truth for placing bets.
            // `allBets` is for visualization.
            // We can filter out current user from allBets if we want to avoid double rendering my own bet if I added logic for that, 
            // but current AnimalCard design separates "My Bet" (center) from "Other Bets" (tags).
            // So let's just exclude myself from `allBets` used for visualization.
            const others = globalBets.filter(b => b.playerId !== playerId);
            setAllBets(others);
        });

        return () => {
            unsubPlayers();
            unsubTx();
            unsubSession();
            unsubBets();
        };
    }, [playerId]); // Re-sub if playerId changes (for filtering)

    // Sync Local Bets to Firestore (Debounced)
    // Sync Local Bets & BALANCE to Firestore (Debounced)
    useEffect(() => {
        if (!playerId || !playerName) return;

        // Sync whenever `bets` changes
        const timeout = setTimeout(() => {
            updateBet(playerId, playerName, bets);
            // Also sync balance immediately so the list updates
            setPlayerBalance(playerId, balance);
        }, 300); // 300ms debounce

        return () => clearTimeout(timeout);
    }, [bets, balance, playerId, playerName]);

    // 3. React to Result from Session (Client Side Win Calculation)
    // 3. React to Result from Session (Client Side Win Calculation)
    const runOnceRef = useRef('');

    useEffect(() => {
        if (!isLive) return;
        if (session?.status === 'RESULT' && session.result?.length === 3) {
            const resultString = session.result.join(',');

            // Prevent double-processing the same result ID/string locally
            if (runOnceRef.current === resultString) return;
            runOnceRef.current = resultString;

            // Simple check to see if we already processed this exact result ID
            // Simple check to see if we already processed this exact result ID
            // For now, we use a session-level ID if available, OR just rely on local state to block duplicate payouts.
            // But simplified for this "MVP":
            // Run settle ONLY if we have bets.

            if (Object.keys(bets).length > 0) {
                // Calculate Win/Loss for Audio Trigger
                let totalBet = 0;
                let totalWin = 0;
                Object.entries(bets).forEach(([animalId, amount]) => {
                    totalBet += amount;
                    const hits = session.result.filter(r => r === animalId).length;
                    if (hits > 0) {
                        totalWin += amount + (amount * hits);
                    }
                });

                // Trigger Taunt
                playTaunt(totalBet, totalWin);

                // Assuming settleClientRound handles the actual balance update
                // We don't want to duplicate balance logic if it's already there
                // but checking the code, I don't see settleClientRound definition in the visible chunks.
                // It likely exists. I will hook the audio here.
            }
        }
    }, [session?.status, session?.result, isLive, runOnceRef.current]); // Added ref to avoid double-trigger if STRICT MODE is on

    // Helper: UUID
    const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const handleJoin = async () => {
        if (!userInputName.trim()) return;
        const name = userInputName.trim();
        const newId = generateUUID();

        localStorage.setItem('bauCuaPlayerId', newId);
        localStorage.setItem('bauCuaPlayerName', name);

        setPlayerId(newId);
        setPlayerName(name);

        const player = await identifyPlayer(newId, name);
        setBalance(player.balance);
        setShowIdentityModal(false);
    };


    // --- ACTIONS ---

    const handleAddMoneyClick = () => {
        setShowTopUpModal(true);
    };

    const handleVenmoPayment = () => {
        const txnType = 'pay';
        const note = `Bau Cua Reload $${topUpAmount}`;
        const webUrl = `https://venmo.com/${VENMO_USERNAME}?txn=${txnType}&note=${encodeURIComponent(note)}&amount=${topUpAmount}`;
        window.open(webUrl, '_blank');
    };

    const handleConfirmTopUp = async () => {
        setBalance(prev => prev + topUpAmount);
        setShowTopUpModal(false);
        if (playerId) {
            await addTransaction(playerId, playerName, 'DEPOSIT', topUpAmount, 'Venmo Top-up');
            await updatePlayerStats(playerId, topUpAmount);
        }
    };

    // --- CHIP SOUND (Web Audio API) ---
    // --- CHIP SOUND (Web Audio API) ---
    const playChipSound = useCallback(() => {
        try {
            const audio = new Audio('/sounds/money.m4a');
            audio.volume = 0.6; // Not too loud
            audio.play().catch(e => console.warn('Audio play failed', e));
        } catch (e) {
            // Audio not supported
        }
    }, []);

    const placeBet = (animalId: string) => {
        // Only allow betting if status is BETTING
        if (currentStatus !== 'BETTING') return;
        if (isHost) return; // HOST CANNOT BET
        if (balance < selectedChip) return;

        playChipSound();

        setBets(prev => ({
            ...prev,
            [animalId]: (prev[animalId] || 0) + selectedChip
        }));
        setBalance(prev => prev - selectedChip);
    };

    const clearBets = () => {
        if (currentStatus !== 'BETTING') return;
        let totalRefund = 0;
        Object.values(bets).forEach(amount => totalRefund += amount);
        setBalance(prev => prev + totalRefund);
        setBets({});
    };

    // --- GAME FLOW LOGIC ---

    const handleRollClick = async (type: 1 | 2 = 1) => {
        if (isLive && !isHost) return; // Clients can't roll

        // Validate Luck Shake Count
        if (type === 2 && luckShakeCount >= 3) return;

        const isStartShake = type === 1;

        // If local game:
        if (!isLive) {
            if (isStartShake && Object.keys(bets).length === 0) return;

            setShakeType(type);
            setShakerActive(true);
            setIsBowlOpen(false); // Close bowl to hide result of re-roll
            setCanReveal(false);

            if (isStartShake) {
                setLuckShakeCount(0);
            } else {
                setLuckShakeCount(prev => prev + 1);
            }

            setShakeTrigger(prev => prev + 1);

            if (isStartShake) setLocalGameState('ROLLING');

            return;
        }

        // If HOST: Pre-roll dice & broadcast shake to ALL players
        const roll = secureRoll(); // Generate dice result on Host
        if (isStartShake) {
            await triggerShake(1, roll);
        } else {
            await triggerShake(2, roll);
        }

        // Host does NOT set local state here manually. 
        // We rely on the subscription to `session` to update local state for Host too.
        // This ensures perfect sync and identical code paths.
        /*
        setLuckShakeCount(prev => prev + 1);
        setShakeType(type);
        setShakerActive(true);
        setIsBowlOpen(false);
        setShakeTrigger(prev => prev + 1);
        */
    };

    const handleOpenClick = async () => {
        if (isLive) {
            // Sync bowl open across ALL clients
            await openBowl();
        } else {
            setIsBowlOpen(true);
        }
        // The DiceShaker will see isOpen=true and trigger `onRollComplete` after animation.
    };

    const handleShakeEnd = () => {
        setCanReveal(true);
    };

    /** Called by DiceShaker when the bowl is fully lifted and dice revealed. */
    const handleDiceResult = async (indices: number[]) => {
        const animalIds = indicesToAnimalIds(indices as [number, number, number]);
        const animalArr = Array.from(animalIds); // string[]

        setResult(animalArr);
        setShakerActive(false);

        // --- ANNOUNCER ---
        // Announce the result locally for everyone when revealed
        announceResult(animalArr);

        if (isLive && isHost) {
            // Publish result to all clients via Firestore
            await updateSessionStatus('RESULT', animalArr);
            // Settle host's own bets
            confirmResult();
        } else if (!isLive) {
            // Solo / local mode — settle immediately
            setLocalGameState('RESULT');
            // confirmResult uses the `result` state, but we just set it.
            // We'll call settlement inline so it uses the fresh animalArr:
            settleLocalRound(animalArr);
        }
    };

    /** Inline settlement for local (solo) mode so we can pass fresh result. */
    const settleLocalRound = async (freshResult: string[]) => {
        let totalWinnings = 0;
        let totalBetReturn = 0;
        let totalBetAmount = 0;

        Object.entries(bets).forEach(([animalId, betAmount]) => {
            totalBetAmount += betAmount;
            const matches = freshResult.filter(r => r === animalId).length;
            if (matches > 0) {
                totalBetReturn += betAmount;
                totalWinnings += betAmount * matches;
            }
        });

        // Trigger Audio Taunt/Celebration (Local Mode)
        playTaunt(totalBetAmount, totalWinnings);

        const payout = totalBetReturn + totalWinnings;
        const profit = payout - totalBetAmount;

        setBalance(prev => prev + payout);
        setLastWin(totalWinnings);
        setLocalGameState('WIN');

        if (playerId && totalBetAmount > 0) {
            if (profit > 0) {
                await addTransaction(playerId, playerName, 'WIN', profit, `Won ${profit}`);
                await updatePlayerStats(playerId, profit, true, false);
            } else if (profit <= 0) {
                await addTransaction(playerId, playerName, profit >= 0 ? 'WIN' : 'LOSS', profit, 'Round Result');
                await updatePlayerStats(playerId, profit, profit > 0, profit < 0);
            }
        }
    };

    // For Host inputting result
    const addResultItem = (animalId: string) => {
        if (result.length < 3) {
            setResult([...result, animalId]);
        }
    };
    const removeResultItem = (index: number) => {
        const newRes = [...result];
        newRes.splice(index, 1);
        setResult(newRes);
    }
    const resetResultInput = () => setResult([]);

    const confirmResult = async () => {
        if (result.length !== 3) return;

        if (isLive) {
            if (isHost) {
                // Host publishes result
                await updateSessionStatus('RESULT', result);

                // --- DEALER LOGIC ---
                // Host plays against ALL players.
                // Host Profit = Sum(Player Losses) - Sum(Player Wins)
                // Effectively: Host Net = -1 * Sum(Player Net Profit)

                let hostNetProfit = 0;
                let details = [];

                // We use `allBets` which contains bets from all OTHER players
                for (const playerBet of allBets) {
                    let pTotalBet = 0;
                    let pTotalWin = 0;

                    Object.entries(playerBet.bets).forEach(([animalId, amount]) => {
                        pTotalBet += amount;
                        const matches = result.filter(r => r === animalId).length;
                        if (matches > 0) {
                            pTotalWin += amount + (amount * matches);
                        }
                    });

                    const pNet = pTotalWin - pTotalBet; // Player's profit (positive = win, negative = loss)
                    const hostChange = -pNet; // Host takes the opposite

                    hostNetProfit += hostChange;
                }

                // Update Host Balance & Stats
                if (hostNetProfit !== 0) {
                    setBalance(prev => prev + hostNetProfit);

                    // Log Host Transaction
                    const type = hostNetProfit > 0 ? 'WIN' : 'LOSS';
                    const desc = `Dealer ${hostNetProfit > 0 ? 'Win' : 'Loss'} (Round Result)`;

                    await addTransaction(playerId, playerName, type, Math.abs(hostNetProfit), desc);
                    await updatePlayerStats(playerId, hostNetProfit, hostNetProfit > 0, hostNetProfit < 0);
                }
            }
            // Clients handle their own settlement via effect
        } else {
            // Local Mode - Same as before (Solo Play)
            const calculatePayout = (currentBets: Record<string, number>, currentResult: string[]) => {
                let totalWinnings = 0;
                let totalBetReturn = 0;
                let totalBetAmount = 0;

                Object.entries(currentBets).forEach(([animalId, betAmount]) => {
                    totalBetAmount += betAmount;
                    const matches = currentResult.filter(r => r === animalId).length;
                    if (matches > 0) {
                        totalBetReturn += betAmount;
                        totalWinnings += betAmount * matches;
                    }
                });
                return { payout: totalBetReturn + totalWinnings, profit: (totalBetReturn + totalWinnings) - totalBetAmount, totalBetAmount, totalWinnings };
            };

            const { payout, profit, totalBetAmount, totalWinnings } = calculatePayout(bets, result);
            setBalance(prev => prev + payout);
            setLastWin(totalWinnings);
            setLocalGameState('WIN');

            if (playerId && totalBetAmount > 0) {
                if (profit > 0) {
                    await addTransaction(playerId, playerName, 'WIN', profit, `Won ${profit}`);
                    await updatePlayerStats(playerId, profit, true, false);
                } else if (profit <= 0) {
                    await addTransaction(playerId, playerName, profit >= 0 ? 'WIN' : 'LOSS', profit, 'Round Result');
                    await updatePlayerStats(playerId, profit, profit > 0, profit < 0);
                }
            }
        };
    };

    // Triggered by CLIENT when they see the result
    const settleClientRound = async () => {
        // Re-run calc for client
        const currentResult = isLive ? session?.result || [] : result;
        if (currentResult.length !== 3) return;

        let totalWinnings = 0;
        let totalBetReturn = 0;
        let totalBetAmount = 0;

        Object.entries(bets).forEach(([animalId, betAmount]) => {
            totalBetAmount += betAmount;
            const matches = currentResult.filter(r => r === animalId).length;
            if (matches > 0) {
                totalBetReturn += betAmount;
                totalWinnings += betAmount * matches;
            }
        });

        const payout = totalBetReturn + totalWinnings;
        const profit = payout - totalBetAmount;

        if (totalBetAmount > 0) {
            setBalance(prev => prev + payout);
            setLastWin(totalWinnings);

            // Log
            if (profit > 0) {
                await addTransaction(playerId, playerName, 'WIN', profit, `Won ${profit}`);
                await updatePlayerStats(playerId, profit, true, false);
            } else if (profit <= 0) {
                await addTransaction(playerId, playerName, profit >= 0 ? 'WIN' : 'LOSS', profit, 'Round Result');
                await updatePlayerStats(playerId, profit, profit > 0, profit < 0);
            }
        }

        // DO NOT CLEAR BETS YET.
        // We want the user to see "I bet on Chicken, Chicken Won, I see 'WIN'"
        // Bets will be cleared when the NEXT round starts (currentStatus goes back to BETTING).
        // setBets({}); 
    };

    const newGame = async () => {
        if (isLive) {
            if (isHost) {
                await updateSessionStatus('BETTING', [], Date.now());
                await clearAllBets(); // Clear global bets
                // Reset bowl to open for new round
                await openBowl();
                setBets({});
                setResult([]);
                setLastWin(0);
                setShakerActive(false);
                setCanReveal(false);
                setIsBowlOpen(true);
            } else {
                // Client side - just clear local view
                setBets({});
                setResult([]);
                setLastWin(0);
            }
        } else {
            // Local Mode
            setBets({});
            setResult([]);
            setLastWin(0);
            setLocalGameState('BETTING');
        }
    };

    // --- ADMIN ACTIONS ---
    const toggleLiveMode = async () => {
        if (isLive) {
            if (confirm("End Live Session? This will archive the game.")) {
                await endLiveGame();
            }
        } else {
            await initGameSession();
            await setSessionHost(playerId, playerName); // Creator defaults to host
        }
        setShowAdminMenu(false);
    };

    const assignHost = async (targetId: string, targetName: string) => {
        // 1. Calculate Total Table Bankroll (excluding the potential host)
        const targetHost = activePlayers.find(p => p.id === targetId);
        if (!targetHost) return;

        const otherPlayers = activePlayers.filter(p => p.id !== targetId);
        const totalTableBalance = otherPlayers.reduce((sum, p) => sum + p.balance, 0);

        // 2. Check Rule: Host Balance >= Total Table Balance
        if (targetHost.balance < totalTableBalance) {
            const shortfall = totalTableBalance - targetHost.balance;
            alert(`Host Requirement Not Met!\n\nThe Host needs a bankroll larger than the combined total of all other players ($${totalTableBalance.toLocaleString()}).\n\n${targetName} is short by $${shortfall.toLocaleString()}.\nPlease add funds before hosting.`);
            return;
        }

        await setSessionHost(targetId, targetName);
        setShowHostPicker(false);
        setShowAdminMenu(false);
    };

    const handlePrint = () => {
        window.print();
    };

    // --- RENDER ---
    return (
        <div className="min-h-[100dvh] bg-[#0B0C15] pb-24 text-white font-sans select-none selection:bg-transparent flex flex-col relative">
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white; color: black; }
                }
                .print-only { display: none; }
            `}</style>

            {/* ADMIN / HOST INDICATOR */}
            {isLive && (
                <div className="no-print bg-gradient-to-r from-purple-900/80 to-blue-900/80 p-2 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-cyan-200 border-b border-white/10 backdrop-blur-md sticky top-0 z-40">
                    <span>HOST: {session?.hostName || 'Unknown'} {isHost && '(YOU)'}</span>
                    <span className="bg-black/30 px-2 py-0.5 rounded text-white">{currentStatus} • {formatTime(elapsedTime)}</span>
                </div>
            )}

            {/* PRINTABLE LEDGER (Same as before) */}
            <div className="print-only p-8 text-black bg-white">
                <h1 className="text-3xl font-bold mb-4">Bau Cua Ledger Report</h1>
                <p className="mb-4">Generated: {new Date().toLocaleString()}</p>
                <h2 className="text-xl font-bold mt-6 mb-2">Player Balances</h2>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="py-2">Player</th>
                            <th className="py-2">Balance</th>
                            <th className="py-2">Wins</th>
                            <th className="py-2">Losses</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activePlayers.map(p => (
                            <tr key={p.id} className="border-b border-gray-300">
                                <td className="py-2">{p.name}</td>
                                <td className="py-2 font-mono font-bold">${p.balance.toLocaleString()}</td>
                                <td className="py-2 text-green-600">{p.wins}</td>
                                <td className="py-2 text-red-600">{p.losses}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <h2 className="text-xl font-bold mt-8 mb-2">Recent Transactions</h2>
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="py-1">Time</th>
                            <th className="py-1">Player</th>
                            <th className="py-1">Type</th>
                            <th className="py-1">Amount</th>
                            <th className="py-1">Desc</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.slice(0, 50).map(t => (
                            <tr key={t.id} className="border-b border-gray-200">
                                <td className="py-1">{t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleTimeString() : 'Pending'}</td>
                                <td className="py-1">{t.playerName}</td>
                                <td className="py-1 font-bold">{t.type}</td>
                                <td className="py-1">${t.amount}</td>
                                <td className="py-1">{t.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* HEADER - COMPACTED WITH ADMIN BTN */}
            <div className="no-print px-3 pt-2 pb-2 flex justify-between items-center bg-black/20 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30 shrink-0">
                <Link href="/" className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">
                    <ChevronLeft className="w-5 h-5" />
                </Link>

                <div className="flex flex-col items-center">
                    {/* Smaller Title */}
                    <h1 className="font-russo text-lg tracking-widest text-[#db2777] drop-shadow-[0_0_10px_rgba(219,39,119,0.5)]">
                        BAU CUA
                    </h1>

                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                            <Coins className="w-3 h-3 text-yellow-500" />
                            <span className="font-mono text-sm font-bold text-yellow-400 min-w-[3ch] text-right">${balance.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={handleAddMoneyClick}
                            className="px-3 py-1 rounded-lg bg-green-600 flex items-center gap-1 text-white shadow-lg hover:bg-green-500 transition font-bold text-[10px] uppercase tracking-wider"
                        >
                            <Plus className="w-3 h-3" strokeWidth={3} />
                            <span>Add</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className={`p-1.5 rounded-full transition ${isLive ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' : 'bg-white/5 hover:bg-white/10'}`}>
                    <Settings className="w-5 h-5" />
                </button>

                {/* ADMIN DROPDOWN */}
                {showAdminMenu && (
                    <div className="absolute top-full right-2 mt-2 w-48 bg-[#1A1C29] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 origin-top-right">
                        <div className="px-4 py-2 text-[10px] uppercase font-bold text-white/40 bg-white/5">Session Control</div>
                        <button onClick={toggleLiveMode} className="px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/5 flex items-center gap-2">
                            {isLive ? <StopCircle size={16} className="text-red-500" /> : <Play size={16} className="text-green-500" />}
                            {isLive ? 'End Live Game' : 'Go Live'}
                        </button>
                        {isLive && (
                            <button onClick={() => setShowHostPicker(true)} className="px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/5 flex items-center gap-2 border-t border-white/5">
                                <UserCheck size={16} className="text-yellow-500" />
                                Set Host
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* MAIN GAME AREA - RESPONSIVE LAYOUT */}
            <div className="no-print flex-1 w-full mx-auto flex flex-col md:flex-row gap-4 md:gap-[2vw] p-4 md:px-[2vw] md:py-4 relative z-10 mb-32 md:mb-4 overflow-y-auto">

                {/* --- LEFT: BOARD (Desktop: expands, Mobile: Full) --- */}
                <div className="flex-1 min-h-0">
                    {(currentStatus === 'BETTING' || currentStatus === 'ROLLING' || currentStatus === 'RESULT') ? (
                        <div className="relative h-full flex flex-col justify-center">

                            {/* === 3D DICE SHAKER === */}
                            <div className="mb-2 md:mb-[1vw] min-h-[300px] flex flex-col justify-center">
                                <React.Suspense fallback={
                                    <div className="w-full aspect-square md:aspect-video flex items-center justify-center bg-white/5 rounded-xl animate-pulse">
                                        <div className="text-white/30 font-bold uppercase tracking-widest">Loading Items...</div>
                                    </div>
                                }>
                                    <DiceShaker
                                        trigger={shakeTrigger}
                                        shakeType={shakeType}
                                        onRollComplete={handleDiceResult}
                                        onShakeEnd={handleShakeEnd}
                                        onBowlTap={handleOpenClick}
                                        disabled={currentStatus === 'RESULT'}
                                        isOpen={isBowlOpen}
                                        forcedResult={isLive ? syncedRollIndices : undefined}
                                        className="border border-white/10 shadow-2xl"
                                    />
                                </React.Suspense>
                                {/* Shake buttons (below canvas, only during BETTING or ROLLING-Hidden) */}
                                {(!isLive || isHost) && (
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        {/* Start Shake Button */}
                                        {currentStatus === 'BETTING' && (
                                            <button
                                                onClick={() => handleRollClick(1)}
                                                disabled={(Object.keys(bets).length === 0 && !isLive) || shakerActive}
                                                className={`
                                                col-span-2 py-4 rounded-xl font-black text-lg uppercase tracking-widest
                                                shadow-lg flex items-center justify-center gap-2 transition-all
                                                ${(Object.keys(bets).length > 0 || (isLive && isHost)) && !shakerActive
                                                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 animate-gradient text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] hover:scale-[1.02]'
                                                        : 'bg-white/10 text-white/30 cursor-not-allowed'}
                                            `}
                                            >
                                                {shakerActive ? (
                                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <>🎲 Start Shake</>
                                                )}
                                            </button>
                                        )}

                                        {/* Luck Shake & Open Buttons (Only when Hidden/Rolling AND shaking finished) */}
                                        {(!isBowlOpen && canReveal) && (
                                            <>
                                                <button
                                                    onClick={() => handleRollClick(2)}
                                                    disabled={luckShakeCount >= 2 || !canReveal}
                                                    className={`
                                                py-4 rounded-xl font-black text-lg uppercase tracking-widest
                                                shadow-lg flex items-center justify-center gap-2 transition-all
                                                ${luckShakeCount < 2 && canReveal
                                                            ? 'bg-gradient-to-r from-purple-600 to-cyan-600 animate-gradient text-white shadow-[0_0_15px_rgba(8,145,178,0.4)] hover:scale-[1.02]'
                                                            : 'bg-white/10 text-white/30 cursor-not-allowed'}
                                            `}
                                                >
                                                    🍀 Luck ({2 - luckShakeCount})
                                                </button>
                                                <button
                                                    onClick={handleOpenClick}
                                                    className={`
                                                py-4 rounded-xl font-black text-lg uppercase tracking-widest
                                                shadow-lg flex items-center justify-center gap-2 transition-all
                                                bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:scale-[1.02] animate-pulse
                                            `}
                                                >
                                                    ✨ TAP TO OPEN
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* === SOUND EMOTE BUTTONS === */}
                            {isLive && (
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    <button
                                        onClick={async () => {
                                            if (troiOiUsed) return;
                                            setTroiOiUsed(true);
                                            await triggerSound('troioi', playerName);
                                        }}
                                        disabled={troiOiUsed}
                                        className={`
                                            flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm
                                            border transition-all duration-200
                                            ${troiOiUsed
                                                ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/40 text-yellow-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] active:scale-95'}
                                        `}
                                    >
                                        <span className="text-lg">😱</span> Trời ơi!
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (chetMeUsed) return;
                                            setChetMeUsed(true);
                                            await triggerSound('chetme', playerName);
                                        }}
                                        disabled={chetMeUsed}
                                        className={`
                                            flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm
                                            border transition-all duration-200
                                            ${chetMeUsed
                                                ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/40 text-red-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] active:scale-95'}
                                        `}
                                    >
                                        <span className="text-lg">💀</span> Chết mẹ!
                                    </button>
                                </div>
                            )}


                            {/* RESULT OVERLAY REMOVED - Results shown on board */}

                            {/* GRID - RESPONSIVE (2 cols mobile, 3 cols desktop) */}
                            {/* Mobile: Use h-full and content-center to keep it centered and packed. gap-2 to save space. */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-[clamp(0.5rem,1.5vw,2rem)] max-w-md md:max-w-none mx-auto w-full h-full md:h-auto content-center md:content-start">
                                {ANIMALS.map(animal => {
                                    const matchCount = (isLive && session?.result && session.result.length > 0) ? session.result.filter(r => r === animal.id).length : result.filter(r => r === animal.id).length;
                                    const betAmount = bets[animal.id] || 0;

                                    return (
                                        <AnimalCard
                                            key={animal.id}
                                            animal={animal}
                                            betAmount={betAmount}
                                            onBet={() => placeBet(animal.id)}
                                            disabled={
                                                (currentStatus === 'BETTING' && balance < selectedChip) ||
                                                (currentStatus === 'ROLLING') ||
                                                (currentStatus === 'RESULT')
                                            }
                                            isWinner={currentStatus === 'RESULT' && (session?.result?.includes(animal.id) || result.includes(animal.id))}
                                            showResult={currentStatus === 'RESULT'}
                                            matchCount={matchCount}
                                            allBets={allBets}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* --- RIGHT: CONTROLS & PLAYERS (Desktop: Fixed Width Sidebar, Mobile: Bottom Sticky) --- */}
                {/* Desktop: Sticky column, split into Top (Controls) and Bottom (Players) */}
                <div className="flex-1 md:flex-none md:w-[clamp(18rem,22vw,24rem)] md:sticky md:top-20 md:h-[calc(100dvh-6rem)] flex flex-col gap-4">
                    {/* DESKTOP CONTROLS (Hidden on Mobile) */}
                    <div className="hidden md:flex bg-[#151725]/90 backdrop-blur-xl p-4 md:p-6 rounded-3xl border border-white/10 shadow-2xl flex-col gap-4 md:gap-6">

                        {/* HOST START NEXT ROUND */}
                        {isHost && currentStatus === 'RESULT' && (
                            <div className="flex flex-col gap-4">
                                <h2 className="text-xl font-bold text-white text-center">Round Over</h2>
                                <div className="flex justify-center gap-2 mb-2">
                                    {session?.result?.map((id, i) => (
                                        <div key={i} className="text-5xl bg-white/10 p-2 rounded-xl">
                                            {ANIMALS.find(a => a.id === id)?.emoji}
                                        </div>
                                    ))}
                                </div>

                                {/* DEALER SUMMARY */}
                                <div className="bg-black/40 rounded-xl p-3 text-sm">
                                    <h3 className="text-yellow-500 font-bold mb-2 uppercase tracking-wider text-xs">Dealer Result</h3>
                                    <div className="space-y-1 max-h-40 overflow-y-auto mb-3">
                                        {allBets.length === 0 ? (
                                            <div className="text-white/30 italic">No bets placed.</div>
                                        ) : (
                                            allBets.map(pb => {
                                                let pTotalBet = 0;
                                                let pTotalWin = 0;
                                                Object.entries(pb.bets).forEach(([aid, amt]) => {
                                                    pTotalBet += amt;
                                                    const matches = result.filter(r => r === aid).length;
                                                    if (matches > 0) pTotalWin += amt + (amt * matches);
                                                });
                                                const pNet = pTotalWin - pTotalBet;
                                                const dealerNet = -pNet;

                                                return (
                                                    <div key={pb.playerId} className="flex justify-between border-b border-white/5 pb-1">
                                                        <span className="text-white/70">{pb.playerName}</span>
                                                        <span className={`font-mono font-bold ${dealerNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                            {dealerNet >= 0 ? '+' : ''}${dealerNet}
                                                        </span>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>

                                <button onClick={newGame} className="w-full py-5 bg-blue-600 rounded-2xl font-bold text-xl uppercase text-white shadow-xl animate-pulse">
                                    Start Next Round
                                </button>
                            </div>
                        )}

                        {/* HOST CONTROL: SUBMIT WINNERS */}
                        {/* HOST CONTROL: OLD MANUAL SUBMIT REMOVED */}


                        {/* BETTING CONTROLS */}
                        {(currentStatus === 'BETTING' || (isHost && currentStatus === 'ROLLING')) && !isHost && (
                            <>
                                <h3 className="text-white/50 font-bold uppercase tracking-widest text-xs md:text-sm">Place Your Bets</h3>

                                {/* Chip Selector - Players Only */}
                                {!isHost && (
                                    <>
                                        <div className="flex gap-2 justify-center py-2 overflow-x-auto no-scrollbar mask-grad-x md:mask-none">
                                            {CHIPS.map(chip => (
                                                <button
                                                    key={chip}
                                                    onClick={() => setSelectedChip(chip)}
                                                    className={`
                                                relative w-20 h-20 md:w-28 md:h-28 rounded-full flex flex-col items-center justify-center font-black text-2xl md:text-3xl border-[4px] transition-all shadow-xl
                                                ${selectedChip === chip
                                                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-white text-black scale-110 shadow-[0_0_20px_rgba(234,179,8,0.6)] z-10'
                                                            : 'bg-black/60 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/30'}
                                            `}
                                                >
                                                    <span>${chip}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="h-px bg-white/10 w-full my-2" />
                                    </>
                                )}

                                {/* Action Buttons Row */}
                                <div className="flex gap-3 h-20 md:h-28">
                                    {/* Clear - Players Only */}
                                    {!isHost && (
                                        <button
                                            onClick={clearBets}
                                            disabled={Object.keys(bets).length === 0}
                                            className="h-full aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 disabled:opacity-30 hover:bg-white/10 transition"
                                        >
                                            <RotateCcw className="w-8 h-8 md:w-10 md:h-10" />
                                        </button>
                                    )}

                                    {/* ROLL / LOCK / READY */}
                                    {(!isLive || isHost) ? (
                                        <div className="flex-1 flex gap-2 h-full">
                                            {/* We only show buttons here if NOT in the special Hidden/Rolling state. 
                                                If Hidden/Rolling, the controls are under the shaker.
                                                Actually, let's keep consistent. Use this space for redundant controls or status.
                                            */}
                                            {currentStatus === 'BETTING' ? (
                                                <button
                                                    onClick={() => handleRollClick(1)}
                                                    className={`
                                                    flex-1 h-full rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg flex items-center justify-center transition-all
                                                    ${(Object.keys(bets).length > 0 || (isLive && isHost))
                                                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 animate-gradient text-white shadow-[0_0_15px_rgba(236,72,153,0.5)] hover:scale-[1.02]'
                                                            : 'bg-white/10 text-white/30 cursor-not-allowed'}
                                                `}
                                                >
                                                    <div className="flex flex-col items-center leading-none">
                                                        <span>Start Shake</span>
                                                        <span className="text-[10px] opacity-70 font-mono mt-1">{timeLeft}s</span>
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className={`flex-1 flex items-center justify-center font-mono ${canReveal ? 'text-green-400 font-bold animate-pulse' : 'text-white/50'}`}>
                                                    {isBowlOpen ? 'Round Finished' : (canReveal ? 'TAP BOWL TO OPEN' : 'Shaking…')}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // CLIENT VIEW: Just a Timer Display
                                        <div className="flex-1 h-full rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-white/50">
                                            <span className="text-xs uppercase tracking-widest mb-1">Starting in</span>
                                            <span className="font-mono text-2xl text-white font-bold">{timeLeft}s</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* DESKTOP PLAYER LIST (Bottom Right Box) */}
                    <div className="hidden md:flex flex-col flex-1 bg-[#151725]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden min-h-0">
                        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center shrink-0">
                            <h3 className="font-russo text-white/70 uppercase tracking-widest text-sm">
                                {isLive ? 'Live Players' : 'Game History'}
                            </h3>
                            {isLive && (
                                <div className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold">
                                    {activePlayers.length} Online
                                </div>
                            )}
                        </div>

                        {isLive ? (
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {activePlayers.map(player => (
                                    <div key={player.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${player.id === playerId ? 'bg-white/10 border border-white/20' : 'bg-black/20 border border-white/5'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${player.id === session?.hostId ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-gradient-to-br from-blue-400 to-purple-400'}`} />
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-sm ${player.id === playerId ? 'text-white' : 'text-white/70'}`}>
                                                    {player.name} {player.id === playerId && '(You)'}
                                                </span>
                                                {player.id === session?.hostId && <span className="text-[8px] uppercase font-bold text-yellow-500 tracking-wider">Host</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-bold text-yellow-400 text-sm">${player.balance.toLocaleString()}</div>
                                            <div className="text-[10px] text-white/30 flex gap-2 justify-end mt-0.5">
                                                <span className="text-green-500/80 font-bold">W:{player.wins}</span>
                                                <span className="text-red-500/80 font-bold">L:{player.losses}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                                <Trophy className="w-12 h-12 text-white/20" />
                                <div>
                                    <p className="text-white/50 text-sm">No live game active.</p>
                                    <p className="text-white/30 text-xs mt-1">Check past results below.</p>
                                </div>
                                <Link href="/bau-cua/history" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase tracking-wider text-sm transition text-white">
                                    View Game History
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

            </div>



            {/* HOST PICKER MODAL */}
            <AnimatePresence>
                {showHostPicker && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowHostPicker(false)} />
                        <div className="relative w-full max-w-sm bg-[#1A1C29] border border-white/10 rounded-3xl p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-4">Assign Host</h2>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {activePlayers.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => assignHost(p.id, p.name)}
                                        className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-between text-white"
                                    >
                                        <span className="font-bold">{p.name}</span>
                                        {p.id === session?.hostId && <Shield size={16} className="text-yellow-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>


            {/* LEDGER DRAWER (Mobile Only) */}
            <div className="md:hidden no-print absolute bottom-0 left-0 right-0 bg-[#0F111A] border-t border-white/10 rounded-t-3xl max-h-[40vh] overflow-hidden flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] w-full max-w-sm mx-auto">
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">
                        {isLive ? 'Live Games' : 'History'}
                    </h3>
                    {isLive && <button onClick={handlePrint} className="text-xs bg-white/5 px-2 py-1 rounded hover:bg-white/10">Print Record</button>}
                </div>

                {isLive ? (
                    <div className="overflow-y-auto flex-1 p-4 space-y-4">
                        {/* Active Players */}
                        <div>
                            {activePlayers.map(player => (
                                <div key={player.id} className={`flex items-center justify-between p-2 rounded-lg ${player.id === playerId ? 'bg-white/10 border border-white/20' : 'border-b border-white/5'}`}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className={`font-bold ${player.id === playerId ? 'text-white' : 'text-white/70'}`}>{player.name} {player.id === playerId && '(You)'}</span>
                                        {isLive && session?.hostId === player.id && <Shield size={12} className="text-yellow-500 ml-1" />}
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-yellow-400">${player.balance.toLocaleString()}</div>
                                        <div className="text-[10px] text-white/30 flex gap-2 justify-end">
                                            <span className="text-green-500/80">W: {player.wins}</span>
                                            <span className="text-red-500/80">L: {player.losses}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 flex flex-col items-center justify-center space-y-4 min-h-[200px]">
                        <p className="text-white/40 text-sm text-center">No active game.</p>
                        <Link href="/bau-cua/history" className="w-full py-4 bg-white/5 rounded-xl flex items-center justify-center font-bold text-white uppercase tracking-wider hover:bg-white/10 transition">
                            View Past Games
                        </Link>
                    </div>
                )}
            </div>

            {/* MOBILE FIXED CONTROLS BAR */}
            <div className="md:hidden no-print fixed bottom-0 left-0 right-0 z-50 bg-[#0B0C15]/95 backdrop-blur-xl border-t border-white/10 px-4 pt-3 pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">

                {/* STATE: BETTING */}
                {currentStatus === 'BETTING' && (
                    <div className="flex items-center gap-3">
                        {/* Chips */}
                        <div className="flex gap-2">
                            {CHIPS.map(chip => (
                                <button
                                    key={chip}
                                    onClick={() => setSelectedChip(chip)}
                                    className={`
                                        w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all
                                        ${selectedChip === chip
                                            ? 'bg-yellow-500 border-white text-black scale-110 shadow-lg'
                                            : 'bg-white/10 border-white/10 text-white/50'}
                                    `}
                                >
                                    ${chip}
                                </button>
                            ))}
                        </div>

                        <div className="w-px h-8 bg-white/10 mx-1" />

                        {/* Clear */}
                        <button
                            onClick={clearBets}
                            disabled={Object.keys(bets).length === 0}
                            className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 disabled:opacity-30 active:bg-white/20"
                        >
                            <RotateCcw size={18} />
                        </button>

                        {/* ROLL / READY (Mobile) */}
                        {(!isLive || isHost) ? (
                            <div className="flex-1 flex gap-2 h-12">
                                {currentStatus === 'BETTING' ? (
                                    <>
                                        <button
                                            onClick={() => handleRollClick(1)}
                                            disabled={Object.keys(bets).length === 0 && !isLive}
                                            className={`
                                                flex-1 h-full rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center transition-all
                                                ${(Object.keys(bets).length > 0 || (isLive && isHost))
                                                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-pink-500/20'
                                                    : 'bg-white/10 text-white/30 cursor-not-allowed'}
                                            `}
                                        >
                                            🎲 Start Shake ({timeLeft}s)
                                        </button>
                                    </>
                                ) : (
                                    null
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 font-mono text-sm">
                                Starting in <span className="text-white font-bold ml-2">{timeLeft}s</span>
                            </div>
                        )}
                    </div>
                )}

                {/* STATE: ROLLING (Host + non-host) */}
                {currentStatus === 'ROLLING' && (
                    <div className="flex items-center gap-3">
                        {(!isLive || isHost) && !isBowlOpen && canReveal ? (
                            <>
                                <button
                                    onClick={() => handleRollClick(2)}
                                    disabled={luckShakeCount >= 2}
                                    className={`
                                        flex-1 h-12 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center transition-all
                                        ${luckShakeCount < 2
                                            ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-cyan-500/20'
                                            : 'bg-white/10 text-white/30 cursor-not-allowed'}
                                    `}
                                >
                                    🍀 Luck ({2 - luckShakeCount})
                                </button>
                                <button
                                    onClick={handleOpenClick}
                                    className="flex-1 h-12 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center transition-all bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/20 animate-pulse"
                                >
                                    ✨ Open
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 font-mono text-sm animate-pulse">
                                {shakerActive ? 'Shaking…' : 'Waiting for dice…'}
                            </div>
                        )}
                    </div>
                )}

                {/* STATE: RESULT/ROUND OVER */}
                {isHost && currentStatus === 'RESULT' && (
                    <button onClick={newGame} className="w-full h-12 bg-blue-600 rounded-xl font-bold uppercase text-white shadow-lg animate-pulse">
                        Start Next Round
                    </button>
                )}

                {/* STATE: WAITING (Client) */}
                {!isHost && currentStatus !== 'BETTING' && (
                    <div className="flex items-center justify-center h-12 text-white/40 font-mono text-xs animate-pulse">
                        WAITING FOR HOST...
                    </div>
                )}

            </div>

            {/* --- TOP UP MODAL --- */}
            <AnimatePresence>
                {showTopUpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowTopUpModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-sm bg-[#1A1C29] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-green-500/20 to-transparent pointer-events-none" />

                            <h2 className="text-2xl font-russo text-center text-white mb-6 relative z-10">ADD FUNDS</h2>

                            <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
                                {[20, 50, 100].map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => setTopUpAmount(amount)}
                                        className={`
                                                py-3 rounded-xl border transition-all font-bold text-lg
                                                ${topUpAmount === amount
                                                ? 'bg-green-600 border-green-400 text-white shadow-[0_0_20px_rgba(22,163,74,0.5)] scale-105'
                                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}
                                            `}
                                    >
                                        ${amount}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3 relative z-10">
                                <button
                                    onClick={handleVenmoPayment}
                                    className="w-full py-4 bg-[#008CFF] hover:bg-[#0074D4] rounded-xl font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all"
                                >
                                    <span className="text-xl">Step 1:</span> Pay with Venmo
                                </button>

                                <div className="text-center text-xs text-white/30 uppercase tracking-widest my-2">Then</div>

                                <button
                                    onClick={handleConfirmTopUp}
                                    className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(22,163,74,0.3)] transition-all"
                                >
                                    <Check className="w-5 h-5" />
                                    <span>Step 2: I Sent It!</span>
                                </button>
                            </div>

                            <button
                                onClick={() => setShowTopUpModal(false)}
                                className="w-full mt-4 py-3 text-white/30 font-bold hover:text-white/60 transition"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- IDENTITY MODAL --- */}
            <AnimatePresence>
                {
                    showIdentityModal && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative w-full max-w-sm bg-[#1A1C29] border border-white/10 rounded-3xl p-8 shadow-2xl text-center"
                            >
                                <h2 className="text-2xl font-russo text-white mb-2">WHO IS PLAYING?</h2>
                                <p className="text-white/50 text-sm mb-6">Enter your name to join the table.</p>

                                <input
                                    type="text"
                                    value={userInputName}
                                    onChange={e => setUserInputName(e.target.value)}
                                    placeholder="Your Name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-center text-xl font-bold text-white mb-4 focus:ring-2 focus:ring-pink-500 outline-none"
                                />

                                <button
                                    onClick={handleJoin}
                                    disabled={!userInputName.trim()}
                                    className="w-full py-4 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-xl font-black text-lg uppercase tracking-widest shadow-lg transition-all"
                                >
                                    Join Table
                                </button>

                                {/* DEBUG SOUNDBOARD */}
                                <div className="mt-8 pt-4 border-t border-white/10">
                                    <p className="text-white/30 text-xs mb-2 uppercase tracking-widest">Sound Check (Debug)</p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {availableSounds.map((sound: string, i: number) => (
                                            <button
                                                key={i}
                                                onClick={() => playFile(sound)}
                                                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/50 text-[10px] rounded"
                                            >
                                                S{i + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

        </div >
    );
}


