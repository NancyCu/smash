"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import type { SquareData } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import Grid from "@/components/Grid";
import GameInfo from "@/components/GameInfo";
import { Copy, Check, UserPlus, Trash2, X, ExternalLink } from "lucide-react";
import { useEspnScores } from "@/hooks/useEspnScores";

export default function GamePage() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    game, setGameId, loading, error, isAdmin, 
    claimSquare, unclaimSquare, updateScores, 
    scrambleGrid, resetGrid, deleteGame
  } = useGame();
  
  const { user } = useAuth();
  const { games: liveGames } = useEspnScores();

  const matchedGame = useMemo(() => 
    game?.espnGameId ? liveGames.find(g => g.id === game.espnGameId) : null, 
    [game, liveGames]
  );
  
  const [activeQuarter, setActiveQuarter] = useState<'q1' | 'q2' | 'q3' | 'final'>('q1');
  const [copied, setCopied] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);

  // --- LOGO HELPER ---
  const getTeamLogo = (teamName: string) => {
    if (matchedGame?.competitors) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const comp = matchedGame.competitors.find((c: any) => 
        c.team.name.toLowerCase().includes(teamName.toLowerCase()) || 
        c.team.abbreviation.toLowerCase() === teamName.toLowerCase()
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (comp && (comp as any).team?.logo) return (comp as any).team.logo;
    }
    return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${teamName.toLowerCase().slice(0,3)}.png&h=200&w=200`;
  };

  // --- LIVE SCORES ---
  const currentScores = useMemo(() => {
    if (!game?.espnGameId) return game?.scores || { q1:{home:0,away:0}, q2:{home:0,away:0}, q3:{home:0,away:0}, final:{home:0,away:0}, teamA:0, teamB:0 };
    const matchedGame = liveGames.find(g => g.id === game.espnGameId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeGame = matchedGame as any; 
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
    return game?.scores || { q1:{home:0,away:0}, q2:{home:0,away:0}, q3:{home:0,away:0}, final:{home:0,away:0}, teamA:0, teamB:0 };
  }, [game, liveGames]);

  // --- WINNING CELL CALCULATION ---
  const defaultAxis = [0,1,2,3,4,5,6,7,8,9];
  const currentAxis = game?.isScrambled ? (game.axis?.[activeQuarter] || { row: defaultAxis, col: defaultAxis }) : { row: defaultAxis, col: defaultAxis };

  const winningCoordinates = useMemo(() => {
    if (!game?.isScrambled) return null; // Only show winner if grid is locked/scrambled

    // Calculate Cumulative Score for the active view
    let scoreA = 0;
    let scoreB = 0;

    if (activeQuarter === 'q1') {
        scoreA = currentScores.q1.home;
        scoreB = currentScores.q1.away;
    } else if (activeQuarter === 'q2') {
        scoreA = currentScores.q1.home + currentScores.q2.home;
        scoreB = currentScores.q1.away + currentScores.q2.away;
    } else if (activeQuarter === 'q3') {
        scoreA = currentScores.q1.home + currentScores.q2.home + currentScores.q3.home;
        scoreB = currentScores.q1.away + currentScores.q2.away + currentScores.q3.away;
    } else {
        scoreA = currentScores.final.home;
        scoreB = currentScores.final.away;
    }

    const lastDigitA = scoreA % 10;
    const lastDigitB = scoreB % 10;

    // Find which ROW index has lastDigitA
    const rowIndex = currentAxis.row.indexOf(lastDigitA);
    // Find which COL index has lastDigitB
    const colIndex = currentAxis.col.indexOf(lastDigitB);

    if (rowIndex === -1 || colIndex === -1) return null;

    return { row: rowIndex, col: colIndex };
  }, [currentScores, activeQuarter, currentAxis, game]);

  // --- GRID SQUARES ---
  const formattedSquares = useMemo(() => {
    if (!game?.squares) return {};
    const result: Record<string, { uid: string, name: string, claimedAt: number }[]> = {};
    Object.entries(game.squares).forEach(([key, sq]) => {
      const square = sq as SquareData;
      const index = parseInt(key);
      if (!isNaN(index)) {
        const gridKey = `${Math.floor(index / 10)}-${index % 10}`;
        if (!result[gridKey]) result[gridKey] = [];
        result[gridKey].push({ uid: square.userId, name: square.displayName, claimedAt: 0 });
      }
    });
    return result;
  }, [game]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      setGameId(id);
      if (typeof window !== "undefined") localStorage.setItem("activeGameId", id);
    }
  }, [id, setGameId]);

  // --- HANDLERS ---
  const handleSquareClick = (row: number, col: number) => setSelectedCell({ row, col });
  const handleClaim = async () => {
    if (!selectedCell || !game || !user) return;
    if (game.isScrambled && !isAdmin) { alert("Game is locked!"); return; }
    await claimSquare(selectedCell.row * 10 + selectedCell.col);
  };
  const handleUnclaim = async () => {
    if (!selectedCell || !game) return;
    await unclaimSquare(selectedCell.row * 10 + selectedCell.col);
  };
  const copyCode = () => {
    if (!game) return;
    navigator.clipboard.writeText(game.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleDelete = async () => {
    if (confirm("Are you sure? This cannot be undone.")) { await deleteGame(); router.push("/"); }
  };

  if (loading && !game) return <div className="min-h-screen flex items-center justify-center bg-[#0B0C15]"><div className="animate-spin h-12 w-12 border-4 border-indigo-500 rounded-full border-t-transparent"/></div>;
  if (error || !game) return <div className="min-h-screen flex items-center justify-center bg-[#0B0C15] text-white">Game Not Found</div>;

  const selectedSquareData = selectedCell ? formattedSquares[`${selectedCell.row}-${selectedCell.col}`] || [] : [];
  const isSelectedOwnedByMe = selectedSquareData.some(p => p.uid === user?.uid);

  // --- INFO PANEL COMPONENT ---
  const InfoPanel = () => (
    <GameInfo 
        gameId={game.id} gameName={game.name} host={game.host} pricePerSquare={game.price}
        totalPot={game.pot || (Object.keys(game.squares).length * game.price)} 
        payouts={game.payouts} matchup={{ teamA: game.teamA, teamB: game.teamB }}
        scores={{ teamA: game.scores.teamA, teamB: game.scores.teamB }}
        isAdmin={isAdmin} isScrambled={game.isScrambled}
        eventDate={matchedGame?.date || game.createdAt?.toDate?.()?.toString() || new Date().toISOString()}
        onUpdateScores={updateScores} onDeleteGame={handleDelete}
        onScrambleGridDigits={scrambleGrid} onResetGridDigits={resetGrid}
        selectedEventId={game.espnGameId} availableGames={liveGames}
    />
  );

  return (
    <main className="flex flex-col lg:flex-row h-screen w-full bg-[#0B0C15] overflow-hidden">
      
      {/* 1. MAIN SCROLLABLE AREA */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar relative">
          
          {/* Mobile Sticky Header */}
          <div className="lg:hidden p-4 bg-[#0B0C15]/95 sticky top-0 z-50 backdrop-blur-md flex justify-between items-center border-b border-white/5">
              <div onClick={() => router.push('/')} className="flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black italic text-white text-sm">SR</div>
                  <span className="font-bold text-white tracking-widest text-xs uppercase">Squares Royale</span>
              </div>
              <button onClick={copyCode} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
                  <span className="text-xs font-mono text-slate-400">{game.id.slice(0,6)}...</span>
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
              </button>
          </div>

          <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-2 lg:p-6 gap-6">
              
              {/* SCOREBOARD */}
              <div className="w-full relative group z-20 shrink-0">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 via-indigo-500/10 to-cyan-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                  <div className="relative w-full bg-[#0f111a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex flex-col items-center shadow-2xl">
                      <div className="flex w-full justify-between items-center mb-4">
                          <div className="flex flex-col items-center w-1/3 relative">
                              <span className="text-pink-500 font-teko text-xl md:text-3xl tracking-[0.2em] uppercase mb-1">{game.teamA}</span>
                              <span className="text-5xl md:text-8xl font-teko text-white leading-none drop-shadow-[0_0_20px_rgba(236,72,153,0.6)]">
                                  {activeQuarter === 'final' ? currentScores.final.home : activeQuarter === 'q1' ? currentScores.q1.home : activeQuarter === 'q2' ? (currentScores.q1.home + currentScores.q2.home) : currentScores.teamA}
                              </span>
                          </div>
                          <div className="flex flex-col items-center w-1/3 z-10">
                              <div className="flex bg-black/40 rounded-full p-1 border border-white/10 scale-75 md:scale-100">
                                  {(['q1', 'q2', 'q3', 'final'] as const).map((q) => (
                                      <button key={q} onClick={() => setActiveQuarter(q)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${activeQuarter === q ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{q.toUpperCase()}</button>
                                  ))}
                              </div>
                          </div>
                          <div className="flex flex-col items-center w-1/3 relative">
                              <span className="text-cyan-400 font-teko text-xl md:text-3xl tracking-[0.2em] uppercase mb-1">{game.teamB}</span>
                              <span className="text-5xl md:text-8xl font-teko text-white leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
                                  {activeQuarter === 'final' ? currentScores.final.away : activeQuarter === 'q1' ? currentScores.q1.away : activeQuarter === 'q2' ? (currentScores.q1.away + currentScores.q2.away) : currentScores.teamB}
                              </span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* THE GRID */}
              <div className="w-full aspect-square shrink-0 relative z-10">
                  <div className="h-full w-full bg-[#0f111a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden">
                      <Grid 
                          rows={currentAxis.row} cols={currentAxis.col} squares={formattedSquares}
                          onSquareClick={handleSquareClick} teamA={game.teamA} teamB={game.teamB}
                          teamALogo={getTeamLogo(game.teamA)} teamBLogo={getTeamLogo(game.teamB)}
                          isScrambled={game.isScrambled} selectedCell={selectedCell}
                          winningCell={winningCoordinates}
                      />
                  </div>
              </div>

              {/* SQUARE DETAILS */}
              <div className="w-full bg-[#151725] border border-white/10 rounded-2xl p-4 shadow-xl shrink-0">
                 <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Square Details</span>
                        <span className="text-lg font-black text-white">{selectedCell ? `Row ${currentAxis.row[selectedCell.row]} • Col ${currentAxis.col[selectedCell.col]}` : "Select a Square"}</span>
                    </div>
                    {selectedCell && <button onClick={() => setSelectedCell(null)} className="p-1 rounded-full hover:bg-white/10 text-slate-500"><X className="w-4 h-4" /></button>}
                 </div>
                 {selectedCell ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                           {selectedSquareData.length === 0 ? <div className="p-3 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-lg">Empty Square</div> : 
                              selectedSquareData.map((p, i) => (
                                  <div key={i} className="flex justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                                      <span className="text-sm font-bold text-slate-200">{p.name}</span>
                                      {(isAdmin || p.uid === user?.uid) && <button onClick={handleUnclaim} className="text-red-400"><Trash2 className="w-3 h-3" /></button>}
                                  </div>
                              ))
                           }
                        </div>
                        <div className="flex gap-3">
                           <button onClick={handleClaim} disabled={game.isScrambled && !isAdmin} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase disabled:opacity-50 flex items-center justify-center gap-2"><UserPlus className="w-4 h-4"/> Add Name (${game.price})</button>
                        </div>
                    </div>
                 ) : <div className="text-center py-4 text-slate-500 text-sm">Tap grid to edit.</div>}
              </div>

              {/* MOBILE INFO */}
              <div className="lg:hidden w-full pb-20">
                  <InfoPanel />
              </div>
          </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:flex w-[400px] xl:w-[450px] bg-[#0f111a] border-l border-white/5 flex-col h-full overflow-y-auto p-6 z-20 shadow-2xl">
          <div className="mb-6 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg"><ExternalLink className="text-white w-5 h-5" /></div>
               <div><h1 className="text-white font-black text-xl tracking-wider uppercase leading-none">Squares Royale</h1><p className="text-xs text-slate-500 font-mono mt-1">THE SOUPER BOWL</p></div>
          </div>
          <InfoPanel />
      </div>

    </main>
  );
}