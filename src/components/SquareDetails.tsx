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
        <div className="shrink-0 w-full bg-white/10 backdrop-blur-xl p-3 border-t border-white/20 transition-all shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-xs uppercase text-white/50 tracking-wider">
                    Square Details
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-pink-500/10 text-pink-200 border border-pink-500/20 shadow-[0_0_8px_rgba(236,72,153,0.1)]">
                        {settings.teamA}: {settings.isScrambled ? rowDigit : "TBD"}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-200 border border-cyan-500/20 shadow-[0_0_8px_rgba(34,211,238,0.1)]">
                        {settings.teamB}: {settings.isScrambled ? colDigit : "TBD"}
                    </span>
                </div>
            </div>

            {claims.length === 0 ? (
                <div className="text-xs text-white/30 italic text-center py-1">
                    Empty Square
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 max-h-32 overflow-y-auto pr-1">
                    {claims.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-white/5 px-2 py-1.5 rounded border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 shadow-[0_0_4px_#818cf8]" />
                            <span className="text-[10px] font-bold truncate text-white/90" title={c.name}>
                                {c.name}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
