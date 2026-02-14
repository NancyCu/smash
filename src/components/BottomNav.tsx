"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Zap, Gamepad2, User, HeartPulse, Dices, Plus, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame, type GameData } from '@/context/GameContext';
import { useEspnScores } from '@/hooks/useEspnScores';
import WarpMenu from './WarpMenu';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { getUserGames } = useGame();
  const { games: espnGames } = useEspnScores();

  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [liveGames, setLiveGames] = useState<GameData[]>([]);
  const [showWarpMenu, setShowWarpMenu] = useState(false);

  // Auto-Hide Nav Logic
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = React.useRef<HTMLDivElement>(null);
  const isInteracting = React.useRef(false); // Prevents immediate closing on open

  // Handle scroll/touch to collapse
  useEffect(() => {
    const handleInteraction = (e: Event) => {
      if (!isExpanded) return;
      if (isInteracting.current) {
        isInteracting.current = false;
        return;
      }

      // If click is inside nav, don't close
      if (e.type === 'click' || e.type === 'touchstart') {
        const target = e.target as Node;
        if (navRef.current && navRef.current.contains(target)) {
          return;
        }
      }

      setIsExpanded(false);
    };

    if (isExpanded) {
      window.addEventListener('scroll', handleInteraction, { passive: true });
      window.addEventListener('touchstart', handleInteraction, { passive: true });
      window.addEventListener('click', handleInteraction); // covers desktop clicks
    }

    return () => {
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [isExpanded]);

  useEffect(() => {
    // Check localStorage for last active game
    const checkActiveGame = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem("activeGameId");
        setActiveGameId(stored);
      }
    };

    checkActiveGame();

    // Listen for custom event from game page
    window.addEventListener('activeGameIdChanged', checkActiveGame);

    // Close warp menu when route changes
    setShowWarpMenu(false);

    return () => {
      window.removeEventListener('activeGameIdChanged', checkActiveGame);
    };
  }, [pathname]); // Re-check when route changes

  // Task 1 & 2: Priority-Based Redirect Logic + Multiple Live Games Support
  useEffect(() => {
    const checkForLiveGames = async () => {
      if (!user) {
        setLiveGames([]);
        return;
      }

      try {
        // Fetch user's games
        const userGames = await getUserGames(user.uid);

        // Find ALL games that are currently LIVE (matched with ESPN)
        const currentlyLive = userGames.filter(game => {
          // Skip completed games
          if (game.status === 'final') return false;

          // Check if game has ESPN ID and is currently live
          if (game.espnGameId) {
            const espnMatch = espnGames.find(eg => eg.id === game.espnGameId);
            return espnMatch?.isLive === true;
          }

          return false;
        });

        setLiveGames(currentlyLive);

        console.log('[BottomNav] Found live games:', currentlyLive.length, currentlyLive.map(g => g.id));
      } catch (error) {
        console.error('[BottomNav] Error checking for live games:', error);
        setLiveGames([]);
      }
    };

    checkForLiveGames();

    // Re-check every 30 seconds in case game status changes
    const interval = setInterval(checkForLiveGames, 30000);

    return () => clearInterval(interval);
  }, [user, getUserGames, espnGames]);

  const getLinkClass = (path: string, altPaths: string[] = []) => {
    const isActive = pathname === path || altPaths.some(p => pathname.startsWith(p));
    const activeColor = "text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]";
    return `flex flex-col items-center justify-center w-full transition-all duration-200 ${isActive ? activeColor : "text-white/40 hover:text-white/70"
      }`;
  };

  const handleLiveClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Task 2: Logic Trigger
    // Priority 1: Multiple live games -> Show Warp Menu
    if (liveGames.length > 1) {
      console.log('[BottomNav] Multiple live games, toggling Warp Menu');
      setShowWarpMenu(!showWarpMenu);
      return;
    }

    // Priority 2: Single live game -> Redirect immediately
    if (liveGames.length === 1) {
      console.log('[BottomNav] Single live game, redirecting:', liveGames[0].id);
      router.push(`/game/${liveGames[0].id}`);
      return;
    }

    // Priority 3: No live games, fallback to last active game from localStorage (if not finished)
    if (activeGameId && user) {
      try {
        const userGames = await getUserGames(user.uid);
        const storedGame = userGames.find(g => g.id === activeGameId);

        // Task 3: Storage Cleanup - Don't redirect if game is finished
        if (storedGame && storedGame.status !== 'final') {
          console.log('[BottomNav] Redirecting to last active game:', activeGameId);
          router.push(`/game/${activeGameId}`);
          return;
        } else {
          // Game is finished or deleted - clean up storage
          console.log('[BottomNav] Cleaning up finished/deleted game from storage:', activeGameId);
          localStorage.removeItem('activeGameId');
          setActiveGameId(null);
          setTimeout(() => {
            window.dispatchEvent(new Event('activeGameIdChanged'));
          }, 0);
        }
      } catch (error) {
        console.error('[BottomNav] Error checking stored game:', error);
      }
    }

    // Priority 4: No live or valid active game - go to Play Hub
    console.log('[BottomNav] No active game found, redirecting to Play Hub');
    router.push('/play');
  };

  // Task 2: Sync the Glow with Priority
  // - PULSE: Only if game is truly LIVE (currently in-progress with ESPN)
  // - GLOW: Only for actual live games (not finished games in storage)
  const hasLiveGames = liveGames.length > 0;
  const shouldPulse = hasLiveGames; // Only pulse for actual live games
  const shouldGlow = hasLiveGames; // Only glow for actual live games, not stored games
  const isOnActiveGame = pathname.includes('/game/') && (
    liveGames.some(g => pathname.includes(g.id)) ||
    pathname.includes(activeGameId || '')
  );
  const isPlayActive = pathname === '/play' || pathname === '/create' || pathname === '/join';
  const isBauCua = pathname === '/bau-cua';

  return (
    <>
      {/* Task 3: Warp Menu */}
      {showWarpMenu && (
        <WarpMenu
          liveGames={liveGames}
          onClose={() => setShowWarpMenu(false)}
        />
      )}

      {/* Mini Menu Button (Visible when collapsed) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(true);
          isInteracting.current = true; // prevent immediate close by document listener
        }}
        className={`
            fixed bottom-4 left-4 z-40 w-12 h-12 rounded-full 
            bg-[#0B0C15]/90 backdrop-blur-xl border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.5)] 
            flex items-center justify-center text-white/70 
            transition-all duration-300 ease-out
            hover:scale-110 hover:text-white hover:border-white/40
            active:scale-95
            ${isExpanded ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}
          `}
        aria-label="Open Menu"
      >
        <Menu size={24} />
      </button>

      <div
        ref={navRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0B0C15]/90 backdrop-blur-xl border-t border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${isBauCua ? 'h-12 pb-1' : 'h-16 pb-safe'} ${isExpanded ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex justify-between items-center h-full px-2 max-w-lg mx-auto w-full">

          {/* 1. HOME */}
          <Link href="/" className={`${getLinkClass('/', [])} flex-1 h-full`} aria-label="Home" title="Home">
            <Home size={isBauCua ? 20 : 26} strokeWidth={2.5} />
            {!isBauCua && <span className="text-[10px] font-bold mt-1 tracking-wider">HOME</span>}
          </Link>

          {/* 2. CREATE (Host Game) - Formerly Bau Cua location */}
          <Link
            href="/create"
            className={`${getLinkClass('/create', [])} flex-1 h-full`}
            aria-label="Create Game"
            title="Host New Game"
          >
            <Plus size={isBauCua ? 20 : 26} strokeWidth={2.5} />
            {!isBauCua && <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">HOST</span>}
          </Link>

          {/* 3. BAU CUA (Inline) */}
          <Link
            href="/bau-cua"
            className={`${getLinkClass('/bau-cua', [])} flex-1 h-full`}
            aria-label="Bau Cua"
            title="Play Bau Cua"
          >
            <span className={`text-[26px] leading-none ${pathname === '/bau-cua' ? "drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" : "grayscale opacity-80"}`}>🦀</span>
            {!isBauCua && <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Bau Cua</span>}
          </Link>

          {/* 
            // OLD LIVE BUTTON (Preserved Code)
            <button
              id="tour-live-btn"
              onClick={handleLiveClick}
              ...
            >
              ...
            </button> 
          */}

          {/* 4. LIPID LOTTO */}
          <Link
            href="/lipid-lotto"
            className={`${getLinkClass('/lipid-lotto', [])} flex-1 h-full`}
            aria-label="Lipid Lotto"
            title="Lipid Lotto"
          >
            <HeartPulse size={isBauCua ? 20 : 26} strokeWidth={2.5} className={`${pathname === '/lipid-lotto' ? "text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "text-white/40 group-hover:text-white/70"}`} />
            {!isBauCua && <span className={`text-[10px] font-bold mt-1 tracking-wider ${pathname === '/lipid-lotto' ? "text-red-400" : ""}`}>LOTTO</span>}
          </Link>

          {/* 5. YOU (Profile) */}
          <Link href="/profile" className={`${getLinkClass('/profile', [])} flex-1 h-full`} aria-label="Profile" title="Your Profile">
            <User size={isBauCua ? 20 : 26} strokeWidth={2.5} />
            {!isBauCua && <span className="text-[10px] font-bold mt-1 tracking-wider">YOU</span>}
          </Link>

        </div>
      </div>
    </>
  );
}
