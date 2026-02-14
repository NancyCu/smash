"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw, Coins, Trophy, Info, Plus, Check } from 'lucide-react';
import Link from 'next/link';

import {
    identifyPlayer,
    addTransaction,
    updatePlayerStats,
    subscribeToPlayers,
    subscribeToTransactions,
    type Player,
    type Transaction
} from '@/lib/bau-cua-service';

// --- CONFIGURATION ---
const VENMO_USERNAME = "your_username";

// --- ASSETS & CONSTANTS ---
// Using Emoji for high-quality visuals on Apple devices
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
    disabled
}: {
    animal: typeof ANIMALS[0],
    betAmount: number,
    onBet: () => void,
    disabled: boolean
}) => {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBet}
            disabled={disabled}
            className={`
        relative aspect-square rounded-full 
        border-[3px] border-white/10 
        bg-gradient-to-br ${animal.color} 
        backdrop-blur-md
        flex flex-col items-center justify-center 
        shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
        shadow-[inset_0_2px_20px_rgba(255,255,255,0.2)]
        transition-all duration-300
        group
        ${disabled ? 'opacity-50 grayscale' : 'hover:scale-105 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'}
      `}
        >
            {/* Glossy Reflection Highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

            {/* Bet Badge */}
            <AnimatePresence>
                {betAmount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 bg-yellow-400 text-black font-black text-[10px] md:text-xs px-1.5 py-0.5 rounded-full border border-white shadow-lg z-20"
                    >
                        ${betAmount}
                    </motion.div>
                )}
            </AnimatePresence>

            <span className="text-5xl md:text-6xl drop-shadow-2xl filter transform transition-transform group-hover:scale-110">{animal.emoji}</span>
            <span className="mt-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/80 text-shadow-sm leading-tight">{animal.name}</span>
        </motion.button>
    );
};

