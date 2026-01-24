"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useGame } from "../../../context/GameContext";

// Imports using relative paths
import Scoreboard from "../../../components/Game/Scoreboard";
import QuarterTabs from "../../../components/QuarterTabs";
import Grid from "../../../components/Grid";
import GameInfo from "../../../components/GameInfo";

export default function GamePage() {
  const params = useParams();
  const gameId = typeof params?.id === 'string' ? params.id : "";

  const { 
    game, 
    loading, 
    setGameId, 
    isAdmin,
    updateScores,
    manualPayout,
    deleteGame,
    scrambleGrid,
    resetGrid
  } = useGame();

  // Local state for which quarter we are viewing
  const [activeQuarter, setActiveQuarter] = useState<"q1" | "q2" | "q3" | "final">("q1");

  useEffect(() => {
    if (gameId) {
      setGameId(gameId);
    }
  }, [gameId, setGameId]);

  // --- THE TRANSLATION LAYER ---
  // We must calculate the specific rows/cols for the selected quarter
  const currentAxis = useMemo(() => {
    // Default 0-9 if data is missing
    const defaultIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    if (!game?.axis || !game.axis[activeQuarter]) {
      return { rows: defaultIndices, cols: defaultIndices };
    }
    
    // Grab the specific numbers for this quarter (e.g. Q1 numbers vs Q2 numbers)
    return { 
      rows: game.axis[activeQuarter].row, 
      cols: game.axis[activeQuarter].col 
    };
  }, [game, activeQuarter]);

  const gridSquares = useMemo(() => {
    if (!game?.squares) return {} as Record<string, { initials: string; paid: boolean }[]>;

    return Object.fromEntries(
      Object.entries(game.squares).map(([key, val]) => {
        const initials = val?.displayName
          ? val.displayName.substring(0, 2).toUpperCase()
          : "??";

        const paid = !!val?.paidAt;

        return [key, [{ initials, paid }]];
      })
    ) as Record<string, { initials: string; paid: boolean }[]>;
  }, [game]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-cyan-400 animate-pulse">Loading Arena...</div>;
  if (!game) return <div className="min-h-screen flex items-center justify-center text-pink-500">Game Not Found</div>;

  
  return (
    <main className="min-h-screen bg-[#0B0C15] pb-24 px-2">
      
      {/* SCOREBOARD */}
      <div className="pt-4 mb-4">
        <Scoreboard 
           scores={game.scores} 
           teamA={game.teamA} 
           teamB={game.teamB} 
        />
      </div>

      {/* TABS & GRID */}
      <div className="w-full max-w-md mx-auto">
        <QuarterTabs 
          // FIX 1: Pass the prop name your component expects (likely setActiveQuarter)
          activeQuarter={activeQuarter} 
          setActiveQuarter={setActiveQuarter} 
          isGameStarted={game.isScrambled}
        />
        
        <div className="mt-2 overflow-x-auto">
  <Grid 
  rows={currentAxis.rows}
  cols={currentAxis.cols}
  squares={gridSquares}
  teamA={game.teamA}
  teamB={game.teamB}
  isScrambled={game.isScrambled}
  onSquareClick={(_row: number, _col: number) => {}} 
  winningCell={null}
  selectedCell={null}
/>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="max-w-md mx-auto mt-8 mb-8">
         <GameInfo 
            gameId={game.id}
            gameName={game.name}
            host={game.host}
            pricePerSquare={game.price}
            totalPot={game.pot}
            payouts={game.payouts}
            matchup={{ teamA: game.teamA, teamB: game.teamB }}
            scores={game.scores}
            isAdmin={isAdmin}
            onUpdateScores={updateScores} 
            onManualPayout={manualPayout}
            onDeleteGame={deleteGame}
            onScrambleGridDigits={scrambleGrid}
            onResetGridDigits={resetGrid}
            isScrambled={game.isScrambled}
            // Add defaults for optional props to prevent crashes
            availableGames={[]} 
            onSelectEvent={() => {}}
         />
      </div>
    </main>
  );
}