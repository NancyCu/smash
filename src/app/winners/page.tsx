"use client";

import { getUserColor } from "@/utils/colors";
import React, { useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import type { SquareData } from "@/context/GameContext";
import { useEspnScores } from "@/hooks/useEspnScores";
import { ArrowLeft, Trophy, Crown, ArrowDown, Ban } from "lucide-react";
import Image from "next/image";

function WinnersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { game, setGameId } = useGame();
  const { games: liveGames } = useEspnScores();

  // --- 0. HYDRATION ---
  // Ensure we have the game data loaded if refreshing this page
  React.useEffect(() => {
    const id = searchParams.get("id");
    if (id && (!game || game.id !== id)) {
        setGameId(id);
    }
  }, [searchParams, game, setGameId]);

  // --- 1. SCORES ENGINE ---
  const currentScores = useMemo(() => {
    const base = {
      q1: { home: 0, away: 0 },
      q2: { home: 0, away: 0 },
      q3: { home: 0, away: 0 },
      final: { home: 0, away: 0 },
      teamA: 0,
      teamB: 0,
    };
    if (!game) return base;

    if (game.espnGameId) {
      const matched = liveGames.find((g) => g.id === game.espnGameId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safeGame = matched as any;
      if (safeGame && safeGame.competitors) {
        const normalize = (s: string) =>
          s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const targetA = normalize(game.teamA);
        const targetB = normalize(game.teamB);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let compA = safeGame.competitors.find((c: any) => {
          const n = normalize(c.team.name);
          return n.includes(targetA) || targetA.includes(n);
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let compB = safeGame.competitors.find((c: any) => {
          const n = normalize(c.team.name);
          return n.includes(targetB) || targetB.includes(n);
        });
        if (!compA && compB)
          compA = safeGame.competitors.find((c: any) => c.id !== compB.id);
        if (!compB && compA)
          compB = safeGame.competitors.find((c: any) => c.id !== compA.id);
        if (!compA && !compB) {
          compA = safeGame.competitors[0];
          compB = safeGame.competitors[1];
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getScore = (c: any, i: number) =>
          c?.linescores?.[i]?.value ? Number(c.linescores[i].value) : 0;
        return {
          q1: { home: getScore(compA, 0), away: getScore(compB, 0) },
          q2: { home: getScore(compA, 1), away: getScore(compB, 1) },
          q3: { home: getScore(compA, 2), away: getScore(compB, 2) },
          final: {
            home: Number(compA?.score || 0),
            away: Number(compB?.score || 0),
          },
          teamA: Number(compA?.score || 0),
          teamB: Number(compB?.score || 0),
        };
      }
    }
    return {
      ...base,
      final: { home: game.scores?.teamA || 0, away: game.scores?.teamB || 0 },
      teamA: game.scores?.teamA || 0,
      teamB: game.scores?.teamB || 0,
    };
  }, [game, liveGames]);

  // --- 2. WINNER FINDER HELPER ---
  const getWinnerForQuarter = (q: "q1" | "q2" | "q3" | "final") => {
    const defaultAxis = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Safely derive axis; fall back to defaults if missing
    const axisConfig = (game?.isScrambled && game?.axis?.[q]) || { row: defaultAxis, col: defaultAxis };
    const axisRow = Array.isArray(axisConfig.row) ? axisConfig.row : defaultAxis;
    const axisCol = Array.isArray(axisConfig.col) ? axisConfig.col : defaultAxis;

    let scoreA = 0,
      scoreB = 0;
    if (q === "q1") {
      scoreA = currentScores.q1.home;
      scoreB = currentScores.q1.away;
    } else if (q === "q2") {
      scoreA = currentScores.q1.home + currentScores.q2.home;
      scoreB = currentScores.q1.away + currentScores.q2.away;
    } else if (q === "q3") {
      scoreA =
        currentScores.q1.home + currentScores.q2.home + currentScores.q3.home;
      scoreB =
        currentScores.q1.away + currentScores.q2.away + currentScores.q3.away;
    } else {
      scoreA = currentScores.final.home;
      scoreB = currentScores.final.away;
    }

    const lastDigitA = scoreA % 10;
    const lastDigitB = scoreB % 10;

  const rowIdx = axisRow.indexOf(lastDigitA);
  const colIdx = axisCol.indexOf(lastDigitB);

    if (rowIdx === -1 || colIdx === -1) return null;

    const cellIndex = rowIdx * 10 + colIdx;
  const cellData = game?.squares ? game.squares[cellIndex] : undefined;

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
      winners: winners.length > 0 ? winners : null,
    };
  };

  // --- 3. ROBUST ROLLOVER LOGIC (Matches Page.tsx) ---
// --- 3. ROBUST ROLLOVER LOGIC ---
  const rolloverResults = useMemo(() => {
    if (!game) return [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchedGame = liveGames.find(g => g.id === game.espnGameId) as any;
    
    // SAFEGUARDS: If data isn't loaded yet, default to reasonable fallbacks
    const status = matchedGame?.status;
    const p = status?.period || 0;
    
    // AGGRESSIVE FINAL CHECK: Check multiple flags to ensure we catch the end of the game
    const isFinal = status?.type?.completed || 
                    status?.type?.state === 'post' || 
                    status?.type?.description === 'Final' ||
                    status?.type?.shortDetail?.toLowerCase().includes('final');

    const isHalf = status?.type?.name === "STATUS_HALFTIME" || 
                   status?.type?.shortDetail === "Halftime" ||
                   p === 2 && status?.clock === 0.0; // Clock hitting 0 in Q2 is halftime

    const pot = game.pot || (Object.keys(game.squares).length * game.price);
    
    const basePayouts = {
      q1: pot * 0.10,
      q2: pot * 0.20,
      q3: pot * 0.20,
      final: pot * 0.50
    };

    let currentRollover = 0;
    const results: any[] = [];

    // --- Process Q1, Q2, Q3, FINAL in sequence ---
    // If isFinal is true, EVERYTHING is done.
    const stages = [
      { key: 'q1', label: "1st Quarter", done: p > 1 || isHalf || isFinal },
      { key: 'q2', label: "Halftime", done: p > 2 || isFinal || (p === 2 && isHalf) },
      { key: 'q3', label: "3rd Quarter", done: p > 3 || isFinal },
      { key: 'final', label: "Final Score", done: isFinal }
    ];

    stages.forEach((stage) => {
      const result = getWinnerForQuarter(stage.key as any);
      const hasWinner = result && result.winners !== null;
      
      // Calculate what this quarter SHOULD pay out (Base + whatever rolled over)
      let displayAmount = basePayouts[stage.key as keyof typeof basePayouts] + currentRollover;
      let rolloverActive = false;

      // Logic: If stage is done and NO WINNER, move money to next bucket
      if (stage.done && !hasWinner) {
        if (stage.key !== 'final') {
          currentRollover = displayAmount;
          displayAmount = 0;
          rolloverActive = true;
        }
      } else if (stage.done && hasWinner) {
        currentRollover = 0; // Reset snowball
      }

      results.push({
        quarter: stage.key,
        scoreA: result?.scoreA ?? 0,
        scoreB: result?.scoreB ?? 0,
        rowDigit: result?.rowDigit ?? null,
        colDigit: result?.colDigit ?? null,
        winners: result?.winners ?? null,
        key: stage.key,
        label: stage.label,
        finalPayout: displayAmount,
        isRollover: rolloverActive,
        hasWinner: hasWinner,
        isFinished: stage.done,
      });
    });

    return results;
  }, [game, currentScores, liveGames]);

  if (!game)
    return (
      <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto relative z-10 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div
          onClick={() => game ? router.push(`/game/${game.id}`) : router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold uppercase text-xs tracking-widest">
            Back to Game
          </span>
        </div>
        <div className="flex items-center gap-2">
          <img
            src="/image_9.png"
            alt="Souper Bowl LX Logo"
            className="h-10 w-auto object-contain rounded-lg"
          />
          <span className="text-white font-black uppercase tracking-wider">
            Winners Circle
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        {rolloverResults.map((res, i) => {
          const isFinal = res.key === "final";
          const isRollover = res.isRollover;

          return (
            <div
              key={res.key}
              className={`relative overflow-hidden rounded-2xl border transition-all ${
                isFinal
                  ? "border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-black"
                  : isRollover
                    ? "border-red-900/30 bg-[#1a1212]"
                    : "border-white/10 bg-[#151725]"
              } p-6 shadow-xl`}
            >
              {isFinal && (
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/20 blur-xl rounded-full" />
              )}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex flex-col items-center md:items-start min-w-[150px]">
                  <span
                    className={`text-xs font-bold uppercase tracking-widest mb-1 ${isFinal ? "text-yellow-400" : isRollover ? "text-red-400" : "text-slate-500"}`}
                  >
                    {res.label}
                  </span>
                  <div className="flex items-center gap-3 text-2xl font-black text-white">
                    <span>{res.scoreA || 0}</span>
                    <span className="text-slate-600 text-sm">-</span>
                    <span>{res.scoreB || 0}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    Digits: {res.rowDigit} - {res.colDigit}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div
                    className={`p-3 rounded-full mb-2 ${
                      isFinal
                        ? "bg-yellow-500 text-black shadow-lg"
                        : isRollover
                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                          : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                    }`}
                  >
                    {isFinal ? (
                      <Crown className="w-6 h-6" />
                    ) : isRollover ? (
                      <Ban className="w-5 h-5" />
                    ) : (
                      <Trophy className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <span
                      className={`text-xl font-black ${isFinal ? "text-yellow-400" : isRollover ? "text-slate-500 line-through decoration-red-500" : "text-white"}`}
                    >
                      ${res.finalPayout}
                    </span>
                    {isRollover && (
                      <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                        <ArrowDown className="w-3 h-3" /> Rolled Over
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center md:items-end">
                  {res.hasWinner ? (
                    <div className="flex flex-col gap-2 items-center md:items-end">
                      {res.winners?.map((w: any, idx: number) => {
                        const userColor = getUserColor(w.displayName || "");
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-xl border border-white/5"
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-lg"
                              style={{
                                backgroundColor: userColor,
                                boxShadow: `0 0 10px ${userColor}40`,
                              }}
                            >
                              {w.displayName?.[0]}
                            </div>
                            <span className="font-bold text-white">
                              {w.displayName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <div
                        className={`px-4 py-2 rounded-xl border border-dashed text-sm italic mb-1 ${isRollover ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-white/5 border-white/10 text-slate-500"}`}
                      >
                        {isRollover
                          ? "Rolled Over"
                          : res.isFinished && !res.hasWinner
                            ? "Unclaimed (No Winner)"
                            : "Waiting..."}
                      </div>
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

export default function WinnersPage() {
  return (
    <main className="min-h-screen bg-[#0B0C15] p-4 lg:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>
      <Suspense
        fallback={
          <div className="text-white text-center pt-20">Loading Winners...</div>
        }
      >
        <WinnersContent />
      </Suspense>
    </main>
  );
}
