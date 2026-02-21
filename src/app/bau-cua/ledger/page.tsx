"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ArrowUpRight, ArrowDownLeft, Wallet, History as HistoryIcon } from 'lucide-react';
import { subscribeToTransactions, subscribeToHistory, type Transaction } from '@/lib/bau-cua-service';

export default function LedgerPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [history, setHistory] = useState<any[]>([]);


    useEffect(() => {
        const unsubTx = subscribeToTransactions(setTransactions);
        const unsubHist = subscribeToHistory(setHistory);
        return () => {
            unsubTx();
            unsubHist();
        };
    }, []);

    // Group by Session ID (or "Unknown Session" if missing)
    const groupedTransactions = useMemo(() => {
        const groups: Record<string, Transaction[]> = {};

        transactions.forEach(tx => {
            const key = tx.sessionId || 'Earlier Sessions';
            if (!groups[key]) groups[key] = [];
            groups[key].push(tx);
        });

        // Sort keys to put recent sessions first? 
        // Session IDs are "history_TIMESTAMP_RANDOM".
        // formatting: "history_" + Date.now() ...
        return Object.entries(groups).sort((a, b) => {
            if (a[0] === 'Earlier Sessions') return 1; // Put older/unknown at bottom
            if (b[0] === 'Earlier Sessions') return -1;
            return b[0].localeCompare(a[0]); // Descending timestamp string comparison works for this format
        });
    }, [transactions]);

    const formatTime = (ts: any) => {
        if (!ts?.seconds) return 'Just now';
        return new Date(ts.seconds * 1000).toLocaleString();
    };

    return (
        <div className="min-h-screen bg-[#0B0C15] text-white font-sans p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* HEADER */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/bau-cua" className="flex items-center gap-2 text-white/50 hover:text-white transition group">
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Game</span>
                    </Link>
                    <h1 className="font-russo text-2xl md:text-3xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        TRANSACTION LEDGER
                    </h1>
                    <div className="w-8" />
                </div>

                {/* LEDGER GROUPS */}
                <div className="space-y-8">
                    {/* LATEST GAME FINAL BALANCES */}
                    {history.length > 0 && history[0].playersSnapshot && (
                        <div className="bg-[#151725] border border-white/5 rounded-3xl overflow-hidden shadow-2xl mb-8">
                            <div className="bg-white/5 p-4 md:p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Wallet className="text-green-400" />
                                    <div>
                                        <h2 className="font-bold text-lg text-white/90">
                                            Final Balances (Last Game)
                                        </h2>
                                        <p className="text-xs text-white/30 font-mono">
                                            {formatTime(history[0].timestamp)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-xs font-bold px-3 py-1 bg-white/10 rounded-full text-white/50">
                                    {history[0].playersSnapshot.length} Players
                                </div>
                            </div>

                            <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {history[0].playersSnapshot.map((player: any, idx: number) => (
                                    <div key={idx} className="bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-2">
                                            <span className="font-bold text-white/80">{player.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <span className="font-bold text-white/90 text-sm truncate w-full text-center">{player.name}</span>
                                        <span className="text-green-400 font-mono font-black mt-1 text-lg">${player.balance}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {groupedTransactions.map(([sessionId, txs]) => (
                        <div key={sessionId} className="bg-[#151725] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                            {/* Session Header */}
                            <div className="bg-white/5 p-4 md:p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <HistoryIcon className="text-purple-400" />
                                    <div>
                                        <h2 className="font-bold text-lg text-white/90">
                                            {sessionId === 'Earlier Sessions' ? 'Legacy / Mixed Sessions' : `Session: ${sessionId.replace('history_', '').split('_')[0]}`}
                                        </h2>
                                        {sessionId !== 'Earlier Sessions' && (
                                            <p className="text-xs text-white/30 font-mono">{sessionId}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs font-bold px-3 py-1 bg-white/10 rounded-full text-white/50">
                                    {txs.length} Transactions
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#0f111a] text-white/40 uppercase text-xs tracking-wider">
                                        <tr>
                                            <th className="p-4 font-normal">Time</th>
                                            <th className="p-4 font-normal">Player</th>
                                            <th className="p-4 font-normal">Action</th>
                                            <th className="p-4 font-normal text-right">Amount</th>
                                            <th className="p-4 font-normal text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {txs.map((tx) => (
                                            <tr key={tx.id || Math.random()} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 text-white/40 font-mono text-xs whitespace-nowrap">
                                                    {formatTime(tx.timestamp)}
                                                </td>
                                                <td className="p-4 font-bold text-white/80">
                                                    {tx.playerName}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        {tx.type === 'WIN' && <ArrowDownLeft size={14} className="text-green-500" />}
                                                        {(tx.type === 'BET' || tx.type === 'LOSS') && <ArrowUpRight size={14} className="text-red-500" />}
                                                        <span className={`
                                                            font-bold text-xs px-2 py-0.5 rounded
                                                            ${tx.type === 'WIN' ? 'bg-green-500/10 text-green-400' : ''}
                                                            ${tx.type === 'LOSS' ? 'bg-red-500/10 text-red-400' : ''}
                                                            ${tx.type === 'BET' ? 'bg-orange-500/10 text-orange-400' : ''}
                                                            ${tx.type === 'DEPOSIT' ? 'bg-blue-500/10 text-blue-400' : ''}
                                                        `}>
                                                            {tx.type}
                                                        </span>
                                                        <span className="text-white/40 text-xs hidden md:inline-block ml-2 truncate max-w-[150px]">
                                                            {tx.description}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={`p-4 text-right font-mono font-bold ${tx.type === 'WIN' || tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    {tx.type === 'WIN' || tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount}
                                                </td>
                                                <td className="p-4 text-right font-mono text-white/60">
                                                    {tx.newBalance !== undefined ? `$${tx.newBalance}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {transactions.length === 0 && (
                        <div className="text-center py-20 opacity-50">
                            <Wallet className="w-16 h-16 mx-auto mb-4 text-white/20" />
                            <p>No transactions found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
