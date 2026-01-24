"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import Grid from "@/components/Grid";
import GameInfo from "@/components/GameInfo";
import Scoreboard from "@/components/Game/Scoreboard";
import QuarterTabs from "@/components/QuarterTabs";
import { Copy, Check, Lock } from "lucide-react";
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

  // --- 1. LOGO HELPER ---
  const getTeamLogo = (teamName: string) => {
    const cleanName = teamName?.toLowerCase() || "";
    if (cleanName.includes("chiefs")) return "https://upload.wikimedia.org/wikipedia/en/e/e1/Kansas_City_Chiefs_logo.svg";
    if (cleanName.includes("eagles")) return "https://upload.wikimedia.org/wikipedia/en/8/8e/Philadelphia_Eagles_logo.svg";
    if (cleanName.includes("49ers")) return "https://upload.wikimedia.org/wikipedia/commons/3/36/San_Francisco_49ers_logo.svg";
    if (cleanName.includes("ravens")) return "https://upload.wikimedia.org/wikipedia/en/1/16/Baltimore_Ravens_logo.svg";
    if (cleanName.includes("patriots")) return "https://upload.wikimedia.org/wikipedia/en/b/b9/New_England_Patriots_logo.svg";
    if (cleanName.includes("broncos")) return "https://upload.wikimedia.org/wikipedia/en/4/44/Denver_Broncos_logo.svg";
    if (cleanName.includes("hawks")) return "https://upload.wikimedia.org/wikipedia/en/2/24/Atlanta_Hawks_logo.svg";
    if (cleanName.includes("suns")) return "https://upload.wikimedia.org/wikipedia/en/d/dc/Phoenix_Suns_logo.svg";
    return undefined;
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
      const index = parseInt(key);
      if (!isNaN(index)) {
        const row = Math.floor(index / 10);
        const col = index % 10;
        const gridKey = `${row}-${col}`;
        if (!result[gridKey]) result[gridKey] = [];
        result[gridKey].push({
          uid: sq.userId,
          name: sq.displayName,
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
    <main className="min-h-screen bg-[#0B0C15] pb-24">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#0B0C15]/90 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
         <div onClick={() => router.push('/')} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black italic text-white text-sm">SR</div>
            <span className="font-bold text-white text-sm tracking-wider uppercase hidden sm:block">Squares Royale</span>
         </div>
         <div className="flex items-center gap-2">
            <button onClick={copyCode} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700 hover:border-slate-600 transition-colors group">
              <span className="text-xs font-mono text-slate-400 group-hover:text-white transition-colors">{game.id}</span>
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-500 group-hover:text-white" />}
            </button>
            <div className="h-6 w-px bg-white/10 mx-1"></div>
            {game.isScrambled ? (
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-[10px] font-black uppercase tracking-widest">
                  <Lock className="w-3 h-3" /> Locked
               </div>
            ) : (
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">Open</div>
            )}
         </div>
      </div>

      {/* --- RESPONSIVE CONTAINER --- */}
      {/* FIX APPLIED HERE: Removed 'max-w-md' and changed 'p-4' to 'p-1' for mobile edge-to-edge */}
      <div className="w-full md:max-w-7xl mx-auto p-1 md:p-8">
        
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* LEFT COLUMN: THE ARENA (Grows to fill space) */}
          <div className="w-full lg:flex-1 space-y-6">
             {/* Scoreboard on top of grid */}
             <Scoreboard scores={currentScores} teamA={game.teamA} teamB={game.teamB} />

             {/* Tab + Grid */}
             <div className="space-y-4">
                <div className="flex justify-center">
                  <QuarterTabs activeQuarter={activeQuarter} setActiveQuarter={setActiveQuarter} isGameStarted={game.isScrambled} />
                </div>
                {/* Grid Container */}
                <div className="w-full max-w-[600px] mx-auto lg:max-w-full aspect-square bg-[#0f111a] rounded-2xl shadow-2xl overflow-hidden border border-white/5">
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
                  />
                </div>
             </div>
          </div>

          {/* RIGHT COLUMN: INFO & CONTROLS (Sticky Sidebar) */}
          <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 lg:sticky lg:top-24 space-y-6">
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
      </div>
    </main>
  );
}