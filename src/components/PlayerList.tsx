"use client";

import React from "react";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
  squares: number;
  paid: boolean;
}

interface PlayerListProps {
  players: Player[];
  canManagePayments: boolean;
  canManagePlayers: boolean;
  pricePerSquare: number;
  onTogglePaid: (id: string) => void;
  onDeletePlayer: (id: string) => void;
}

export default function PlayerList({ players, canManagePayments, canManagePlayers, pricePerSquare, onTogglePaid, onDeletePlayer }: PlayerListProps) {

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col h-full transition-colors duration-300">
      <div className="p-2 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/5 flex justify-between items-center backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest text-xs flex items-center gap-2">
           <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
           Players ({players.length})
        </h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-white/5 overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {players.map((player) => (
          <div key={player.id} className="p-3 pl-4 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs ring-1 ring-transparent group-hover:ring-indigo-500/50 transition-all">
                {player.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-200 text-sm">{player.name}</div>
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  {player.squares} Sqr · <span className={cn(pricePerSquare ? "text-cyan-600 dark:text-cyan-400" : "text-slate-500")}>{pricePerSquare ? `-$${(player.squares * pricePerSquare).toFixed(0)}` : "TBD"}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {canManagePayments && (
                <button
                  onClick={() => onTogglePaid(player.id)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all border",
                    player.paid 
                      ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-200 dark:hover:bg-emerald-500/20" 
                      : "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 hover:bg-rose-200 dark:hover:bg-rose-500/20"
                  )}
                  title={player.paid ? "Mark Unpaid" : "Mark Paid"}
                >
                  {player.paid ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Paid
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      Unpaid
                    </>
                  )}
                </button>
              )}
              
              {!canManagePayments && player.paid && (
                  <div className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-600/70 dark:text-emerald-400/70 border-emerald-100 dark:border-emerald-500/10 cursor-default">
                     <CheckCircle2 className="w-3 h-3" />
                     Paid
                  </div>
              )}

              {canManagePlayers && (
                <button 
                  onClick={() => onDeletePlayer(player.id)}
                  aria-label={`Delete ${player.name}`}
                  title={`Delete ${player.name}`}
                  className="p-1.5 text-slate-400 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-md hover:bg-slate-200 dark:hover:bg-white/5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
