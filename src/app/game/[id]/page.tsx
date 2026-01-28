"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import Grid from "@/components/Grid";
import GameInfo from "@/components/GameInfo";
import {
  LogIn,
  LogOut,
  Loader2,
  X,
} from "lucide-react";
import { useEspnScores } from "@/hooks/useEspnScores";

// Required for static export with dynamic routes
export function generateStaticParams() {
  return [];
}

export default function GamePage() {
  const router = useRouter();
  const { id } = useParams();

  // 1. Hooks
  const { user, logout, isAdmin } = useAuth();
  const { games: liveGames } = useEspnScores();

  const {
    activeGame: game,
    settings,
    squares,
    players,
    scores,
    loading,
    joinGame,
    claimSquare,
    unclaimSquare,
    updateScores,
    scrambleGridDigits,
    resetGridDigits,
    deleteGame,
  } = useGame();

  // 2. Data Fetching Ignition
  useEffect(() => {
    if (id && typeof id === 'string') {
      joinGame(id);
    }
  }, [id, joinGame]);

  // 4. Live Game Sync
  const matchedGame = useMemo(
    () => game?.espnGameId ? liveGames.find((g) => g.id === game.espnGameId) : null,
    [game, liveGames]
  );

  // 5. State
  const [activeQuarter, setActiveQuarter] = useState<'q1' | 'q2' | 'q3' | 'final'>('q1');
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [isManualView, setIsManualView] = useState(false);

  // 6. Auto-sync ESPN scores to Firebase
  useEffect(() => {
    if (!matchedGame || !game) return;
    const espnHome = parseInt(matchedGame.homeTeam.score, 10) || 0;
    const espnAway = parseInt(matchedGame.awayTeam.score, 10) || 0;
    const dbHome = scores?.teamA || 0;
    const dbAway = scores?.teamB || 0;

    if (espnHome !== dbHome || espnAway !== dbAway) {
      updateScores({ teamA: espnHome, teamB: espnAway });
    }
  }, [matchedGame, game, scores, updateScores]);

  // 7. Current Scores (with Manual Fallback)
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

    // ESPN Mode
    if (matchedGame) {
      const home = parseInt(matchedGame.homeTeam.score, 10) || 0;
      const away = parseInt(matchedGame.awayTeam.score, 10) || 0;
      return {
        ...base,
        final: { home, away },
        teamA: home,
        teamB: away,
      };
    }

    // Fallback for Manual Mode: Apply the single saved score to ALL quarters
    // This allows the host to type "7-0" to see Q1 winners, then "14-7" to see Q2 winners, etc.
    const manualHome = scores?.teamA || 0;
    const manualAway = scores?.teamB || 0;
    const manualObj = { home: manualHome, away: manualAway };

    return {
      ...base,
      q1: manualObj,   // <-- CHANGED from 0
      q2: manualObj,   // <-- CHANGED from 0
      q3: manualObj,   // <-- CHANGED from 0
      final: manualObj,
      teamA: manualHome,
      teamB: manualAway,
    };
  }, [game, matchedGame, scores]);

  // 8. Live Pot Calculation
  const livePot = useMemo(() => {
    if (!game) return 0;
    const allClaims = Object.values(squares).flat();
    return allClaims.length * (settings.pricePerSquare || 0);
  }, [game, squares, settings.pricePerSquare]);

  // 9. Payout Distribution
  const payouts = useMemo(() => {
    const distribution = [0.20, 0.20, 0.20, 0.40];
    const defaults = ["Q1 Winner", "Q2 Winner", "Q3 Winner", "Final Winner"];
    return distribution.map((pct, i) => ({
      label: settings.payouts?.[i]?.label || defaults[i],
      amount: Math.floor(livePot * pct),
    }));
  }, [livePot, settings.payouts]);

  // 10. Handlers
  const handleSquareClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    if (!user || settings.isScrambled) return;
    const key = `${row}-${col}`;
    const userClaim = squares[key]?.find((c) => c.uid === user.uid);
    if (userClaim) {
      if (confirm("Remove your claim?")) {
        unclaimSquare(row, col, user.uid);
      }
    } else {
      claimSquare(row, col, { id: user.uid, name: user.displayName || "Anonymous" });
    }
  };

  const handleDeleteGame = async () => {
    if (confirm("Delete this game forever?")) {
      await deleteGame();
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <X className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Game Not Found</h1>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/SouperBowl.png" alt="Logo" width={40} height={40} />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {settings.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <button className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg">
                <LogIn className="w-4 h-4" />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
              <Grid
                rows={settings.rows || []}
                cols={settings.cols || []}
                squares={squares}
                winningCell={null}
                selectedCell={selectedCell}
                onSquareClick={handleSquareClick}
                teamA={settings.teamA || "Team A"}
                teamB={settings.teamB || "Team B"}
                teamALogo={matchedGame?.homeTeam.logo}
                teamBLogo={matchedGame?.awayTeam.logo}
                isScrambled={settings.isScrambled || false}
              />
            </div>
          </div>

          {/* Right: Game Info */}
          <div className="lg:col-span-1">
            <GameInfo
              gameId={game?.id}
              gameName={settings.name}
              host={game?.hostName || "Unknown"}
              pricePerSquare={settings.pricePerSquare}
              totalPot={livePot}
              payouts={payouts}
              matchup={{ teamA: settings.teamA || "Team A", teamB: settings.teamB || "Team B" }}
              scores={scores}
              isAdmin={isAdmin}
              isScrambled={settings.isScrambled || false}
              onUpdateScores={updateScores}
              onScrambleGridDigits={scrambleGridDigits}
              onDeleteGame={handleDeleteGame}
              onSelectEvent={() => {}}
              selectedEventId={settings.espnGameId || ""}
              eventDate={settings.eventDate || ""}
              eventName={settings.eventName || ""}
              eventLeague={settings.espnLeague || ""}
              availableGames={liveGames}
              onResetGridDigits={resetGridDigits}
              onManualPayout={() => {}}
              currentUserName={user?.displayName || "Anonymous"}
              currentUserRole={isAdmin ? "Admin" : "Player"}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
