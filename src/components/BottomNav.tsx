"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, Ticket, Dices, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  // Helper to style the active button (Glows Cyan when active)
  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex flex-col items-center justify-center w-16 transition-all duration-200 ${
      isActive ? "text-cyan-400 scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-gray-500 hover:text-gray-300"
    }`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-20 pb-safe bg-[#0B0C15] border-t border-gray-800 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center h-full px-2 max-w-md mx-auto">
        
        {/* 1. HOME */}
        <Link href="/" className={getLinkClass('/')}>
          <Home size={24} strokeWidth={pathname === '/' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">HOME</span>
        </Link>

        {/* 2. CREATE (Points to /create) */}
        <Link href="/create" className={getLinkClass('/create')}>
          <PlusSquare size={24} strokeWidth={pathname === '/create' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">CREATE</span>
        </Link>

        {/* 3. JOIN (Center Floating Button) */}
        <Link href="/join" className="relative -top-6 group">
          <div className={`
            p-4 rounded-full border-4 border-[#0B0C15] shadow-lg transition-transform duration-200 group-hover:scale-105
            ${pathname === '/join' 
              ? "bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.6)]" 
              : "bg-gray-700 group-hover:bg-gray-600"}
          `}>
            <Ticket size={32} color="white" strokeWidth={2.5} />
          </div>
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 group-hover:text-white">
            JOIN
          </span>
        </Link>

        {/* 4. PROPS (Points to /props) */}
        <Link href="/props" className={getLinkClass('/props')}>
          <Dices size={24} strokeWidth={pathname === '/props' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">PROPS</span>
        </Link>

        {/* 5. PROFILE (Points to /profile) */}
        <Link href="/profile" className={getLinkClass('/profile')}>
          <User size={24} strokeWidth={pathname === '/profile' ? 2.5 : 2} />
          <span className="text-[10px] font-bold mt-1 tracking-wide">YOU</span>
        </Link>

      </div>
    </div>
  );
}