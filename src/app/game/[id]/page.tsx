"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import type { SquareData } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import Grid from "@/components/Grid";
import GameInfo from "@/components/GameInfo";
import { Copy, Check, ExternalLink, UserPlus, Trash2, X } from "lucide-react";
import { useEspnScores } from "@/hooks/useEspnScores";

export default function GamePage() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    game, 
    setGameId, 
    loading, 
    error, 
    isAdmin, 
    claimSquare, 
    unclaimSquare, 
    updateScores, 
    scrambleGrid, 
    resetGrid, 
    deleteGame
  } = useGame();
  
  const { user } = useAuth();
  const { games: liveGames } = useEspnScores();

  // Find the ESPN game object if we have an ID
  const matchedGame = useMemo(() => 
    game?.espnGameId ? liveGames.find(g => g.id === game.espnGameId) : null, 
    [game, liveGames]
  );
  
  const [activeQuarter, setActiveQuarter] = useState<'q1' | 'q2' | 'q3' | 'final'>('q1');
  const [copied, setCopied] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);

  // --- 1. LOGO HELPER ---
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

  // --- 2. LIVE SCORES ---
  const currentScores = useMemo(() => {
    if (!game?.espnGameId) {
       return game?.scores || { q1:{home:0,away:0}, q2:{home:0,away:0}, q3:{home:0,away:0}, final:{home:0,away:0}, teamA:0, teamB:0 };
    }

    const matchedGame = liveGames.find(g => g.id === game.espnGameId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeGame = matchedGame as any; 

    if (safeGame && safeGame.competitors) {
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const targetA = normalize(game.teamA);
      const targetB = normalize(game.teamB);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let compA = safeGame.competitors.find((c: any) => {
         const cName = normalize(c.team.name);
         const cAbbr = normalize(c.team.abbreviation);
         return cName.includes(targetA) || targetA.includes(cName) || cAbbr === targetA;
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let compB = safeGame.competitors.find((c: any) => {
         const cName = normalize(c.team.name);
         const cAbbr = normalize(c.team.abbreviation);
         return cName.includes(targetB) || targetB.includes(cName) || cAbbr === targetB;
      });

      if (!compA && compB) compA = safeGame.competitors.find((c: any) => c.id !== compB.id);
      if (!compB && compA) compB = safeGame.competitors.find((c: any) => c.id !== compA.id);
      if (!compA && !compB) {
         compA = safeGame.competitors[0];
         compB = safeGame.competitors[1];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getScore = (comp: any, index: number) => {
        if (!comp || !comp.linescores || !comp.linescores[index]) return 0;
        return Number(comp.linescores[index].value || 0);
      };
      
      const scoreA = Number(compA?.score || 0);
      const scoreB = Number(compB?.score || 0);

      return {
        q1: { home: getScore(compA, 0), away: getScore(compB, 0) },
        q2: { home: getScore(compA, 1), away: getScore(compB, 1) },
        q3: { home: getScore(compA, 2), away: getScore(compB, 2) },
        final: { home: scoreA, away: scoreB },
        teamA: scoreA,
        teamB: scoreB
      };
    }

    return game?.scores || { q1:{home:0,away:0}, q2:{home:0,away:0}, q3:{home:0,away:0}, final:{home:0,away:0}, teamA:0, teamB:0 };
  }, [game, liveGames]);

  // --- 3. GRID SQUARES ---
  const formattedSquares = useMemo(() => {
    if (!game?.squares) return {};
    const result: Record<string, { uid: string, name: string, claimedAt: number }[]> = {};
    
    Object.entries(game.squares).forEach(([key, sq]) => {
      const square = sq as SquareData;
      const index = parseInt(key);
      if (!isNaN(index)) {
        const row = Math.floor(index / 10);
        const col = index % 10;
        const gridKey = `${row}-${col}`;
        if (!result[gridKey]) result[gridKey] = [];
        result[gridKey].push({
          uid: square.userId,
          name: square.displayName,
          claimedAt: 0 
        });
      }
    });
    return result;
  }, [game]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      setGameId(id);
      if (typeof window !== "undefined") {
          localStorage.setItem("activeGameId", id);
      }
    }
  }, [id, setGameId]);

  // --- HANDLERS ---
  const handleSquareClick = (row: number, col: number) => {
    // Just select the cell. Do not claim immediately.
    setSelectedCell({ row, col });
  };

  const handleClaim = async () => {
    if (!selectedCell || !game || !user) return;
    if (game.isScrambled && !isAdmin) {
        alert("Game is locked!");
        return;
    }
    const index = selectedCell.row * 10 + selectedCell.col;
    await claimSquare(index);
  };

  const handleUnclaim = async () => {
    if (!selectedCell || !game) return;
    const index = selectedCell.row * 10 + selectedCell.col;
    
    // Check permission logic inside unclaimSquare or here
    // For now, assuming unclaimSquare handles checking if user owns it
    await unclaimSquare(index);
  };

  const copyCode = () => {
    if (!game) return;
    navigator.clipboard.writeText(game.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure? This cannot be undone.")) {
      await deleteGame();
      router.push("/");
    }
  };

  if (loading && !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0C15] gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-indigo-400 font-bold tracking-widest animate-pulse">LOADING ARENA...</p>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0C15] text-white p-6 text-center">
        <h1 className="text-2xl font-black uppercase mb-2">Game Not Found</h1>
        <button onClick={() => router.push('/')} className="px-6 py-3 bg-indigo-600 rounded-xl font-bold uppercase tracking-widest">Return Home</button>
      </div>
    );
  }

  // Resolve Axis
  const defaultAxis = [0,1,2,3,4,5,6,7,8,9];
  const currentAxis = game.isScrambled ? (game.axis?.[activeQuarter] || { row: defaultAxis, col: defaultAxis }) : { row: defaultAxis, col: defaultAxis };

  // Data for Selected Cell
  const selectedSquareData = selectedCell ? formattedSquares[`${selectedCell.row}-${selectedCell.col}`] || [] : [];
  const isSelectedOwnedByMe = selectedSquareData.some(p => p.uid === user?.uid);

  return (
    <main className="flex flex-col h-screen w-full bg-[#0B0C15] overflow-y-auto overflow-x-hidden">
      
      {/* 1. MOBILE HEADER */}
      <div className="lg:hidden p-4 bg-[#0B0C15]/90 sticky top-0 z-50 backdrop-blur-md flex justify-between items-center border-b border-white/5 shrink-0">
            <div onClick={() => router.push('/')} className="flex items-center gap-2 cursor-pointer">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black italic text-white text-sm">SR</div>
                 <span className="font-bold text-white tracking-widest text-xs uppercase">Squares Royale</span>
            </div>
             <button onClick={copyCode} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
               <span className="text-xs font-mono text-slate-400">{game.id.slice(0,6)}...</span>
               {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
             </button>
      </div>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <div className="flex-1 flex flex-col items-center w-full max-w-3xl mx-auto p-2 lg:p-6 gap-6">
            
            {/* A. JUMBOTRON SCOREBOARD */}
            <div className="w-full relative group z-20">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 via-indigo-500/10 to-cyan-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
              <div className="relative w-full bg-[#0f111a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex flex-col items-center shadow-2xl">
                {/* Scores */}
                <div className="flex w-full justify-between items-center mb-4">
                  {/* Team A */}
                  <div className="flex flex-col items-center w-1/3 relative">
                    <span className="relative text-pink-500 font-teko text-xl md:text-3xl tracking-[0.2em] uppercase mb-1 drop-shadow-sm">{game.teamA}</span>
                    <span className="relative text-6xl md:text-8xl font-teko text-white leading-none drop-shadow-[0_0_20px_rgba(236,72,153,0.6)]">
                      {activeQuarter === 'final' ? currentScores.final.home : 
                       activeQuarter === 'q1' ? currentScores.q1.home :
                       activeQuarter === 'q2' ? (currentScores.q1.home + currentScores.q2.home) :
                       activeQuarter === 'q3' ? (currentScores.q1.home + currentScores.q2.home + currentScores.q3.home) :
                       currentScores.teamA}
                    </span>
                  </div>
                  {/* Controls */}
                  <div className="flex flex-col items-center w-1/3 z-10">
                    <span className="text-slate-400 font-mono text-[10px] tracking-widest uppercase mb-2">Live Period</span>
                    <div className="flex bg-black/40 rounded-full p-1 border border-white/10 backdrop-blur-md shadow-inner scale-90 md:scale-100">
                        {(['q1', 'q2', 'q3', 'final'] as const).map((q) => (
                            <button key={q} onClick={() => setActiveQuarter(q)}
                                className={`relative px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${activeQuarter === q ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                                {q === 'final' ? 'END' : q.toUpperCase()}
                            </button>
                        ))}
                    </div>
                  </div>
                  {/* Team B */}
                  <div className="flex flex-col items-center w-1/3 relative">
                     <span className="relative text-cyan-400 font-teko text-xl md:text-3xl tracking-[0.2em] uppercase mb-1 drop-shadow-sm">{game.teamB}</span>
                    <span className="relative text-6xl md:text-8xl font-teko text-white leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
                      {activeQuarter === 'final' ? currentScores.final.away : 
                       activeQuarter === 'q1' ? currentScores.q1.away :
                       activeQuarter === 'q2' ? (currentScores.q1.away + currentScores.q2.away) :
                       activeQuarter === 'q3' ? (currentScores.q1.away + currentScores.q2.away + currentScores.q3.away) :
                       currentScores.teamB}
                    </span>
                  </div>
                </div>
                {/* Mini Stats */}
                <div className="w-full border-t border-white/10 pt-2 md:pt-3 flex justify-between px-2 md:px-12 text-[10px] md:text-sm font-mono text-slate-400 uppercase tracking-widest font-bold">
                    <div className="flex items-center gap-2"><span className={activeQuarter === 'q1' ? 'text-indigo-400 drop-shadow-md' : 'opacity-50'}>Q1</span><span className="text-white">{currentScores.q1.home}-{currentScores.q1.away}</span></div>
                    <div className="w-px h-3 md:h-4 bg-white/20"></div>
                    <div className="flex items-center gap-2"><span className={activeQuarter === 'q2' ? 'text-indigo-400 drop-shadow-md' : 'opacity-50'}>Q2</span><span className="text-white">{currentScores.q2.home}-{currentScores.q2.away}</span></div>
                    <div className="w-px h-3 md:h-4 bg-white/20"></div>
                    <div className="flex items-center gap-2"><span className={activeQuarter === 'q3' ? 'text-indigo-400 drop-shadow-md' : 'opacity-50'}>Q3</span><span className="text-white">{currentScores.q3.home}-{currentScores.q3.away}</span></div>
                </div>
              </div>
            </div>

            {/* B. THE GRID */}
            <div className="w-full aspect-square max-w-[600px] flex items-center justify-center relative">
                <div className="h-full w-full aspect-square bg-[#0f111a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden">
                    <Grid 
                      rows={currentAxis.row}
                      cols={currentAxis.col}
                      squares={formattedSquares}
                      onSquareClick={handleSquareClick}
                      teamA={game.teamA}
                      teamB={game.teamB}
                      teamALogo={getTeamLogo(game.teamA)}
                      teamBLogo={getTeamLogo(game.teamB)}
                      isScrambled={game.isScrambled}
                      selectedCell={selectedCell}
                    />
                </div>
            </div>

            {/* C. SQUARE DETAILS (THE "ADD" BOX) */}
            <div className="w-full max-w-[600px] bg-[#151725] border border-white/10 rounded-2xl p-4 shadow-xl">
               <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Square Details</span>
                      <span className="text-lg font-black text-white">
                        {selectedCell ? `Row ${currentAxis.row[selectedCell.row]} • Col ${currentAxis.col[selectedCell.col]}` : "Select a Square"}
                      </span>
                  </div>
                  {selectedCell && (
                    <button onClick={() => setSelectedCell(null)} className="p-1 rounded-full hover:bg-white/10 text-slate-500 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                  )}
               </div>

               {selectedCell ? (
                  <div className="space-y-4">
                      {/* List Owners */}
                      <div className="space-y-2">
                         {selectedSquareData.length === 0 ? (
                            <div className="p-3 rounded-lg bg-white/5 border border-dashed border-white/10 text-center text-xs text-slate-500">
                                This square is empty.
                            </div>
                         ) : (
                            selectedSquareData.map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                                    <span className="text-sm font-bold text-slate-200">{p.name}</span>
                                    {/* Admin or Owner can delete */}
                                    {(isAdmin || p.uid === user?.uid) && (
                                        <button onClick={handleUnclaim} className="text-red-400 hover:text-red-300 transition-colors p-1">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))
                         )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                         <button 
                            onClick={handleClaim}
                            disabled={game.isScrambled && !isAdmin}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            <UserPlus className="w-4 h-4" />
                            Add Name (${game.price})
                         </button>
                         {(isSelectedOwnedByMe || isAdmin) && selectedSquareData.length > 0 && (
                             <button 
                                onClick={handleUnclaim}
                                className="px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-black text-xs uppercase tracking-widest transition-all"
                             >
                                Remove
                             </button>
                         )}
                      </div>
                  </div>
               ) : (
                  <div className="text-center py-6 text-slate-500 text-sm">
                      Tap any square on the grid to see details or add your name.
                  </div>
               )}
            </div>

            {/* D. GAME INFO (Below Grid) */}
            <div className="w-full max-w-[600px]">
                <GameInfo 
                    gameId={game.id}
                    gameName={game.name}
                    host={game.host}
                    pricePerSquare={game.price}
                    totalPot={game.pot || (Object.keys(game.squares).length * game.price)} 
                    payouts={game.payouts}
                    matchup={{ teamA: game.teamA, teamB: game.teamB }}
                    scores={{ teamA: game.scores.teamA, teamB: game.scores.teamB }}
                    isAdmin={isAdmin}
                    isScrambled={game.isScrambled}
                    eventDate={matchedGame?.date || game.createdAt?.toDate?.()?.toString() || new Date().toISOString()}
                    onUpdateScores={updateScores}
                    onDeleteGame={handleDelete}
                    onScrambleGridDigits={scrambleGrid}
                    onResetGridDigits={resetGrid}
                    selectedEventId={game.espnGameId}
                    availableGames={liveGames}
                />
            </div>

      </div>
    </main>
  );
}