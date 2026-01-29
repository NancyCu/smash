"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Zap, Gamepad2, User, Trophy } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a stored game ID
    const checkActiveGame = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem("activeGameId");
        setActiveGameId(stored);
      }
    };
    
    checkActiveGame();
    
    // Listen for custom event from game page
    window.addEventListener('activeGameIdChanged', checkActiveGame);
    
    return () => {
      window.removeEventListener('activeGameIdChanged', checkActiveGame);
    };
  }, [pathname]); // Re-check when route changes

  const getLinkClass = (path: string, altPaths: string[] = [], isWinners: boolean = false) => {
    const isActive = pathname === path || altPaths.some(p => pathname.startsWith(p));
    const activeColor = isWinners 
      ? "text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" 
      : "text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]";
    return `flex flex-col items-center justify-center w-full transition-all duration-200 ${
      isActive ? activeColor : "text-white/40 hover:text-white/70"
    }`;
  };

  const handleLiveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeGameId) {
        router.push(`/game/${activeGameId}`);
    } else {
        // If no active game, go to Play Hub
        router.push('/play');
    }
  };

  // NEW LOGIC: Button lights up when activeGameId exists (beacon mode)
  const hasActiveGame = activeGameId !== null;
  const isOnActiveGame = pathname.includes('/game/') && pathname.includes(activeGameId || '');
  const isPlayActive = pathname === '/play' || pathname === '/create' || pathname === '/join';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 pb-safe bg-[#0B0C15]/90 backdrop-blur-xl border-t border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center h-full px-2 max-w-lg mx-auto w-full">
        
        {/* 1. HOME */}
        <Link href="/" className={`${getLinkClass('/', [])} flex-1 h-full`} aria-label="Home" title="Home">
          <Home size={26} strokeWidth={2.5} />
          <span className="text-[10px] font-bold mt-1 tracking-wider">HOME</span>
        </Link>

        {/* 2. WINNERS (Hall of Fame) */}
        <Link href="/winners" className={`${getLinkClass('/winners', [], true)} flex-1 h-full`} aria-label="Hall of Fame" title="Hall of Fame">
          <Trophy size={26} strokeWidth={2.5} />
          <span className="text-[10px] font-bold mt-1 tracking-wider">WINNERS</span>
        </Link>

        {/* 3. LIVE (The Big Center FAB - Beacon Mode) */}
        <button 
            onClick={handleLiveClick} 
            className="relative -top-7 group flex flex-col items-center flex-1 h-full justify-start z-10" 
            aria-label="Live Game"
            title={hasActiveGame ? "Jump to Active Game" : "No Active Game"}
        >
          <div className="relative overflow-visible">
            {/* Active Ring - Shown when on the exact active game page */}
            {isOnActiveGame && (
              <div className="absolute inset-0 -m-1 rounded-full border-2 border-cyan-400 opacity-50 animate-pulse" />
            )}
            
            <div className={`
              p-4 rounded-full shadow-2xl transition-all duration-300 group-hover:scale-105 overflow-visible
              ${hasActiveGame
                ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_30px_rgba(34,211,238,0.8)] animate-pulse" 
                : "bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/20 group-hover:from-cyan-500/30 group-hover:to-blue-600/30 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"}
            `} style={{ filter: hasActiveGame ? 'drop-shadow(0 0 20px rgba(34,211,238,0.6))' : 'none' }}>
              <Zap 
                size={32} 
                strokeWidth={2.5} 
                className={`${hasActiveGame ? "fill-white text-white" : "text-white"} drop-shadow-lg`} 
              />
            </div>
          </div>
          <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wider whitespace-nowrap ${hasActiveGame ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" : "text-white/40 group-hover:text-white/70"}`}>
            LIVE
          </span>
        </button>

        {/* 4. PLAY (Create/Join Hub) */}
        <Link 
          href="/play" 
          className={`${getLinkClass('/play', ['/create', '/join'])} flex-1 h-full`} 
          aria-label="Play Hub" 
          title="Play Hub"
        >
          <Gamepad2 size={26} strokeWidth={2.5} className={isPlayActive ? "fill-cyan-400/20" : ""} />
          <span className="text-[10px] font-bold mt-1 tracking-wider">PLAY</span>
        </Link>

        {/* 5. YOU (Profile) */}
        <Link href="/profile" className={`${getLinkClass('/profile', [])} flex-1 h-full`} aria-label="Profile" title="Your Profile">
          <User size={26} strokeWidth={2.5} />
          <span className="text-[10px] font-bold mt-1 tracking-wider">YOU</span>
        </Link>

      </div>
    </div>
  );
}
