import React from 'react';
import { cn } from "@/lib/utils";

interface SquareDetailsProps {
    cell: { row: number; col: number } | null;
    squares: Record<string, any[]>;
    settings: {
        rows: number[];
        cols: number[];
        teamA: string;
        teamB: string;
        isScrambled: boolean;
    };
}

export default function SquareDetails({ cell, squares, settings }: SquareDetailsProps) {
    if (!cell) return null;

    const key = `${cell.row}-${cell.col}`;
    const claims = squares[key] || [];
    const rowDigit = settings.rows[cell.row];
    const colDigit = settings.cols[cell.col];

    return (
        <div className="shrink-0 w-full bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md p-3 border-t border-slate-200 dark:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Square Details
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30">
                        {settings.teamA}: {settings.isScrambled ? rowDigit : "TBD"}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                        {settings.teamB}: {settings.isScrambled ? colDigit : "TBD"}
                    </span>
                </div>
            </div>

            {claims.length === 0 ? (
                <div className="text-xs text-slate-400 italic text-center py-1">
                    Empty Square
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                    {claims.map(c => (
                        <div key={c.uid} className="flex items-center gap-1.5 bg-white dark:bg-slate-900/50 px-2 py-1.5 rounded border border-slate-200 dark:border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            <span className="text-[10px] font-bold truncate text-slate-700 dark:text-slate-200" title={c.name}>
                                {c.name}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
