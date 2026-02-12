"use client";

import React from "react";
import { Users, FileText, Trash2, Skull } from "lucide-react";
import SystemFailureView from "./SystemFailureView";

export type LipidTabView = "WAITING_ROOM" | "LAB_RESULTS" | "SYSTEM_FAILURE";

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
        <button
          onClick={() => onTabChange("SYSTEM_FAILURE")}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${
            currentTab === "SYSTEM_FAILURE"
              ? "text-white border-b-2 border-red-500 bg-slate-800/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Skull size={14} /> System Failure
        </button>
      </div>

      <div className="p-4">
        {currentTab === "WAITING_ROOM" ? (
          <div className="space-y-1">
            {/* Header Row */}
            <div className="grid grid-cols-[20px_1fr_45px_40px_45px_60px_20px] gap-2 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/10">
              <div className="text-left">#</div>
              <div className="text-left">PATIENT</div>
              <div className="text-center">TARGET</div>
              <div className="text-center">SIDE</div>
              <div className="text-right">RISK</div>
              <div className="text-right">P/L</div>
              <div></div> {/* Empty column for delete button */}
            </div>

            {bets.map((bet, index) => {
              const isUnder = bet.team === "RABBIT_FOOD";
              const winAmount = bet.potentialPayout
                ? bet.potentialPayout
                : isUnder
                  ? bet.amount + bet.amount * 1.5
                  : bet.amount * 2;
              const loseAmount = bet.amount;

              return (
                <div
                  key={bet.id}
                  className="grid grid-cols-[20px_1fr_45px_40px_45px_60px_20px] gap-2 px-4 py-3 border-b border-white/5 items-center hover:bg-white/5 transition-colors"
                >
                  {/* Index */}
                  <div className="text-gray-600 text-xs font-mono">{index + 1}</div>

                  {/* Name (Truncate if too long) */}
                  <div className="font-bold text-white text-sm truncate pr-2">
                    {bet.userName || "Anonymous"}
                  </div>

                  {/* Target */}
                  <div className="text-center">
                    <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
                      {bet.targetValue}
                    </span>
                  </div>

                  {/* Side (Fat/Veg) */}
                  <div className="text-center">
                    <span
                      className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                        bet.team === "TALLOW"
                          ? "bg-red-900/30 text-red-400"
                          : "bg-green-900/30 text-green-400"
                      }`}
                    >
                      {bet.team === "TALLOW" ? "FAT" : "VEG"}
                    </span>
                  </div>

                  {/* Risk Amount */}
                  <div className="text-right text-gray-400 text-xs">
                    ${bet.amount}
                  </div>

                  {/* Win/Lose - STACKED VERTICALLY to save space */}
                  <div className="text-right flex flex-col leading-tight">
                    <span className="text-green-400 text-[10px] font-bold">
                      +${winAmount.toFixed(0)}
                    </span>
                    <span className="text-red-500 text-[10px]">
                      -${loseAmount}
                    </span>
                  </div>
                  
                  {/* Delete Button */}
                  <div className="text-center">
                    {isAdmin && onDeleteBet && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this bet?")) onDeleteBet(bet.id);
                        }}
                        className="p-1 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded"
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
        ) : currentTab === "SYSTEM_FAILURE" ? (
          <SystemFailureView />
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
