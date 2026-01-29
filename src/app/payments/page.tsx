"use client";

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import type { SquareData } from '@/context/GameContext';
import { ArrowLeft, Check, X, DollarSign, ShieldCheck, Loader2 } from 'lucide-react';

function PaymentsPageContent() {
  const { game, togglePaid, setGameId } = useGame();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  const handleTogglePaid = async (gridIndex: number, userId: string) => {
    const toggleKey = `${gridIndex}-${userId}`;
    setTogglingId(toggleKey);
    try {
      await togglePaid(gridIndex, userId);
    } catch (error) {
      console.error('Error toggling paid status:', error);
      alert('Failed to update payment status. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  if (!game) return <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center text-white">Loading...</div>;

  const totalCollected = claims.filter(c => c.paid).length * game.price;
  const totalPot = claims.length * game.price;

  return (
    <main className="min-h-screen bg-[#0B0C15] p-2 md:p-4 lg:p-8 relative">
       
       {/* HEADER */}
       <div className="max-w-6xl mx-auto mb-6 md:mb-8 flex items-center justify-between">
           <div onClick={() => game ? router.push(`/game/${game.id}`) : router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white cursor-pointer transition-colors">
               <ArrowLeft className="w-5 h-5" />
               <span className="font-bold uppercase text-xs tracking-widest">Back to Game</span>
           </div>
           <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
               <ShieldCheck className="w-4 h-4 text-indigo-400" />
               <span className="text-xs font-bold text-indigo-300 uppercase">Host Admin</span>
           </div>
       </div>

       <div className="max-w-6xl mx-auto">
           
           {/* TITLE */}
           <div className="mb-6">
               <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide flex items-center gap-3 mb-2">
                   <span>💰</span> Payment Ledger
               </h1>
               <p className="text-slate-400 text-sm">
                   <span className="text-white font-bold">Total Players: {claims.length}</span> • 
                   <span className="text-green-400 font-bold ml-1">Total Pot: ${totalPot}</span>
               </p>
           </div>

           {/* SUMMARY CARDS - DESKTOP ONLY */}
           <div className="hidden md:grid md:grid-cols-3 gap-4 mb-8">
               <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                   <span className="block text-xs text-indigo-400 uppercase font-bold tracking-widest mb-1">Total Pot</span>
                   <span className="block text-2xl font-black text-white">${totalPot}</span>
               </div>
               <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                   <span className="block text-xs text-green-400 uppercase font-bold tracking-widest mb-1">Collected</span>
                   <span className="block text-2xl font-black text-green-400">${totalCollected}</span>
               </div>
               <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                   <span className="block text-xs text-red-400 uppercase font-bold tracking-widest mb-1">Outstanding</span>
                   <span className="block text-2xl font-black text-red-400">${totalPot - totalCollected}</span>
               </div>
           </div>

           {/* TRANSACTIONS TABLE */}
           <div className="bg-[#151725] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
               <div className="p-3 md:p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                   <h2 className="font-bold text-white text-xs md:text-sm uppercase tracking-widest flex items-center gap-2">
                       <DollarSign className="w-4 h-4 text-slate-400" /> Transactions ({claims.length})
                   </h2>
               </div>

               <div className="overflow-x-auto">
                   <div className="overflow-y-auto max-h-[600px] p-2 md:p-4 space-y-2">
                       {claims.length === 0 ? (
                           <div className="p-8 text-center text-slate-500 text-sm">No squares claimed yet.</div>
                       ) : (
                           claims.map((c, i) => (
                               <div key={`${c.gridIndex}-${c.userId}-${i}`} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 md:p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                                   <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                       <div className={`w-12 h-12 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-black text-xs border flex-shrink-0 ${c.paid ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-red-500/20 border-red-500/30 text-red-400"}`}>
                                           ${game.price}
                                       </div>
                                       <div className="min-w-0">
                                           <div className="font-bold text-white text-sm md:text-base truncate">{c.name}</div>
                                           <div className="text-xs text-slate-500 font-mono">Row {c.row} • Col {c.col}</div>
                                           <div className="text-xs text-slate-500 font-mono mt-1 md:hidden">${c.paid ? "PAID" : String(game.price)}</div>
                                       </div>
                                   </div>

                                   <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto justify-between md:justify-end">
                                       <div className="md:hidden text-right">
                                           <div className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${c.paid ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                                               {c.paid ? "✓ PAID" : "✗ UNPAID"}
                                           </div>
                                       </div>
                                       <button 
                                           onClick={() => handleTogglePaid(c.gridIndex, c.userId)}
                                           disabled={togglingId === `${c.gridIndex}-${c.userId}`}
                                           className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-1.5 rounded-lg text-xs md:text-xs font-bold uppercase transition-all disabled:opacity-50 whitespace-nowrap flex-shrink-0 ${
                                               c.paid 
                                               ? "bg-green-500 text-black hover:bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                                               : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
                                           }`}
                                       >
                                           {togglingId === `${c.gridIndex}-${c.userId}` ? (
                                               <> <Loader2 className="w-3 h-3 animate-spin" /> </> 
                                           ) : c.paid ? (
                                               <> <Check className="w-3 h-3" /> Paid </>
                                           ) : (
                                               <> <X className="w-3 h-3" /> Mark Paid </>
                                           )}
                                       </button>
                                   </div>
                               </div>
                           ))
                       )}
                   </div>
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