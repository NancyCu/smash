"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw, Coins, Trophy, Info, Plus, Check } from 'lucide-react';
import Link from 'next/link';

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
                        // Compacted badge size and position
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
    const [balance, setBalance] = useState(1000);
    const [bets, setBets] = useState<Record<string, number>>({});
    const [selectedChip, setSelectedChip] = useState(5);
    const [gameState, setGameState] = useState<'BETTING' | 'RESULT' | 'WIN'>('BETTING');
    const [result, setResult] = useState<string[]>([]); // Array of 3 animal IDs
    const [lastWin, setLastWin] = useState(0);

    // Load Balance on Mount
    useEffect(() => {
        const stored = localStorage.getItem('bauCuaBalance');
        if (stored) setBalance(parseInt(stored));
    }, []);

    // Save Balance on Change
    useEffect(() => {
        localStorage.setItem('bauCuaBalance', balance.toString());
    }, [balance]);

    // --- ACTIONS ---

    const handleVenmo = () => {
        const txnType = 'pay';
        const note = 'Bau Cua Reload';
        const webUrl = `https://venmo.com/${VENMO_USERNAME}?txn=${txnType}&note=${encodeURIComponent(note)}`;
        window.open(webUrl, '_blank');
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

    const confirmResult = () => {
        if (result.length !== 3) return;

        let totalWinnings = 0;
        let totalBetReturn = 0;

        Object.entries(bets).forEach(([animalId, betAmount]) => {
            const matches = result.filter(r => r === animalId).length;
            if (matches > 0) {
                totalBetReturn += betAmount;
                totalWinnings += betAmount * matches;
            }
        });

        const payout = totalBetReturn + totalWinnings;
        setBalance(prev => prev + payout);
        setLastWin(totalWinnings);
        setGameState('WIN');
    };

    const newGame = () => {
        setBets({});
        setResult([]);
        setLastWin(0);
        setGameState('BETTING');
    };

    // --- RENDER ---
    return (
        <div className="min-h-[100dvh] bg-[#0B0C15] pb-24 text-white overflow-hidden font-sans select-none selection:bg-transparent flex flex-col">

            {/* HEADER - COMPACTED */}
            <div className="px-3 pt-3 pb-2 flex justify-between items-center bg-black/20 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30 shrink-0">
                <Link href="/" className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition">
                    <ChevronLeft className="w-5 h-5" />
                </Link>

                <div className="flex flex-col items-center">
                    {/* Smaller Title */}
                    <h1 className="font-russo text-lg tracking-widest text-[#db2777] drop-shadow-[0_0_10px_rgba(219,39,119,0.5)]">
                        BAU CUA
                    </h1>

                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10">
                            <Coins className="w-3 h-3 text-yellow-500" />
                            <span className="font-mono text-sm font-bold text-yellow-400">${balance.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={handleVenmo}
                            className="w-5 h-5 rounded-full bg-[#008CFF] flex items-center justify-center text-white shadow-lg hover:bg-[#0074D4] transition"
                        >
                            <Plus className="w-3 h-3" strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <button onClick={() => { if (confirm("Reset Balance to $1000?")) setBalance(1000) }} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition text-white/50">
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 p-2 max-w-sm mx-auto flex flex-col justify-center gap-2 relative z-10 w-full">

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

                        {/* CONTROLS - Compacted padding/sizing */}
                        <div className="flex flex-col gap-2 mt-1 bg-[#151725]/80 backdrop-blur-xl p-3 rounded-[1.5rem] border border-white/10 shadow-2xl shrink-0">
                            {/* Chip Selector */}
                            <div className="flex justify-center items-center gap-6">
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
                                        {selectedChip === chip && <span className="text-[8px] font-bold opacity-60 uppercase tracking-wider -mt-1">CHIP</span>}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2 mt-1 h-12">
                                <button
                                    onClick={clearBets}
                                    disabled={Object.keys(bets).length === 0}
                                    className="px-4 h-full rounded-xl bg-white/5 border border-white/10 font-bold text-white/50 uppercase text-xs tracking-widest disabled:opacity-30 hover:bg-white/10 transition"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={handleRollClick}
                                    disabled={Object.keys(bets).length === 0}
                                    className={`
                      flex-1 h-full rounded-xl font-black text-lg uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all
                      ${Object.keys(bets).length > 0
                                            ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-[length:200%_auto] animate-gradient text-white shadow-[0_0_25px_rgba(236,72,153,0.5)] hover:scale-[1.02]'
                                            : 'bg-white/10 text-white/30 cursor-not-allowed'}
                    `}
                                >
                                    ROLL DICE
                                </button>
                            </div>
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
        </div>
    );
}
