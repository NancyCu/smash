"use client";

import React, { useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import type { SquareData } from '@/context/GameContext';
import { ArrowLeft, Check, X, DollarSign, ShieldCheck } from 'lucide-react';

function PaymentsPageContent() {
  const { game, togglePaid, setGameId } = useGame();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- HYDRATION ---
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && (!game || game.id !== id)) {
        setGameId(id);
    }
  }, [searchParams, game, setGameId]);

  useEffect(() => {
    // Security redirect: Only Host can see this
    if (game && user && game.host !== user.uid) {
      router.push(`/game/${game.id}`);
    }
    if (!game && !user) {
        router.push('/');
    }
  }, [game, user, router]);

  // --- FLATTEN DATA FOR LIST VIEW ---
  // This converts the complex "Squares" map (which might contain Arrays) 
  // into a flat, easy-to-read list of claims.
  const claims = useMemo(() => {
      if (!game) return [];
      
      const list: { 
          gridIndex: number; 
          userId: string; 
          name: string; 
          paid: boolean; 
          row: number; 
          col: number 
      }[] = [];

      Object.entries(game.squares).forEach(([key, value]) => {
          const index = parseInt(key);
          if (isNaN(index)) return;

          // Helper to standardize the data
          const addToList = (sq: SquareData) => {
              list.push({
                  gridIndex: index,
                  userId: sq.userId,
                  name: sq.displayName,
                  paid: !!sq.paid, // Ensure boolean
                  row: Math.floor(index / 10),
                  col: index % 10
              });
          };

          // Handle "Stacking" (Arrays) vs "Legacy" (Single Objects)
          if (Array.isArray(value)) {
              value.forEach(addToList);
          } else {
              addToList(value as SquareData);
          }
      });
      
      // Sort by Paid Status (Unpaid first), then Name
      return list.sort((a, b) => {
          if (a.paid === b.paid) return a.name.localeCompare(b.name);
          return a.paid ? 1 : -1;
      });
  }, [game]);

  if (!game) return <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center text-white">Loading...</div>;

  const totalCollected = claims.filter(c => c.paid).length * game.price;
  const totalPot = claims.length * game.price;

  return (
    <main className="min-h-screen bg-[#0B0C15] p-4 lg:p-8 relative">
       
       {/* HEADER */}
       <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
           <div onClick={() => game ? router.push(`/game/${game.id}`) : router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white cursor-pointer transition-colors">
               <ArrowLeft className="w-5 h-5" />
               <span className="font-bold uppercase text-xs tracking-widest">Back to Game</span>
           </div>
           <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
               <ShieldCheck className="w-4 h-4 text-indigo-400" />
               <span className="text-xs font-bold text-indigo-300 uppercase">Host Admin</span>
           </div>
       </div>

       <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-[300px_1fr]">
           
           {/* SIDEBAR SUMMARY */}
           <div className="space-y-4">
               <div className="bg-[#151725] border border-white/10 rounded-2xl p-6 shadow-xl">
                   <div className="flex items-center gap-4 mb-6">
                        <div className="relative h-12 w-auto rounded-xl overflow-hidden shadow-lg">
                             <img src="/image_9.png" alt="Souper Bowl LX Logo" className="h-12 w-auto object-contain" />
                        </div>
                        <div>
                            <h1 className="text-white font-black text-lg leading-none mb-1">PAYMENT LEDGER</h1>
                            <p className="text-slate-500 text-xs font-mono">{game.name}</p>
                        </div>
                   </div>
                   
                   <div className="space-y-4">
                       <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                           <span className="block text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Total Pot</span>
                           <span className="block text-3xl font-black text-white">${totalPot}</span>
                       </div>
                       <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                           <span className="block text-xs text-green-400 uppercase font-bold tracking-widest mb-1">Collected</span>
                           <span className="block text-3xl font-black text-green-400">${totalCollected}</span>
                       </div>
                       <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                           <span className="block text-xs text-red-400 uppercase font-bold tracking-widest mb-1">Outstanding</span>
                           <span className="block text-3xl font-black text-red-400">${totalPot - totalCollected}</span>
                       </div>
                   </div>
               </div>
           </div>

           {/* MAIN LIST */}
           <div className="bg-[#151725] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col">
               <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                   <h2 className="font-bold text-white text-sm uppercase tracking-widest flex items-center gap-2">
                       <DollarSign className="w-4 h-4 text-slate-400" /> Transactions ({claims.length})
                   </h2>
               </div>

               <div className="overflow-y-auto max-h-[600px] p-2 space-y-2">
                   {claims.length === 0 ? (
                       <div className="p-8 text-center text-slate-500 text-sm">No squares claimed yet.</div>
                   ) : (
                       claims.map((c, i) => (
                           <div key={`${c.gridIndex}-${c.userId}-${i}`} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors group">
                               <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs border ${c.paid ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-red-500/20 border-red-500/30 text-red-400"}`}>
                                       ${game.price}
                                   </div>
                                   <div>
                                       <div className="font-bold text-white text-sm">{c.name}</div>
                                       <div className="text-xs text-slate-500 font-mono">Row {c.row} • Col {c.col}</div>
                                   </div>
                               </div>

                               <button 
                                   onClick={() => togglePaid(c.gridIndex, c.userId)}
                                   className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                                       c.paid 
                                       ? "bg-green-500 text-black hover:bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                                       : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                                   }`}
                               >
                                   {c.paid ? (
                                       <> <Check className="w-3 h-3" /> Paid </>
                                   ) : (
                                       <> <X className="w-3 h-3" /> Mark Paid </>
                                   )}
                               </button>
                           </div>
                       ))
                   )}
               </div>
           </div>

       </div>
    </main>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0C15] flex items-center justify-center text-white">Loading Payments...</div>}>
      <PaymentsPageContent />
    </Suspense>
  );
}