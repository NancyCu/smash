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
  const [localPaidStatus, setLocalPaidStatus] = useState<Record<string, boolean>>({});

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
              const key = `${index}-${sq.userId}`;
              // Use local override if available, otherwise use game data
              const paid = localPaidStatus[key] !== undefined ? localPaidStatus[key] : !!sq.paid;
              list.push({
                  gridIndex: index,
                  userId: sq.userId,
                  name: sq.displayName,
                  paid: paid, // Use overridden value if available
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
  }, [game, localPaidStatus]);
  
  // Group claims by user
  const groupedClaims = useMemo(() => {
      const groups = new Map<string, {
          userId: string;
          name: string;
          squares: Array<{ gridIndex: number; row: number; col: number; paid: boolean }>;
          totalAmount: number;
          allPaid: boolean;
      }>();
      
      claims.forEach(claim => {
          if (!groups.has(claim.userId)) {
              groups.set(claim.userId, {
                  userId: claim.userId,
                  name: claim.name,
                  squares: [],
                  totalAmount: 0,
                  allPaid: true
              });
          }
          
          const group = groups.get(claim.userId)!;
          group.squares.push({
              gridIndex: claim.gridIndex,
              row: claim.row,
              col: claim.col,
              paid: claim.paid
          });
          group.totalAmount += game?.price || 0;
          if (!claim.paid) group.allPaid = false;
      });
      
      // Sort groups: unpaid first, then by name
      return Array.from(groups.values()).sort((a, b) => {
          if (a.allPaid === b.allPaid) return a.name.localeCompare(b.name);
          return a.allPaid ? 1 : -1;
      });
  }, [claims, game?.price]);

  const handleTogglePaid = async (userId: string, squares: Array<{ gridIndex: number; paid: boolean }>) => {
    // Prevent double-clicks
    if (togglingId === userId) return;
    
    setTogglingId(userId);
    
    try {
      // Determine target state: if all paid, unpay all. If any unpaid, pay all.
      const allPaid = squares.every(sq => sq.paid);
      const targetState = !allPaid;
      
      // Optimistically update local state for all squares
      const newLocalState: Record<string, boolean> = {};
      squares.forEach(sq => {
        const toggleKey = `${sq.gridIndex}-${userId}`;
        newLocalState[toggleKey] = targetState;
      });
      
      setLocalPaidStatus(prev => ({
        ...prev,
        ...newLocalState
      }));
      
      // Update Firebase for all squares
      await Promise.all(
        squares.map(sq => togglePaid(sq.gridIndex, userId))
      );
      
      // Clear local overrides after successful update
      setTimeout(() => {
        setLocalPaidStatus(prev => {
          const newState = { ...prev };
          squares.forEach(sq => {
            const toggleKey = `${sq.gridIndex}-${userId}`;
            delete newState[toggleKey];
          });
          return newState;
        });
      }, 500);
      
    } catch (error) {
      console.error('Error toggling paid status:', error);
      alert('Failed to update payment status. Please try again.');
      // Revert local state on error
      setLocalPaidStatus(prev => {
        const newState = { ...prev };
        squares.forEach(sq => {
          const toggleKey = `${sq.gridIndex}-${userId}`;
          delete newState[toggleKey];
        });
        return newState;
      });
    } finally {
      setTogglingId(null);
    }
  };

  if (!game) return <div className="min-h-screen bg-[#0B0C15] flex items-center justify-center text-white">Loading...</div>;

  const totalCollected = claims.filter(c => c.paid).length * game.price;
  const totalPot = claims.length * game.price;
  const totalPlayers = groupedClaims.length;

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
                   <span className="text-white font-bold">Total Players: {totalPlayers}</span> • 
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
                       <DollarSign className="w-4 h-4 text-slate-400" /> Transactions ({totalPlayers})
                   </h2>
               </div>

               <div className="overflow-y-auto max-h-[600px]">
                   <div className="p-2 md:p-4 space-y-2">
                       {groupedClaims.length === 0 ? (
                           <div className="p-8 text-center text-slate-500 text-sm">No squares claimed yet.</div>
                       ) : (
                           groupedClaims.map((group, i) => (
                               <div key={`${group.userId}-${i}`} className="flex flex-col gap-2 p-3 md:p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                                   {/* Top Row: User Info */}
                                   <div className="flex items-center gap-3 min-w-0">
                                       <div className={`w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center font-black text-sm border flex-shrink-0 ${group.allPaid ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-red-500/20 border-red-500/30 text-red-400"}`}>
                                           ${group.totalAmount}
                                       </div>
                                       <div className="min-w-0 flex-1">
                                           <div className="font-bold text-white text-sm md:text-base truncate">{group.name}</div>
                                           <div className="text-xs text-slate-500 font-mono">
                                               {group.squares.length} square{group.squares.length !== 1 ? 's' : ''} • {group.allPaid ? "✓ ALL PAID" : `${group.squares.filter(s => s.paid).length}/${group.squares.length} PAID`}
                                           </div>
                                           <div className="text-[10px] text-slate-600 mt-0.5">
                                               {group.squares.map(sq => `(${sq.row},${sq.col})`).join(', ')}
                                           </div>
                                       </div>
                                   </div>

                                   {/* Bottom Row: Action Button - Full Width on Mobile */}
                                   <button 
                                       type="button"
                                       onClick={() => handleTogglePaid(group.userId, group.squares)}
                                       disabled={togglingId === group.userId}
                                       className={`w-full md:w-auto md:self-end py-3 md:py-2 px-4 rounded-lg text-sm md:text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                                           group.allPaid 
                                           ? "bg-green-500 text-black hover:bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)] disabled:opacity-50" 
                                           : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] disabled:opacity-50"
                                       }`}
                                   >
                                       {togglingId === group.userId ? (
                                           <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                                       ) : group.allPaid ? (
                                           <><Check className="w-4 h-4" /> All Paid</>
                                       ) : (
                                           <><Check className="w-4 h-4" /> Mark All as Paid</>
                                       )}
                                   </button>
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