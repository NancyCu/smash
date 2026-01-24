"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import type { SquareData } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import Grid from "@/components/Grid";
import GameInfo from "@/components/GameInfo";
import { Copy, Check, Lock, ExternalLink } from "lucide-react";
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
  const [mobileView, setMobileView] = useState<'board' | 'info'>('board');

  // --- DYNAMIC LOGO HELPER ---
  const getTeamLogo = (teamName: string) => {
    // 1. Try to find the logo in the live game data (Perfect Match)
    if (matchedGame?.competitors) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const comp = matchedGame.competitors.find((c: any) => 
        c.team.name.toLowerCase().includes(teamName.toLowerCase()) || 
        c.team.abbreviation.toLowerCase() === teamName.toLowerCase()
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (comp && (comp as any).team?.logo) return (comp as any).team.logo;
    }

    // 2. If no live game attached, fall back to this generic NFL/NBA CDN or placeholders
    // (This is a safety net if ESPN data isn't loaded yet)
    return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${teamName.toLowerCase().slice(0,3)}.png&h=200&w=200`;
  };


  // --- 2. LIVE SCORES ---
  const currentScores = useMemo(() => {
    // If no ESPN Game ID, return DB scores immediately
    if (!game?.espnGameId) {
       return game?.scores || { q1:{home:0,away:0}, q2:{home:0,away:0}, q3:{home:0,away:0}, final:{home:0,away:0}, teamA:0, teamB:0 };
    }

    const matchedGame = liveGames.find(g => g.id === game.espnGameId);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeGame = matchedGame as any; 

    if (safeGame && safeGame.competitors) {
      // Helper: Fuzzy match team names
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

      // Fallbacks if direct matching fails
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!compA && compB) compA = safeGame.competitors.find((c: any) => c.id !== compB.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!compB && compA) compB = safeGame.competitors.find((c: any) => c.id !== compA.id);
      if (!compA && !compB) {
         compA = safeGame.competitors[0];
         compB = safeGame.competitors[1];
      }

      // Safe Extraction Helper
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

  const handleSquareClick = async (row: number, col: number) => {
    if (game?.isScrambled && !isAdmin) {
      alert("Game is locked! No more picks.");
      return;
    }
    if (!game) return;

    const index = row * 10 + col;
    const existing = formattedSquares[`${row}-${col}`]?.[0];

    if (existing) {
      if (existing.uid === user?.uid || isAdmin) {
        if (isAdmin && existing.uid !== user?.uid) {
           if(!confirm(`Admin: Remove ${existing.name} from this square?`)) return;
        }
        await unclaimSquare(index);
      } else {
        alert(`This square is owned by ${existing.name}`);
      }
    } else {
      if (!user) {
        alert("Please login to play!");
        return;
      }
      await claimSquare(index);
    }
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

  return (

      {/* MOBILE HEADER (Always Visible on Small Screens) */}
      <div className="lg:hidden p-4 bg-[#0B0C15]/90 sticky top-0 z-50 backdrop-blur-md flex justify-between items-center border-b border-white/5 shrink-0">
         <div onClick={() => router.push('/')} className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black italic text-white text-sm">SR</div>
         </div>
         
         {/* VIEW TOGGLE */}
         <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/5">
            <button 
              onClick={() => setMobileView('board')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${mobileView === 'board' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Board
            </button>
            <button 
              onClick={() => setMobileView('info')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${mobileView === 'info' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Info
            </button>
         </div>

         <button onClick={copyCode} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
            <span className="text-xs font-mono text-slate-400">{game.id.slice(0,4)}..</span>
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
         </button>
      </div>
      
      {/* -------------------- */}
      {/* LEFT: ACTION AREA (Grid + Score) */}
      {/* -------------------- */}
      <div className={`flex-1 flex-col h-full relative overflow-y-auto lg:overflow-hidden no-scrollbar ${mobileView === 'board' ? 'flex' : 'hidden'} lg:flex`}>
/button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col items-center justify-start p-2 lg:p-6 w-full">
            
            {/* 1. THE JUMBOTRON HEADER */}
            {/* Replaces both Scoreboard and QuarterTabs */}
            <div className="w-full max-w-[85vh] mb-6 relative group z-20 shrink-0">
              
              {/* Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 via-indigo-500/10 to-cyan-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>

              {/* Glass Container */}
              <div className="relative w-full bg-[#0f111a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col items-center shadow-2xl">

                {/* Scores Row */}
                <div className="flex w-full justify-between items-center mb-6">
                  
                  {/* Team A (Pink) */}
                  <div className="flex flex-col items-center w-1/3 relative">
                    <div className="absolute inset-0 bg-pink-500/10 blur-3xl rounded-full opacity-20"></div>
                    <span className="relative text-pink-500 font-teko text-xl md:text-3xl tracking-[0.2em] uppercase mb-1 drop-shadow-sm">
                      {game.teamA}
                    </span>
                    <span className="relative text-6xl md:text-8xl font-teko text-white leading-none drop-shadow-[0_0_20px_rgba(236,72,153,0.6)]">
                      {activeQuarter === 'final' ? currentScores.final.home : 
                       activeQuarter === 'q1' ? currentScores.q1.home :
                       activeQuarter === 'q2' ? (currentScores.q1.home + currentScores.q2.home) :
                       activeQuarter === 'q3' ? (currentScores.q1.home + currentScores.q2.home + currentScores.q3.home) :
                       currentScores.teamA}
                    </span>
                  </div>

                  {/* Center Controls */}
                  <div className="flex flex-col items-center w-1/3 z-10">
                    <span className="text-slate-500 font-mono text-[10px] tracking-widest uppercase mb-3">Live Period</span>
                    <div className="flex bg-black/40 rounded-full p-1.5 border border-white/10 backdrop-blur-md shadow-inner">
                        {(['q1', 'q2', 'q3', 'final'] as const).map((q) => (
                            <button
                                key={q}
                                onClick={() => setActiveQuarter(q)}
                                className={`
                                  relative px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider transition-all duration-300
                                  ${activeQuarter === q 
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105' 
                                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}
                                `}
                            >
                                {q === 'final' ? 'END' : q.toUpperCase()}
                            </button>
                        ))}
                    </div>
                  </div>

                  {/* Team B (Cyan) */}
                  <div className="flex flex-col items-center w-1/3 relative">
                     <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full opacity-20"></div>
                     <span className="relative text-cyan-400 font-teko text-xl md:text-3xl tracking-[0.2em] uppercase mb-1 drop-shadow-sm">
                      {game.teamB}
                    </span>
                    <span className="relative text-6xl md:text-8xl font-teko text-white leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]">
                      {activeQuarter === 'final' ? currentScores.final.away : 
                       activeQuarter === 'q1' ? currentScores.q1.away :
                       activeQuarter === 'q2' ? (currentScores.q1.away + currentScores.q2.away) :
                       activeQuarter === 'q3' ? (currentScores.q1.away + currentScores.q2.away + currentScores.q3.away) :
                       currentScores.teamB}
                    </span>
                  </div>
                </div>

                {/* Mini Stats Row */}
                <div className="w-full border-t border-white/5 pt-3 flex justify-between px-4 md:px-12 text-[10px] md:text-xs font-mono text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <span className={activeQuarter === 'q1' ? 'text-white font-bold' : ''}>Q1</span>
                        <span className="text-slate-300">{currentScores.q1.home}-{currentScores.q1.away}</span>
                    </div>
                    <div className="w-px h-3 bg-white/10"></div>
                    <div className="flex items-center gap-2">
                        <span className={activeQuarter === 'q2' ? 'text-white font-bold' : ''}>Q2</span>
                        <span className="text-slate-300">{currentScores.q2.home}-{currentScores.q2.away}</span>
                    </div>
                    <div className="w-px h-3 bg-white/10"></div>
                    <div className="flex items-center gap-2">
                        <span className={activeQuarter === 'q3' ? 'text-white font-bold' : ''}>Q3</span>
                        <span className="text-slate-300">{currentScores.q3.home}-{currentScores.q3.away}</span>
                    </div>
                </div>

              </div>
            </div>

            {/* 2. THE GRID */}
            <div className="relative w-full max-w-[85vh] aspect-square flex items-center justify-center bg-[#0f111a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden shrink-0">
                <Grid{`w-full lg:w-[420px] bg-[#0f111a] border-l border-white/5 overflow-y-auto z-20 shadow-2xl h-full lg:h-full ${mobileView === 'info' ? 'flex flex-col flex-1' : 'hidden'} lg:block`}
                  rows={currentAxis.row}
                  cols={currentAxis.col}
                  squares={formattedSquares}
                  onSquareClick={handleSquareClick}
                  teamA={game.teamA}
                  teamB={game.teamB}
                  teamALogo={getTeamLogo(game.teamA)}
                  teamBLogo={getTeamLogo(game.teamB)}
                  isScrambled={game.isScrambled}
                />
            </div>
        </div>
      </div>

      {/* -------------------- */}
      {/* RIGHT: SIDEBAR (Info) */}
      {/* -------------------- */}
      <div className="w-full lg:w-[420px] bg-[#0f111a] border-l border-white/5 overflow-y-auto z-20 shadow-2xl h-auto lg:h-full">
         <div className="p-6 space-y-8">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
                <div onClick={() => router.push('/')} className="cursor-pointer flex items-center gap-3 group">
                     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <ExternalLink className="text-white w-5 h-5" />
                     </div>
                     <div>
                        <h1 className="text-white font-black text-xl tracking-wider uppercase leading-none">Squares Royale</h1>
                        <p className="text-xs text-slate-500 font-mono mt-1">THE SOUPER BOWL</p>
                     </div>
                </div>
            </div>

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