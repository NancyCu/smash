"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image"; 
import { useParams, useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import type { SquareData } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import Grid from "@/components/Grid";
import GameInfo from "@/components/GameInfo";
import LiveGameClock from "@/components/LiveGameClock"; 
import { Copy, Check, ShoppingCart, LogIn, LogOut, Loader2, X, Trophy, UserPlus, Trash2, Ban } from "lucide-react";
import { useEspnScores } from "@/hooks/useEspnScores";

export default function GamePage() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    game, setGameId, loading, error, isAdmin, 
    claimSquare, unclaimSquare, updateScores, 
    scrambleGrid, resetGrid, deleteGame, setGamePhase
  } = useGame();
  
  const { user, logOut } = useAuth();
  const { games: liveGames } = useEspnScores();

  const matchedGame = useMemo(() => 
    game?.espnGameId ? liveGames.find(g => g.id === game.espnGameId) : null, 
    [game, liveGames]
  );
  
  // --- STATE ---
  const [activeQuarter, setActiveQuarter] = useState<'q1' | 'q2' | 'q3' | 'final'>('q1');
  const [isManualView, setIsManualView] = useState(false); // Track if user clicked a button
  const [copied, setCopied] = useState(false);
  const [pendingSquares, setPendingSquares] = useState<number[]>([]); 
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. CALCULATE LIVE QUARTER ---
  const liveQuarter = useMemo(() => {
      // Priority 1: Game Over -> Final
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (matchedGame as any)?.status;
      const detail = (matchedGame as any)?.statusDetail;
      
      if (status === "post" || (detail && detail.includes("Final"))) {
          return 'final';
      }
      // Priority 2: Game Live -> Use Period
      if (matchedGame?.isLive) {
          const p = matchedGame.period;
          if (p === 1) return 'q1';
          if (p === 2) return 'q2';
          if (p === 3) return 'q3';
          if (p >= 4) return 'final'; 
      }
      // Priority 3: Host Control (Fallback)
      return (game?.currentPeriod as 'q1'|'q2'|'q3'|'final') || 'q1';
  }, [matchedGame, game]);

  // --- 2. AUTO-SYNC LOGIC ---
  useEffect(() => {
      if (!isManualView) {
          setActiveQuarter(liveQuarter);
      }
  }, [liveQuarter, isManualView]);

  // --- 3. SNAP-BACK TIMER (10s) ---
  useEffect(() => {
      if (isManualView) {
          const timer = setTimeout(() => {
              setIsManualView(false); 
          }, 10000);
          return () => clearTimeout(timer);
      }
  }, [isManualView]);

  const handleQuarterChange = (q: 'q1'|'q2'|'q3'|'final') => {
      setActiveQuarter(q);
      // If user clicks the current live quarter, stay live. Otherwise, start manual timer.
      if (q === liveQuarter) setIsManualView(false);
      else setIsManualView(true);

      if (isAdmin) setGamePhase(q);
  };

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

  // --- SCORES ---
  const currentScores = useMemo(() => {
    const base = { q1: { home: 0, away: 0 }, q2: { home: 0, away: 0 }, q3: { home: 0, away: 0 }, final: { home: 0, away: 0 }, teamA: 0, teamB: 0 };
    if (!game) return base;

    if (game.espnGameId && matchedGame && matchedGame.competitors) {
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const targetA = normalize(game.teamA);
        const targetB = normalize(game.teamB);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let compA = matchedGame.competitors.find((c: any) => { const n = normalize(c.team.name); return n.includes(targetA) || targetA.includes(n); });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let compB = matchedGame.competitors.find((c: any) => { const n = normalize(c.team.name); return n.includes(targetB) || targetB.includes(n); });
        
        if (!compA && compB) compA = matchedGame.competitors.find((c: any) => c.id !== compB.id);
        if (!compB && compA) compB = matchedGame.competitors.find((c: any) => c.id !== compA.id);
        if (!compA && !compB) { compA = matchedGame.competitors[0]; compB = matchedGame.competitors[1]; }
        
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
    return { ...base, final: { home: game.scores?.teamA || 0, away: game.scores?.teamB || 0 }, teamA: game.scores?.teamA || 0, teamB: game.scores?.teamB || 0 };
  }, [game, matchedGame]);

  // --- WINNING CELL ---
  const defaultAxis = [0,1,2,3,4,5,6,7,8,9];
  const currentAxis = game?.isScrambled ? (game.axis?.[activeQuarter] || { row: defaultAxis, col: defaultAxis }) : { row: defaultAxis, col: defaultAxis };

  const winningCoordinates = useMemo(() => {
    const axis = game?.isScrambled ? (game.axis?.[activeQuarter] || { row: defaultAxis, col: defaultAxis }) : { row: defaultAxis, col: defaultAxis };
    
    let scoreA = 0, scoreB = 0;
    if (activeQuarter === 'q1') { scoreA = currentScores.q1.home; scoreB = currentScores.q1.away; }
    else if (activeQuarter === 'q2') { scoreA = currentScores.q1.home + currentScores.q2.home; scoreB = currentScores.q1.away + currentScores.q2.away; }
    else if (activeQuarter === 'q3') { scoreA = currentScores.q1.home + currentScores.q2.home + currentScores.q3.home; scoreB = currentScores.q1.away + currentScores.q2.away + currentScores.q3.away; }
    else { scoreA = currentScores.final.home; scoreB = currentScores.final.away; }
    
    const rowIndex = axis.row.indexOf(scoreA % 10);
    const colIndex = axis.col.indexOf(scoreB % 10);
    if (rowIndex === -1 || colIndex === -1) return null;
    return { row: rowIndex, col: colIndex };
  }, [currentScores, activeQuarter, game]);

  // --- GRID DATA ---
  const formattedSquares = useMemo(() => {
    if (!game?.squares) return {};
    const result: Record<string, { uid: string, name: string, claimedAt: number }[]> = {};
    Object.entries(game.squares).forEach(([key, value]) => {
      const index = parseInt(key);
      if (isNaN(index)) return;
      const gridKey = `${Math.floor(index / 10)}-${index % 10}`;
      if (!result[gridKey]) result[gridKey] = [];
      if (Array.isArray(value)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value.forEach((sq: any) => { result[gridKey].push({ uid: sq.userId, name: sq.displayName, claimedAt: 0 }); });
      } else {
        const sq = value as SquareData;
        result[gridKey].push({ uid: sq.userId, name: sq.displayName, claimedAt: 0 });
      }
    });
    return result;
  }, [game]);

  // --- STATS / PAYOUTS (ROLLOVER LOGIC) ---
  const gameStats = useMemo(() => {
      if (!game) return { payouts: { q1: 0, q2: 0, q3: 0, final: 0 }, winners: [], currentPotential: 0 };
      
      const pot = game.pot || (Object.keys(game.squares).length * game.price);
      const base = {
          q1: Math.floor(pot * 0.10),
          q2: Math.floor(pot * 0.20),
          q3: Math.floor(pot * 0.20),
          final: pot - (Math.floor(pot * 0.10) + Math.floor(pot * 0.20) * 2)
      };

      const getOwner = (q: 'q1'|'q2'|'q3'|'final') => {
          const axis = game.isScrambled && game.axis ? game.axis[q] : { row: defaultAxis, col: defaultAxis };
          let sA=0, sB=0;
          if (q==='q1') { sA = currentScores.q1.home; sB = currentScores.q1.away; }
          else if (q==='q2') { sA = currentScores.q1.home+currentScores.q2.home; sB = currentScores.q1.away+currentScores.q2.away; }
          else if (q==='q3') { sA = currentScores.q1.home+currentScores.q2.home+currentScores.q3.home; sB = currentScores.q1.away+currentScores.q2.away+currentScores.q3.away; }
          else { sA = currentScores.final.home; sB = currentScores.final.away; }

          const r = axis.row.indexOf(sA % 10);
          const c = axis.col.indexOf(sB % 10);
          if (r === -1 || c === -1) return null; 
          const cell = game.squares[r*10+c];
          if (Array.isArray(cell)) return cell.length > 0 ? cell[0] : null;
          if (cell) return cell;
          return null;
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (matchedGame as any)?.status;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const statusType = (matchedGame as any)?.statusDetail;
      
      const p = matchedGame?.period || 1;
      const isFinal = status === "post" || (statusType && statusType.includes("Final"));
      const isHalf = status === "halftime" || (statusType && statusType.includes("Halftime"));

      let currentRollover = 0;
      const results = [];
      const payoutMap = { q1: 0, q2: 0, q3: 0, final: 0 };

      // Q1
      const q1Done = p > 1 || isHalf || isFinal;
      const w1 = getOwner('q1');
      if (q1Done && !w1) { currentRollover += base.q1; payoutMap.q1 = 0; results.push({ key: 'q1', label: 'Q1', winner: 'Rollover', amount: 0, rollover: true }); } 
      else if (q1Done && w1) { payoutMap.q1 = base.q1; results.push({ key: 'q1', label: "Q1", winner: w1.displayName, amount: base.q1, rollover: false }); currentRollover = 0; } 
      else { payoutMap.q1 = base.q1; }

      // Q2
      const q2Done = p > 2 || isFinal;
      const w2 = getOwner('q2');
      const q2Total = base.q2 + currentRollover;
      if (q2Done && !w2) { currentRollover = q2Total; payoutMap.q2 = 0; results.push({ key: 'q2', label: 'Half', winner: 'Rollover', amount: 0, rollover: true }); } 
      else if (q2Done && w2) { payoutMap.q2 = q2Total; results.push({ key: 'q2', label: "Half", winner: w2.displayName, amount: q2Total, rollover: false }); currentRollover = 0; } 
      else { payoutMap.q2 = q2Total; }

      // Q3
      const q3Done = p > 3 || isFinal;
      const w3 = getOwner('q3');
      const q3Total = base.q3 + currentRollover;
      if (q3Done && !w3) { currentRollover = q3Total; payoutMap.q3 = 0; results.push({ key: 'q3', label: 'Q3', winner: 'Rollover', amount: 0, rollover: true }); } 
      else if (q3Done && w3) { payoutMap.q3 = q3Total; results.push({ key: 'q3', label: "Q3", winner: w3.displayName, amount: q3Total, rollover: false }); currentRollover = 0; } 
      else { payoutMap.q3 = q3Total; }

      // Final
      const finalTotal = base.final + currentRollover;
      payoutMap.final = finalTotal;
      if (isFinal) {
          const wFinal = getOwner('final');
          if (wFinal) results.push({ key: 'final', label: "Final", winner: wFinal.displayName, amount: finalTotal, rollover: false });
          else results.push({ key: 'final', label: "Final", winner: "No Winner", amount: 0, rollover: true });
      }

      return { payouts: payoutMap, winners: results, currentPotential: payoutMap[activeQuarter] };
  }, [game, currentScores, matchedGame, activeQuarter]);


  useEffect(() => {
    if (id && typeof id === 'string') {
      setGameId(id);
      if (typeof window !== "undefined") localStorage.setItem("activeGameId", id);
    }
  }, [id, setGameId]);

  useEffect(() => {
    if (winningCoordinates) setSelectedCell(winningCoordinates);
  }, [winningCoordinates]);

  // Handlers
  const handleSquareClick = (row: number, col: number) => {
    const index = row * 10 + col;
    if (game?.isScrambled && !isAdmin) { setSelectedCell({ row, col }); return; }
    setPendingSquares(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    setSelectedCell({ row, col });
  };
  const handleAuth = async () => { if (user) await logOut(); else router.push('/?action=login'); };
  const handleConfirmCart = async () => {
    if (!user) { await handleAuth(); return; }
    if (pendingSquares.length === 0) return;
    setIsSubmitting(true);
    try { for (const index of pendingSquares) await claimSquare(index); setPendingSquares([]); setSelectedCell(null); } catch (err) { alert("Error"); } finally { setIsSubmitting(false); }
  };
  const handleClearCart = () => setPendingSquares([]);
  const handleClaim = async () => {
    if (!selectedCell || !game) return;
    if (!user) { await handleAuth(); return; }
    if (game.isScrambled && !isAdmin) { alert("Game is locked!"); return; }
    setIsSubmitting(true);
    try { await claimSquare(selectedCell.row * 10 + selectedCell.col); } catch (err) { alert("Failed."); } finally { setIsSubmitting(false); }
  };
  const handleUnclaim = async () => { if (selectedCell) await unclaimSquare(selectedCell.row * 10 + selectedCell.col); };
  const copyCode = () => { if(game) { navigator.clipboard.writeText(game.id); setCopied(true); setTimeout(() => setCopied(false), 2000); }};
  const handleDelete = async () => { if (confirm("Are you sure?")) { await deleteGame(); router.push("/"); }};

  if (loading && !game) return <div className="min-h-screen flex items-center justify-center bg-[#0B0C15]"><div className="animate-spin h-12 w-12 border-4 border-indigo-500 rounded-full border-t-transparent"/></div>;
  if (error || !game) return <div className="min-h-screen flex items-center justify-center bg-[#0B0C15] text-white">Game Not Found</div>;

  const selectedSquareData = selectedCell ? formattedSquares[`${selectedCell.row}-${selectedCell.col}`] || [] : [];
  const isWinningSquare = winningCoordinates && selectedCell && winningCoordinates.row === selectedCell.row && winningCoordinates.col === selectedCell.col;
  const cartTotal = pendingSquares.length * game.price;
  const currentWinningPlayer = selectedSquareData.length > 0 ? selectedSquareData[0].name : "Open";
  const currentPotValue = gameStats.currentPotential || 0;

  return (
    <main className="flex flex-col lg:flex-row h-screen w-full bg-[#0B0C15] overflow-hidden">
      
      {/* 1. MAIN AREA */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar relative">
          
          {/* MOBILE HEADER */}
          <div className="lg:hidden p-4 bg-[#0B0C15]/95 sticky top-0 z-50 backdrop-blur-md flex justify-between items-center border-b border-white/5">
              <div onClick={() => router.push('/')} className="flex items-center gap-2 cursor-pointer">
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20">
                    <Image src="/SouperBowlDark.png" alt="Logo" fill className="object-cover" />
                  </div>
                  <span className="font-bold text-white tracking-widest text-xs uppercase">Souper Bowl Squares</span>
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={handleAuth} className="p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-400">{user ? <LogOut className="w-4 h-4 text-red-400" /> : <LogIn className="w-4 h-4 text-green-400" />}</button>
                  <button onClick={copyCode} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
                      <span className="text-xs font-mono text-slate-400">{game.id.slice(0,6)}...</span>
                      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                  </button>
              </div>
          </div>

          <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-2 lg:p-6 gap-6">
              
              {/* SCOREBOARD (FIXED OVERLAP & WRAPPING) */}
              <div className="w-full relative group z-20 shrink-0">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 via-indigo-500/10 to-cyan-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
                  <div className="relative w-full bg-[#0f111a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 flex flex-col items-center shadow-2xl">
                      
                      <div className="flex w-full justify-between items-start mb-2 relative">
                          
                          {/* TEAM A (LEFT) */}
                          <div className="flex flex-col items-center justify-start w-[35%] relative z-0">
                              <span className="text-pink-500 font-teko text-lg md:text-3xl tracking-widest uppercase mb-1 text-center leading-none text-balance w-full break-words px-1">
                                  {game.teamA}
                              </span>
                              <span className="text-5xl md:text-8xl font-teko text-white leading-none drop-shadow-[0_0_20px_rgba(236,72,153,0.6)] mt-1">
                                  {activeQuarter === 'final' ? currentScores.final.home : activeQuarter === 'q1' ? currentScores.q1.home : activeQuarter === 'q2' ? (currentScores.q1.home + currentScores.q2.home) : currentScores.teamA}
                              </span>
                          </div>
                          
                          {/* CENTER CLOCK (Does not shrink) */}
                          <div className="flex flex-col items-center w-[30%] shrink-0 z-10 pt-2">
                              <LiveGameClock game={matchedGame} />

                              <div className="flex bg-black/40 rounded-full p-1 border border-white/10 scale-75 md:scale-100 mt-1">
                                  {(['q1', 'q2', 'q3', 'final'] as const).map((q) => (
                                      <button 
                                          key={q} 
                                          onClick={() => handleQuarterChange(q)} 
                                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${activeQuarter === q ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                      >
                                          {q === 'final' ? 'Final' : q.toUpperCase()}
                                      </button>
                                  ))}
                              </div>
                              {isAdmin && <span className="text-[9px] text-green-400 font-bold uppercase mt-1 tracking-widest animate-pulse">Host Control</span>}
                          </div>

                          {/* TEAM B (RIGHT) */}
                          <div className="flex flex-col items-center justify-start w-[35%] relative z-0">
                              <span className="text-cyan-400 font-teko text-lg md:text-3xl tracking-widest uppercase mb-1 text-center leading-none text-balance w-full break-words px-1">
                                  {game.teamB}
                              </span>
                              <span className="text-5xl md:text-8xl font-teko text-white leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] mt-1">
                                  {activeQuarter === 'final' ? currentScores.final.away : activeQuarter === 'q1' ? currentScores.q1.away : activeQuarter === 'q2' ? (currentScores.q1.away + currentScores.q2.away) : currentScores.teamB}
                              </span>
                          </div>

                      </div>
                  </div>
              </div>

              {/* CURRENT WINNER & PURSE DISPLAY */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#151725] border border-green-500/30 rounded-xl p-4 shadow-lg flex items-center justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" /></div>
                      <div className="flex flex-col">
                          <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> Current Winning Square
                          </span>
                          <span className="text-xl font-black text-white truncate max-w-[150px]">{isWinningSquare ? currentWinningPlayer : "Nobody"}</span>
                      </div>
                      <div className="flex flex-col items-end">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Current Purse</span>
                          <span className="text-2xl font-black text-white">${currentPotValue}</span>
                      </div>
                  </div>

                  {/* PAST WINNERS / ROLLOVER LOG */}
                  {gameStats?.winners && gameStats.winners.length > 0 && (
                      <div className="bg-[#151725] border border-white/5 rounded-xl p-4 shadow-lg flex flex-col justify-center">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 border-b border-white/5 pb-1">History</span>
                          <div className="space-y-1">
                              {gameStats.winners.map((w: any, idx: number) => (
                                  <div key={idx} className="flex justify-between text-xs items-center">
                                      <span className="text-slate-400 font-bold">{w.label}</span>
                                      <div className="flex items-center gap-2">
                                          {w.rollover ? (
                                              <span className="text-red-400 italic flex items-center gap-1"><Ban className="w-3 h-3"/> Rollover</span>
                                          ) : (
                                              <>
                                                  <span className="text-white font-bold">{w.winner}</span>
                                                  <span className="text-green-400 font-mono font-black">${w.amount}</span>
                                              </>
                                          )}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>

              {/* GRID */}
              <div className="w-full aspect-square shrink-0 relative z-10">
                  <div className="h-full w-full bg-[#0f111a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden">
                      <Grid 
                          rows={currentAxis.row} cols={currentAxis.col} squares={formattedSquares}
                          onSquareClick={handleSquareClick} teamA={game.teamA} teamB={game.teamB}
                          teamALogo={getTeamLogo(game.teamA)} teamBLogo={getTeamLogo(game.teamB)}
                          isScrambled={game.isScrambled} selectedCell={selectedCell}
                          winningCell={winningCoordinates}
                          pendingIndices={pendingSquares} currentUserId={user?.uid}
                      />
                  </div>
              </div>

              {/* CART / DETAILS BOX */}
              {pendingSquares.length > 0 ? (
                  <div className="w-full bg-[#151725] border border-indigo-500/50 rounded-2xl p-4 shadow-xl shrink-0 animate-in slide-in-from-bottom-5">
                      <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                                  <ShoppingCart className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex flex-col">
                                  <span className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Selected Squares</span>
                                  <span className="text-xl font-black text-white">{pendingSquares.length} <span className="text-sm font-medium text-slate-400">Total: ${cartTotal}</span></span>
                              </div>
                          </div>
                          <button onClick={handleClearCart} className="text-xs text-slate-500 hover:text-white underline">Clear</button>
                      </div>
                      <button onClick={handleConfirmCart} disabled={isSubmitting} className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : (user ? `Confirm & Claim ($${cartTotal})` : "Sign In to Claim")}
                      </button>
                  </div>
              ) : (
                  <div className={`w-full bg-[#151725] border ${isWinningSquare ? "border-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.2)]" : "border-white/10"} rounded-2xl p-4 shadow-xl shrink-0 transition-all`}>
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-2">
                                Square Details {isWinningSquare && <span className="text-yellow-400 flex items-center gap-1 animate-pulse"><Trophy className="w-3 h-3" /> Winning Square</span>}
                            </span>
                            <span className="text-lg font-black text-white">{selectedCell ? `Row ${currentAxis.row[selectedCell.row]} • Col ${currentAxis.col[selectedCell.col]}` : "Select a Square"}</span>
                        </div>
                        {selectedCell && <button onClick={() => setSelectedCell(null)} className="p-1 rounded-full hover:bg-white/10 text-slate-500"><X className="w-4 h-4" /></button>}
                    </div>
                    {selectedCell ? (
                        <div className="space-y-4">
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {selectedSquareData.length === 0 ? <div className="p-3 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-lg">Empty Square</div> : 
                                selectedSquareData.map((p, i) => (
                                    <div key={i} className={`flex justify-between items-center p-3 rounded-lg border ${p.uid === user?.uid ? "bg-indigo-600/20 border-indigo-500/30" : "bg-black/40 border-white/5"}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${p.uid === user?.uid ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                                                {i+1}
                                            </div>
                                            <span className={`text-sm font-bold ${p.uid === user?.uid ? "text-indigo-200" : "text-slate-200"}`}>{p.name} {p.uid === user?.uid && "(You)"}</span>
                                        </div>
                                        {(isAdmin || p.uid === user?.uid) && <button onClick={handleUnclaim} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>}
                                    </div>
                                ))
                            }
                            </div>
                            <div className="flex gap-3">
                               <button onClick={handleClaim} disabled={(game.isScrambled && !isAdmin) || isSubmitting} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <><UserPlus className="w-4 h-4"/> {user ? `Add Name ($${game.price})` : "Sign In to Play"}</>}
                               </button>
                            </div>
                        </div>
                    ) : <div className="text-center py-6 text-slate-500 text-sm">Tap empty squares to build your cart.</div>}
                  </div>
              )}

              <div className="lg:hidden w-full pb-20">
                  <GameInfo 
                      gameId={game.id} gameName={game.name} host={game.host} pricePerSquare={game.price}
                      totalPot={game.pot || (Object.keys(game.squares).length * game.price)} 
                      payouts={gameStats?.payouts} 
                      winners={gameStats?.winners || []}  
                      matchup={{ teamA: game.teamA, teamB: game.teamB }}
                      scores={{ teamA: game.scores.teamA, teamB: game.scores.teamB }}
                      isAdmin={isAdmin} isScrambled={game.isScrambled}
                      eventDate={matchedGame?.date || game.createdAt?.toDate?.()?.toString() || new Date().toISOString()}
                      onUpdateScores={updateScores} onDeleteGame={handleDelete}
                      onScrambleGridDigits={scrambleGrid} onResetGridDigits={resetGrid}
                      selectedEventId={game.espnGameId} availableGames={liveGames}
                  />
              </div>
          </div>
      </div>
      
      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:flex w-[400px] xl:w-[450px] bg-[#0f111a] border-l border-white/5 flex-col h-full overflow-y-auto p-6 z-20 shadow-2xl relative">
          <div className="mb-6">
               <div onClick={() => router.push('/')} className="cursor-pointer group">
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 mb-4 shadow-xl group-hover:shadow-2xl transition-all">
                      <Image src="/SouperBowlBanner.jpg" alt="Banner" fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] to-transparent/50" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
                             <Image src="/SouperBowlDark.png" alt="Logo" fill className="object-cover" />
                          </div>
                          <div>
                            <h1 className="text-white font-black text-xl tracking-wider uppercase leading-none drop-shadow-md">Souper Bowl</h1>
                            <h1 className="text-indigo-400 font-black text-xl tracking-wider uppercase leading-none drop-shadow-md">Squares</h1>
                          </div>
                      </div>
                  </div>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed border-l-2 border-indigo-500 pl-3 italic">
                     "Go Big or Go Home. Connect, compete, and win big with the ultimate squares experience. Because with us, a Nguyen is always a Win"
                  </p>
               </div>
               <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
                  <button onClick={handleAuth} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-white font-bold text-xs uppercase hover:bg-slate-700 transition-colors">
                      {user ? <><LogOut className="w-4 h-4 text-red-400" /><span>Log Out</span></> : <><LogIn className="w-4 h-4 text-green-400" /><span>Log In</span></>}
                  </button>
               </div>
          </div>
          <GameInfo 
              gameId={game.id} gameName={game.name} host={game.host} pricePerSquare={game.price}
              totalPot={game.pot || (Object.keys(game.squares).length * game.price)} 
              payouts={gameStats?.payouts} 
              winners={gameStats?.winners || []} 
              matchup={{ teamA: game.teamA, teamB: game.teamB }}
              scores={{ teamA: game.scores.teamA, teamB: game.scores.teamB }}
              isAdmin={isAdmin} isScrambled={game.isScrambled}
              eventDate={matchedGame?.date || game.createdAt?.toDate?.()?.toString() || new Date().toISOString()}
              onUpdateScores={updateScores} onDeleteGame={handleDelete}
              onScrambleGridDigits={scrambleGrid} onResetGridDigits={resetGrid}
              selectedEventId={game.espnGameId} availableGames={liveGames}
          />
      </div>
    </main>
  );
}