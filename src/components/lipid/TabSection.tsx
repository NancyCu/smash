"use client";

import React from "react";
import { Users, FileText, Trash2 } from "lucide-react";

export type LipidTabView = "WAITING_ROOM" | "LAB_RESULTS";

export interface LipidBet {
  id: string;
  oddsId: string;
  userName: string;
  amount: number;
  team: "RABBIT_FOOD" | "TALLOW";
  targetValue: number;
  timestamp: number;
  odds?: string;
  potentialPayout?: number;
}

interface TabSectionProps {
  currentTab: LipidTabView;
  onTabChange: (tab: LipidTabView) => void;
  bets: LipidBet[];
  isAdmin?: boolean;
  onDeleteBet?: (betId: string) => void;
}

export default function TabSection({
  currentTab,
  onTabChange,
  bets,
  isAdmin = false,
  onDeleteBet,
}: TabSectionProps) {
  return (
    <div className="bg-[#151525] rounded-t-3xl border-t border-slate-800 min-h-[300px] pb-24">
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => onTabChange("WAITING_ROOM")}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${
            currentTab === "WAITING_ROOM"
              ? "text-white border-b-2 border-[#00e676] bg-slate-800/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Users size={14} /> The Waiting Room
        </button>
        <button
          onClick={() => onTabChange("LAB_RESULTS")}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${
            currentTab === "LAB_RESULTS"
              ? "text-white border-b-2 border-blue-500 bg-slate-800/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <FileText size={14} /> The Lab Results
        </button>
      </div>

      <div className="p-4">
        {currentTab === "WAITING_ROOM" ? (
          <div className="space-y-2">
            {/* Header Row */}
            <div className="grid grid-cols-12 text-[10px] uppercase text-slate-500 font-bold mb-2 px-2">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Patient</div>
              <div className="col-span-2 text-center">Target</div>
              <div className="col-span-1 text-center">Side</div>
              <div className="col-span-2 text-center">Risked</div>
              <div className="col-span-3 text-right">Win / Lose</div>
            </div>

            {bets.map((bet, idx) => {
              const isUnder = bet.team === "RABBIT_FOOD";
              const winAmount = bet.potentialPayout
                ? bet.potentialPayout
                : isUnder ? bet.amount + bet.amount * 1.5 : bet.amount * 2;
              const loseAmount = bet.amount;

              return (
                <div
                  key={bet.id}
                  className="grid grid-cols-12 items-center p-3 bg-slate-800/40 rounded-lg border border-slate-700/50"
                >
                  <div className="col-span-1 text-slate-500 font-mono text-xs">
                    {idx + 1}
                  </div>
                  <div className="col-span-3 font-semibold text-sm text-white truncate">
                    {bet.userName}
                  </div>
                  <div className="col-span-2 text-center font-mono text-xs text-slate-300">
                    <span className="bg-slate-700/50 px-2 py-1 rounded text-white">
                      {bet.targetValue}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span
                      className={`text-[10px] font-bold px-1 py-0.5 rounded ${bet.team === "TALLOW" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}
                    >
                      {bet.team === "TALLOW" ? "FAT" : "FIT"}
                    </span>
                  </div>
                  <div className="col-span-2 text-center font-mono text-xs text-white/70">
                    ${bet.amount}
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-1">
                    <span className="text-xs font-mono font-bold text-emerald-400">+${winAmount.toFixed(0)}</span>
                    <span className="text-[9px] text-slate-500">/</span>
                    <span className="text-xs font-mono font-bold text-red-400">-${loseAmount}</span>
                    {isAdmin && onDeleteBet && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this bet?")) onDeleteBet(bet.id);
                        }}
                        className="p-1 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded ml-1"
                        title="Admin: Delete Bet"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {bets.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                No bets yet. Be the first degenerate.
              </div>
            )}

            {bets.length > 0 && (
              <div className="p-4 text-center text-slate-500 text-xs italic">
                + {Math.floor(Math.random() * 200)} others currently eating
                mayonnaise
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center animate-spin" style={{ animationDuration: "8s" }}>
              <FileText size={24} />
            </div>
            <p className="text-xs font-mono">
              LAB PROCESSING... (ETA: 3 Days)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
