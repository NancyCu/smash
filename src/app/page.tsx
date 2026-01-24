"use client";

import React, { Suspense, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';

// Components
import AuthModal from '@/components/AuthModal';
import JoinGameForm from '@/components/JoinGameForm';
import BottomNav from '@/components/BottomNav';

type View = 'home' | 'join' | 'game';

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { game } = useGame();

  const initialGameCode = searchParams.get('code') || '';
  const currentView = (searchParams.get('view') as View) || (game ? 'game' : (initialGameCode ? 'join' : 'home'));

  const setView = (v: View) => {
    router.push(`/?view=${v}`);
  };

  useEffect(() => {
    if (currentView !== 'game') return;
    const storedGameId = typeof window !== 'undefined' ? localStorage.getItem('activeGameId') : null;
    const targetGameId = game?.id || storedGameId;
    if (targetGameId) {
      router.replace(`/game/${targetGameId}`);
    }
  }, [currentView, game?.id, router]);

  if (!user) return <AuthModal />;

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 text-slate-800 dark:text-slate-200 transition-colors duration-300'>
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
        {currentView === 'game' ? (
          <div className='min-h-[50vh] flex items-center justify-center text-cyan-500 font-bold uppercase tracking-widest'>
            Loading game...
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