"use client";

import React, { useMemo, useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, PlusCircle, LayoutGrid, Users as UsersIcon, LogOut, DollarSign, Trophy } from "lucide-react";
import Grid from "@/components/Grid";
import GameInfo from "@/components/GameInfo";
import GameWinnersLog from "@/components/GameWinnersLog";
import PlayerList from "@/components/PlayerList";
import CreateGameForm from "@/components/CreateGameForm";
import JoinGameForm from "@/components/JoinGameForm";
import SquareDetails from "@/components/SquareDetails";
import PropBetsList from "@/components/PropBetsList";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useGame, type GameState } from "@/context/GameContext";
import { cn } from "@/lib/utils";
import { EspnScoreData, useEspnScores } from "@/hooks/useEspnScores";

type View = "home" | "create" | "game" | "join" | "props";

function SquaresApp() {
  const router = useRouter();
  // Wrap useSearchParams in a way that is robust or accept that it might be null during SSR?
  // Since it's a client component, it's fine.
  const searchParams = useSearchParams();
  const initialGameCode = searchParams.get("code") || "";
  const currentView = (searchParams.get("view") as View) || (initialGameCode ? "join" : "home");

  // State "view" is now derived. We don't need local state for it anymore,
  // but if we want to keep the existing logic simple, we can just use the Derived view.
  // HOWEVER, existing components might expect view state to be immediate.
  // We'll trust the router.

  const { user, logout, loading, isAdmin } = useAuth();
  const { activeGame, settings, squares, players, scores, claimSquare, unclaimSquare, togglePaid, deletePlayer, updateScores, leaveGame, resetGame, scrambleGridDigits, resetGridDigits, updateSettings, getUserGames, joinGame, logPayout, payoutHistory, deleteGame } = useGame();
  const { games: liveGames } = useEspnScores();
  
  const [myGames, setMyGames] = useState<GameState[]>([]);
  const [hasCheckedGames, setHasCheckedGames] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const sortedMyGames = useMemo(() => {
    const list = myGames.map(game => {
      const liveInfo = liveGames.find(lg => lg.id === game.settings.espnGameId);
      return {
        ...game,
        isLive: liveInfo?.isLive ?? false,
        isStarted: game.settings.isScrambled
      };
    });

    return list.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      if (a.isStarted && !b.isStarted) return -1;
      if (!a.isStarted && b.isStarted) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [myGames, liveGames]);

  const totalPot = useMemo(() => {
    return players.reduce((acc, p) => acc + (p.squares * settings.pricePerSquare), 0);
  }, [players, settings.pricePerSquare]);

  const payouts = useMemo(() => {
    // Default distribution: 20% Q1, 20% Q2, 20% Q3, 40% Final
    const distribution = [0.20, 0.20, 0.20, 0.40];
    
    // If we have custom payout settings, try to respect the labels, otherwise default
    const defaults = ["Q1 Winner", "Q2 Winner", "Q3 Winner", "Final Winner"];
    
    return distribution.map((pct, i) => {
      const existing = settings.payouts && settings.payouts[i];
      return {
        label: existing ? existing.label : defaults[i],
        amount: Math.floor(totalPot * pct)
      };
    });
  }, [totalPot, settings.payouts]);

  // Helper to change view
  const setView = (v: View) => {
    router.push(`/?view=${v}`);
  };

  // Auto-redirect to game if user belongs to exactly one
  useEffect(() => {
    if (!user || hasCheckedGames) return;

    let mounted = true;
    async function checkMyGames() {
      if (!user) return;
      const games = await getUserGames(user.uid);
      if (!mounted) return;
      
      setMyGames(games);
      setHasCheckedGames(true);

      // Only auto-join if we are NOT already in a game (activeGame null) and haven't selected one
      if (games.length === 1 && !activeGame) {
        // Pass user.uid to joinGame to bypass password if we are a participant
        await joinGame(games[0].id, undefined, user.uid);
        router.push("/?view=game");
      }
    }
    checkMyGames();
    return () => { mounted = false; };
  }, [user, hasCheckedGames, activeGame, getUserGames, joinGame, router]);

  const isHost = !!user && !!activeGame && user.uid === activeGame.hostUserId;
  const canManage = isAdmin || isHost;
  const userName = user?.displayName || user?.email?.split("@")[0] || "Player";

  const handleEventSelect = (game: EspnScoreData | null) => {
    if (!canManage) return;
    if (game) {
      void updateSettings({
        teamA: game.awayTeam.name,
        teamB: game.homeTeam.name,
        espnGameId: game.id,
        eventName: game.name,
        espnLeague: game.league,
        eventDate: game.date,
      });
      return;
    }
    void updateSettings({
      espnGameId: "",
      eventName: "",
      espnLeague: "",
      eventDate: "",
    });
  };

  const handleDeleteGame = async () => {
    if (!canManage) return;
    if (window.confirm("Are you sure you want to PERMANENTLY DELETE this game? This action cannot be undone and all data will be lost.")) {
        if (window.confirm("Please confirm one last time: Delete Game Forever?")) {
            await deleteGame();
            setView("home");
        }
    }
  };

  const handleManualPayout = async (teamA: number, teamB: number) => {
    if (!canManage) return;

    // 1. Update scores globally if different to ensure everyone sees the winning score
    if (teamA !== scores.teamA || teamB !== scores.teamB) {
        await updateScores(teamA, teamB);
    }

    // 2. Validate Grid
    const rowDigit = ((teamA % 10) + 10) % 10;
    const colDigit = ((teamB % 10) + 10) % 10;
    const rowIndex = settings.rows.indexOf(rowDigit);
    const colIndex = settings.cols.indexOf(colDigit);

    if (rowIndex < 0 || colIndex < 0) {
        alert("Cannot determine winner: Grid digits are not set or grid is invalid.");
        return;
    }

    // 3. Identify Winner
    const key = `${rowIndex}-${colIndex}`;
    const claims = squares[key] || [];
    
    // 4. Determine Payout Details
    // Use the next available label from our standard set, or fallback
    const standardLabels = ["Q1 Winner", "Q2 Winner", "Q3 Winner", "Final Winner"];
    const nextLabelIndex = Math.min(payoutHistory.length, standardLabels.length - 1);
    const label = standardLabels[nextLabelIndex];
    
    // Amount from our calculated `payouts` memo
    const payoutInfo = payouts.find(p => p.label === label) || payouts[payouts.length - 1];
    const amount = payoutInfo ? payoutInfo.amount : 0;

    if (claims.length === 0) {
        if (!confirm(`No player on square ${teamA}-${teamB} (Row:${rowDigit}, Col:${colDigit}). Log "No Winner"?`)) {
            return;
        }
    }

    const winners = claims.map((c) => ({ uid: c.uid, name: c.name }));
    const primaryWinner = winners[0] || { uid: "NONE", name: "No Winner (Rollover)" };
    const winnerNamesCombined = winners.length > 0 ? winners.map((w) => w.name).join(", ") : primaryWinner.name;
    const timestamp = Date.now();
    const triggerId = `manual_q_${timestamp}`;

    await logPayout({
      id: triggerId,
      period: nextLabelIndex + 1,
      label,
      amount,
      winnerUserId: primaryWinner.uid,
      winnerName: winnerNamesCombined,
      winners,
      timestamp,
      teamAScore: teamA,
      teamBScore: teamB,
      gameId: activeGame?.id,
      gameName: activeGame?.settings?.name,
      teamA: activeGame?.settings?.teamA,
      teamB: activeGame?.settings?.teamB,
      eventDate: activeGame?.settings?.eventDate
    });
  };

  const winningCell = useMemo(() => {
    const rowDigit = ((scores.teamA % 10) + 10) % 10;
    const colDigit = ((scores.teamB % 10) + 10) % 10;
    // json stringify to prevent ref changes
    const rowsStr = JSON.stringify(settings.rows);
    const colsStr = JSON.stringify(settings.cols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const rows = JSON.parse(rowsStr) as number[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const cols = JSON.parse(colsStr) as number[];

    const rowIndex = rows.indexOf(rowDigit);
    const colIndex = cols.indexOf(colDigit);
    if (rowIndex < 0 || colIndex < 0) return null;
    return { row: rowIndex, col: colIndex };
  }, [scores.teamA, scores.teamB, settings.rows, settings.cols]);

  // Find the matching live game
  const matchedLiveGame = useMemo(() => {
    if (!activeGame || liveGames.length === 0) return null;
    
    // If we have an explicit ESPN Game ID linked, ONLY sync with that game.
    // This allows manual overrides (by clearing the ID) to work without interference.
    if (settings.espnGameId) {
      return liveGames.find(g => g.id === settings.espnGameId);
    }
    
    // If no explicit ID is linked, we DO NOT fuzzy match anymore to prevent accidental overwrites
    // when admin wants manual control.
    return null;
  }, [liveGames, activeGame, settings.espnGameId]);

  // Sync with Live ESPN Data
  useEffect(() => {
    if (!matchedLiveGame) return;

    const liveData = matchedLiveGame;
    const homeScore = parseInt(liveData.homeTeam.score, 10);
    const awayScore = parseInt(liveData.awayTeam.score, 10);
    if (isNaN(homeScore) || isNaN(awayScore)) return;

    const homeName = liveData.homeTeam.name.toLowerCase();
    const awayName = liveData.awayTeam.name.toLowerCase();
    const teamAName = settings.teamA.toLowerCase();
    const teamBName = settings.teamB.toLowerCase();

    // Heuristics to map API Home/Away to Context TeamA/TeamB
    let newAScore = scores.teamA;
    let newBScore = scores.teamB;
    let mismatched = false;

    if (teamAName.includes(homeName) || homeName.includes(teamAName)) {
       newAScore = homeScore;
       newBScore = awayScore; 
    } else if (teamAName.includes(awayName) || awayName.includes(teamAName)) {
       newAScore = awayScore;
       newBScore = homeScore;
    } else if (teamBName.includes(homeName) || homeName.includes(teamBName)) {
       newBScore = homeScore;
       newAScore = awayScore;
    } else if (teamBName.includes(awayName) || awayName.includes(teamBName)) {
       newBScore = awayScore;
       newAScore = homeScore;
    } else {
       mismatched = true;
    }

    if (!mismatched && (scores.teamA !== newAScore || scores.teamB !== newBScore)) {
      updateScores(newAScore, newBScore);
    }
  }, [matchedLiveGame, settings.teamA, settings.teamB, scores.teamA, scores.teamB, updateScores]);

  const logos = useMemo(() => {
    if (!matchedLiveGame) return { teamA: undefined, teamB: undefined };
    
    const home = matchedLiveGame.homeTeam;
    const away = matchedLiveGame.awayTeam;
    const homeName = home.name.toLowerCase();
    const awayName = away.name.toLowerCase();
    const teamAName = settings.teamA.toLowerCase();
    const teamBName = settings.teamB.toLowerCase();
    
    let logoA = undefined;
    let logoB = undefined;

    // Try to match A
    if (teamAName.includes(homeName) || homeName.includes(teamAName)) logoA = home.logo;
    else if (teamAName.includes(awayName) || awayName.includes(teamAName)) logoA = away.logo;

    // Try to match B
    if (teamBName.includes(homeName) || homeName.includes(teamBName)) logoB = home.logo;
    else if (teamBName.includes(awayName) || awayName.includes(teamBName)) logoB = away.logo;

    return { teamA: logoA, teamB: logoB };
 }, [matchedLiveGame, settings.teamA, settings.teamB]);

  // Automatic Payout Logic
  useEffect(() => {
    if (!matchedLiveGame) return;

    const leagueKey = (matchedLiveGame.league || settings.espnLeague || "").toLowerCase();
    const isNFL = leagueKey.includes("nfl") || leagueKey.includes("football");
    const isNBA = leagueKey.includes("nba") || leagueKey.includes("basketball");

    const effectivePayoutFrequency = isNBA
      ? (settings.payoutFrequency === "NBA_Frequent" ? "NBA_Frequent" : "NBA_Standard")
      : isNFL
        ? "NBA_Standard"
        : settings.payoutFrequency;

    if (!effectivePayoutFrequency || effectivePayoutFrequency === "Manual") return;

    const { period, clock, status, statusDetail } = matchedLiveGame;
    const isSoccer = leagueKey.includes("soccer") || leagueKey.includes("ucl") || leagueKey.includes("epl") || leagueKey.includes("mls") || leagueKey.includes("uefa");
    // Helper to parse clock "MM:SS" -> seconds
    const parseClock = (str: string) => {
      const parts = str.split(":").map(Number);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return 0;
    };
    const secondsLeft = parseClock(clock);
    const isQuarterEnd = secondsLeft === 0 || status === "post";
    // For NBA (12 min quarters), mid-point is around 6:00 (360s)
    const isQuarterMid = secondsLeft <= 360 && secondsLeft > 0;

    // Determine current trigger
    let triggerId = "";
    let triggerLabel = "";
    
    if (isSoccer) {
      const isHalftime = period === 1 && /half|halftime|ht/i.test(statusDetail || "");
      const isFullTime = status === "post";
      if (isHalftime) {
        triggerId = "H1_END";
        triggerLabel = "H1 Winner";
      } else if (isFullTime) {
        triggerId = "H2_END";
        triggerLabel = "Final Winner";
      }
    } else {
      // Q1..Q4 logic
      if (period >= 1 && period <= 4) {
        if (effectivePayoutFrequency === "NBA_Frequent" && isQuarterMid) {
          triggerId = `Q${period}_MID`;
          triggerLabel = `Q${period} Midpoint`;
        } else if (isQuarterEnd) {
          triggerId = `Q${period}_END`;
          triggerLabel = `Q${period} Winner`;
          if (period === 4) triggerLabel = "Final Winner";
        }
      }
    }
    
    if (!triggerId) return;

    // Check if already logged
    if (payoutHistory.some(p => p.id === triggerId)) return;

    // Calculate winner
    const rowDigit = ((scores.teamA % 10) + 10) % 10;
    const colDigit = ((scores.teamB % 10) + 10) % 10;
    const rowIndex = settings.rows.indexOf(rowDigit);
    const colIndex = settings.cols.indexOf(colDigit);

    if (rowIndex < 0 || colIndex < 0) return; // Grid probably scrambled? or not set up?

    const key = `${rowIndex}-${colIndex}`;
    const claims = squares[key] || [];
    
    // If multiple people claimed the square (rare but possible in some variants), just pick first or all? 
    // Usually squares are unique.
    if (claims.length === 0) {
        // Log "No Winner" -> Carry over? For now just log "Rollover"
         void logPayout({
          id: triggerId,
          period,
          label: triggerLabel,
          amount: 0,
          winnerUserId: "NONE",
          winnerName: "No Winner (Rollover)",
          timestamp: Date.now(),
          teamAScore: scores.teamA,
          teamBScore: scores.teamB
        });
        return;
    }
    
    const payoutAmount = Math.floor(totalPot * (triggerLabel.includes("Final") ? 0.4 : 0.2)); 
    // Note: This payout calculation is static based on 20/20/20/40. If frequent, we might want to split it.
    // If "Frequent", we have 8 payouts (Q1 mid, Q1 end, ...).
    // The prompt didn't specify amount logic for frequent.
    // I'll assume for "Frequent", we split the Quarter pot? Or just log the event.
    // Let's assume standard distribution for now, maybe split in half if "Frequent"?
    // If Frequent, we have 8 events. 100% / 8 = 12.5% each?
    // Let's stick to the prompt: "trigger a 'Winner' notification and log a payout".
    // I will dynamically calculate amount: 
    // Standard: 4 events. 20/20/20/40.
    // Frequent: 8 events. Let's do 10/10/10/10/10/10/10/30? Or 12.5 flat.
    // I'll use a simple heuristic:
    let actualAmount = payoutAmount;
    if (effectivePayoutFrequency === "NBA_Frequent") {
        // Split the quarter's allocation in half?
        actualAmount = Math.floor(payoutAmount / 2);
    }
    
    // Multiple users can share the winning square. Include all names in the notification.
    const winners = claims.map((c) => ({ uid: c.uid, name: c.name }));
    const primaryWinner = winners[0];
    const winnerNamesCombined = winners.map((w) => w.name).join(", ");

    void logPayout({
      id: triggerId,
      period,
      label: triggerLabel,
      amount: actualAmount,
      winnerUserId: primaryWinner.uid,
      winnerName: winnerNamesCombined,
      winners,
      timestamp: Date.now(),
      teamAScore: scores.teamA,
      teamBScore: scores.teamB,
      // Add metadata for global history
      gameId: activeGame?.id,
      gameName: activeGame?.settings?.name,
      teamA: activeGame?.settings?.teamA,
      teamB: activeGame?.settings?.teamB,
      eventDate: activeGame?.settings?.eventDate
    });

  }, [matchedLiveGame, isHost, settings.payoutFrequency, scores, squares, settings.rows, settings.cols, payoutHistory, totalPot, logPayout, activeGame]);
  
  // Show Payout Notification (Toast)
  useEffect(() => {
    // Determine the most recent payout
    if (payoutHistory.length === 0) return;
    const latest = payoutHistory[0]; // Sorted desc in context
    
    // Check if valid timestamp (fresh within last 10 seconds? or just show it if we haven't seen it?)
    // This is a simple view component, maybe we don't need a toast, just a section.
    // Prompt said "trigger a 'Winner' notification".
    // I'll use browser Alert for now or valid UI if I can fit it.
    // A persistent "Last Payout" banner is better.
    
  }, [payoutHistory]);

  if (loading) return null;
  if (!user) return <AuthModal />;

  const handleSquareClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    if (!user) return;
    
    // Check if user has already claimed this square
    const key = `${row}-${col}`;
    const existing = squares[key] || [];
    const userClaim = existing.find(c => c.uid === user.uid);
    
    if (userClaim) {
       // Ask if they want to unclaim? Or just check if allowed to unclaim.
       // We'll trust unclaimSquare to check lock status
       if (confirm("You already own this square. Do you want to remove your claim?")) {
          void unclaimSquare(row, col, user.uid);
       }
       return;
    }

    void claimSquare(row, col, {
      id: user.uid,
      name: user.displayName || "Anonymous",
    });
  };

  const handleCopyUid = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      window.setTimeout(() => setCopiedUid(false), 1500);
    } catch {
      // Clipboard may be blocked by browser permissions.
      alert("Could not copy UID. Please copy from Firebase Console.");
    }
  };

  const handleQuickPick = async (count: number) => {
    if (!user) return;
    const cost = count * settings.pricePerSquare;
    if (!confirm(`Quick pick ${count} squares for $${cost}?`)) return;

    // 1. Identify all available squares
    const availableCells: { row: number; col: number }[] = [];
    for (let r = 0; r < settings.rows.length; r++) {
      for (let c = 0; c < settings.cols.length; c++) {
        const key = `${r}-${c}`;
        const claims = squares[key] || [];
        // Assuming square limit is 10 per cell? Or exclusive?
        // Usually squares are 1 per person unless "100 squares" grid. 
        // Code in context: `if (existingClaims.length >= 10) return;`
        // Code in context: `if (existingClaims.some((c) => c.uid === player.id)) return;`
        
        const myClaim = claims.find(cl => cl.uid === user.uid);
        if (claims.length < 10 && !myClaim) {
           availableCells.push({ row: r, col: c });
        }
      }
    }

    if (availableCells.length < count) {
      alert(`Not enough squares available. Only ${availableCells.length} left.`);
      return;
    }

    // 2. Shuffle (Fisher-Yates)
    for (let i = availableCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableCells[i], availableCells[j]] = [availableCells[j], availableCells[i]];
    }

    // 3. Pick first N
    const picks = availableCells.slice(0, count);

    // 4. Claim them
    // We execute sequentially to avoid overwhelming browser/connection if count is high, 
    // or we can Promise.all. Promise.all is better for speed.
    try {
        await Promise.all(picks.map(p => 
            claimSquare(p.row, p.col, { id: user.uid, name: user.displayName || "Anonymous" })
        ));
    } catch (e) {
        console.error("Quick pick error", e);
        alert("Some squares might not have been claimed due to an error.");
    }
  };

  const isGameStarted = settings.isScrambled || (matchedLiveGame?.isLive ?? false);

  return (
    <div className="min-h-screen bg-transparent pb-24 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-50 px-4 py-3 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md dark:shadow-[0_0_15px_rgba(99,102,241,0.5)] ring-2 ring-indigo-500/50 rotate-[-2deg]">
              <Image
                src="/SouperBowlDark.png"
                alt="Beef Noodle Superbowl Squares mascot"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase drop-shadow-md">The Souper Bowl</h1>
              <div className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.2em] text-shadow-neon">Squares</div>
            </div>
            {user && (
              <div className="hidden md:flex flex-col text-xs text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-white/10 pl-3 ml-2">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Welcome back</span>
                <span className="tracking-tight uppercase text-slate-500 font-bold">{userName}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">
              <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              <span className="text-[10px] font-black text-indigo-800 dark:text-indigo-200 uppercase tracking-widest">{canManage ? (isAdmin ? "Admin" : "Host") : "Player"} Mode</span>
            </div>

            {sortedMyGames.length > 0 && (
              <div className="bg-white/95 dark:bg-slate-900/95 p-4 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 absolute top-14 right-0 w-72 z-40 backdrop-blur-xl hidden group-hover:block transition-all animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Your Games</h3>
                <div className="space-y-2">
                  {sortedMyGames.map((g) => (
                    <button
                      key={g.id}
                      onClick={async () => {
                        if (!user) return;
                        await joinGame(g.id, undefined, user.uid);
                        setView("game");
                      }}
                      className={`w-full text-left bg-slate-50 dark:bg-white/5 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 p-3 rounded-xl transition-all border ${g.isLive ? 'border-red-500/50' : 'border-slate-200 dark:border-white/5'} hover:border-cyan-300 dark:hover:border-cyan-500/30 group`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex items-center gap-1">
                            {g.settings.name}
                            {g.isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase">{g.settings.teamA} vs {g.settings.teamB}</p>
                        </div>
                        <div className={`text-[10px] font-black px-1.5 py-0.5 rounded text-cyan-700 dark:text-cyan-400 border ${g.isLive ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' : 'bg-slate-200 dark:bg-black/40 border-cyan-200 dark:border-cyan-500/20'}`}>
                          {g.scores.teamA}-{g.scores.teamB}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            
            {isAdmin && user && (
              <button
                type="button"
                onClick={handleCopyUid}
                className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-black text-slate-600 uppercase hover:bg-slate-50"
                title="Copy your Firebase UID"
              >
                <span>UID {copiedUid ? "Copied" : user.uid.slice(0, 6) + "…" + user.uid.slice(-4)}</span>
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 lg:px-8 max-w-7xl mx-auto">
        {currentView === "home" && (
          <div className="space-y-12 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-sky-600 via-indigo-600 to-emerald-500 rounded-[3rem] p-12 md:p-16 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
              <div className="relative flex flex-col gap-10 md:flex-row items-center justify-center">
                <div className="space-y-8 md:max-w-2xl text-white flex flex-col items-center md:items-start text-center md:text-left z-10">
                  <h2 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter">
                    PHO-NOMENAL<br /><span className="text-cyan-200">SQUARES.</span><br />ZERO BEEF.
                  </h2>
                  <p className="text-indigo-100 text-xl md:text-2xl max-w-lg font-medium">
                    Go Big or Go Home. Connect, compete, and win big with the ultimate squares experience.
                  </p>
                  <div className="flex gap-4 w-full md:w-auto">
                    <button 
                      onClick={() => setView("create")}
                      className="flex-1 md:flex-none px-8 py-5 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:bg-indigo-50 hover:scale-105 transition-all text-lg"
                    >
                      HOST A GAME
                    </button>
                    <button 
                      onClick={() => setView("join")}
                      className="flex-1 md:flex-none px-8 py-5 bg-white/10 text-white border-2 border-white/20 font-black rounded-2xl hover:bg-white/20 transition-all text-lg backdrop-blur-sm"
                    >
                      JOIN GAME
                    </button>
                  </div>
                </div>
                <div className="flex flex-1 justify-center md:justify-end w-full relative">
                  <div 
                    className="relative w-full max-w-lg aspect-square transform hover:scale-105 transition-transform duration-500 drop-shadow-2xl" 
                  >
                    <Image
                      src="/SouperBowlBanner.png"
                      alt="Beef Noodle Superbowl Squares"
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/30 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4 pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6 border border-orange-200 dark:border-orange-500/30 group-hover:scale-110 transition-transform">
                  <LayoutGrid className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-black text-2xl mb-3 text-slate-900 dark:text-white">Custom Grids</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Choose from 5x5, 10x10 or custom sizes for any sport event you&apos;re hosting.</p>
              </div>
              <Link href="/payments" className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors block cursor-pointer group">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-200 dark:border-emerald-500/30 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-black text-2xl mb-3 text-slate-900 dark:text-white">Automatic Pot</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Track who&apos;s paid and manage your pot effortlessly with built-in ledgers.</p>
              </Link>
              <div className="bg-white dark:bg-slate-800/50 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-200 dark:border-blue-500/30 group-hover:scale-110 transition-transform">
                  <UsersIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-black text-2xl mb-3 text-slate-900 dark:text-white">Live Updates</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Share the link. Watch scores and wins update in real-time as the game plays.</p>
              </div>
            </div>
          </div>
        )}

        {currentView === "create" && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <CreateGameForm onSuccess={() => setView("game")} />
          </div>
        )}

        {currentView === "join" && (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <JoinGameForm onSuccess={() => setView("game")} initialGameId={initialGameCode} />
          </div>
        )}

        {currentView === "props" && (
          <>
            {!activeGame ? (
              <div className="animate-in fade-in zoom-in-95 duration-300 max-w-lg mx-auto pt-12">
                 <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">Side Hustles</h2>
                    <p className="text-slate-500 font-medium">Join a game first to see the available prop bets.</p>
                 </div>
                <JoinGameForm onSuccess={() => setView("props")} initialGameId={initialGameCode} />
              </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-6">
                    <div className="mb-6 flex items-center justify-between max-w-2xl mx-auto">
                         <button 
                           onClick={() => setView("game")} 
                           className="text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors pl-2"
                         >
                            ← Back to Grid
                         </button>
                         <div className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {settings.teamA} vs {settings.teamB}
                         </div>
                    </div>
                    <PropBetsList isAdmin={!!canManage} />
                </div>
            )}
          </>
        )}

        {currentView === "game" && (
          <>
            {!activeGame ? (
              <div className="animate-in fade-in zoom-in-95 duration-300 max-w-lg mx-auto">
                <JoinGameForm onSuccess={() => setView("game")} initialGameId={initialGameCode} />
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-4 animate-in fade-in slide-in-from-right-4 duration-500 max-w-[2200px] mx-auto w-full">
                {/* Main Grid Area - Flex Grow to take available space */}
                <div className="flex-1 flex flex-col gap-4 w-full min-w-0 order-1">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-2">
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <button className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform">GRID</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-xs font-black text-slate-500 uppercase tracking-widest hidden sm:block mr-2">Code: <span className="text-slate-700 dark:text-slate-300">{activeGame.id}</span></div>
                      
                      {!isGameStarted && (
                        <>
                          <button 
                            onClick={() => handleQuickPick(5)}
                            className="px-3 py-2 bg-teal-200/50 dark:bg-cyan-500/20 text-teal-900 dark:text-cyan-200 rounded-full text-[10px] font-black border border-teal-300/50 dark:border-cyan-500/30 hover:bg-teal-300/50 dark:hover:bg-cyan-500/30 transition-colors"
                            title={`Quick Pick 5 Squares ($${5 * settings.pricePerSquare})`}
                          >
                            PICK 5
                          </button>
                          <button 
                            onClick={() => handleQuickPick(10)}
                            className="px-3 py-2 bg-teal-200/50 dark:bg-cyan-500/20 text-teal-900 dark:text-cyan-200 rounded-full text-[10px] font-black border border-teal-300/50 dark:border-cyan-500/30 hover:bg-teal-300/50 dark:hover:bg-cyan-500/30 transition-colors"
                            title={`Quick Pick 10 Squares ($${10 * settings.pricePerSquare})`}
                          >
                            PICK 10
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => { leaveGame(); setView("home"); }}
                        disabled={isGameStarted}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-black border transition-colors",
                          isGameStarted 
                            ? "bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-transparent cursor-not-allowed opacity-50"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-white/5 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white"
                        )}
                      >
                        LEAVE
                      </button>
                      {canManage && (
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to reset the game? This will clear all squares and scores.")) {
                               if (window.confirm("Are you really really sure? This cannot be undone.")) {
                                  resetGame();
                               }
                            }
                          }}
                          disabled={isGameStarted}
                          className={cn(
                            "px-4 py-2 rounded-full text-xs font-black border transition-colors",
                            isGameStarted 
                              ? "bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-transparent cursor-not-allowed opacity-50"
                              : "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-200 border-rose-200 dark:border-rose-500/30 hover:bg-rose-200 dark:hover:bg-rose-900"
                          )}
                        >
                          RESET
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {payoutHistory.length > 0 && (
                    <div className="mb-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between backdrop-blur-sm transition-all">
                      <div className="flex items-center gap-3">
                         <div className="bg-amber-500 p-2 rounded-lg text-white shadow-lg shadow-amber-500/20">
                           <Trophy className="w-5 h-5" />
                         </div>
                         <div>
                           <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none mb-1">
                              Latest Winner: {payoutHistory[0].label}
                           </div>
                           <div className="font-black text-slate-900 dark:text-white text-base leading-none">
                              {payoutHistory[0].winnerName}
                           </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-xl font-black text-amber-600 dark:text-amber-400">${payoutHistory[0].amount}</div>
                         <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                           Score: {payoutHistory[0].teamAScore}-{payoutHistory[0].teamBScore}
                         </div>
                      </div>
                    </div>
                  )}

                  <div className="w-full relative rounded-2xl ring-1 ring-slate-200 dark:ring-white/10 shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                      {/* Grid Area - Natural Height */}
                      <div className="w-full p-0">
                        <Grid 
                          rows={settings.rows} 
                          cols={settings.cols} 
                          squares={squares}
                          winningCell={winningCell}
                          selectedCell={selectedCell}
                          onSquareClick={handleSquareClick}
                          teamA={settings.teamA}
                          teamB={settings.teamB}
                          teamALogo={logos.teamA}
                          teamBLogo={logos.teamB}
                          isScrambled={settings.isScrambled}
                        />
                      </div>

                      {/* Selected/Highlighted Square Details - Bridge the Gap */}
                      <SquareDetails 
                        cell={selectedCell || winningCell} 
                        squares={squares} 
                        settings={{
                          rows: settings.rows,
                          cols: settings.cols,
                          teamA: settings.teamA,
                          teamB: settings.teamB,
                          isScrambled: settings.isScrambled ?? false
                        }} 
                      />
                  
                      {/* Live Score Bar - Bridge the Gap */}
                      <div className="shrink-0 w-full bg-white dark:bg-slate-900 p-4 flex flex-col md:flex-row items-center justify-between text-slate-900 dark:text-white border-t border-slate-200 dark:border-white/10 gap-3 md:gap-0 transition-colors duration-300">
                        {/* Event Status Pill */}
                        <div className="w-full md:w-auto flex justify-center md:justify-start order-1 md:order-1">
                          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-200 dark:border-white/5">
                            {matchedLiveGame?.isLive ? (
                              <span className="flex items-center gap-2 text-red-500 font-black uppercase tracking-widest">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                LIVE: Q{matchedLiveGame.period} {matchedLiveGame.clock && `• ${matchedLiveGame.clock}`}
                              </span>
                            ) : (
                              <span className="uppercase tracking-widest text-[10px]">Active Game</span>
                            )}
                          </div>
                        </div>

                        {/* Score Display */}
                        <div className="flex items-center justify-center gap-4 md:gap-8 w-full order-2 md:order-2">
                          <div className="flex-1 text-right font-black text-slate-900 dark:text-white text-base md:text-xl uppercase tracking-tight truncate">
                             {settings.teamA.split(' ').pop()}
                          </div>
                          
                          <div className="flex items-center gap-2 md:gap-4 px-3 md:px-5 bg-slate-100 dark:bg-black/40 rounded-xl py-2 border border-slate-200 dark:border-white/5 shrink-0 transition-colors">
                            <div className="text-2xl md:text-4xl font-black text-pink-600 dark:text-pink-500 drop-shadow-sm dark:drop-shadow-[0_0_5px_rgba(236,72,153,0.5)] w-8 md:w-12 text-center">
                              {scores.teamA.toString().padStart(2, '0')}
                            </div>
                            <div className="text-slate-400 dark:text-slate-600 font-thin text-xl md:text-2xl">:</div>
                            <div className="text-2xl md:text-4xl font-black text-cyan-600 dark:text-cyan-400 drop-shadow-sm dark:drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] w-8 md:w-12 text-center">
                              {scores.teamB.toString().padStart(2, '0')}
                            </div>
                          </div>

                          <div className="flex-1 text-left font-black text-slate-900 dark:text-white text-base md:text-xl uppercase tracking-tight truncate">
                             {settings.teamB.split(' ').pop()}
                          </div>
                        </div>

                        {/* Desktop Spacer */}
                        <div className="hidden md:block w-32 order-3"></div>
                      </div>
                  </div>
                </div>

                {/* Sidebar - Game Info & Players */}
                 <div className="w-full lg:w-[480px] lg:shrink-0 flex flex-col gap-3 order-2">
                  <div>
                     <GameInfo 
                        gameId={activeGame.id}
                        gameName={settings.name}
                        host={activeGame.hostName}
                        pricePerSquare={settings.pricePerSquare}
                        totalPot={totalPot}
                        onResetGridDigits={resetGridDigits}
                        payouts={payouts}
                        matchup={{ teamA: settings.teamA, teamB: settings.teamB }}
                        scores={scores}
                        isAdmin={canManage}
                        isScrambled={settings.isScrambled}
                        onUpdateScores={updateScores}
                        onManualPayout={handleManualPayout}
                        onScrambleGridDigits={scrambleGridDigits}
                        availableGames={liveGames}
                        eventName={settings.eventName}
                        eventLeague={settings.espnLeague ?? ""}
                        eventDate={settings.eventDate}
                        selectedEventId={settings.espnGameId ?? ""}
                        onSelectEvent={handleEventSelect}
                        onDeleteGame={handleDeleteGame}
                      />
                  </div>
                  
                  <div>
                    <GameWinnersLog history={payoutHistory} />
                  </div>

                  <div className="mt-auto">
                      <PlayerList 
                        players={players}
                        pricePerSquare={settings.pricePerSquare}
                        canManagePayments={isAdmin}
                        canManagePlayers={canManage}
                        onTogglePaid={togglePaid}
                        onDeletePlayer={deletePlayer}
                      />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>}>
      <SquaresApp />
    </Suspense>
  );
}