export default function BauCuaPage() {
    // --- STATE ---
    const [balance, setBalance] = useState(0);
    const [bets, setBets] = useState<Record<string, number>>({});
    const [selectedChip, setSelectedChip] = useState(5);
    const [gameState, setGameState] = useState<'BETTING' | 'RESULT' | 'WIN'>('BETTING');
    const [result, setResult] = useState<string[]>([]);
    const [lastWin, setLastWin] = useState(0);

    const [showTopUpModal, setShowTopUpModal] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState(20);

    // Multiplayer State
    const [playerName, setPlayerName] = useState("");
    const [playerId, setPlayerId] = useState("");
    const [showIdentityModal, setShowIdentityModal] = useState(false);
    const [activePlayers, setActivePlayers] = useState<Player[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [userInputName, setUserInputName] = useState("");

    // 1. Identity Check
    useEffect(() => {
        const checkIdentity = async () => {
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
    }, []);

    // 2. Subscriptions
    useEffect(() => {
        const unsubPlayers = subscribeToPlayers(setActivePlayers);
        const unsubTx = subscribeToTransactions(setTransactions);
        return () => {
            unsubPlayers();
            unsubTx();
        };
    }, []);

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

    // Auto-save logic was here (removed in favor of explicit transactions)
    // Actually, let's keep balance synced just in case? 
    // No, we rely on identifyPlayer and explicit actions now.

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
        // Fire and forget (optimistic UI)
        setBalance(prev => prev + topUpAmount);
        setShowTopUpModal(false);

        if (playerId) {
            await addTransaction(playerId, playerName, 'DEPOSIT', topUpAmount, 'Venmo Top-up');
            await updatePlayerStats(playerId, topUpAmount);
        }
    };

    const placeBet = (animalId: string) => {
        if (balance < selectedChip) return;

        setBets(prev => ({
            ...prev,
            [animalId]: (prev[animalId] || 0) + selectedChip
        }));
        setBalance(prev => prev - selectedChip);
    };

    const clearBets = () => {
        let totalRefund = 0;
        Object.values(bets).forEach(amount => totalRefund += amount);
        setBalance(prev => prev + totalRefund);
        setBets({});
    };

    const handleRollClick = () => {
        if (Object.keys(bets).length === 0) return;
        setGameState('RESULT');
        setResult([]);
    };

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

        let totalWinnings = 0;
        let totalBetReturn = 0;
        let totalBetAmount = 0;

        Object.entries(bets).forEach(([animalId, betAmount]) => {
            totalBetAmount += betAmount;
            const matches = result.filter(r => r === animalId).length;
            if (matches > 0) {
                totalBetReturn += betAmount;
                totalWinnings += betAmount * matches;
            }
        });

        const payout = totalBetReturn + totalWinnings;
        const profit = payout - totalBetAmount; // Net profit (positive) or loss (negative)

        setBalance(prev => prev + payout);
        setLastWin(totalWinnings);
        setGameState('WIN');

        // Log to Firestore
        if (playerId && totalBetAmount > 0) {
            if (profit > 0) {
                await addTransaction(playerId, playerName, 'WIN', profit, `Won ${profit}`);
                await updatePlayerStats(playerId, profit, true, false);
            } else if (profit < 0) {
                // Loss transaction if you want to track net loss per round
                // Or just track the "Bet" earlier.
                // Let's track the result summary
                // Actually, simply: We deducted bets from balance already locally.
                // But we didn't deduct from Firestore yet?
                // Wait, 'placeBet' reduces local balance but did not touch DB.
                // So we need to sync the NET change.
                // Logic: At start of round balance was X. Now it is X - Bets + Payout.
                // Change = Payout - Bets.
                await addTransaction(playerId, playerName, profit >= 0 ? 'WIN' : 'LOSS', profit, profit >= 0 ? 'Win Round' : 'Loss Round');
                await updatePlayerStats(playerId, profit, profit > 0, profit < 0);
            }
        }
    };

    const newGame = () => {
        setBets({});
        setResult([]);
        setLastWin(0);
        setGameState('BETTING');
    };

    const handlePrint = () => {
        window.print();
    };

    // --- RENDER ---
    return (
        <div className="min-h-[100dvh] bg-[#0B0C15] pb-24 text-white overflow-hidden font-sans select-none selection:bg-transparent flex flex-col relative">
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white; color: black; }
                }
                .print-only { display: none; }
            `}</style>

            {/* PRINTABLE LEDGER */}
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

            {/* HEADER - COMPACTED */}
            <div className="no-print px-3 pt-3 pb-2 flex justify-between items-center bg-black/20 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30 shrink-0">
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
                            <span>Add Money</span>
                        </button>
                    </div>
                </div>

                <div className="w-8" />
                {/* Replaces Reset Button with spacer for center alignment */}
            </div>

            <div className="no-print flex-1 p-2 max-w-sm mx-auto flex flex-col justify-center gap-2 relative z-10 w-full mb-80">

                {/* --- PHASE 1: BETTING BOARD --- */}
                {gameState === 'BETTING' && (
                    <>
                        {/* GRID - Compacted gaps */}
                        <div className="grid grid-cols-2 gap-3 px-1">
                            {ANIMALS.map(animal => (
                                <AnimalCard
                                    key={animal.id}
                                    animal={animal}
                                    betAmount={bets[animal.id] || 0}
                                    onBet={() => placeBet(animal.id)}
                                    disabled={balance < selectedChip}
                                />
                            ))}
                        </div>

                        {/* CONTROLS - Single Row */}
                        <div className="mt-1 bg-[#151725]/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl shrink-0 flex items-center justify-between gap-2">

                            {/* 1. Clear Button (Left) */}
                            <button
                                onClick={clearBets}
                                disabled={Object.keys(bets).length === 0}
                                className="h-14 w-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 disabled:opacity-30 hover:bg-white/10 transition"
                                title="Clear Bets"
                            >
                                <RotateCcw className="w-6 h-6" />
                            </button>

                            {/* 2. Chips (Center) */}
                            <div className="flex gap-3">
                                {CHIPS.map(chip => (
                                    <button
                                        key={chip}
                                        onClick={() => setSelectedChip(chip)}
                                        className={`
                                            relative w-14 h-14 rounded-full flex flex-col items-center justify-center font-black text-base border-[3px] transition-all shadow-xl
                                            ${selectedChip === chip
                                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-white text-black scale-110 shadow-[0_0_20px_rgba(234,179,8,0.6)] z-10'
                                                : 'bg-black/60 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/30'}
                                        `}
                                    >
                                        <span>${chip}</span>
                                    </button>
                                ))}
                            </div>

                            {/* 3. Roll/Ready Button (Right) */}
                            <button
                                onClick={handleRollClick}
                                disabled={Object.keys(bets).length === 0}
                                className={`
                                    h-14 px-6 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg flex items-center justify-center transition-all
                                    ${Object.keys(bets).length > 0
                                        ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-[length:200%_auto] animate-gradient text-white shadow-[0_0_25px_rgba(236,72,153,0.5)] hover:scale-[1.05]'
                                        : 'bg-white/10 text-white/30 cursor-not-allowed'}
                                `}
                            >
                                ROLL
                            </button>
                        </div>
                    </>
                )}

                {/* --- PHASE 2: RESULT INPUT --- */}
                {gameState === 'RESULT' && (
                    <div className="flex flex-col items-center justify-between h-full animate-in zoom-in py-2">

                        {/* Top Section: Prompt & Slots */}
                        <div className="w-full flex flex-col items-center gap-2">
                            <h2 className="text-xl font-bold text-center text-cyan-400 drop-shadow-lg uppercase tracking-widest">
                                Tap Result (3)
                            </h2>

                            {/* The 3 Result Slots - Compacted */}
                            <div className="flex gap-3 mb-2">
                                {[0, 1, 2].map(i => {
                                    const animalId = result[i];
                                    const animal = ANIMALS.find(a => a.id === animalId);
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => removeResultItem(i)}
                                            className={`
                                    w-16 h-16 rounded-xl border-2 flex items-center justify-center text-4xl shadow-inner backdrop-blur-sm transition-all
                                    ${animal ? 'bg-gradient-to-br from-white/20 to-white/5 border-white/40' : 'bg-black/40 border-dashed border-white/10'}
                                `}
                                        >
                                            {animal ? animal.emoji : <span className="opacity-10 text-xs">?</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Center Section: BIG INPUT GRID - Compacted */}
                        <div className="grid grid-cols-2 gap-3 w-full px-4 flex-1 content-center">
                            {ANIMALS.map((animal) => {
                                const count = result.filter(r => r === animal.id).length;
                                return (
                                    <button
                                        key={animal.id}
                                        onClick={() => addResultItem(animal.id)}
                                        disabled={result.length >= 3}
                                        className={`
                                relative aspect-[4/3] rounded-2xl border-2 transition-all duration-100 flex flex-col items-center justify-center
                                ${count > 0 ? 'bg-white/20 border-white/50' : 'bg-white/5 border-white/10'}
                                ${result.length >= 3 ? 'opacity-40 grayscale' : 'active:scale-95'}
                            `}
                                    >
                                        {count > 0 && (
                                            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-green-500 border-2 border-white flex items-center justify-center font-black text-xs z-10 shadow-lg">
                                                {count}
                                            </div>
                                        )}
                                        <span className="text-5xl drop-shadow-xl">{animal.emoji}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Bottom Section: Confirm Action - Compacted */}
                        <div className="flex gap-3 w-full mt-auto pt-2 px-2">
                            <button
                                onClick={resetResultInput}
                                className="px-4 py-4 bg-white/10 rounded-xl font-bold uppercase text-white/50 hover:bg-white/20 text-sm"
                            >
                                Reset
                            </button>
                            <button
                                onClick={confirmResult}
                                disabled={result.length !== 3}
                                className={`
                    flex-1 py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-all shadow-xl
                    ${result.length === 3
                                        ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)] transform scale-105'
                                        : 'bg-white/10 text-white/30'}
                  `}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                )}

                {/* --- PHASE 3: WIN SCREEN --- */}
                {gameState === 'WIN' && (
                    <div className="flex flex-col items-center justify-center gap-6 py-6 animate-in zoom-in-50 h-full">

                        {lastWin > 0 ? (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-yellow-400 blur-[80px] opacity-30 animate-pulse" />
                                    <Trophy className="w-24 h-24 text-yellow-400 drop-shadow-[0_0_30px_rgba(234,179,8,0.8)] relative z-10" />
                                </div>

                                <div className="text-center relative z-10">
                                    <h2 className="text-4xl font-black italic text-white mb-2 drop-shadow-md">YOU WON</h2>
                                    <p className="text-6xl font-russo text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                                        ${lastWin}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center opacity-80 py-6">
                                <div className="text-6xl mb-4 grayscale">🥺</div>
                                <h2 className="text-2xl font-bold text-slate-400">Not this time...</h2>
                            </div>
                        )}

                        {/* Breakdown of what happened */}
                        <div className="bg-white/5 backdrop-blur-md p-5 rounded-3xl border border-white/10 w-full shadow-xl">
                            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">The Result</h3>
                            <div className="flex justify-center gap-4 mb-2">
                                {result.map((id, i) => (
                                    <div key={i} className="text-5xl drop-shadow-md animate-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
                                        {ANIMALS.find(a => a.id === id)?.emoji}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={newGame}
                            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-black text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all hover:scale-[1.02] mt-4"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {/* LEDGER DRAWER */}
            <div className="no-print absolute bottom-0 left-0 right-0 bg-[#0F111A] border-t border-white/10 rounded-t-3xl max-h-[40vh] overflow-hidden flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] w-full max-w-sm mx-auto">
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Live Games</h3>
                    <button onClick={handlePrint} className="text-xs bg-white/5 px-2 py-1 rounded hover:bg-white/10">Print Record</button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-4">
                    {/* Active Players */}
                    <div>
                        {activePlayers.map(player => (
                            <div key={player.id} className={`flex items-center justify-between p-2 rounded-lg ${player.id === playerId ? 'bg-white/10 border border-white/20' : 'border-b border-white/5'}`}>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className={`font-bold ${player.id === playerId ? 'text-white' : 'text-white/70'}`}>{player.name} {player.id === playerId && '(You)'}</span>
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
                {showIdentityModal && (
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
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
