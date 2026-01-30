"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Trophy, DollarSign, Shuffle, Hash, Grid3X3, AlertCircle } from "lucide-react";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Game</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-auto rounded-full overflow-hidden">
              <img src="/image_9.png" alt="Souper Bowl LX Logo" className="h-10 w-auto object-contain" />
            </div>
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest hidden sm:block">Rules of Play</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Title Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-600 rounded-2xl mb-2">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">How to Win</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Everything you need to know about The Souper Bowl Squares. Simple rules, big excitement.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-6">
          
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Grid3X3 className="w-32 h-32 rotate-12" />
            </div>
            <div className="flex gap-4 relative z-10">
              <div className="flex-shrink-0 w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600 font-black text-xl">1</div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Claim Your Squares</h3>
                <p className="text-slate-600 leading-relaxed">
                  The game board is a 10x10 grid with 100 total squares. Each square can be purchased/claimed by a player. You can claim as many squares as you like (up to the limit set by the Host).
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg mt-2">
                   <CheckCircle2 className="w-3.5 h-3.5" />
                   First Come, First Served
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Shuffle className="w-32 h-32 -rotate-12" />
            </div>
            <div className="flex gap-4 relative z-10">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">2</div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Numbers Are Revealed</h3>
                <p className="text-slate-600 leading-relaxed">
                  Once the grid is filled or the game starts, the system randomly assigns numbers (0-9) to each column and row. 
                </p>
                <ul className="space-y-2 mt-3 text-sm text-slate-500 font-medium">
                    <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2" />
                        <span><strong>Top Row:</strong> Represents the last digit of Team A's score.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2" />
                        <span><strong>Left Column:</strong> Represents the last digit of Team B's score.</span>
                    </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <DollarSign className="w-32 h-32 rotate-6" />
            </div>
            <div className="flex gap-4 relative z-10">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-xl">3</div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Watch & Win</h3>
                <p className="text-slate-600 leading-relaxed">
                  At the end of each quarter (or game end), compare the last digit of each team's score to the grid. The player who owns the intersecting square wins that portion of the pot!
                </p>
                
                <div className="bg-slate-50 rounded-xl p-4 mt-4 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Example Scenario</p>
                    <div className="flex items-center justify-between text-sm">
                        <div className="font-bold text-slate-900">Ravens: 2<span className="text-emerald-600 text-lg">7</span></div>
                        <div className="font-bold text-slate-900">Chiefs: 1<span className="text-emerald-600 text-lg">4</span></div>
                    </div>
                    <div className="h-px bg-slate-200 my-3" />
                    <p className="text-slate-600 text-sm">
                        The winning square is the intersection of <span className="font-bold text-slate-900">Row 7</span> and <span className="font-bold text-slate-900">Column 4</span>.
                    </p>
                </div>
              </div>
            </div>
          </div>

          {/* NEW: 50/50 Split Rollover Explanation */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 md:p-8 rounded-3xl shadow-sm border-2 border-amber-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <AlertCircle className="w-32 h-32" />
            </div>
            <div className="flex gap-4 relative z-10">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">💰</div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900">50/50 Split Rollover</h3>
                <p className="text-slate-700 leading-relaxed font-medium">
                  If a quarter ends with no winner (nobody owns the winning square), the money doesn't disappear—it rolls over using our fair 50/50 split system:
                </p>
                
                <div className="space-y-3 mt-4">
                  <div className="bg-white rounded-xl p-4 border border-amber-200">
                    <p className="font-bold text-amber-900 mb-2">Quarter 1 or 2 (No Winner):</p>
                    <p className="text-sm text-slate-600">
                      The pot <span className="font-bold text-amber-700">splits 50/50</span> → Half goes to the next quarter, half goes directly to Final.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-amber-200">
                    <p className="font-bold text-amber-900 mb-2">Quarter 3 (No Winner):</p>
                    <p className="text-sm text-slate-600">
                      The entire pot <span className="font-bold text-amber-700">rolls 100% to Final</span> (since there's no Quarter 4).
                    </p>
                  </div>
                </div>

                <div className="bg-amber-100 rounded-xl p-4 mt-4 border border-amber-300">
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-2">Example</p>
                  <div className="text-sm text-slate-700 space-y-1">
                    <p>Q1 ($19): No winner → $9.50 to Q2, $9.50 to Final</p>
                    <p>Q2 ($38 + $9.50 = $47.50): No winner → $23.75 to Q3, $23.75 to Final</p>
                    <p className="font-bold text-emerald-700">Q3 ($38 + $23.75 = $61.75): Winner takes $61.75</p>
                    <p className="font-bold text-emerald-700">Final ($95 + $9.50 + $23.75 = $128.25): Winner takes $128.25</p>
                  </div>
                  <p className="text-xs text-amber-800 mt-2 font-semibold">✓ Total paid out: $190 (100% of pot)</p>
                </div>

                <p className="text-xs text-slate-500 italic mt-4">
                  This system ensures Final never gets too small while keeping earlier quarters exciting!
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl p-8 text-center text-white shadow-xl">
            <h2 className="text-2xl font-black mb-4">Ready to Play?</h2>
            <p className="text-slate-300 mb-8 max-w-md mx-auto">Now that you know the rules, it's time to pick your lucky squares and enjoy the game.</p>
            <div className="flex justify-center gap-4">
                <Link href="/" className="px-8 py-3 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
                    Join a Game
                </Link>
            </div>
        </div>

        {/* Parimutuel Pool Rules */}
        <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-900 rounded-3xl p-8 shadow-2xl border border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-white" />
            <h2 className="text-3xl font-black uppercase tracking-widest text-white">SIDE HUSTLE RULES</h2>
          </div>
          <p className="text-base font-semibold text-white/90 mb-6">HOW PROP BETS WORK</p>
          <ul className="space-y-4 text-white/90">
            <li>
              <span className="font-black text-white">The Pool:</span> This isn't Vegas. We use a Parimutuel Pool system.
            </li>
            <li>
              <span className="font-black text-white">The Buy-In:</span> Everyone pays the same fixed Entry Fee (e.g., $5) to enter a specific bet.
            </li>
            <li>
              <span className="font-black text-white">The Payout:</span> All entry fees go into a single pot.
            </li>
            <li>
              <span className="font-black text-white">The Split:</span> The winners split the entire pot evenly.
            </li>
            <li>
              <span className="font-black text-white">Example:</span> 10 people bet $5. The Pot is $50.
            </li>
            <li>
              <span className="font-black text-white">Heads Wins:</span> If 5 people pick "Heads" and they win, they each get $10. If only 1 person picks "Heads" and wins, they take the whole $50.
            </li>
            <li>
              <span className="font-black text-white">The Ledger:</span> Wins and losses are tracked in your Ledger. We settle up cash at the end of the night.
            </li>
          </ul>
        </div>

      </main>
    </div>
  );
}
