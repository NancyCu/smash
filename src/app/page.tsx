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

  // Simple "Host Game" Logic
  const handleCreateGame = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      // 1. Create the Game Document in Firestore
      const docRef = await addDoc(collection(db, "games"), {
        name: `${user.displayName || "Host"}'s Bowl`,
        host: user.displayName || "Anonymous",
        hostId: user.uid,
        price: 10, // Default, you can make a form for this later
        pot: 0,
        teamA: "Chiefs",
        teamB: "Eagles",
        isScrambled: false,
        createdAt: serverTimestamp(),
        // Initialize empty structures to prevent crashes
        scores: { q1:{home:0,away:0}, q2:{home:0,away:0}, q3:{home:0,away:0}, final:{home:0,away:0}, teamA:0, teamB:0 },
        squares: {},
        axis: { q1:{row:[],col:[]}, q2:{row:[],col:[]}, q3:{row:[],col:[]}, final:{row:[],col:[]} }
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

      {/* --- MAIN DASHBOARD --- */}
      <main className='w-full px-4 max-w-md mx-auto py-8 space-y-6'>
        
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Welcome, {user.displayName?.split(' ')[0]}!</h2>
          <p className="text-indigo-100 text-sm mb-6">Ready to dominate the grid?</p>
          
          <button 
            onClick={handleCreateGame}
            disabled={isCreating}
            className="w-full py-3 bg-white text-indigo-700 font-black uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            {isCreating ? (
              <span className="animate-pulse">Creating Arena...</span>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Host New Game
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
        </div>

        {/* Join Game Form */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-lg">
           <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400">
             <Trophy className="w-5 h-5" />
             <span className="text-xs font-black uppercase tracking-widest">Join Action</span>
           </div>
           {/* Pass a onSuccess callback that pushes to the new route */}
           <JoinGameForm 
              onSuccess={(gameId: string) => router.push(`/game/${gameId}`)} 
              initialGameId="" 
           />
        </div>

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