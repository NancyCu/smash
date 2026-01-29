"use client";

import { getUserColor } from "@/utils/colors";
import React, { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGame, type SquareData, type GameData } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import { useEspnScores } from "@/hooks/useEspnScores";
import { ArrowLeft, Trophy, Crown, ArrowDown, Ban, Ghost, Sparkles } from "lucide-react";
import GameHistoryCard from "@/components/GameHistoryCard";

// ============================================================================
// SINGLE GAME WINNERS VIEW (Original functionality)
// ============================================================================
function SingleGameWinners({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { game, setGameId } = useGame();
  const { games: liveGames } = useEspnScores();

  useEffect(() => {
    if (gameId && (!game || game.id !== gameId)) {
      setGameId(gameId);
    }
  }, [gameId, game, setGameId]);

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
      const safeGame = matched as any;
      if (safeGame && safeGame.competitors) {
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const targetA = normalize(game.teamA);
        const targetB = normalize(game.teamB);
        let compA = safeGame.competitors.find((c: any) => {
          const n = normalize(c.team.name);
          return n.includes(targetA) || targetA.includes(n);
        });
        let compB = safeGame.competitors.find((c: any) => {
          const n = normalize(c.team.name);
          return n.includes(targetB) || targetB.includes(n);
        });
        if (!compA && compB) compA = safeGame.competitors.find((c: any) => c.id !== compB.id);
        if (!compB && compA) compB = safeGame.competitors.find((c: any) => c.id !== compA.id);
        if (!compA && !compB) {
          compA = safeGame.competitors[0];
          compB = safeGame.competitors[1];
        }
        const getScore = (c: any, i: number) => c?.linescores?.[i]?.value ? Number(c.linescores[i].value) : 0;
        return {
          q1: { home: getScore(compA, 0), away: getScore(compB, 0) },
          q2: { home: getScore(compA, 1), away: getScore(compB, 1) },
          q3: { home: getScore(compA, 2), away: getScore(compB, 2) },
          final: { home: Number(compA?.score || 0), away: Number(compB?.score || 0) },
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

  const getWinnerForQuarter = (q: "q1" | "q2" | "q3" | "final") => {
    const defaultAxis = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const axisConfig = (game?.isScrambled && game?.axis?.[q]) || { row: defaultAxis, col: defaultAxis };
    const axisRow = Array.isArray(axisConfig.row) ? axisConfig.row : defaultAxis;
    const axisCol = Array.isArray(axisConfig.col) ? axisConfig.col : defaultAxis;

    let scoreA = 0, scoreB = 0;
    if (q === "q1") { scoreA = currentScores.q1.home; scoreB = currentScores.q1.away; }
    else if (q === "q2") { scoreA = currentScores.q1.home + currentScores.q2.home; scoreB = currentScores.q1.away + currentScores.q2.away; }
    else if (q === "q3") { scoreA = currentScores.q1.home + currentScores.q2.home + currentScores.q3.home; scoreB = currentScores.q1.away + currentScores.q2.away + currentScores.q3.away; }
    else { scoreA = currentScores.final.home; scoreB = currentScores.final.away; }

    const lastDigitA = scoreA % 10;
    const lastDigitB = scoreB % 10;
    const rowIdx = axisRow.indexOf(lastDigitA);
    const colIdx = axisCol.indexOf(lastDigitB);
    if (rowIdx === -1 || colIdx === -1) return null;

    const cellIndex = rowIdx * 10 + colIdx;
    const cellData = game?.squares ? game.squares[cellIndex] : undefined;
    let winners: SquareData[] = [];
    if (Array.isArray(cellData)) winners = cellData as SquareData[];
    else if (cellData) winners = [cellData as SquareData];

    return { quarter: q, scoreA, scoreB, rowDigit: lastDigitA, colDigit: lastDigitB, winners: winners.length > 0 ? winners : null };
  };

  const rolloverResults = useMemo(() => {
    if (!game) return [];
    const matchedGame = liveGames.find(g => g.id === game.espnGameId) as any;
    const status = matchedGame?.status;
    const p = status?.period || 0;
    const isFinal = status?.type?.completed || status?.type?.state === 'post' || status?.type?.description === 'Final' || status?.type?.shortDetail?.toLowerCase().includes('final');
    const isHalf = status?.type?.name === "STATUS_HALFTIME" || status?.type?.shortDetail === "Halftime" || (p === 2 && status?.clock === 0.0);

    const pot = game.pot || (Object.keys(game.squares).length * game.price);
    const basePayouts = { q1: pot * 0.10, q2: pot * 0.20, q3: pot * 0.20, final: pot * 0.50 };

    let currentRollover = 0;
    const results: any[] = [];
    const stages = [
      { key: 'q1', label: "1st Quarter", done: p > 1 || isHalf || isFinal },
      { key: 'q2', label: "Halftime", done: p > 2 || isFinal || (p === 2 && isHalf) },
      { key: 'q3', label: "3rd Quarter", done: p > 3 || isFinal },
      { key: 'final', label: "Final Score", done: isFinal }
    ];

    stages.forEach((stage) => {
      const result = getWinnerForQuarter(stage.key as any);
      const hasWinner = result && result.winners !== null;
      let displayAmount = basePayouts[stage.key as keyof typeof basePayouts] + currentRollover;
      let rolloverActive = false;

      if (stage.done && !hasWinner) {
        if (stage.key !== 'final') { currentRollover = displayAmount; displayAmount = 0; rolloverActive = true; }
      } else if (stage.done && hasWinner) { currentRollover = 0; }

      results.push({
        quarter: stage.key, scoreA: result?.scoreA ?? 0, scoreB: result?.scoreB ?? 0,
        rowDigit: result?.rowDigit ?? null, colDigit: result?.colDigit ?? null,
        winners: result?.winners ?? null, key: stage.key, label: stage.label,
        finalPayout: displayAmount, isRollover: rolloverActive, hasWinner: hasWinner, isFinished: stage.done,
      });
    });
    return results;
  }, [game, currentScores, liveGames]);

  if (!game) return <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto relative z-10 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div onClick={() => router.push(`/game/${game.id}`)} className="flex items-center gap-2 text-slate-400 hover:text-white cursor-pointer transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold uppercase text-xs tracking-widest">Back to Game</span>
        </div>
        <div className="flex items-center gap-2">
          <img src="/image_9.png" alt="Souper Bowl LX Logo" className="h-10 w-auto object-contain rounded-lg" />
          <span className="text-white font-black uppercase tracking-wider">Winners Circle</span>
        </div>
      </div>

      <div className="grid gap-6">
        {rolloverResults.map((res) => {
          const isFinal = res.key === "final";
          const isRollover = res.isRollover;

          return (
            <div key={res.key} className={`relative overflow-hidden rounded-2xl border transition-all ${isFinal ? "border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-black" : isRollover ? "border-red-900/30 bg-[#1a1212]" : "border-white/10 bg-[#151725]"} p-6 shadow-xl`}>
              {isFinal && <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/20 blur-xl rounded-full" />}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex flex-col items-center md:items-start min-w-[150px]">
                  <span className={`text-xs font-bold uppercase tracking-widest mb-1 ${isFinal ? "text-yellow-400" : isRollover ? "text-red-400" : "text-slate-500"}`}>{res.label}</span>
                  <div className="flex items-center gap-3 text-2xl font-black text-white">
                    <span>{res.scoreA || 0}</span><span className="text-slate-600 text-sm">-</span><span>{res.scoreB || 0}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">Digits: {res.rowDigit} - {res.colDigit}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`p-3 rounded-full mb-2 ${isFinal ? "bg-yellow-500 text-black shadow-lg" : isRollover ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"}`}>
                    {isFinal ? <Crown className="w-6 h-6" /> : isRollover ? <Ban className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-xl font-black ${isFinal ? "text-yellow-400" : isRollover ? "text-slate-500 line-through decoration-red-500" : "text-white"}`}>${res.finalPayout}</span>
                    {isRollover && <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1"><ArrowDown className="w-3 h-3" /> Rolled Over</span>}
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center md:items-end">
                  {res.hasWinner ? (
                    <div className="flex flex-col gap-2 items-center md:items-end">
                      {res.winners?.map((w: any, idx: number) => {
                        const userColor = getUserColor(w.displayName || "");
                        return (
                          <div key={idx} className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-lg" style={{ backgroundColor: userColor, boxShadow: `0 0 10px ${userColor}40` }}>{w.displayName?.[0]}</div>
                            <span className="font-bold text-white">{w.displayName}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <div className={`px-4 py-2 rounded-xl border border-dashed text-sm italic mb-1 ${isRollover ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-white/5 border-white/10 text-slate-500"}`}>
                        {isRollover ? "Rolled Over" : res.isFinished && !res.hasWinner ? "Unclaimed (No Winner)" : "Waiting..."}
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

// ============================================================================
// HALL OF FAME - ALL GAMES LIST
// ============================================================================
function HallOfFame() {
  const router = useRouter();
  const { user } = useAuth();
  const { getUserGames } = useGame();
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const userGames = await getUserGames(user.uid);
        const sorted = userGames.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        setGames(sorted);
      } catch (err) {
        console.error("Failed to fetch games:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [user, getUserGames]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto relative z-10 pb-20">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <Ghost className="w-20 h-20 text-white/20" />
          <h2 className="text-2xl font-black text-white/60 uppercase tracking-widest">Sign In Required</h2>
          <p className="text-white/40 text-center max-w-sm">Log in to view your game history and see your wins!</p>
          <button onClick={() => router.push("/?action=login")} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto relative z-10 pb-20">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-white/60 font-bold uppercase tracking-widest text-sm">Loading History...</span>
        </div>
      </div>
    );
  }

  const totalPots = games.reduce((sum, g) => sum + (g.totalPot || g.pot || Object.keys(g.squares || {}).length * g.price), 0);

  return (
    <div className="max-w-4xl mx-auto relative z-10 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div onClick={() => router.push("/")} className="flex items-center gap-2 text-slate-400 hover:text-white cursor-pointer transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold uppercase text-xs tracking-widest">Home</span>
        </div>
        <div className="flex items-center gap-2">
          <img src="/image_9.png" alt="Souper Bowl LX Logo" className="h-10 w-auto object-contain rounded-lg" />
        </div>
      </div>

      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 drop-shadow-[0_0_30px_rgba(251,191,36,0.3)]" style={{ fontFamily: "'Russo One', sans-serif" }}>
            Hall of Fame
          </h1>
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </div>
        <p className="text-white/40 text-sm font-medium uppercase tracking-widest">Your Game History</p>
      </div>

      {games.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
            <span className="text-3xl font-black text-white">{games.length}</span>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Games Played</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
            <span className="text-3xl font-black text-[#22d3ee]">
              {games.filter(g => g.status === "final").length}
            </span>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Completed</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/5">
            <span className="text-3xl font-black text-[#db2777]">${totalPots}</span>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Total Pots</p>
          </div>
        </div>
      )}

      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="relative">
            <Ghost className="w-24 h-24 text-white/10" />
            <div className="absolute inset-0 animate-pulse">
              <Ghost className="w-24 h-24 text-white/5" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white/40 uppercase tracking-widest">No History Yet</h2>
          <p className="text-white/30 text-center max-w-sm text-sm">
            Join or create a game to start building your legacy!
          </p>
          <div className="flex gap-3">
            <button onClick={() => router.push("/create")} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl transition-colors uppercase tracking-wider">
              Create Game
            </button>
            <button onClick={() => router.push("/join")} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition-colors uppercase tracking-wider border border-white/20">
              Join Game
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-0">
          {games.map((game) => (
            <GameHistoryCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
function WinnersContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get("id");

  if (gameId) {
    return <SingleGameWinners gameId={gameId} />;
  }

  return <HallOfFame />;
}

export default function WinnersPage() {
  return (
    <main className="min-h-screen bg-[#0B0C15] p-4 lg:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-[#22d3ee]/5 rounded-full blur-[120px]" />
      </div>
      
      <Suspense fallback={<div className="text-white text-center pt-20">Loading...</div>}>
        <WinnersContent />
      </Suspense>
    </main>
  );
}
