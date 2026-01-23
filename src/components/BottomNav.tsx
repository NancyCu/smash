"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusSquare, Zap, Dices, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

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
          <Home size={24} />
          <span className="text-[10px] font-bold mt-1">HOME</span>
        </Link>

        {/* 2. CREATE (The Plus Icon) -> MUST POINT TO /create */}
        <Link href="/create" className={getLinkClass('/create')}>
          <PlusSquare size={24} />
          <span className="text-[10px] font-bold mt-1">CREATE</span>
        </Link>

        {/* 3. LIVE (The Big Center Button) -> /live */}
        <Link href="/live" className="relative -top-6 group">
          <div className={`
            p-4 rounded-full border-4 border-[#0B0C15] shadow-lg transition-transform duration-200 group-hover:scale-105
            ${pathname === '/live' 
              ? "bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_25px_rgba(34,211,238,0.7)]" 
              : "bg-gray-700 group-hover:bg-gray-600 group-hover:shadow-[0_0_18px_rgba(34,211,238,0.45)]"}
          `}>
            <Zap size={32} color="white" />
          </div>
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 group-hover:text-white">
            LIVE
          </span>
        </Link>

        {/* 4. PROPS */}
        <Link href="/props" className={getLinkClass('/props')}>
          <Dices size={24} />
          <span className="text-[10px] font-bold mt-1">PROPS</span>
        </Link>

        {/* 5. PROFILE */}
        <Link href="/profile" className={getLinkClass('/profile')}>
          <User size={24} />
          <span className="text-[10px] font-bold mt-1">YOU</span>
        </Link>

      </div>
    </div>
  );
}