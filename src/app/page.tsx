'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Copy, LayoutGrid, Users as UsersIcon, LogOut, DollarSign, Trophy } from 'lucide-react';

// New Component Imports
import QuarterTabs from '@/components/QuarterTabs';
import TrophyCase from '@/components/TrophyCase';

import Grid from '@/components/Grid';
import GameInfo from '@/components/GameInfo';
import PlayerList from '@/components/PlayerList';
import CreateGameForm from '@/components/CreateGameForm';
import JoinGameForm from '@/components/JoinGameForm';
import SquareDetails from '@/components/SquareDetails';
import PropBetsList from '@/components/PropBetsList';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/context/AuthContext';
import { useGame, type GameState } from '@/context/GameContext';
import { cn } from '@/lib/utils';
import { type EspnScoreData, useEspnScores } from '@/hooks/useEspnScores';
import { type GameAxisData } from '@/lib/game-logic';

type View = 'home' | 'create' | 'game' | 'join' | 'props';

function SquaresApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGameCode = searchParams.get('code') || '';
  const currentView = (searchParams.get('view') as View) || (initialGameCode ? 'join' : 'home');

  const { user, logout, loading, isAdmin } = useAuth();
  const { activeGame, settings, squares, players, scores, claimSquare, unclaimSquare, togglePaid, deletePlayer, updateScores, leaveGame, resetGame, scrambleGridDigits, resetGridDigits, updateSettings, getUserGames, joinGame, logPayout, payoutHistory, deleteGame } = useGame();
  const { games: liveGames } = useEspnScores();
  
  const [myGames, setMyGames] = useState<GameState[]>([]);
  const [hasCheckedGames, setHasCheckedGames] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  type QuarterKey = 'q1' | 'q2' | 'q3' | 'final';
  const [viewQuarter, setViewQuarter] = useState<QuarterKey>('q1');

  const matchedLiveGame = useMemo(() => {
    if (!activeGame || liveGames.length === 0) return null;
    if (settings.espnGameId) {
      return liveGames.find(g => g.id === settings.espnGameId);
    }
    return null;
  }, [liveGames, activeGame, settings.espnGameId]);

  useEffect(() => {
    if (matchedLiveGame?.period) {
      if (matchedLiveGame.period === 1) setViewQuarter('q1');
      else if (matchedLiveGame.period === 2) setViewQuarter('q2');
      else if (matchedLiveGame.period === 3) setViewQuarter('q3');
      else if (matchedLiveGame.period >= 4) setViewQuarter('final');
    }
  }, [matchedLiveGame?.period]);

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
    const distribution = [0.20, 0.20, 0.20, 0.40];
    const defaults = ["Q1 Winner", "Q2 Winner", "Q3 Winner", "Final Winner"];
    
    return distribution.map((pct, i) => {
      const existing = settings.payouts && settings.payouts[i];
      return {
        label: existing ? existing.label : defaults[i],
        amount: Math.floor(totalPot * pct)
      };
    });
  }, [totalPot, settings.payouts]);

  const setView = (v: View) => {
    router.push(`/?view=${v}`);
  };

  useEffect(() => {
    if (!user || hasCheckedGames) return;

    let mounted = true;
    async function checkMyGames() {
      if (!user) return;
      const games = await getUserGames(user.uid);
      if (!mounted) return;
      
      setMyGames(games);
      setHasCheckedGames(true);

      if (games.length === 1 && !activeGame) {
        await joinGame(games[0].id, undefined, user.uid);
        router.push('/?view=game');
      }
    }
    checkMyGames();
    return () => { mounted = false; };
  }, [user, hasCheckedGames, activeGame, getUserGames, joinGame, router]);

  const isHost = !!user && !!activeGame && user.uid === activeGame.hostUserId;
  const canManage = isAdmin || isHost;
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Player';

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
      espnGameId: '',
      eventName: '',
      espnLeague: '',
      eventDate: '',
    });
  };

  const handleDeleteGame = async () => {
    if (!canManage) return;
    if (window.confirm('Are you sure you want to PERMANENTLY DELETE this game? This action cannot be undone and all data will be lost.')) {
        if (window.confirm('Please confirm one last time: Delete Game Forever?')) {
            await deleteGame();
            setView('home');
        }
    }
  };

  const currentAxis = useMemo(() => {
    const axisData = (settings as any).axisValues as GameAxisData | undefined;
    const defaultIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    if (axisData && axisData[viewQuarter]) {
      return axisData[viewQuarter];
    }
    
    if (!settings.rows || settings.rows.length === 0 || !settings.cols || settings.cols.length === 0) {
        return { rows: defaultIndices, cols: defaultIndices };
    }

    return { rows: settings.rows, cols: settings.cols };
  }, [settings, viewQuarter]);

  const handleManualPayout = async (teamA: number, teamB: number) => {
    if (!canManage) return;

    if (teamA !== scores.teamA || teamB !== scores.teamB) {
        await updateScores(teamA, teamB);
    }

    const rowDigit = ((teamA % 10) + 10) % 10;
    const colDigit = ((teamB % 10) + 10) % 10;
    const rowIndex = currentAxis.rows.indexOf(rowDigit);
    const colIndex = currentAxis.cols.indexOf(colDigit);

    if (rowIndex < 0 || colIndex < 0) {
        alert('Cannot determine winner: Grid digits are not set or grid is invalid.');
        return;
    }

    const key = `${rowIndex}-${colIndex}`;
    const claims = squares[key] || [];
    
    const standardLabels = ["Q1 Winner", "Q2 Winner", "Q3 Winner", "Final Winner"];
    const nextLabelIndex = Math.min(payoutHistory.length, standardLabels.length - 1);
    const label = standardLabels[nextLabelIndex];
    
    const payoutInfo = payouts.find(p => p.label === label) || payouts[payouts.length - 1];
    const amount = payoutInfo ? payoutInfo.amount : 0;

    if (claims.length === 0) {
        if (!confirm(`No player on square ${teamA}-${teamB} (Row:${rowDigit}, Col:${colDigit}). Log \'No Winner\'?`)) {
            return;
        }
    }

    const winners = claims.map((c) => ({ uid: c.uid, name: c.name }));
    const primaryWinner = winners[0] || { uid: 'NONE', name: 'No Winner (Rollover)' };
    const winnerNamesCombined = winners.length > 0 ? winners.map((w) => w.name).join(', ') : primaryWinner.name;
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
    const rowIndex = currentAxis.rows.indexOf(rowDigit);
    const colIndex = currentAxis.cols.indexOf(colDigit);
    if (rowIndex < 0 || colIndex < 0) return null;
    return { row: rowIndex, col: colIndex };
  }, [scores.teamA, scores.teamB, currentAxis]);

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

    let newAScore = scores.teamA;
    let newBScore = scores.teamB;

    if (teamAName.includes(homeName) || homeName.includes(teamAName)) {
       newAScore = homeScore; newBScore = awayScore; 
    } else if (teamAName.includes(awayName) || awayName.includes(teamAName)) {
       newAScore = awayScore; newBScore = homeScore;
    } else if (teamBName.includes(homeName) || homeName.includes(teamBName)) {
       newBScore = homeScore; newAScore = awayScore;
    } else if (teamBName.includes(awayName) || awayName.includes(teamBName)) {
       newBScore = awayScore; newAScore = homeScore;
    } else {
       return;
    }

    if (scores.teamA !== newAScore || scores.teamB !== newBScore) {
      updateScores(newAScore, newBScore);
    }
  }, [matchedLiveGame, settings.teamA, settings.teamB, scores.teamA, scores.teamB, updateScores]);

  const logos = useMemo(() => {
    if (!matchedLiveGame) return { teamA: undefined, teamB: undefined };
    const { homeTeam, awayTeam } = matchedLiveGame;
    const teamAName = settings.teamA.toLowerCase();
    const teamBName = settings.teamB.toLowerCase();
    let logoA, logoB;

    if (teamAName.includes(homeTeam.name.toLowerCase()) || homeTeam.name.toLowerCase().includes(teamAName)) logoA = homeTeam.logo;
    else if (teamAName.includes(awayTeam.name.toLowerCase()) || awayTeam.name.toLowerCase().includes(teamAName)) logoA = awayTeam.logo;

    if (teamBName.includes(homeTeam.name.toLowerCase()) || homeTeam.name.toLowerCase().includes(teamBName)) logoB = homeTeam.logo;
    else if (teamBName.includes(awayTeam.name.toLowerCase()) || awayTeam.name.toLowerCase().includes(teamBName)) logoB = awayTeam.logo;

    return { teamA: logoA, teamB: logoB };
  }, [matchedLiveGame, settings.teamA, settings.teamB]);

  const isGameStarted = settings.isScrambled || (matchedLiveGame?.isLive ?? false);

  if (loading) return null;
  if (!user) return <AuthModal />;

  return (
    <div className='min-h-screen bg-transparent pb-24 text-slate-800 dark:text-slate-200 transition-colors duration-300'>
      <header className='bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-50 px-4 py-3 transition-colors duration-300'>
        {/* ... Header content remains unchanged ... */}
      </header>

      <main className='w-full px-4 lg:px-8 max-w-7xl mx-auto'>
        {currentView === 'home' && ( <div>{/* Home view content */}</div> )}
        {currentView === 'create' && ( <CreateGameForm onSuccess={() => setView('game')} /> )}
        {currentView === 'join' && ( <JoinGameForm onSuccess={() => setView('game')} initialGameId={initialGameCode} /> )}
        
        {currentView === 'game' && activeGame && (
          <div className='flex flex-col lg:flex-row items-stretch lg:items-start gap-4 animate-in fade-in slide-in-from-right-4 duration-500 max-w-[2200px] mx-auto w-full'>
            <div className='flex-1 flex flex-col gap-4 w-full min-w-0 order-1'>

              {/* NEW: TROPHY CASE & QUARTER TABS - The Hybrid Dashboard */}
              <div className='w-full relative rounded-2xl ring-1 ring-slate-200 dark:ring-white/10 shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4'>
                <TrophyCase 
                  payouts={payouts}
                  history={payoutHistory}
                  totalPot={totalPot}
                />
                <QuarterTabs 
                  activeQuarter={viewQuarter}
                  setActiveQuarter={setViewQuarter}
                  isGameStarted={isGameStarted}
                />
              </div>

              {/* The Grid */}
              <div className='w-full relative rounded-2xl ring-1 ring-slate-200 dark:ring-white/10 shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md'>
                <Grid 
                  rows={currentAxis.rows} 
                  cols={currentAxis.cols} 
                  squares={squares}
                  winningCell={winningCell}
                  selectedCell={selectedCell}
                  onSquareClick={(row, col) => setSelectedCell({row, col})}
                  teamA={settings.teamA}
                  teamB={settings.teamB}
                  teamALogo={logos.teamA}
                  teamBLogo={logos.teamB}
                  isScrambled={settings.isScrambled}
                />
              </div>

              <SquareDetails 
                cell={selectedCell || winningCell} 
                squares={squares} 
                settings={{
                  rows: currentAxis.rows,
                  cols: currentAxis.cols,
                  teamA: settings.teamA,
                  teamB: settings.teamB,
                  isScrambled: settings.isScrambled ?? false
                }} 
              />
              
              {/* ... Other components like PlayerList, GameInfo etc. remain ... */}
            </div>

            <div className='w-full lg:w-[480px] lg:shrink-0 flex flex-col gap-3 order-2'>
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
                 eventLeague={settings.espnLeague ?? ''}
                 eventDate={settings.eventDate}
                 selectedEventId={settings.espnGameId ?? ''}
                 onSelectEvent={handleEventSelect}
                 onDeleteGame={handleDeleteGame}
               />
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
        )}

        {!activeGame && currentView === 'game' && (
            <div className='animate-in fade-in zoom-in-95 duration-300 max-w-lg mx-auto'>
              <JoinGameForm onSuccess={() => setView('game')} initialGameId={initialGameCode} />
            </div>
        )}

      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className='min-h-screen flex items-center justify-center text-slate-500'>Loading...</div>}>
      <SquaresApp />
    </Suspense>
  );
}
