"use client";

import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGame } from '@/context/GameContext';
import type { SquareData } from '@/context/GameContext';
import { useEspnScores } from '@/hooks/useEspnScores';
import { ArrowLeft, Trophy, Crown } from 'lucide-react';
import Image from 'next/image';

function WinnersContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const { game } = useGame();
  const { games: liveGames } = useEspnScores();
  
  // --- SCORES ---
  const currentScores = useMemo(() => {
    const base = { q1: { home: 0, away: 0 }, q2: { home: 0, away: 0 }, q3: { home: 0, away: 0 }, final: { home: 0, away: 0 }, teamA: 0, teamB: 0 };
    if (!game) return base;

    if (game.espnGameId) {
        const matched = liveGames.find(g => g.id === game.espnGameId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const safeGame = matched as any; 
        if (safeGame && safeGame.competitors) {
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
            const targetA = normalize(game.teamA);
            const targetB = normalize(game.teamB);
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let compA = safeGame.competitors.find((c: any) => { const n = normalize(c.team.name); return n.includes(targetA) || targetA.includes(n); });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let compB = safeGame.competitors.find((c: any) => { const n = normalize(c.team.name); return n.includes(targetB) || targetB.includes(n); });
            
            if (!compA && compB) compA = safeGame.competitors.find((c: any) => c.id !== compB.id);
            if (!compB && compA) compB = safeGame.competitors.find((c: any) => c.id !== compA.id);
            if (!compA && !compB) { compA = safeGame.competitors[0]; compB = safeGame.competitors[1]; }
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getScore = (c: any, i: number) => c?.linescores?.[i]?.value ? Number(c.linescores[i].value) : 0;
            
            return {
                q1: { home: getScore(compA, 0), away: getScore(compB, 0) },
                q2: { home: getScore(compA, 1), away: getScore(compB, 1) },
                q3: { home: getScore(compA, 2), away: getScore(compB, 2) },
                final: { home: Number(compA?.score||0), away: Number(compB?.score||0) },
                teamA: Number(compA?.score||0), teamB: Number(compB?.score||0)
            };
        }
    }
    return { ...base, final: { home: game.scores?.teamA || 0, away: game.scores?.teamB || 0 }, teamA: game.scores?.teamA || 0, teamB: game.scores?.teamB || 0 };
  }, [game, liveGames]);

  // --- STANDARD PAYOUT CALCULATOR (NO ROLLOVER) ---
  const calculatePayouts = useMemo(() => {
      if (!game) return { q1: 0, q2: 0, q3: 0, final: 0 };
      const pot = game.pot || (Object.keys(game.squares).length * game.price);
      
      const q1 = Math.floor(pot * 0.10);
      const q2 = Math.floor(pot * 0.20);
      const q3 = Math.floor(pot * 0.20);
      const final = pot - (q1 + q2 + q3);
      
      return { q1, q2, q3, final };
  }, [game]);

  // --- CALCULATE WINNERS ---
  const getWinnerForQuarter = (q: 'q1'|'q2'|'q3'|'final') => {
      if (!game?.isScrambled || !game.axis) return null;

      let scoreA = 0; 
      let scoreB = 0;

      if (q === 'q1') { scoreA = currentScores.q1.home; scoreB = currentScores.q1.away; }
      else if (q === 'q2') { scoreA = currentScores.q1.home + currentScores.q2.home; scoreB = currentScores.q1.away + currentScores.q2.away; }
      else if (q === 'q3') { scoreA = currentScores.q1.home + currentScores.q2.home + currentScores.q3.home; scoreB = currentScores.q1.away + currentScores.q2.away + currentScores.q3.away; }
      else { scoreA = currentScores.final.home; scoreB = currentScores.final.away; }

      const lastDigitA = scoreA % 10;
      const lastDigitB = scoreB % 10;

      const axis = game.axis[q] || { row: [0,1,2,3,4,5,6,7,8,9], col: [0,1,2,3,4,5,6,7,8,9] };
      const rowIdx = axis.row.indexOf(lastDigitA);
      const colIdx = axis.col.indexOf(lastDigitB);

      if (rowIdx === -1 || colIdx === -1) return null;

      const cellIndex = rowIdx * 10 + colIdx;
      const cellData = game.squares[cellIndex];
      
      let winners: SquareData[] = [];
      
      if (Array.isArray(cellData)) {
          winners = cellData as SquareData[];
      } else if (cellData) {
          winners = [cellData as SquareData];
      }

      return {
          quarter: q,
          scoreA,
          scoreB,
          rowDigit: lastDigitA,
          colDigit: lastDigitB,
          winners: winners.length > 0 ? winners : null
      };
  };

  if (!game) return <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center text-white">Loading...</div>;

  const quarters = ['q1', 'q2', 'q3', 'final'] as const;
  const results = quarters.map(q => getWinnerForQuarter(q));

  return (
    <div className="max-w-4xl mx-auto relative z-10 pb-20">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
            <div onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white cursor-pointer transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-bold uppercase text-xs tracking-widest">Back</span>
            </div>
            <div className="flex items-center gap-2">
                <Image src="/SouperBowlDark.png" alt="Logo" width={32} height={32} className="rounded-lg border border-white/10" />
                <span className="text-white font-black uppercase tracking-wider">Winners Circle</span>
            </div>
        </div>

        {/* MAIN WINNERS DISPLAY */}
        <div className="grid gap-6">
            {results.map((res, i) => {
                if (!res) return null;
                const labels = { q1: "1st Quarter", q2: "Halftime", q3: "3rd Quarter", final: "Final Score" };
                const amount = calculatePayouts[res.quarter];
                const isFinal = res.quarter === 'final';

                return (
                    <div key={res.quarter} className={`relative overflow-hidden rounded-2xl border ${isFinal ? "border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-black" : "border-white/10 bg-[#151725]"} p-6 shadow-xl`}>
                        {isFinal && <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/20 blur-xl rounded-full" />}
                        
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                            
                            {/* QUARTER INFO */}
                            <div className="flex flex-col items-center md:items-start min-w-[150px]">
                                <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${isFinal ? "text-yellow-400" : "text-slate-500"}`}>{labels[res.quarter]}</span>
                                <div className="flex items-center gap-3 text-2xl font-black text-white">
                                    <span>{res.scoreA}</span>
                                    <span className="text-slate-600 text-sm">-</span>
                                    <span>{res.scoreB}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-1">
                                    Digits: {res.rowDigit} - {res.colDigit}
                                </div>
                            </div>

                            {/* PRIZE */}
                            <div className="flex flex-col items-center">
                                <div className={`p-3 rounded-full mb-2 ${isFinal ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/50" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"}`}>
                                    {isFinal ? <Crown className="w-6 h-6" /> : <Trophy className="w-5 h-5" />}
                                </div>
                                <span className={`text-xl font-black ${isFinal ? "text-yellow-400" : "text-white"}`}>${amount}</span>
                            </div>

                            {/* WINNER(S) */}
                            <div className="flex-1 flex flex-col items-center md:items-end">
                                {res.winners ? (
                                    <div className="flex flex-col gap-2 items-center md:items-end">
                                        {res.winners.map((w, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white">
                                                    {w.displayName?.[0]}
                                                </div>
                                                <span className="font-bold text-white">{w.displayName}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-4 py-2 rounded-xl bg-white/5 border border-dashed border-white/10 text-slate-500 text-sm italic">
                                        Unclaimed Square
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                );
            })}
        </div>

    </div>
  );
}

// --- 2. The Main Page (Wrapper) ---
export default function WinnersPage() {
  return (
    <main className="min-h-screen bg-[#0B0C15] p-4 lg:p-8 relative overflow-hidden">
        {/* Background Ambience */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]" />
        </div>

        <Suspense fallback={<div className="text-white text-center pt-20">Loading Winners...</div>}>
            <WinnersContent />
        </Suspense>
    </main>
  );
}