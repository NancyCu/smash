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
                        className="absolute -top-1 -right-1 bg-yellow-400 text-black font-black text-xs md:text-sm px-2 py-1 rounded-full border-2 border-white shadow-lg z-20"
                    >
                        ${betAmount}
                    </motion.div>
                )}
            </AnimatePresence>

            <span className="text-6xl md:text-7xl drop-shadow-2xl filter transform transition-transform group-hover:scale-110">{animal.emoji}</span>
            <span className="mt-1 md:mt-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-white/80 text-shadow-sm">{animal.name}</span>
        </motion.button>
    );
};

// 2. Result Icon (Larger for Results Phase)
const ResultIcon = ({
    animal,
    selected,
    onToggle
}: {
    animal: typeof ANIMALS[0],
    selected: boolean,
    onToggle: () => void
}) => {
    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggle}
            className={`
          relative aspect-square rounded-full 
          border-[4px] 
          bg-gradient-to-br ${animal.color} 
          backdrop-blur-md
          flex flex-col items-center justify-center 
          shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
          transition-all duration-200
          ${selected
                    ? 'border-green-400 scale-110 shadow-[0_0_40px_rgba(74,222,128,0.5)] z-10'
                    : 'border-white/10 opacity-60 hover:opacity-100 hover:scale-105'}
        `}
        >
            {/* Selection Badge */}
            {selected && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-20">
                    <Check className="w-5 h-5" strokeWidth={4} />
                </div>
            )}

            <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            <span className="text-6xl md:text-7xl drop-shadow-2xl">{animal.emoji}</span>
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

    //   const toggleResultAnimal = (animalId: string) => {
    //     setResult(prev => {
    //       // Check how many times this animal is already selected
    //       const count = prev.filter(id => id === animalId).length;

    //       // If less than 3 total selected items, we can add
    //       if (prev.length < 3) {
    //          return [...prev, animalId];
    //       }
    //       return prev;
    //     });
    //   };
    // Simplified for speed: Click to toggle On/Off? No, dice can have duplicates.
    // Best speed UI: Just tap 3 times. Tapping adds. 
    // If we want to support duplicates (e.g. 2 Deer), we need to show count.
    // Let's stick to the previous logic but make UI bigger.

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
        <div className="min-h-screen bg-[#0B0C15] pb-32 text-white overflow-x-hidden font-sans select-none selection:bg-transparent">

            {/* HEADER */}
            <div className="p-4 pt-8 flex justify-between items-center bg-black/20 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
                <Link href="/" className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
                    <ChevronLeft className="w-6 h-6" />
                </Link>

                <div className="flex flex-col items-center">
                    <h1 className="font-russo text-2xl tracking-widest text-[#db2777] drop-shadow-[0_0_15px_rgba(219,39,119,0.5)]">
                        BAU CUA
                    </h1>

                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                            <Coins className="w-3.5 h-3.5 text-yellow-500" />
                            <span className="font-mono text-base font-bold text-yellow-400">${balance.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={handleVenmo}
                            className="w-7 h-7 rounded-full bg-[#008CFF] flex items-center justify-center text-white shadow-lg hover:bg-[#0074D4] transition"
                        >
                            <Plus className="w-4 h-4" strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <button onClick={() => { if (confirm("Reset Balance to $1000?")) setBalance(1000) }} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition text-white/50">
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 max-w-lg mx-auto flex flex-col gap-6 mt-2 relative z-10">

                {/* --- PHASE 1: BETTING BOARD --- */}
                {gameState === 'BETTING' && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 px-2">
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

                        {/* CONTROLS */}
                        <div className="flex flex-col gap-4 mt-6 bg-[#151725]/80 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 shadow-2xl">
                            {/* Chip Selector - Simplified */}
                            <div className="flex justify-center items-center gap-6 pb-2">
                                {CHIPS.map(chip => (
                                    <button
                                        key={chip}
                                        onClick={() => setSelectedChip(chip)}
                                        className={`
                        relative w-20 h-20 rounded-full flex flex-col items-center justify-center font-black text-xl border-4 transition-all shadow-xl
                        ${selectedChip === chip
                                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-white text-black scale-110 shadow-[0_0_25px_rgba(234,179,8,0.6)] z-10'
                                                : 'bg-black/60 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/30'}
                      `}
                                    >
                                        <span>${chip}</span>
                                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">CHIP</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={clearBets}
                                    disabled={Object.keys(bets).length === 0}
                                    className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-white/50 uppercase tracking-widest disabled:opacity-30 hover:bg-white/10 transition"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={handleRollClick}
                                    disabled={Object.keys(bets).length === 0}
                                    className={`
                      flex-1 py-4 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all
                      ${Object.keys(bets).length > 0
                                            ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-[length:200%_auto] animate-gradient text-white shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:scale-[1.02]'
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
                    <div className="flex flex-col items-center justify-between min-h-[70vh] animate-in zoom-in py-4">

                        {/* Top Section: Prompt & Slots */}
                        <div className="w-full flex flex-col items-center gap-6">
                            <h2 className="text-2xl font-bold text-center text-cyan-400 drop-shadow-lg uppercase tracking-widest">
                                Tap Result (3)
                            </h2>

                            {/* The 3 Result Slots */}
                            <div className="flex gap-4 mb-4">
                                {[0, 1, 2].map(i => {
                                    const animalId = result[i];
                                    const animal = ANIMALS.find(a => a.id === animalId);
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => removeResultItem(i)}
                                            className={`
                                    w-24 h-24 rounded-2xl border-2 flex items-center justify-center text-5xl shadow-inner backdrop-blur-sm transition-all
                                    ${animal ? 'bg-gradient-to-br from-white/20 to-white/5 border-white/40' : 'bg-black/40 border-dashed border-white/10'}
                                `}
                                        >
                                            {animal ? animal.emoji : <span className="opacity-10 text-sm">?</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Center Section: BIG INPUT GRID */}
                        <div className="grid grid-cols-3 gap-4 w-full px-2">
                            {ANIMALS.map((animal) => {
                                // Check count of this animal in results
                                const count = result.filter(r => r === animal.id).length;
                                return (
                                    <button
                                        key={animal.id}
                                        onClick={() => addResultItem(animal.id)}
                                        disabled={result.length >= 3}
                                        className={`
                                relative aspect-square rounded-2xl border-2 transition-all duration-100 flex flex-col items-center justify-center
                                ${count > 0 ? 'bg-white/20 border-white/50' : 'bg-white/5 border-white/10'}
                                ${result.length >= 3 ? 'opacity-40 grayscale' : 'active:scale-95'}
                            `}
                                    >
                                        {/* Count Badge */}
                                        {count > 0 && (
                                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center font-black text-sm z-10 shadow-lg">
                                                {count}
                                            </div>
                                        )}
                                        <span className="text-6xl drop-shadow-xl">{animal.emoji}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Bottom Section: Confirm Action */}
                        <div className="flex gap-4 w-full mt-auto pt-6">
                            <button
                                onClick={resetResultInput}
                                className="px-6 py-5 bg-white/10 rounded-2xl font-bold uppercase text-white/50 hover:bg-white/20"
                            >
                                Reset
                            </button>
                            <button
                                onClick={confirmResult}
                                disabled={result.length !== 3}
                                className={`
                    flex-1 py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all shadow-xl
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
                    <div className="flex flex-col items-center justify-center gap-8 py-10 animate-in zoom-in-50 min-h-[60vh]">

                        {lastWin > 0 ? (
                            <>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-yellow-400 blur-[80px] opacity-30 animate-pulse" />
                                    <Trophy className="w-32 h-32 text-yellow-400 drop-shadow-[0_0_30px_rgba(234,179,8,0.8)] relative z-10" />
                                </div>

                                <div className="text-center relative z-10">
                                    <h2 className="text-5xl font-black italic text-white mb-2 drop-shadow-md">YOU WON</h2>
                                    <p className="text-8xl font-russo text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                                        ${lastWin}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center opacity-80 py-10">
                                <div className="text-8xl mb-6 grayscale">🥺</div>
                                <h2 className="text-4xl font-bold text-slate-400">Not this time...</h2>
                            </div>
                        )}

                        {/* Breakdown of what happened */}
                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 w-full shadow-xl">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">The Result</h3>
                            <div className="flex justify-center gap-4 mb-2">
                                {result.map((id, i) => (
                                    <div key={i} className="text-6xl drop-shadow-md animate-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 100}ms` }}>
                                        {ANIMALS.find(a => a.id === id)?.emoji}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={newGame}
                            className="w-full py-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl font-black text-xl uppercase tracking-widest shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all hover:scale-[1.02] mt-8"
                        >
                            Play Again
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
