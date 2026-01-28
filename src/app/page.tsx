"use client";

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { LogIn, LogOut, Plus, ArrowRight, Loader2, Mail, Lock } from 'lucide-react';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signIn, signUp, logOut } = useAuth(); // Needs signIn/signUp from AuthContext

  const initialGameCode = searchParams.get('code') || '';
  const [gameCode, setGameCode] = useState(initialGameCode);
  const [isJoining, setIsJoining] = useState(false);

  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Check for ?action=login in URL
  useEffect(() => {
     if (searchParams.get('action') === 'login') {
         const form = document.getElementById('auth-form');
         if (form) form.scrollIntoView({ behavior: 'smooth' });
     }
  }, [searchParams]);

  const handleJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gameCode.trim()) return;
    setIsJoining(true);
    router.push(`/game/${gameCode.trim()}`);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) return;
      setAuthLoading(true);
      try {
          if (authMode === 'login') {
              await signIn(email, password);
          } else {
              if (!name) { alert("Please enter a display name"); return; }
              await signUp(email, password, name);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setAuthLoading(false);
      }
  };

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-8 relative z-10 pb-20">
      
      {/* LOGO SECTION */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <img 
            src="/image_9.png" 
            alt="Souper Bowl LX Logo" 
            className="w-full max-w-[320px] mx-auto mb-6 object-contain drop-shadow-[0_10px_15px_rgba(249,115,22,0.3)]"
          />
          <div className="text-center mt-6 mb-8 relative z-10">
            <h1 className="font-russo text-5xl md:text-7xl tracking-tighter uppercase italic leading-[0.95] overflow-visible pb-1">
              <span className="text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.9)]">
                Souper Bowl
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#db2777] via-[#22d3ee] to-[#db2777] bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(34,211,238,0.6)]">
                SQUARES
              </span>
            </h1>
            <p className="text-[#22d3ee] text-sm md:text-base font-bold mt-3 tracking-[0.2em] uppercase opacity-90">
              &ldquo;Because with us, a Nguyen is always a Win&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="w-full bg-[#151725] border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col gap-6">
         
         {/* JOIN SECTION */}
         <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Join Existing Game</label>
            <div className="flex gap-2">
              <input 
                type="text" value={gameCode} onChange={(e) => setGameCode(e.target.value)}
                placeholder="Enter Game Code" 
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button type="submit" disabled={isJoining || !gameCode} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl px-4 flex items-center justify-center">
                {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
         </form>

         <div className="h-px w-full bg-white/5" />

         {/* AUTH SECTION (Replaces Google Button) */}
         {user ? (
             <div className="flex flex-col gap-3">
                 <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl flex items-center justify-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                     <span className="text-green-400 text-sm font-bold">Logged in as {user.displayName}</span>
                 </div>
                 <button onClick={() => router.push('/create')} className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Host New Game
                 </button>
                 <button onClick={() => logOut()} className="w-full py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors">Sign Out</button>
             </div>
         ) : (
             <div id="auth-form" className="flex flex-col gap-4">
                 <div className="flex gap-4 border-b border-white/10 pb-2">
                     <button onClick={() => setAuthMode('login')} className={`flex-1 text-sm font-bold uppercase tracking-wider pb-2 transition-colors ${authMode === 'login' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500'}`}>Login</button>
                     <button onClick={() => setAuthMode('signup')} className={`flex-1 text-sm font-bold uppercase tracking-wider pb-2 transition-colors ${authMode === 'signup' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500'}`}>Sign Up</button>
                 </div>
                 
                 <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3">
                     {authMode === 'signup' && (
                         <input type="text" placeholder="Display Name" value={name} onChange={e => setName(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                     )}
                     <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                     </div>
                     <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                     </div>
                     <button type="submit" disabled={authLoading} className="mt-2 w-full py-3 rounded-xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                         {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (authMode === 'login' ? "Log In" : "Create Account")}
                     </button>
                 </form>
             </div>
         )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0C15] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <Suspense fallback={<div className="text-white animate-pulse">Loading...</div>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}