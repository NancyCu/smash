"use client";

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, Plus, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Components
import AuthModal from '@/components/AuthModal';
import JoinGameForm from '@/components/JoinGameForm';
import BottomNav from '@/components/BottomNav'; // Keeping your nav

function LobbyContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  type QuarterKey = 'q1' | 'q2' | 'q3' | 'final';
  const [viewQuarter, setViewQuarter] = useState<QuarterKey>('q1');

  const matchedLiveGame = useMemo(() => {
    if (!activeGame || liveGames.length === 0) return null;
    return liveGames.find(g => g.id === settings.espnGameId) || null;
  }, [liveGames, activeGame, settings.espnGameId]);

  // Sync quarter view with live game period during render (React pattern for adjusting state based on props)
  const [prevPeriod, setPrevPeriod] = useState<number | undefined>(matchedLiveGame?.period);
  if (matchedLiveGame?.period !== prevPeriod) {
    setPrevPeriod(matchedLiveGame?.period);
    if (matchedLiveGame?.period) {
      const p = matchedLiveGame.period;
      setViewQuarter(p === 1 ? 'q1' : p === 2 ? 'q2' : p === 3 ? 'q3' : 'final');
    }
  }

  const totalPot = useMemo(() => {
    return players.reduce((acc, p) => acc + (p.squares * settings.pricePerSquare), 0);
  }, [players, settings.pricePerSquare]);

  const payouts = useMemo(() => {
    const distribution = [0.20, 0.20, 0.20, 0.40];
    const defaults = ["Q1 Winner", "Q2 Winner", "Q3 Winner", "Final Winner"];
    return distribution.map((pct, i) => ({
      label: settings.payouts?.[i]?.label || defaults[i],
      amount: Math.floor(totalPot * pct)
    }));
  }, [totalPot, settings.payouts]);

  const setView = (v: View) => {
    router.push(`/?view=${v}`);
  };

  const canManage = isAdmin || (!!user && !!activeGame && user.uid === activeGame.hostUserId);
  const currentUserName = user?.displayName || user?.email || 'Anonymous';
  const currentUserRole = canManage ? 'Admin' : 'Player';

  const currentAxis = useMemo(() => {
    const axisData = settings.axisValues;
    const defaultIndices = Array.from({ length: 10 }, (_, i) => i);
    if (axisData?.[viewQuarter]) return axisData[viewQuarter];
    if (!settings.rows || settings.rows.length === 0) return { rows: defaultIndices, cols: defaultIndices };
    return { rows: settings.rows, cols: settings.cols };
  }, [settings, viewQuarter]);

  const winningCell = useMemo(() => {
    const rowDigit = scores.teamA % 10;
    const colDigit = scores.teamB % 10;
    const rowIndex = currentAxis.rows.indexOf(rowDigit);
    const colIndex = currentAxis.cols.indexOf(colDigit);
    if (rowIndex < 0 || colIndex < 0) return null;
    return { row: rowIndex, col: colIndex };
  }, [scores, currentAxis]);

  const logos = useMemo(() => {
    if (!matchedLiveGame) return { teamA: undefined, teamB: undefined };
    const { homeTeam, awayTeam } = matchedLiveGame;
    const teamAName = settings.teamA.toLowerCase();
    const teamBName = settings.teamB.toLowerCase();
    let logoA, logoB;
    if (teamAName.includes(homeTeam.name.toLowerCase())) logoA = homeTeam.logo; else if (teamAName.includes(awayTeam.name.toLowerCase())) logoA = awayTeam.logo;
    if (teamBName.includes(homeTeam.name.toLowerCase())) logoB = homeTeam.logo; else if (teamBName.includes(awayTeam.name.toLowerCase())) logoB = awayTeam.logo;
    return { teamA: logoA, teamB: logoB };
  }, [matchedLiveGame, settings.teamA, settings.teamB]);

  const isGameStarted = settings.isScrambled || (matchedLiveGame?.isLive ?? false);

  const handleSquareClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    if (!user || isGameStarted) return;
    const key = `${row}-${col}`;
    const userClaim = squares[key]?.find(c => c.uid === user.uid);
    if (userClaim) {
      if (confirm('Remove your claim on this square?')) {
        void unclaimSquare(row, col, user.uid);
      }
    } else {
      void claimSquare(row, col, { id: user.uid, name: user.displayName || 'Anonymous' });
    }
  };
  
  // --- RESTORED HANDLER FUNCTIONS ---
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

      // 2. Redirect to the new Game Room
      router.push(`/game/${docRef.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game. Check console.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) return <AuthModal />;

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 text-slate-800 dark:text-slate-200 transition-colors duration-300'>
      
      {/* --- HEADER --- */}
      <header className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md rotate-[-2deg]">
                    <Image src="/SouperBowlDark.png" alt="Logo" width={40} height={40} className="object-cover" priority />
                </div>
                <div className="flex flex-col leading-none">
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Squares Royale</h1>
                    <div className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.2em]">Lobby</div>
                </div>
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-600 transition-colors" aria-label="Logout" title="Logout">
                <LogOut className="w-5 h-5" />
            </button>
        </div>
      </header>

      <main className='w-full px-4 lg:px-8 max-w-7xl mx-auto py-6'>
        {currentView === 'game' && activeGame ? (
          <div className='flex flex-col lg:flex-row items-stretch lg:items-start gap-4 animate-in fade-in duration-500 max-w-[2200px] mx-auto w-full'>
            <div className='flex-1 flex flex-col gap-2 w-full min-w-0'>
              <div className='w-full relative rounded-2xl ring-1 ring-slate-200 dark:ring-white/10 shadow-xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-md p-4'>
                <TrophyCase payouts={payouts} history={payoutHistory} totalPot={totalPot} />
                <QuarterTabs activeQuarter={viewQuarter} setActiveQuarter={setViewQuarter} isGameStarted={isGameStarted} />
              </div>
              <div className='w-full relative rounded-2xl ring-1 ring-slate-200 dark:ring-white/10 shadow-2xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-md'>
                <Grid 
                  rows={currentAxis.rows} 
                  cols={currentAxis.cols} 
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
              <SquareDetails cell={selectedCell || winningCell} squares={squares} settings={{...settings, rows: currentAxis.rows, cols: currentAxis.cols}} />
            </div>
            <div className='w-full lg:w-[480px] lg:shrink-0 flex flex-col gap-3'>
               <GameInfo 
                 gameId={activeGame.id}
                 gameName={settings.name}
                 host={activeGame.hostName}
                 pricePerSquare={settings.pricePerSquare}
                 totalPot={totalPot}
                 payouts={payouts}
                 matchup={{ teamA: settings.teamA, teamB: settings.teamB }}
                 scores={scores}
                 isAdmin={canManage}
                 isScrambled={settings.isScrambled ?? false}
                 onUpdateScores={updateScores}
                 onScrambleGridDigits={scrambleGridDigits}
                 onDeleteGame={handleDeleteGame} // <-- RESTORED
                 onSelectEvent={handleEventSelect} // <-- RESTORED
                 selectedEventId={settings.espnGameId ?? ''}
                 eventDate={settings.eventDate ?? ''}
                 eventName={settings.eventName ?? ''}
                 eventLeague={settings.espnLeague ?? ''}
                 availableGames={liveGames}
                 onResetGridDigits={resetGridDigits}
                 onManualPayout={handleManualPayout} // <-- RESTORED
                 currentUserName={currentUserName}
                 currentUserRole={currentUserRole}
               />
               <PlayerList players={players} pricePerSquare={settings.pricePerSquare} canManagePayments={isAdmin} canManagePlayers={canManage} onTogglePaid={togglePaid} onDeletePlayer={deletePlayer} />
            </div>
          </div>
        ) : (
            <div className='animate-in fade-in zoom-in-95 duration-300 max-w-lg mx-auto pt-8'>
              <JoinGameForm onSuccess={() => setView('game')} initialGameId={initialGameCode} />
            </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className='min-h-screen flex items-center justify-center text-cyan-500'>Loading Lobby...</div>}>
      <LobbyContent />
    </Suspense>
  );
}