"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, PlusSquare, Zap, Dices, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a stored game ID
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem("activeGameId");
        if (stored) setActiveGameId(stored);
    }
  }, [pathname]); // Re-check when route changes

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex flex-col items-center justify-center w-full transition-all duration-200 ${
      isActive ? "text-cyan-200 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-white/40 hover:text-white/80"
    }`;
  };

  const handleLiveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeGameId) {
        router.push(`/game/${activeGameId}`);
    } else {
        // If no active game, go to profile to pick one
        router.push('/profile');
    }
  };

  const isLiveActive = pathname.startsWith('/game/');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 pb-safe bg-[#0B0C15]/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center h-full px-2 max-w-lg mx-auto w-full">
        
        {/* 1. HOME */}
        <Link href="/" className={`${getLinkClass('/')} flex-1 h-full`} aria-label="Home" title="Home">
          <Home size={28} />
          <span className="text-xs font-bold mt-1.5">HOME</span>
        </Link>

        {/* 2. CREATE */}
        <Link href="/create" className={`${getLinkClass('/create')} flex-1 h-full`} aria-label="Create" title="Create">
          <PlusSquare size={28} />
          <span className="text-xs font-bold mt-1.5">CREATE</span>
        </Link>

        {/* 3. LIVE (The Big Center Button) */}
        {/* We use a button here to handle the "Smart Redirect" logic */}
        <button 
            onClick={handleLiveClick} 
            className="relative -top-8 group flex flex-col items-center flex-1 h-full justify-start z-10" 
            aria-label="Live Game"
        >
          <div className={`
            p-5 rounded-full border-4 border-white/10 shadow-lg transition-transform duration-200 group-hover:scale-105 backdrop-blur-md
            ${isLiveActive 
              ? "bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_25px_rgba(34,211,238,0.7)]" 
              : "bg-white/20 group-hover:bg-white/30 group-hover:shadow-[0_0_18px_rgba(34,211,238,0.45)]"}
          `}>
            <Zap size={36} color="white" className={isLiveActive ? "fill-white" : ""} />
          </div>
          <span className={`absolute bottom-5 left-1/2 -translate-x-1/2 text-xs font-bold ${isLiveActive ? "text-cyan-200" : "text-white/40"} group-hover:text-white`}>
            LIVE
          </span>
        </button>

        {/* 4. JOIN (Changed from Props since Props page is likely empty) */}
        <Link href="/join" className={`${getLinkClass('/join')} flex-1 h-full`} aria-label="Join" title="Join">
          <Dices size={28} />
          <span className="text-xs font-bold mt-1.5">JOIN</span>
        </Link>

        {/* 5. PROFILE */}
        <Link href="/profile" className={`${getLinkClass('/profile')} flex-1 h-full`} aria-label="Profile" title="Profile">
          <User size={28} />
          <span className="text-xs font-bold mt-1.5">YOU</span>
        </Link>

      </div>
    </div>
  );
}