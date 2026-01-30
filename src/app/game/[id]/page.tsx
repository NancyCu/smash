"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useGame, SquareData } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import Grid from "@/components/Grid";
import GameInfo from "@/components/GameInfo";
import GameBar from "@/components/GameBar";
import LiveGameClock from "@/components/LiveGameClock";
import { HelpButton } from "@/components/HelpButton";
import PaymentModal from "@/components/PaymentModal";
import {
  ShoppingCart,
  LogIn,
  LogOut,
  Loader2,
  X,
  Trophy,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEspnScores } from "@/hooks/useEspnScores";
import { getSportConfig, getDisplayPeriods, getPeriodLabel, type PeriodKey, type SportType } from "@/lib/sport-config";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { savePendingSelections, loadPendingSelections, clearPendingSelections } from "@/utils/selectionSuitcase";


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

  // State declarations (must be before useEffect hooks that reference them)
  const [activePeriod, setActivePeriod] = useState<PeriodKey>('p1');
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [isManualView, setIsManualView] = useState(false);
  const [pendingSquares, setPendingSquares] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restorationToast, setRestorationToast] = useState<{ show: boolean; message: string; type: 'success' | 'warning' | 'error' }>({ show: false, message: '', type: 'success' });
  const [restoringSquares, setRestoringSquares] = useState<number[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'warning' | 'error' }>({ show: false, message: '', type: 'success' });
  const [isDetailsPanelCollapsed, setIsDetailsPanelCollapsed] = useState(false);

  // 2. Data Fetching Ignition
  useEffect(() => {
    if (id) {
      setGameId(id as string);
      setInitialLoadComplete(false); // Reset on ID change
    }
  }, [id, setGameId]);
  
  // 2a. Track when initial load is complete
  useEffect(() => {
    // Set initialLoadComplete to true once we have a definitive result from loading
    if (!loading) {
      // Either we have a valid game (with teamA and teamB) or we don't
      setInitialLoadComplete(true);
    }
  }, [loading, setInitialLoadComplete]);
  
  // 2b. Store as active game when successfully loaded
  useEffect(() => {
    if (!loading && game && id && typeof window !== 'undefined') {
      if (game.teamA && game.teamB) {
        console.log(`[GamePage] Setting activeGameId: ${id}`);
        localStorage.setItem("activeGameId", id as string);
        // Dispatch event asynchronously to avoid setState during render
        setTimeout(() => {
          window.dispatchEvent(new Event('activeGameIdChanged'));
        }, 0);
      }
    }
  }, [loading, game, id]);

  // 2c. Restore pending selections after authentication
  useEffect(() => {
    if (!loading && game && user && id) {
      const gameId = id as string;
      const savedSelections = loadPendingSelections(gameId);
      
      if (savedSelections && savedSelections.length > 0) {
        console.log(`[GamePage] Restoring ${savedSelections.length} pending selections`);
        
        // Check which squares are still available
        const available: number[] = [];
        const conflicts: number[] = [];
        
        savedSelections.forEach(index => {
          const rawData = game.squares?.[index];
          const usersInSquare = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];
          const alreadyOwned = usersInSquare.some((u: any) => 
            (u.uid && u.uid === user.uid) || (u.userId && u.userId === user.uid)
          );
          const isTaken = usersInSquare.length > 0;
          
          if (alreadyOwned || isTaken) {
            conflicts.push(index);
          } else {
            available.push(index);
          }
        });
        
        if (available.length > 0) {
          // Restore available squares with animation
          setRestoringSquares(available);
          setPendingSquares(available);
          
          // Sequential animation effect
          available.forEach((idx, i) => {
            setTimeout(() => {
              setRestoringSquares(prev => prev.filter(x => x !== idx));
            }, 300 + (i * 100));
          });
          
          setTimeout(() => {
            setRestoringSquares([]);
            setRestorationToast({
              show: true,
              message: `${available.length} square${available.length > 1 ? 's' : ''} restored! Ready to claim.`,
              type: 'success'
            });
            setTimeout(() => setRestorationToast({ show: false, message: '', type: 'success' }), 4000);
          }, 300 + (available.length * 100));
        }
        
        if (conflicts.length > 0) {
          console.log(`[GamePage] ${conflicts.length} squares no longer available`);
          if (available.length === 0) {
            setRestorationToast({
              show: true,
              message: 'Selected squares are no longer available.',
              type: 'warning'
            });
            setTimeout(() => setRestorationToast({ show: false, message: '', type: 'warning' }), 4000);
          }
        }
        
        // Clear saved selections
        clearPendingSelections(gameId);
      }
    }
  }, [loading, game, user, id]);

  // 2d. Auto-save pending selections before unload (safety net)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingSquares.length > 0 && id && !user) {
        savePendingSelections(id as string, pendingSquares);
        console.log(`[GamePage] Auto-saved ${pendingSquares.length} selections before unload`);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingSquares, id, user]);

  // 3. Safety & Pot Logic
  const squares = game?.squares ?? {};

  // 4. Live Game Sync
  const matchedGame = useMemo(
    () => {
      const matched = game?.espnGameId ? liveGames.find((g) => g.id === game.espnGameId) : null;
      if (matched) {
        console.log('[GamePage] Matched ESPN Game:', {
          id: matched.id,
          name: matched.name,
          period: matched.period,
          clock: matched.clock,
          status: matched.status,
          isLive: matched.isLive,
          competitors: matched.competitors?.length,
        });
      }
      return matched;
    },
    [game, liveGames]
  );

  // Get sport configuration
  const sportType: SportType = game?.sport || 'default';
  const sportConfig = getSportConfig(sportType);
  const displayPeriods = getDisplayPeriods(sportType);

  // --- 1. CALCULATE LIVE PERIOD ---
  const livePeriod = useMemo(() => {
      // PRIORITY 1: Manual Game Status
      if (game?.status === 'final') return 'final' as PeriodKey;

      // PRIORITY 2: ESPN Data
      if (matchedGame?.status === "post" || matchedGame?.statusDetail?.includes("Final")) return 'final' as PeriodKey;
      
      if (matchedGame?.status === "pre" || matchedGame?.status === "scheduled") {
        // Fix: If ESPN says "Pre/Scheduled" but we manually advanced the period (e.g. testing), respect the manual period.
        if (game?.currentPeriod && game.currentPeriod !== 'p1') {
             return game.currentPeriod as PeriodKey;
        }
        return 'p1' as PeriodKey;
      }
      
      if (matchedGame?.isLive) {
          const p = matchedGame.period;
          if (sportType === 'soccer') {
            if (p === 1) return 'p1' as PeriodKey; 
            if (p === 2) return 'p2' as PeriodKey; 
            if (p >= 3) return 'final' as PeriodKey; 
          } else {
            if (p === 1) return 'p1' as PeriodKey;
            if (p === 2) return 'p2' as PeriodKey;
            if (p === 3) return 'p3' as PeriodKey;
            if (p >= 4) return 'final' as PeriodKey;
          }
      }
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
    
    if (game) {
      if (teamName === game.teamA && game.teamALogo) return game.teamALogo;
      if (teamName === game.teamB && game.teamBLogo) return game.teamBLogo;
    }
    
    // Fallback logic omitted for brevity, keep your existing code here
    return "";
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

      const scores = {
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

      return scores;
    }
    
      // --- MANUAL FALLBACK ---
      const manualHome = game.scores?.teamA || 0;
      const manualAway = game.scores?.teamB || 0;
      
      const qScores = game.quarterScores;
      
      // If explicit quarter scores exist, use them (Discrete). 
      // Otherwise, assume the Total Score belongs to P1 (for summation logic compatibility) or spread it if needed.
      // To ensure the "Summation" logic in gameStats works correctly (p1+p2+p3), 
      // we should put the ENTIRE current score in p1 if we lack breakdown, 
      // and 0 in others. This ensures Q1=Total, Q2=Total+0, Q3=Total+0+0.
      
      const p1 = qScores?.p1 ? { home: qScores.p1.teamA, away: qScores.p1.teamB } : { home: manualHome, away: manualAway };
      const p2 = qScores?.p2 ? { home: qScores.p2.teamA, away: qScores.p2.teamB } : { home: 0, away: 0 };
      const p3 = qScores?.p3 ? { home: qScores.p3.teamA, away: qScores.p3.teamB } : { home: 0, away: 0 };
      const p4 = { home: 0, away: 0 }; // Overtime/extra not usually manually tracked this way
      
      // Final is always the total
      const final = qScores?.final ? { home: qScores.final.teamA, away: qScores.final.teamB } : { home: manualHome, away: manualAway };
  
      return {
        ...base,
        p1,   
        p2,   
        p3,
        p4,   
        final,
        teamA: manualHome,
        teamB: manualAway,
      };
  }, [game, matchedGame]);

  // --- AUTO-SYNC ENGINE ---
  useEffect(() => {
    if (!game || !currentScores || !id) return;
    const liveHome = currentScores.teamA;
    const liveAway = currentScores.teamB;
    const storedHome = game.scores?.teamA || 0;
    const storedAway = game.scores?.teamB || 0;

    if (liveHome !== storedHome || liveAway !== storedAway) {
       if (game.espnGameId && matchedGame) {
          const quarterScores = {
            p1: { teamA: currentScores.p1.home, teamB: currentScores.p1.away },
            p2: { teamA: currentScores.p2.home, teamB: currentScores.p2.away },
            p3: { teamA: currentScores.p3.home, teamB: currentScores.p3.away },
            final: { teamA: currentScores.final.home, teamB: currentScores.final.away }
          };
          
          updateScores(liveHome, liveAway).then(() => {
            if (id) {
              updateDoc(doc(db, "games", id as string), { quarterScores });
            }
          });
       }
    }
  }, [currentScores, game?.scores, matchedGame, updateScores, game?.espnGameId, id]);

  // --- QUARTER-FINALIZED HELPER (Gatekeeper) ---
  // Only allows winner calculation when quarter is officially complete
  const isQuarterFinalized = (period: PeriodKey, currentPeriod: number, gameFinal: boolean): boolean => {
    if (gameFinal) return true; // Always finalized in final
    
    if (sportType === 'soccer') {
      if (period === 'p1') return currentPeriod > 1;
      if (period === 'p2') return currentPeriod > 2 || gameFinal;
      if (period === 'final') return gameFinal;
    } else {
      // Football/Basketball logic
      if (period === 'p1') return currentPeriod > 1;
      if (period === 'p2') return currentPeriod > 2;
      if (period === 'p3') return currentPeriod > 3;
      if (period === 'final') return gameFinal;
    }
    return false;
  };

  // --- WINNING CELL (SPORT-AWARE) ---
  const winningCoordinates = useMemo(() => {
    const defaultAxis = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const axis = game?.isScrambled
      ? game.axis?.[activePeriod] || { row: defaultAxis, col: defaultAxis }
      : { row: defaultAxis, col: defaultAxis };

    // GATEKEEPER: Only calculate winning coordinates if this period is finalized
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (matchedGame as any)?.status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusType = (matchedGame as any)?.statusDetail;
    
    // Fix: Resolve 'p' (current period index) correctly for both Live (ESPN) and Manual modes
    let p = matchedGame?.period || 1;
    if (!matchedGame && game?.currentPeriod) {
       // Map 'p1'->1, 'p2'->2, etc.
       const map: Record<string, number> = { 'p1': 1, 'p2': 2, 'p3': 3, 'p4': 4, 'final': 5 };
       p = map[game.currentPeriod as string] || 1;
    }

    const isFinal = status === "post" || (statusType && statusType.includes("Final")) || game?.status === 'final';
    
    // NOTE: We REMOVED the "isQuarterFinalized" check here. 
    // The grid should ALWAYS highlight the potential winner based on current scores, 
    // even if the quarter is still in progress.
    // Use 'isFinal' just for styling/logic if needed, but don't return null.

    let scoreA = 0, scoreB = 0;

    if (sportType === 'soccer') {
          if (activePeriod === "p1") {
            scoreA = currentScores.teamA; scoreB = currentScores.teamB;
          } else if (activePeriod === 'p2') {
            scoreA = currentScores.teamA; scoreB = currentScores.teamB;
          } else {
            scoreA = currentScores.final.home; scoreB = currentScores.final.away;
          }
        } else {
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

      const rowIndex = axis.row.indexOf(scoreA % 10);
      const colIndex = axis.col.indexOf(scoreB % 10);
      if (rowIndex === -1 || colIndex === -1) return null;
      return { row: colIndex, col: rowIndex };
  }, [currentScores, activePeriod, game, sportType, matchedGame]);

  // Current axis
  const defaultAxis = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const currentAxis = game?.isScrambled
    ? game.axis?.[activePeriod] || { row: defaultAxis, col: defaultAxis }
    : { row: defaultAxis, col: defaultAxis };

  // --- GRID DATA ---
  const formattedSquares = useMemo(() => {
    if (!game?.squares) return {};
    const result: Record<string, { uid: string; name: string; claimedAt: number; paid?: boolean }[]> = {};
    Object.entries(game.squares).forEach(([key, value]) => {
      const index = parseInt(key);
      if (isNaN(index)) return;
      const gridKey = `${Math.floor(index / 10)}-${index % 10}`;
      if (!result[gridKey]) result[gridKey] = [];
      const users = Array.isArray(value) ? value : [value];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      users.forEach((sq: any) => {
        if (sq) result[gridKey].push({ uid: sq.userId, name: sq.displayName, claimedAt: 0, paid: sq.paid });
      });
    });
    return result;
  }, [game]);

  // --- SIDEBAR PAYOUTS (SPORT-AWARE) ---
  const livePot = Object.keys(game?.squares || {}).length * (game?.price || 10);
  const basePayouts = useMemo(() => {
    const payoutMap: Record<string, number> = {};
    sportConfig.periods.forEach(period => {
      const percentage = sportConfig.payoutStructure[period];
      payoutMap[period] = Math.floor(livePot * percentage);
    });
    return payoutMap;
  }, [livePot, sportConfig]);

  // 3. GAME STATS HOOK WITH 50/50 SPLIT ROLLOVER LOGIC (SPORT-AWARE)
  const gameStats = useMemo(() => {
    if (!game) return { payouts: {}, winners: [], currentPotential: 0, effectivePayouts: {} };

    const getOwner = (period: PeriodKey) => {
      const axis = (game.isScrambled && game.axis && game.axis[period]) ? game.axis[period] : { row: defaultAxis, col: defaultAxis };
      let sA = 0, sB = 0;
      
      if (sportType === 'soccer') {
            if (period === "p1") { sA = currentScores.teamA; sB = currentScores.teamB; }
            else if (period === "p2") { sA = currentScores.teamA; sB = currentScores.teamB; }
            else { sA = currentScores.final.home; sB = currentScores.final.away; }
          } else {
            if (period === "p1") { sA = currentScores.p1.home; sB = currentScores.p1.away; } 
            else if (period === "p2") { sA = currentScores.p1.home + currentScores.p2.home; sB = currentScores.p1.away + currentScores.p2.away; } 
            else if (period === "p3") { sA = currentScores.p1.home + currentScores.p2.home + currentScores.p3.home; sB = currentScores.p1.away + currentScores.p2.away + currentScores.p3.away; } 
            else { sA = currentScores.final.home; sB = currentScores.final.away; }
          }

      const r = axis.row.indexOf(sA % 10);
      const c = axis.col.indexOf(sB % 10);
      if (r === -1 || c === -1) return null;
      const cell = game.squares[r * 10 + c];
      if (Array.isArray(cell)) return cell.length > 0 ? cell : null;
      return cell ? [cell] : null;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (matchedGame as any)?.status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusType = (matchedGame as any)?.statusDetail;
    
    // Fix: Resolve 'p' correctly for Manual Mode as well
    let p = matchedGame?.period || 1;
    if (!matchedGame && game?.currentPeriod) {
       const map: Record<string, number> = { 'p1': 1, 'p2': 2, 'p3': 3, 'p4': 4, 'final': 5 };
       p = map[game.currentPeriod as string] || 1;
    }

    const isFinal = status === "post" || (statusType && statusType.includes("Final")) || game?.status === 'final';

    // Initialize current pots with base amounts
    const currentPots = { ...basePayouts };
    const effectivePayouts: Record<string, number> = {};
    const results: { key: PeriodKey | string; label: string; winner: string; amount: number; rollover: boolean; baseAmount: number; rolloverAmount: number }[] = [];

    // Track winners for each period
    const periodWinners: Record<string, any> = {};
    displayPeriods.forEach((period, idx) => {
      // Check if this specific quarter has been officially finalized
      const isFinalized = isQuarterFinalized(period as PeriodKey, p, isFinal);
      
      // Standard period-complete check (for rollover processing)
      const periodComplete = sportType === 'soccer' 
        ? (period === 'p1' && p > 1) || (period === 'p2' && (p > 2 || isFinal)) || (period === 'final' && isFinal)
        : (idx < p - 1) || (period === 'final' && isFinal);
      
      // RELAXED RULE: If this is the ACTIVE period being viewed, show the winner!
      // This ensures the "Payout Schedule" card matches the "Grid" highlights.
      // (Even if the quarter isn't officially over yet)
      const shouldCalculate = isFinalized || period === activePeriod;

      periodWinners[period] = shouldCalculate ? getOwner(period) : null;
    });

    // Process p1 (Q1)
    const p1Complete = sportType === 'soccer' ? p > 1 : p > 1;
    const p1Winner = periodWinners['p1'];
    // ONLY rollover if the period is ACTUALLY complete (don't rollover just because we don't see a winner in active view)
    if (p1Complete && !p1Winner && displayPeriods.includes('p1')) {
      const rolloverAmount = currentPots['p1'];
      const splitAmount = rolloverAmount / 2;
      if (displayPeriods.includes('p2')) currentPots['p2'] += splitAmount;
      if (displayPeriods.includes('final')) currentPots['final'] += splitAmount;
      currentPots['p1'] = 0;
    }

    // Process p2 (Q2/Half)
    const p2Complete = sportType === 'soccer' ? (p > 2 || isFinal) : (p > 2 || isFinal);
    const p2Winner = periodWinners['p2'];
    if (p2Complete && !p2Winner && displayPeriods.includes('p2')) {
      const rolloverAmount = currentPots['p2'];
      const splitAmount = rolloverAmount / 2;
      if (displayPeriods.includes('p3')) currentPots['p3'] += splitAmount;
      if (displayPeriods.includes('final')) currentPots['final'] += splitAmount;
      currentPots['p2'] = 0;
    }

    // Process p3 (Q3) - 100% to Final (no split)
    const p3Complete = sportType === 'soccer' ? isFinal : (p > 3 || isFinal);
    const p3Winner = periodWinners['p3'];
    if (p3Complete && !p3Winner && displayPeriods.includes('p3')) {
      if (displayPeriods.includes('final')) currentPots['final'] += currentPots['p3'];
      currentPots['p3'] = 0;
    }

    // Build results array
    displayPeriods.forEach((period, idx) => {
      // Check if this period is officially finalized
      const isFinalized = isQuarterFinalized(period as PeriodKey, p, isFinal);
      
      // Standard period-complete check (for rollover processing)
      const periodComplete = sportType === 'soccer' 
        ? (period === 'p1' && p > 1) || (period === 'p2' && (p > 2 || isFinal)) || (period === 'final' && isFinal)
        : (idx < p - 1) || (period === 'final' && isFinal);
      
      const winner = periodWinners[period];
      const baseAmount = basePayouts[period] || 0;
      const currentAmount = currentPots[period] || baseAmount;
      const rolloverAmount = currentAmount - baseAmount;
      
      effectivePayouts[period] = currentAmount;
      
      // PRIORITY 1: If we have a winner (Finalized OR Active View), Show it!
      if (winner) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const winnerNames = Array.isArray(winner) 
          ? winner.map((w: any) => w.displayName || w.name).join(', ')
          : (winner as any).displayName || (winner as any).name;
        
        results.push({ 
          key: period, 
          label: getPeriodLabel(period, sportType), 
          winner: winnerNames, 
          amount: currentAmount,
          baseAmount,
          rolloverAmount: rolloverAmount,
          rollover: false 
        });
      }
      // PRIORITY 2: If finalized but NO winner (Rollover), show Empty/Rollover
      else if (isFinalized && periodComplete && !winner && baseAmount > 0) {
        results.push({ 
          key: period, 
          label: getPeriodLabel(period, sportType), 
          winner: '', 
          amount: 0,
          baseAmount,
          rolloverAmount: 0,
          rollover: true 
        });
      } 
      // PRIORITY 3: Pending
      else if (baseAmount > 0) {
        results.push({ 
          key: period, 
          label: getPeriodLabel(period, sportType), 
          winner: 'Pending', 
          amount: currentAmount, 
          baseAmount,
          rolloverAmount: rolloverAmount,
          rollover: false 
        });
      }
    });
    
    return { 
      payouts: basePayouts, 
      effectivePayouts,
      winners: results, 
      currentPotential: effectivePayouts[activePeriod] || basePayouts[activePeriod] || 0 
    };
  }, [game, currentScores, matchedGame, activePeriod, basePayouts, sportType, displayPeriods]);

  const livePayouts = gameStats.effectivePayouts;

  // --- HANDLERS ---
  const handleSquareClick = (row: number, col: number) => {
    const index = row * 10 + col;
    setSelectedCell({ row, col });
    setIsManualView(true);
    
    if (game?.isScrambled && !isAdmin) return;
    
    // Toggle square in/out of cart
    if (pendingSquares.includes(index)) {
      setPendingSquares((prev) => prev.filter((i) => i !== index));
      return;
    }

    const rawData = game?.squares?.[index];
    const usersInSquare = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const alreadyInSquare = user && usersInSquare.some((u: any) => (u.uid && u.uid === user.uid) || (u.userId && u.userId === user.uid));
    if (alreadyInSquare) {
      setToast({ show: true, message: 'You already have a spot in this square!', type: 'warning' });
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
      return;
    }

    let ownedCount = 0;
    if (user && game?.squares) {
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
      setToast({ show: true, message: 'Limit reached: You can only choose up to 10 squares.', type: 'warning' });
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
      return;
    }
    
    setPendingSquares((prev) => [...prev, index]);
  };

  const handleAuth = async () => { 
    if (user) {
      await logOut(); 
    } else {
      // Save pending selections before redirecting to sign in
      if (pendingSquares.length > 0 && id) {
        savePendingSelections(id as string, pendingSquares);
        console.log(`[GamePage] Saved ${pendingSquares.length} pending selections before auth`);
      }
      router.push(`/?action=login&redirect=${id}`); 
    }
  };
  
  const handleConfirmCart = async () => {
    if (!user) { await handleAuth(); return; }
    if (pendingSquares.length === 0) return;
    setIsSubmitting(true);
    try {
      for (const index of pendingSquares) await claimSquare(index);
      setPendingSquares([]);
      setSelectedCell(null);
    } catch {
      alert("Error claiming squares");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClearCart = () => setPendingSquares([]);
  const handleUnclaim = async () => { if (selectedCell) await unclaimSquare(selectedCell.row * 10 + selectedCell.col); };
  const handleDelete = async () => { if (confirm("Are you sure you want to delete this game?")) { await deleteGame(); router.push("/"); } };
   
  // 4. Loading Screen & Error Handling
  if (!game || !game?.teamA || !game?.teamB) {
    // Show loading state if we're still loading OR haven't completed initial load yet
    if (loading || !initialLoadComplete) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#0B0C15] text-cyan-400">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            <p className="animate-pulse font-black tracking-widest uppercase text-xs">LOADING GAME DATA...</p>
          </div>
        </div>
      );
    }
    
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem("activeGameId");
      if (storedId === id) {
        console.warn(`Clearing invalid activeGameId: ${id}`);
        localStorage.removeItem("activeGameId");
        setTimeout(() => {
          window.dispatchEvent(new Event('activeGameIdChanged'));
        }, 0);
      }
    }
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#0B0C15] text-white px-4">
        <div className="text-center">
          <h1 className="font-teko text-3xl tracking-widest mb-2 text-white/80">GAME NOT FOUND</h1>
          <p className="text-sm text-white/50 mb-6">This game doesn't exist or data is incomplete.</p>
        </div>
        <button 
          onClick={() => router.push('/')} 
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-sm uppercase tracking-wider transition-all"
        >
          Return Home
        </button>
      </div>
    );
  }

  const cartTotal = pendingSquares.length * game.price;

  return (
    <main className="flex flex-col lg:flex-row h-dvh w-full overflow-hidden bg-[#0B0C15]">

      {/* Task 3: UI Feedback Toast */}
      {restorationToast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slideDown">
          <div className={`
            px-6 py-3 rounded-xl backdrop-blur-xl border shadow-2xl flex items-center gap-3 min-w-[280px] max-w-md
            ${restorationToast.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-100' : ''}
            ${restorationToast.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-100' : ''}
            ${restorationToast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-100' : ''}
          `}>
            <div className={`
              w-2 h-2 rounded-full animate-pulse
              ${restorationToast.type === 'success' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : ''}
              ${restorationToast.type === 'warning' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : ''}
              ${restorationToast.type === 'error' ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''}
            `} />
            <span className="text-sm font-bold flex-1">{restorationToast.message}</span>
            <button 
              onClick={() => setRestorationToast({ show: false, message: '', type: 'success' })}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. MAIN AREA */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* MOBILE HEADER */}
        <div className="lg:hidden p-2 bg-[#0B0C15]/60 shrink-0 z-50 backdrop-blur-md flex justify-between items-center border-b border-white/20 shadow-lg">
          <div onClick={() => router.push("/")} className="flex items-center gap-2 cursor-pointer">
            <div className="relative h-8 w-auto rounded-lg overflow-hidden shadow-md">
              <img src="/image_9.png" alt="Souper Bowl LX Logo" className="h-8 w-auto object-contain" />
            </div>
            <span className="font-bold text-white tracking-widest text-[10px] uppercase drop-shadow-md">Souper Bowl Squares</span>
          </div>
          <div className="flex items-center gap-2">
            <HelpButton />
            <button onClick={handleAuth} className="p-1.5 rounded-full bg-white/20 border border-white/30 text-slate-100 backdrop-blur-sm shadow-sm hover:bg-white/30 transition-all">
              {user ? <LogOut className="w-3 h-3 text-red-300" /> : <LogIn className="w-3 h-3 text-green-300" />}
            </button>
          </div>
        </div>
        
        {/* GAME BAR */}
        <GameBar />

        <div className="flex-1 w-full min-h-0 overflow-y-auto no-scrollbar pb-32 flex flex-col items-center px-2 py-1 lg:px-6 lg:py-4 gap-1 lg:gap-2">
          {/* SCOREBOARD */}
          <div className="w-full max-w-[500px] lg:max-w-[calc(100vh-260px)] lg:mx-auto relative group z-20 shrink-0">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/30 via-indigo-500/20 to-cyan-500/30 rounded-2xl blur-lg opacity-60 group-hover:opacity-80 transition duration-1000"></div>
            <div className="relative w-full bg-[#0B0C15]/60 backdrop-blur-xl border border-white/10 rounded-xl px-2 lg:px-6 pt-1 lg:pt-3 pb-0.5 lg:pb-2 flex flex-col items-center shadow-xl">
              <div className="flex w-full justify-between items-start relative">
                {/* AWAY TEAM (Left - matches grid vertical/rows - pink) */}
                <div className="flex flex-col items-center justify-start w-[35%] relative z-0">
                  <div className="flex items-center gap-1 lg:gap-2 mb-0.5 justify-center w-full">
                    {getTeamLogo(game.teamB) && <img src={getTeamLogo(game.teamB)} alt="Logo" className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain drop-shadow-md" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
                    <span className="text-pink-200 font-teko text-[10px] md:text-lg lg:text-2xl tracking-wide uppercase text-center leading-tight whitespace-nowrap truncate max-w-[70px] md:max-w-[120px] lg:max-w-[180px] drop-shadow-sm">
                      {game.teamB}
                    </span>
                  </div>
                  <span className="text-4xl md:text-7xl lg:text-8xl font-teko text-white leading-none drop-shadow-[0_0_20px_rgba(236,72,153,0.6)] mt-0.5">
                    {!game.espnGameId 
                        ? currentScores.teamB 
                        : (activePeriod === "final" 
                            ? currentScores.final.away 
                            : sportType === 'soccer'
                              ? currentScores.teamB
                              : (activePeriod === "p1" 
                                  ? currentScores.p1.away 
                                  : activePeriod === "p2" 
                                    ? currentScores.p1.away + currentScores.p2.away 
                                    : currentScores.p1.away + currentScores.p2.away + currentScores.p3.away))
                    }
                  </span>
                </div>
                {/* CLOCK */}
                <div className="flex flex-col items-center w-[30%] shrink-0 z-10 pt-0.5">
                  <LiveGameClock game={matchedGame} />
                  <div className="flex bg-black/20 rounded-full p-1 border border-white/20 scale-75 md:scale-100 backdrop-blur-sm">
                    {displayPeriods.map((period) => (
                      <button key={period} onClick={() => handlePeriodChange(period)} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${activePeriod === period ? "bg-indigo-500/90 text-white shadow-lg ring-1 ring-indigo-400" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
                        {getPeriodLabel(period, sportType)}
                      </button>
                    ))}
                  </div>
                  {game.espnGameId ? (
                     espnError ? (
                        <span className="text-[9px] text-red-300 font-bold uppercase tracking-widest animate-pulse drop-shadow-sm">Sync Error</span>
                     ) : (
                        <span className="flex items-center justify-center">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_5px_#4ade80]"/>
                        </span>
                     )
                  ) : (
                     <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest drop-shadow-sm">Manual Mode</span>
                  )}
                </div>
                {/* HOME TEAM (Right - matches grid horizontal/cols - cyan) */}
                <div className="flex flex-col items-center justify-start w-[35%] relative z-0">
                  <div className="flex items-center gap-1 lg:gap-2 mb-0.5 justify-center w-full">
                    <span className="text-cyan-200 font-teko text-[10px] md:text-lg lg:text-2xl tracking-wide uppercase text-center leading-tight whitespace-nowrap truncate max-w-[70px] md:max-w-[120px] lg:max-w-[180px] drop-shadow-sm">
                      {game.teamA}
                    </span>
                    {getTeamLogo(game.teamA) && <img src={getTeamLogo(game.teamA)} alt="Logo" className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain drop-shadow-md" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
                  </div>
                  <span className="text-4xl md:text-7xl lg:text-8xl font-teko text-white leading-none drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] mt-0.5">
                    {!game.espnGameId 
                        ? currentScores.teamA 
                        : (activePeriod === "final" 
                            ? currentScores.final.home 
                            : sportType === 'soccer'
                              ? currentScores.teamA 
                              : (activePeriod === "p1" 
                                  ? currentScores.p1.home 
                                  : activePeriod === "p2" 
                                    ? currentScores.p1.home + currentScores.p2.home 
                                    : currentScores.p1.home + currentScores.p2.home + currentScores.p3.home))}
                  </span>
                </div>
              </div>
              {/* Host indicator */}
              <div className="w-full flex justify-center mt-1">
                <span className="text-[9px] text-white/40 font-medium tracking-wide">
                  Hosted by <span className="text-indigo-300/70">
                    {game.hostDisplayName || (() => {
                      const hostSquare = Object.values(game.squares || {}).flat().find(
                        (sq: any) => sq?.userId === game.host
                      ) as SquareData | undefined;
                      return hostSquare?.displayName || "Host";
                    })()}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* GRID */}
          <div className="w-full shrink-0 aspect-square max-w-[500px] lg:max-w-[calc(100vh-260px)] lg:mx-auto z-10 flex flex-col justify-center my-1 lg:my-2">
            <div className="w-full h-full bg-[#0B0C15]/60 backdrop-blur-md rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/10 overflow-hidden ring-1 ring-white/5">
              <Grid rows={currentAxis.col} cols={currentAxis.row} squares={formattedSquares} onSquareClick={handleSquareClick} teamA={game.teamB || "Away"} teamB={game.teamA || "Home"} teamALogo={getTeamLogo(game.teamB)} teamBLogo={getTeamLogo(game.teamA)} isScrambled={game.isScrambled} selectedCell={selectedCell} winningCell={winningCoordinates} pendingIndices={pendingSquares} restoringIndices={restoringSquares} currentUserId={user?.uid} />
            </div>
          </div>

          {/* CART / DETAILS BOX */}
          {pendingSquares.length > 0 ? (
            <div className="fixed left-0 right-0 z-40 p-4 bg-[#0B0C15]/60 backdrop-blur-xl border border-indigo-400/30 rounded-2xl shadow-xl transition-all duration-300 ease-in-out translate-y-0 opacity-100 mx-2" style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
              {pendingSquares.length >= 10 && (
                <div className="mb-3 px-3 py-2 bg-yellow-500/20 border border-yellow-400/40 rounded-lg">
                  <p className="text-xs text-yellow-200 font-semibold text-center">
                    Max limit reached. Ready to checkout!
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40"><ShoppingCart className="w-5 h-5 text-white" /></div>
                  <div className="flex flex-col"><span className="text-xs text-indigo-100 font-bold uppercase tracking-widest">Selected Squares</span><span className="text-xl font-black text-white">{pendingSquares.length} <span className="text-sm font-medium text-white/70">Total: ${cartTotal}</span></span></div>
                </div>
                <button onClick={handleClearCart} className="text-xs text-white/70 hover:text-white underline shadow-sm">Clear</button>
              </div>
              <button 
                onClick={handleConfirmCart} 
                disabled={isSubmitting} 
                className={`relative w-full py-4 rounded-2xl font-black text-sm uppercase tracking-tighter transition-all overflow-hidden group
                  ${!user && !isSubmitting 
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]" 
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.02]"
                  } disabled:opacity-50`}
              >
                {!user && !isSubmitting && (
                  <span className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                )}

                <div className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : user ? (
                    <>Confirm & Claim (${cartTotal})</>
                  ) : (
                    <>
                      SIGN IN TO CLAIM
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    </>
                  )}
                </div>
              </button>
            </div>
          ) : (() => {
            // --- DETAILS PANEL ---
            const targetCell = selectedCell || winningCoordinates;
            const isWinnerView = !selectedCell && winningCoordinates; 
            const isTargetWinning = winningCoordinates && targetCell && winningCoordinates.row === targetCell.row && winningCoordinates.col === targetCell.col;
            
            // Hide completely if no cell is selected or winning
            if (!targetCell) {
              return null;
            }
            
            // Determine if panel should be stationary (during game) or collapsible (before game)
            const isGameStarted = game.isScrambled;
            const isStationary = isGameStarted;
            
            // Get common content
            const cellKey = `${targetCell.row}-${targetCell.col}`;
            const cellData = formattedSquares[cellKey] || [];
            
            const panelContent = (
              <div className="flex items-start justify-between">
                <div className="flex flex-col flex-1">
                  {/* OWNERS AT TOP - THE HERO */}
                  {cellData.length > 0 ? (
                    <div className="flex flex-row flex-wrap gap-2 items-center mb-2">
                        {cellData.map((p, i) => (
                          <div key={i} className="relative flex items-center gap-1.5 bg-black/20 px-2 py-0.5 rounded-md border border-white/10">
                            <span className="absolute -top-2 -right-2 bg-black/60 rounded-full p-0.5 drop-shadow-md">
                              <Trophy className="w-3 h-3 text-yellow-300" aria-hidden="true" />
                            </span>
                            <span className={`text-xl font-bold ${p.uid === user?.uid ? "text-cyan-200 drop-shadow-sm" : "text-white"}`}>{p.name}</span>
                            {!isWinnerView && (isAdmin || p.uid === user?.uid) && <button onClick={handleUnclaim} className="hover:text-red-300 transition-colors text-white/50"><Trash2 className="w-3.5 h-3.5" /></button>}
                          </div>
                        ))}
                    </div>
                  ) : null}
                  
                  <div className="flex items-center gap-2 text-xs text-white/70 font-medium">
                    {isWinnerView && <><Trophy className="w-3 h-3 text-yellow-300" /><span className="text-yellow-100">Winning Square</span></>}
                    {selectedCell && <span className="text-white/60">Selected Square</span>}
                    {targetCell && (
                      <span className="flex items-center gap-1">
                        (Row {currentAxis.col[targetCell.row]} • Col {currentAxis.row[targetCell.col]})
                        {isTargetWinning && <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />}
                      </span>
                    )}
                    {!targetCell && <span className="text-white/50">Select a Square</span>}
                  </div>
                </div>
                {!isStationary && selectedCell && <button onClick={() => setSelectedCell(null)} className="p-1 rounded-full hover:bg-white/20 text-white/70 ml-2"><X className="w-4 h-4" /></button>}
                {!isStationary && !selectedCell && (
                  <button 
                    onClick={() => setIsDetailsPanelCollapsed(!isDetailsPanelCollapsed)} 
                    className="p-1 rounded-full hover:bg-white/20 text-white/70 ml-2"
                    aria-label={isDetailsPanelCollapsed ? "Expand details" : "Collapse details"}
                  >
                    {isDetailsPanelCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
            );
            
            const emptySquareContent = cellData.length === 0 ? (
              <div className="p-2 text-center text-xs text-white/40 border border-dashed border-white/20 rounded-lg mt-2">Empty Square</div>
            ) : null;
            
            // Return stationary panel (under grid) when game started
            if (isStationary) {
              return (
                <div className={`w-full p-3 bg-[#0B0C15]/60 backdrop-blur-xl border ${isTargetWinning ? "border-yellow-400/60 shadow-[0_0_30px_rgba(250,204,21,0.3)] bg-yellow-900/10" : "border-white/10"} rounded-2xl shadow-xl mt-2`}>
                  {panelContent}
                  {emptySquareContent}
                </div>
              );
            }
            
            // Return collapsible fixed panel (at bottom) before game starts
            if (isDetailsPanelCollapsed) {
              // Collapsed state - show minimal info
              return (
                <div 
                  className={`fixed left-0 right-0 z-40 bg-[#0B0C15]/60 backdrop-blur-xl border ${isTargetWinning ? "border-yellow-400/60 shadow-[0_0_30px_rgba(250,204,21,0.3)] bg-yellow-900/10" : "border-white/10"} rounded-t-2xl shadow-xl transition-all duration-300 ease-in-out mx-0`}
                  style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
                >
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      {isWinnerView && <><Trophy className="w-3 h-3 text-yellow-300" /><span className="text-yellow-100">Winning Square</span></>}
                      {selectedCell && <span className="text-white/60">Square Selected</span>}
                      {targetCell && (
                        <span>(Row {currentAxis.col[targetCell.row]} • Col {currentAxis.row[targetCell.col]})</span>
                      )}
                    </div>
                    <button 
                      onClick={() => setIsDetailsPanelCollapsed(false)} 
                      className="p-1 rounded-full hover:bg-white/20 text-white/70"
                      aria-label="Expand details"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            }
            
            // Expanded fixed panel before game starts
            return (
              <div className={`fixed left-0 right-0 z-40 p-3 bg-[#0B0C15]/60 backdrop-blur-xl border ${isTargetWinning ? "border-yellow-400/60 shadow-[0_0_30px_rgba(250,204,21,0.3)] bg-yellow-900/10" : "border-white/10"} rounded-2xl shadow-xl transition-all duration-300 ease-in-out translate-y-0 opacity-100 mx-2`} style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
                {panelContent}
                {emptySquareContent}
              </div>
            );
          })()}

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
              paymentLink={game.paymentLink}
              zellePhone={game.zellePhone}
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
      <div className="hidden lg:flex w-[400px] xl:w-[450px] bg-[#0B0C15]/60 backdrop-blur-xl border-l border-white/10 flex-col h-full overflow-y-auto p-6 z-20 shadow-2xl relative">
        <div className="mb-6">
          <div onClick={() => router.push("/")} className="cursor-pointer group">
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/20 mb-4 shadow-xl group-hover:shadow-2xl transition-all">
              <Image src="/SouperBowlBanner.jpg" alt="Banner" fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b]/80 to-transparent/30" />
              <div className="absolute bottom-3 left-3 flex items-center gap-3">
                <div className="relative h-16 w-auto rounded-xl overflow-hidden shadow-lg ring-1 ring-white/10">
                  <img src="/image_9.png" alt="Souper Bowl LX Logo" className="h-16 w-auto object-contain" />
                </div>
                <div><h1 className="text-white font-black text-xl tracking-wider uppercase leading-none drop-shadow-md">Souper Bowl</h1><h1 className="text-indigo-300 font-black text-xl tracking-wider uppercase leading-none drop-shadow-md">Squares</h1></div>
              </div>
            </div>
            <p className="text-indigo-200 text-xs font-medium leading-relaxed border-l-2 border-indigo-400 pl-3 italic">"Go Big or Go Home. Connect, compete, and win big with the ultimate squares experience. Because with us, a Nguyen is always a Win"</p>
          </div>
          <div className="mt-6 flex justify-between items-center border-t border-white/10 pt-4">
            <HelpButton />
            <button onClick={handleAuth} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase transition-colors backdrop-blur-sm shadow-sm opacity-90 hover:opacity-100">
              {user ? <><LogOut className="w-4 h-4 text-red-300" /><span>Log Out</span></> : <><LogIn className="w-4 h-4 text-green-300" /><span>Log In</span></>}
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
          paymentLink={game.paymentLink}
          zellePhone={game.zellePhone}
          onResetGridDigits={resetGrid}
          selectedEventId={game.espnGameId}
          availableGames={liveGames}
          sportType={sportType}
        />
      </div>

      {/* Payment Modal */}
      {game && (() => {
        let ownedSquares = 0;
        if (user && game.squares) {
          Object.values(game.squares).forEach((sqValue: unknown) => {
            const sqUsers = Array.isArray(sqValue) ? sqValue : [sqValue];
            if (sqUsers.some((u: { uid?: string; userId?: string }) => 
              (u.uid && u.uid === user.uid) || (u.userId && u.userId === user.uid)
            )) {
              ownedSquares++;
            }
          });
        }
        
        return (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            paymentLink={game.paymentLink}
            zellePhone={game.zellePhone}
            hostName={game.hostDisplayName || "Host"}
            totalOwed={ownedSquares * game.price}
            gameName={game.name}
          />
        );
      })()}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl backdrop-blur-xl border-2 animate-in slide-in-from-top-5 fade-in duration-300"
          style={{
            backgroundColor: toast.type === 'error' ? 'rgba(220, 38, 38, 0.95)' : toast.type === 'warning' ? 'rgba(234, 179, 8, 0.95)' : 'rgba(34, 197, 94, 0.95)',
            borderColor: toast.type === 'error' ? 'rgba(248, 113, 113, 0.5)' : toast.type === 'warning' ? 'rgba(250, 204, 21, 0.5)' : 'rgba(74, 222, 128, 0.5)',
          }}
        >
          <p className="text-white font-bold text-sm text-center drop-shadow-md">{toast.message}</p>
        </div>
      )}
    </main>
  );
}