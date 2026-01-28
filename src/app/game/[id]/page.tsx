"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import Grid from "@/components/Grid";
import GameInfo from "@/components/GameInfo";
import LiveGameClock from "@/components/LiveGameClock";
import {
  Copy,
  Check,
  ShoppingCart,
  LogIn,
  LogOut,
  Loader2,
  X,
  Trophy,
  Trash2,
} from "lucide-react";
import { useEspnScores } from "@/hooks/useEspnScores";
import { getSportConfig, getDisplayPeriods, getPeriodLabel, type PeriodKey, type SportType } from "@/lib/sport-config";

export default function GamePage() {
  const router = useRouter();
  const { id } = useParams();

  // 1. Hooks
  const { user, logOut } = useAuth();
  const { games: liveGames, error: espnError } = useEspnScores();

  const {
    game,
    setGameId,
    loading,
    isAdmin,
    claimSquare,
    unclaimSquare,
    updateScores,
    scrambleGrid,
    resetGrid,
    deleteGame,
    setGamePhase,
  } = useGame();

  // 2. Data Fetching Ignition
  useEffect(() => {
    if (id) {
      setGameId(id as string);
    }
  }, [id, setGameId]);

  // 3. Safety & Pot Logic
  const squares = game?.squares ?? {};

  // 4. Live Game Sync
  const matchedGame = useMemo(
    () => game?.espnGameId ? liveGames.find((g) => g.id === game.espnGameId) : null,
    [game, liveGames]
  );
   
  // 5. State
  const [activePeriod, setActivePeriod] = useState<PeriodKey>('p1');
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [isManualView, setIsManualView] = useState(false);
  const [pendingSquares, setPendingSquares] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get sport configuration
  const sportType: SportType = game?.sport || 'default';
  const sportConfig = getSportConfig(sportType);
  const displayPeriods = getDisplayPeriods(sportType);

  // --- 1. CALCULATE LIVE PERIOD ---
  const livePeriod = useMemo(() => {
      // 1. Final Game -> Show Final
      if (matchedGame?.status === "post" || matchedGame?.statusDetail?.includes("Final")) return 'final' as PeriodKey;

      // 2. Pre/Scheduled Game -> Force 1st Half/Quarter (Ignore Admin Override if synced)
      if (matchedGame?.status === "pre" || matchedGame?.status === "scheduled") return 'p1' as PeriodKey;
      
      // 3. Live Game -> Use API Period
      if (matchedGame?.isLive) {
          const p = matchedGame.period;
          // Map ESPN period numbers to our period keys based on sport
          if (sportType === 'soccer') {
            if (p === 1) return 'p1' as PeriodKey; // 1st Half
            if (p === 2) return 'p2' as PeriodKey; // 2nd Half
            if (p >= 3) return 'final' as PeriodKey; // Extra time/shootout counts as final
          } else {
            // Football/Basketball: standard quarter mapping
            if (p === 1) return 'p1' as PeriodKey;
            if (p === 2) return 'p2' as PeriodKey;
            if (p === 3) return 'p3' as PeriodKey;
            if (p >= 4) return 'final' as PeriodKey;
          }
      }
      
      // 4. Manual/Fallback -> Use DB State
      return (game?.currentPeriod as PeriodKey) || 'p1';
  }, [matchedGame, game, sportType]);

  // --- 2. SNAP BACK TIMER ---
  useEffect(() => {
      let timer: NodeJS.Timeout;
      if (isManualView) {
          timer = setTimeout(() => {
              setSelectedCell(null); 
              setIsManualView(false);
              setActivePeriod(livePeriod); 
          }, 10000);
      } else {
          if (activePeriod !== livePeriod) {
              setActivePeriod(livePeriod);
          }
      }
      return () => {
          if (timer) clearTimeout(timer);
      };
  }, [isManualView, livePeriod, activePeriod]);

  // --- 3. HANDLE PERIOD TAB CLICK ---
  const handlePeriodChange = (p: PeriodKey) => {
      setActivePeriod(p);
      if (p === livePeriod) {
          setIsManualView(false);
          setSelectedCell(null); 
      } else {
          setIsManualView(true);
          setSelectedCell(null); 
      }
      // Host control removed: Setting DB phase is no longer manual here
  };

  // --- LOGO HELPER ---
  const getTeamLogo = (teamName: string | undefined) => {
    const safeName = teamName || "Generic";
    if (matchedGame?.competitors) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const comp = matchedGame.competitors.find(
        (c: any) =>
          c.team.name.toLowerCase().includes(safeName.toLowerCase()) ||
          c.team.abbreviation.toLowerCase() === safeName.toLowerCase(),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (comp && (comp as any).team?.logo) return (comp as any).team.logo;
    }
    return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/${safeName.toLowerCase().slice(0, 3)}.png&h=200&w=200`;
  };

  // --- SCORES ---
  const currentScores = useMemo(() => {
    const base = {
      p1: { home: 0, away: 0 },
      p2: { home: 0, away: 0 },
      p3: { home: 0, away: 0 },
      p4: { home: 0, away: 0 },
      final: { home: 0, away: 0 },
      teamA: 0,
      teamB: 0,
    };
    if (!game) return base;

    if (game.espnGameId && matchedGame && matchedGame.competitors) {
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const targetA = normalize(game.teamA || "Home");
      const targetB = normalize(game.teamB || "Away");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let compA = matchedGame.competitors.find((c: any) => {
        const n = normalize(c.team.name);
        return n.includes(targetA) || targetA.includes(n);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let compB = matchedGame.competitors.find((c: any) => {
        const n = normalize(c.team.name);
        return n.includes(targetB) || targetB.includes(n);
      });

      if (!compA && compB)
        compA = matchedGame.competitors.find((c: any) => c.id !== compB.id);
      if (!compB && compA)
        compB = matchedGame.competitors.find((c: any) => c.id !== compA.id);
      if (!compA && !compB) {
        compA = matchedGame.competitors[0];
        compB = matchedGame.competitors[1];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getScore = (c: any, i: number) =>
        c?.linescores?.[i]?.value ? Number(c.linescores[i].value) : 0;

      return {
        p1: { home: getScore(compA, 0), away: getScore(compB, 0) },
        p2: { home: getScore(compA, 1), away: getScore(compB, 1) },
        p3: { home: getScore(compA, 2), away: getScore(compB, 2) },
        p4: { home: getScore(compA, 3), away: getScore(compB, 3) },
        final: {
          home: Number(compA?.score || 0),
          away: Number(compB?.score || 0),
        },
        teamA: Number(compA?.score || 0),
        teamB: Number(compB?.score || 0),
      };
    }
    
    // --- MANUAL FALLBACK ---
    const manualHome = game.scores?.teamA || 0;
    const manualAway = game.scores?.teamB || 0;
    const manualObj = { home: manualHome, away: manualAway };

    return {
      ...base,
      p1: manualObj,   
      p2: manualObj,   
      p3: manualObj,
      p4: manualObj,   
      final: manualObj,
      teamA: manualHome,
      teamB: manualAway,
    };
  }, [game, matchedGame]);

  // --- AUTO-SYNC ENGINE ---
  useEffect(() => {
    if (!game || !currentScores) return;
    const liveHome = currentScores.teamA;
    const liveAway = currentScores.teamB;
    const storedHome = game.scores?.teamA || 0;
    const storedAway = game.scores?.teamB || 0;

    if (liveHome !== storedHome || liveAway !== storedAway) {
       if (game.espnGameId && matchedGame) {
          console.log(`🔄 Syncing ESPN Scores (${liveHome}-${liveAway}) to Database...`);
          updateScores(liveHome, liveAway);
       }
    }
  }, [currentScores, game?.scores, matchedGame, updateScores, game?.espnGameId]);

  // --- WINNING CELL (SPORT-AWARE) ---
  const winningCoordinates = useMemo(() => {
    const defaultAxis = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const axis = game?.isScrambled
      ? game.axis?.[activePeriod] || { row: defaultAxis, col: defaultAxis }
      : { row: defaultAxis, col: defaultAxis };

    let scoreA = 0, scoreB = 0;

    // Manual Mode: Use total score for all periods
    if (!game?.espnGameId) {
        scoreA = currentScores.teamA;
        scoreB = currentScores.teamB;
    } else {
        // ESPN Mode: Calculate cumulative scores based on sport type
        if (sportType === 'soccer') {
          // Soccer: Use current total score for each period check
          if (activePeriod === "p1") {
            scoreA = currentScores.teamA; scoreB = currentScores.teamB;
          } else if (activePeriod === 'p2') {
            scoreA = currentScores.teamA; scoreB = currentScores.teamB;
          } else {
            scoreA = currentScores.final.home; scoreB = currentScores.final.away;
          }
        } else {
          // Football/Basketball: Cumulative scoring
          if (activePeriod === "p1") {
            scoreA = currentScores.p1.home; scoreB = currentScores.p1.away;
          } else if (activePeriod === "p2") {
            scoreA = currentScores.p1.home + currentScores.p2.home;
            scoreB = currentScores.p1.away + currentScores.p2.away;
          } else if (activePeriod === "p3") {
            scoreA = currentScores.p1.home + currentScores.p2.home + currentScores.p3.home;
            scoreB = currentScores.p1.away + currentScores.p2.away + currentScores.p3.away;
          } else {
            scoreA = currentScores.final.home; scoreB = currentScores.final.away;
          }
        }
    }

    const rowIndex = axis.row.indexOf(scoreA % 10);
    const colIndex = axis.col.indexOf(scoreB % 10);
    if (rowIndex === -1 || colIndex === -1) return null;
    return { row: rowIndex, col: colIndex };
  }, [currentScores, activePeriod, game, sportType]);

  // Current axis
  const defaultAxis = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const currentAxis = game?.isScrambled
    ? game.axis?.[activePeriod] || { row: defaultAxis, col: defaultAxis }
    : { row: defaultAxis, col: defaultAxis };

  // --- GRID DATA ---
  const formattedSquares = useMemo(() => {
    if (!game?.squares) return {};
    const result: Record<string, { uid: string; name: string; claimedAt: number }[]> = {};
    Object.entries(game.squares).forEach(([key, value]) => {
      const index = parseInt(key);
      if (isNaN(index)) return;
      const gridKey = `${Math.floor(index / 10)}-${index % 10}`;
      if (!result[gridKey]) result[gridKey] = [];
      const users = Array.isArray(value) ? value : [value];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      users.forEach((sq: any) => {
        if (sq) result[gridKey].push({ uid: sq.userId, name: sq.displayName, claimedAt: 0 });
      });
    });
    return result;
  }, [game]);

  // --- SIDEBAR PAYOUTS (SPORT-AWARE) ---
  const livePot = Object.keys(game?.squares || {}).length * (game?.price || 10);
  const livePayouts = useMemo(() => {
    const payoutMap: Record<string, number> = {};
    sportConfig.periods.forEach(period => {
      const percentage = sportConfig.payoutStructure[period];
      payoutMap[period] = Math.floor(livePot * percentage);
    });
    return payoutMap;
  }, [livePot, sportConfig]);

  // 3. GAME STATS HOOK (SPORT-AWARE)
  const gameStats = useMemo(() => {
    if (!game) return { payouts: {}, winners: [], currentPotential: 0 };

    const getOwner = (period: PeriodKey) => {
      const axis = (game.isScrambled && game.axis && game.axis[period]) ? game.axis[period] : { row: defaultAxis, col: defaultAxis };
      let sA = 0, sB = 0;
      
      // Apply sport-specific scoring logic
      if (!game.espnGameId) {
          sA = currentScores.teamA; sB = currentScores.teamB;
      } else {
          if (sportType === 'soccer') {
            // Soccer: Use current total score for each period
            if (period === "p1") { sA = currentScores.teamA; sB = currentScores.teamB; }
            else if (period === "p2") { sA = currentScores.teamA; sB = currentScores.teamB; }
            else { sA = currentScores.final.home; sB = currentScores.final.away; }
          } else {
            // Football/Basketball: Cumulative
            if (period === "p1") { sA = currentScores.p1.home; sB = currentScores.p1.away; } 
            else if (period === "p2") { sA = currentScores.p1.home + currentScores.p2.home; sB = currentScores.p1.away + currentScores.p2.away; } 
            else if (period === "p3") { sA = currentScores.p1.home + currentScores.p2.home + currentScores.p3.home; sB = currentScores.p1.away + currentScores.p2.away + currentScores.p3.away; } 
            else { sA = currentScores.final.home; sB = currentScores.final.away; }
          }
      }

      const r = axis.row.indexOf(sA % 10);
      const c = axis.col.indexOf(sB % 10);
      if (r === -1 || c === -1) return null;
      const cell = game.squares[r * 10 + c];
      if (Array.isArray(cell)) return cell.length > 0 ? cell[0] : null;
      return cell || null;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (matchedGame as any)?.status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusType = (matchedGame as any)?.statusDetail;
    const p = matchedGame?.period || 1;
    const isFinal = status === "post" || (statusType && statusType.includes("Final"));

    const results: { key: PeriodKey | string; label: string; winner: string; amount: number; rollover: boolean }[] = [];

    // Check which periods have payouts and which are complete
    displayPeriods.forEach((period, idx) => {
      const periodComplete = sportType === 'soccer' 
        ? (period === 'p1' && p > 1) || (period === 'p2' && (p > 2 || isFinal)) || (period === 'final' && isFinal)
        : (idx < p - 1) || (period === 'final' && isFinal);
      
      const winner = getOwner(period);
      const amount = livePayouts[period] || 0;
      
      if (periodComplete && winner && amount > 0) {
        results.push({ 
          key: period, 
          label: getPeriodLabel(period, sportType), 
          winner: winner.displayName, 
          amount, 
          rollover: false 
        });
      }
    });
    
    return { payouts: livePayouts, winners: results, currentPotential: livePayouts[activePeriod] || 0 };
  }, [game, currentScores, matchedGame, activePeriod, livePayouts, sportType, displayPeriods]);

  // --- HANDLERS ---
  const handleSquareClick = (row: number, col: number) => {
    const index = row * 10 + col;
    setSelectedCell({ row, col });
    setIsManualView(true);
    if (game?.isScrambled && !isAdmin) return;
    if (pendingSquares.includes(index)) {
      setPendingSquares((prev) => prev.filter((i) => i !== index));
      return;
    }

    // FIX: Access using index (0-99), not "row-col" string
    const rawData = game?.squares?.[index];
    const usersInSquare = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const alreadyInSquare = user && usersInSquare.some((u: any) => (u.uid && u.uid === user.uid) || (u.userId && u.userId === user.uid));
    if (alreadyInSquare) {
      alert("You already have a spot in this square!");
      return;
    }

    let ownedCount = 0;
    if (user && game?.squares) {
      // FIX: Handle both array and single object data structure for counting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.values(game.squares).forEach((sqValue: any) => {
        const sqUsers = Array.isArray(sqValue) ? sqValue : [sqValue];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (sqUsers.some((u: any) => (u.uid && u.uid === user.uid) || (u.userId && u.userId === user.uid))) {
          ownedCount++;
        }
      });
    }

    if (ownedCount + pendingSquares.length >= 10) {
      alert("Limit reached: You can only choose up to 10 squares.");
      return;
    }
    setPendingSquares((prev) => [...prev, index]);
  };

  const handleAuth = async () => { if (user) await logOut(); else router.push("/?action=login"); };
  const handleConfirmCart = async () => {
    if (!user) { await handleAuth(); return; }
    if (pendingSquares.length === 0) return;
    setIsSubmitting(true);
    try {
      for (const index of pendingSquares) await claimSquare(index);
      setPendingSquares([]); setSelectedCell(null);
    } catch (err) { alert("Error claiming squares"); } finally { setIsSubmitting(false); }
  };
  const handleClearCart = () => setPendingSquares([]);
  const handleClaim = async () => {
    if (!selectedCell || !game) return;
    if (!user) { await handleAuth(); return; }
    if (game.isScrambled && !isAdmin) { alert("Game is locked!"); return; }
    setIsSubmitting(true);
    try { await claimSquare(selectedCell.row * 10 + selectedCell.col); } catch (err) { alert("Failed to claim."); } finally { setIsSubmitting(false); }
  };
  const handleUnclaim = async () => { if (selectedCell) await unclaimSquare(selectedCell.row * 10 + selectedCell.col); };
  const copyCode = () => { if (game) { navigator.clipboard.writeText(game.id); setCopied(true); setTimeout(() => setCopied(false), 2000); } };
  const handleDelete = async () => { if (confirm("Are you sure you want to delete this game?")) { await deleteGame(); router.push("/"); } };
   
  // 4. Loading Screen
  if (!game || !game?.teamA) {
    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#0B0C15] text-cyan-400">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            <p className="animate-pulse font-black tracking-widest uppercase text-xs">LOADING GAME DATA...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0C15] text-white font-teko text-2xl tracking-widest">
        GAME NOT FOUND (OR DATA INCOMPLETE)
      </div>
    );
  }

  const cartTotal = pendingSquares.length * game.price;

  return (
    <main className="flex flex-col lg:flex-row h-screen w-full bg-[#0B0C15] overflow-hidden">
      {/* 1. MAIN AREA */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar relative">
        {/* MOBILE HEADER */}
        <div className="lg:hidden p-4 bg-[#0B0C15]/95 sticky top-0 z-50 backdrop-blur-md flex justify-between items-center border-b border-white/5">
          <div onClick={() => router.push("/")} className="flex items-center gap-2 cursor-pointer">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20">
              <Image src="/SouperBowlDark.png" alt="Logo" fill className="object-cover" />
            </div>
            <span className="font-bold text-white tracking-widest text-xs uppercase">Souper Bowl Squares</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAuth} className="p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
              {user ? <LogOut className="w-4 h-4 text-red-400" /> : <LogIn className="w-4 h-4 text-green-400" />}
            </button>
            <button onClick={copyCode} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
              <span className="text-xs font-mono text-slate-400">{game.id.slice(0, 6)}...</span>
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-2 lg:p-4 gap-2 lg:gap-4">
          {/* SCOREBOARD */}
          <div className="w-full relative group z-20 shrink-0">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 via-indigo-500/10 to-cyan-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>
            <div className="relative w-full bg-[#0f111a]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex flex-col items-center shadow-2xl">
              <div className="flex w-full justify-between items-start relative">
                {/* TEAM A */}
                <div className="flex flex-col items-center justify-start w-[35%] relative z-0">
                  <div className="flex items-center gap-2 mb-1 justify-center w-full">
                    <img src={getTeamLogo(game.teamA)} alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                    <span className="text-pink-500 font-teko text-xs md:text-xl tracking-wide uppercase text-center leading-tight whitespace-normal break-words max-w-[80px] md:max-w-none">
                      {game.teamA}
                    </span>
                  </div>
                  <span className="text-5xl md:text-8xl font-teko text-white leading-none drop-shadow-[0_0_20px_rgba(236,72,153,0.6)] mt-1">
                    {/* Sport-aware score display */}
                    {!game.espnGameId 
                        ? currentScores.teamA 
                        : (activePeriod === "final" 
                            ? currentScores.final.home 
                            : sportType === 'soccer'
                              ? currentScores.teamA  // Soccer: Always show total score during live play
                              : (activePeriod === "p1" 
                                  ? currentScores.p1.home 
                                  : activePeriod === "p2" 
                                    ? currentScores.p1.home + currentScores.p2.home 
                                    : currentScores.p1.home + currentScores.p2.home + currentScores.p3.home))
                    }
                  </span>
                </div>
                {/* CLOCK */}
                <div className="flex flex-col items-center w-[30%] shrink-0 z-10 pt-2">
                  <LiveGameClock game={matchedGame} />
                  <div className="flex bg-black/40 rounded-full p-1 border border-white/10 scale-75 md:scale-100">
                    {displayPeriods.map((period) => (
                      <button key={period} onClick={() => handlePeriodChange(period)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${activePeriod === period ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}>
                        {getPeriodLabel(period, sportType)}
                      </button>
                    ))}
                  </div>
                  {game.espnGameId ? (
                     espnError ? (
                        <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest animate-pulse">Sync Error</span>
                     ) : (
                        <span className="flex items-center justify-center">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
                        </span>
                     )
                  ) : (
                     <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Manual Mode</span>
                  )}
                </div>
                {/* TEAM B */}
                <div className="flex flex-col items-center justify-start w-[35%] relative z-0">
                  <div className="flex items-center gap-2 mb-1 justify-center w-full">
                    <span className="text-cyan-400 font-teko text-xs md:text-xl tracking-wide uppercase text-center leading-tight whitespace-normal break-words max-w-[80px] md:max-w-none">
                      {game.teamB}
                    </span>
                    <img src={getTeamLogo(game.teamB)} alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                  </div>
                  <span className="text-5xl md:text-8xl font-teko text-white leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] mt-1">
                    {!game.espnGameId 
                        ? currentScores.teamB 
                        : (activePeriod === "final" 
                            ? currentScores.final.away 
                            : sportType === 'soccer'
                              ? currentScores.teamB  // Soccer: Always show total score during live play
                              : (activePeriod === "p1" 
                                  ? currentScores.p1.away 
                                  : activePeriod === "p2" 
                                    ? currentScores.p1.away + currentScores.p2.away 
                                    : currentScores.p1.away + currentScores.p2.away + currentScores.p3.away))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* GRID */}
          <div className="w-full aspect-square shrink-0 relative z-10">
            <div className="h-full w-full bg-[#0f111a] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
              <Grid rows={currentAxis.row} cols={currentAxis.col} squares={formattedSquares} onSquareClick={handleSquareClick} teamA={game.teamA || "Home"} teamB={game.teamB || "Away"} teamALogo={getTeamLogo(game.teamA)} teamBLogo={getTeamLogo(game.teamB)} isScrambled={game.isScrambled} selectedCell={selectedCell} winningCell={winningCoordinates} pendingIndices={pendingSquares} currentUserId={user?.uid} />
            </div>
          </div>

          {/* CART / DETAILS BOX */}
          {pendingSquares.length > 0 ? (
            <div className="w-full bg-[#151725] border border-indigo-500/50 rounded-2xl p-4 shadow-xl shrink-0 animate-in slide-in-from-bottom-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30"><ShoppingCart className="w-5 h-5 text-white" /></div>
                  <div className="flex flex-col"><span className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Selected Squares</span><span className="text-xl font-black text-white">{pendingSquares.length} <span className="text-sm font-medium text-slate-400">Total: ${cartTotal}</span></span></div>
                </div>
                <button onClick={handleClearCart} className="text-xs text-slate-500 hover:text-white underline">Clear</button>
              </div>
              <button onClick={handleConfirmCart} disabled={isSubmitting} className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : user ? `Confirm & Claim ($${cartTotal})` : "Sign In to Claim"}
              </button>
            </div>
          ) : (
            // --- DETAILS PANEL ---
            (() => {
                const targetCell = selectedCell || winningCoordinates;
                const isWinnerView = !selectedCell && winningCoordinates; 
                const isTargetWinning = winningCoordinates && targetCell && winningCoordinates.row === targetCell.row && winningCoordinates.col === targetCell.col;
                return (
                    <div className={`w-full bg-[#151725] border ${isTargetWinning ? "border-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.2)]" : "border-white/10"} rounded-2xl p-3 shadow-xl shrink-0 transition-all`}>
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col flex-1">
                          {/* OWNERS AT TOP - THE HERO */}
                          {targetCell && (() => {
                             const cellKey = `${targetCell.row}-${targetCell.col}`;
                             const cellData = formattedSquares[cellKey] || [];
                             return cellData.length > 0 ? (
                                <div className="flex flex-row flex-wrap gap-2 items-center mb-2">
                                  {cellData.map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                      <span className={`text-xl font-bold ${p.uid === user?.uid ? "text-indigo-300" : "text-white"}`}>{p.name}</span>
                                      {(isAdmin || p.uid === user?.uid) && <button onClick={handleUnclaim} className="hover:text-red-400 transition-colors text-slate-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                                    </div>
                                  ))}
                                </div>
                             ) : null;
                          })()}
                          
                          {/* METADATA BELOW - REDUCED PROMINENCE */}
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {isWinnerView && <><Trophy className="w-3 h-3 text-yellow-500" /><span>Winning Square</span></>}
                            {selectedCell && <span className="text-slate-500">Selected Square</span>}
                            {targetCell && (
                              <span className="flex items-center gap-1">
                                (Row {currentAxis.row[targetCell.row]} • Col {currentAxis.col[targetCell.col]})
                                {isTargetWinning && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />}
                              </span>
                            )}
                            {!targetCell && <span className="text-slate-500">Select a Square</span>}
                          </div>
                        </div>
                        {selectedCell && <button onClick={() => setSelectedCell(null)} className="p-1 rounded-full hover:bg-white/10 text-slate-500 ml-2"><X className="w-4 h-4" /></button>}
                      </div>
                      {targetCell && (() => {
                         const cellKey = `${targetCell.row}-${targetCell.col}`;
                         const cellData = formattedSquares[cellKey] || [];
                         return cellData.length === 0 ? (
                            <div className="p-2 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-lg mt-2">Empty Square</div>
                         ) : null;
                      })()}
                      {!targetCell && <div className="text-center py-4 text-slate-500 text-xs">Tap empty squares to build your cart.</div>}
                    </div>
                )
            })()
          )}

          <div className="lg:hidden w-full pb-20">
            {/* MOBILE GAME INFO */}
            <GameInfo
              gameId={game.id}
              gameName={game.name}
              host={game.host}
              pricePerSquare={game.price}
              totalPot={livePot}
              payouts={livePayouts}
              winners={gameStats?.winners || []}
              matchup={{ teamA: game.teamA || "Home", teamB: game.teamB || "Away" }}
              scores={{ teamA: game.scores?.teamA || 0, teamB: game.scores?.teamB || 0 }} 
              isAdmin={isAdmin}
              isScrambled={game.isScrambled}
              eventDate={matchedGame?.date || game.createdAt?.toDate?.()?.toString() || new Date().toISOString()}
              onUpdateScores={updateScores}
              onDeleteGame={handleDelete}
              onScrambleGridDigits={scrambleGrid}
              onResetGridDigits={resetGrid}
              selectedEventId={game.espnGameId}
              availableGames={liveGames}
              sportType={sportType}
            />
          </div>
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:flex w-[400px] xl:w-[450px] bg-[#0f111a] border-l border-white/5 flex-col h-full overflow-y-auto p-6 z-20 shadow-2xl relative">
        <div className="mb-6">
          <div onClick={() => router.push("/")} className="cursor-pointer group">
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 mb-4 shadow-xl group-hover:shadow-2xl transition-all">
              <Image src="/SouperBowlBanner.jpg" alt="Banner" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] to-transparent/50" />
              <div className="absolute bottom-3 left-3 flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg"><Image src="/SouperBowlDark.png" alt="Logo" fill className="object-cover" /></div>
                <div><h1 className="text-white font-black text-xl tracking-wider uppercase leading-none drop-shadow-md">Souper Bowl</h1><h1 className="text-indigo-400 font-black text-xl tracking-wider uppercase leading-none drop-shadow-md">Squares</h1></div>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-medium leading-relaxed border-l-2 border-indigo-500 pl-3 italic">"Go Big or Go Home. Connect, compete, and win big with the ultimate squares experience. Because with us, a Nguyen is always a Win"</p>
          </div>
          <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
            <button onClick={handleAuth} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-white font-bold text-xs uppercase hover:bg-slate-700 transition-colors">
              {user ? <><LogOut className="w-4 h-4 text-red-400" /><span>Log Out</span></> : <><LogIn className="w-4 h-4 text-green-400" /><span>Log In</span></>}
            </button>
          </div>
        </div>
        {/* DESKTOP GAME INFO */}
        <GameInfo
          gameId={game.id}
          gameName={game.name}
          host={game.host}
          pricePerSquare={game.price}
          totalPot={livePot}
          payouts={livePayouts}
          winners={gameStats?.winners || []}
          matchup={{ teamA: game.teamA || "Home", teamB: game.teamB || "Away" }}
          scores={{ teamA: game.scores?.teamA || 0, teamB: game.scores?.teamB || 0 }}
          isAdmin={isAdmin}
          isScrambled={game.isScrambled}
          eventDate={matchedGame?.date || game.createdAt?.toDate?.()?.toString() || new Date().toISOString()}
          onUpdateScores={updateScores}
          onDeleteGame={handleDelete}
          onScrambleGridDigits={scrambleGrid}
          onResetGridDigits={resetGrid}
          selectedEventId={game.espnGameId}
          availableGames={liveGames}
          sportType={sportType}
        />
      </div>
    </main>
  );
}