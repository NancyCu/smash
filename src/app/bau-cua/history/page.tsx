"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Printer, Calendar, Clock, Trophy } from 'lucide-react';
import { subscribeToHistory, type Player } from '@/lib/bau-cua-service';

interface HistoryItem {
    id: string;
    timestamp: any;
    result: string[]; // ['deer', 'fish', 'crab']
    hostName: string;
    playersSnapshot: {
        name: string;
        balance: number;
        wins: number;
        losses: number;
    }[];
}

const ANIMALS = [
    { id: 'deer', name: 'Nai', emoji: '🦌' },
    { id: 'gourd', name: 'Bầu', emoji: '🍐' },
    { id: 'chicken', name: 'Gà', emoji: '🐓' },
    { id: 'fish', name: 'Cá', emoji: '🐟' },
    { id: 'crab', name: 'Cua', emoji: '🦀' },
    { id: 'shrimp', name: 'Tôm', emoji: '🦐' },
];

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedGame, setSelectedGame] = useState<HistoryItem | null>(null);

    useEffect(() => {
        const unsub = subscribeToHistory(setHistory as any);
        return () => unsub();
    }, []);

    const handlePrint = (game: HistoryItem) => {
        setSelectedGame(game);
        // Wait for state update then print
        setTimeout(() => {
            window.print();
        }, 100);
    };

    return (
        <div className="min-h-screen bg-[#0B0C15] text-white font-sans p-4 md:p-8">
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white; color: black; }
                    @page { margin: 0.5cm; }
                }
                .print-only { display: none; }
            `}</style>

            {/* HEADER */}
            <div className="no-print max-w-4xl mx-auto flex items-center justify-between mb-8">
                <Link href="/bau-cua" className="flex items-center gap-2 text-white/50 hover:text-white transition">
                    <ChevronLeft size={20} />
                    <span>Back to Game</span>
                </Link>
                <h1 className="font-russo text-2xl tracking-widest text-[#db2777]">GAME HISTORY</h1>
                <div className="w-8" /> {/* Spacer */}
            </div>

            {/* LIST */}
            <div className="no-print max-w-4xl mx-auto space-y-4">
                {history.map((game) => (
                    <div key={game.id} className="bg-[#151725] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 hover:border-white/10 transition shadow-lg">
                        {/* Time & Host */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center gap-2 text-white/40 text-sm mb-1 justify-center md:justify-start">
                                <Calendar size={14} />
                                <span>
                                    {game.timestamp?.seconds
                                        ? new Date(game.timestamp.seconds * 1000).toLocaleDateString()
                                        : 'Just now'}
                                </span>
                                <Clock size={14} className="ml-2" />
                                <span>
                                    {game.timestamp?.seconds
                                        ? new Date(game.timestamp.seconds * 1000).toLocaleTimeString()
                                        : ''}
                                </span>
                            </div>
                            <div className="font-bold text-lg">Host: <span className="text-yellow-400">{game.hostName}</span></div>
                        </div>

                        {/* Result */}
                        <div className="flex gap-2">
                            {game.result.map((animalId, i) => (
                                <div key={i} className="text-4xl bg-black/30 p-2 rounded-xl border border-white/5">
                                    {ANIMALS.find(a => a.id === animalId)?.emoji}
                                </div>
                            ))}
                        </div>

                        {/* Action */}
                        <div className="w-full md:w-auto">
                            <button
                                onClick={() => handlePrint(game)}
                                className="w-full md:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold flex items-center justify-center gap-2 transition border border-white/10"
                            >
                                <Printer size={18} />
                                <span>Print Record</span>
                            </button>
                        </div>
                    </div>
                ))}

                {history.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <Trophy className="w-16 h-16 mx-auto mb-4 text-white/20" />
                        <p>No games recorded yet.</p>
                    </div>
                )}
            </div>

            {/* PRINT TEMPLATE (Hidden until print) */}
            {selectedGame && (
                <div className="print-only p-4 text-black bg-white max-w-2xl mx-auto">
                    {/* --- COPY 1 --- */}
                    <div className="border-b-2 border-dashed border-gray-400 pb-8 mb-8">
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-black uppercase tracking-widest mb-2">Bau Cua Result</h1>
                            <p className="font-mono text-sm text-gray-500">
                                {selectedGame.timestamp?.seconds
                                    ? new Date(selectedGame.timestamp.seconds * 1000).toLocaleString()
                                    : 'Just Now'}
                            </p>
                            <div className="mt-4 flex justify-center gap-4 text-4xl border border-black inline-flex p-4 rounded-xl">
                                {selectedGame.result.map((id, i) => (
                                    <span key={i}>{ANIMALS.find(a => a.id === id)?.emoji}</span>
                                ))}
                            </div>
                            <p className="mt-2 font-bold">Host: {selectedGame.hostName}</p>
                        </div>

                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="text-left py-1">Player</th>
                                    <th className="text-right py-1">Balance</th>
                                    <th className="text-right py-1">W/L Record</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedGame.playersSnapshot.map((p, i) => (
                                    <tr key={i} className="border-b border-gray-200">
                                        <td className="py-2 font-bold">{p.name}</td>
                                        <td className="py-2 text-right font-mono">${p.balance.toLocaleString()}</td>
                                        <td className="py-2 text-right">
                                            {p.wins}W - {p.losses}L
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* --- COPY 2 (Duplicate) --- */}
                    <div>
                        <div className="text-center mb-6">
                            <h1 className="text-xl font-black uppercase tracking-widest mb-2">Bau Cua Result (Copy)</h1>
                            <p className="font-mono text-xs text-gray-500">
                                {selectedGame.timestamp?.seconds
                                    ? new Date(selectedGame.timestamp.seconds * 1000).toLocaleString()
                                    : 'Just Now'}
                            </p>
                            <div className="mt-2 flex justify-center gap-2 text-2xl border border-black inline-flex p-2 rounded-lg">
                                {selectedGame.result.map((id, i) => (
                                    <span key={i}>{ANIMALS.find(a => a.id === id)?.emoji}</span>
                                ))}
                            </div>
                            <p className="mt-1 font-bold text-sm">Host: {selectedGame.hostName}</p>
                        </div>

                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-black">
                                    <th className="text-left py-1">Player</th>
                                    <th className="text-right py-1">Balance</th>
                                    <th className="text-right py-1">W/L Record</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedGame.playersSnapshot.map((p, i) => (
                                    <tr key={i} className="border-b border-gray-200">
                                        <td className="py-1 font-bold">{p.name}</td>
                                        <td className="py-1 text-right font-mono">${p.balance.toLocaleString()}</td>
                                        <td className="py-1 text-right">
                                            {p.wins}W - {p.losses}L
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
