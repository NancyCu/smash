"use client";

import { useGame } from "@/context/GameContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Check, X, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PaymentsPage() {
  const { activeGame, players, settings, togglePaid } = useGame();
  const { isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!activeGame) {
      router.push("/");
      return;
    }
    // Check if current user is host (simple client side check for UI, real security is Firestore rules)
    // We actually don't have the current user ID easily available in this context without auth hook
    // But GameContext has players.
    // Let's just show it to everyone for transparency, or maybe restricting edits to host.
    // The prompt implies a "page with all the users", transparency is usually good for pots.
  }, [activeGame, router]);

  if (!activeGame) return null;

  const totalPot = players.reduce((sum, p) => sum + (p.squares * settings.pricePerSquare), 0);
  const collectedAmount = players.reduce((sum, p) => sum + (p.paid ? (p.squares * settings.pricePerSquare) : 0), 0);
  const percentCollected = totalPot > 0 ? (collectedAmount / totalPot) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/")}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Payment Ledger</h1>
            <p className="text-slate-400">{settings.name}</p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-sm mb-1">Total Pot</div>
            <div className="text-3xl font-bold text-green-400 format-money">
              ${totalPot.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {players.reduce((sum, p) => sum + p.squares, 0)} squares claim
            </div>
          </div>
          
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-sm mb-1">Collected</div>
            <div className="text-3xl font-bold text-blue-400">
              ${collectedAmount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {percentCollected.toFixed(1)}% of total
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
             <div className="text-slate-400 text-sm mb-1">Price Per Square</div>
             <div className="text-3xl font-bold text-white">
               ${settings.pricePerSquare}
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {/* Mobile View (Card List) */}
          <div className="md:hidden divide-y divide-slate-800">
             {players.length === 0 ? (
               <div className="p-8 text-center text-slate-500">
                 No players have joined yet.
               </div>
             ) : (
                players
                  .sort((a, b) => {
                      if (a.paid === b.paid) return a.name.localeCompare(b.name);
                      return a.paid ? 1 : -1;
                  })
                  .map((player) => {
                    const amountOwed = player.squares * settings.pricePerSquare;
                    return (
                       <div key={player.id} className="p-4 flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-base">{player.name}</span>
                                {player.id === activeGame.hostUserId && (
                                  <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">HOST</span>
                                )}
                             </div>
                             <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">{player.squares} squares</span>
                                <span className="text-emerald-400 font-mono">${amountOwed}</span>
                             </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            {isAdmin ? (
                              <button
                                  onClick={() => togglePaid(player.id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    player.paid
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                                  }`}
                                >
                                  {player.paid ? "PAID" : "UNPAID"}
                                </button>
                            ) : (
                              <div
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border cursor-default ${
                                  player.paid
                                    ? "bg-green-500/10 text-green-400/80 border-green-500/20"
                                    : "bg-red-500/10 text-red-400/80 border-red-500/20"
                                }`}
                              >
                                {player.paid ? "PAID" : "UNPAID"}
                              </div>
                            )}
                             {player.paid && player.paidAt && (
                                <span className="text-[10px] text-slate-500">
                                   {new Date(player.paidAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                             )}
                          </div>
                       </div>
                    );
                  })
             )}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-slate-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Player</th>
                  <th className="p-4 font-medium text-center">Squares</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium text-center">Status</th>
                  <th className="p-4 font-medium text-right">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {players.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No players have joined yet.
                    </td>
                  </tr>
                ) : (
                  players
                    .sort((a, b) => {
                        // Sort by paid status (unpaid first), then name
                        if (a.paid === b.paid) return a.name.localeCompare(b.name);
                        return a.paid ? 1 : -1;
                    })
                    .map((player) => {
                      const amountOwed = player.squares * settings.pricePerSquare;
                      return (
                        <tr key={player.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 font-medium text-white">
                            {player.name}
                            {player.id === activeGame.hostUserId && (
                              <span className="ml-2 text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">HOST</span>
                            )}
                          </td>
                          <td className="p-4 text-center text-slate-300">
                            {player.squares}
                          </td>
                          <td className="p-4 text-right font-mono text-slate-200">
                            ${amountOwed.toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            {isAdmin ? (
                              <button
                                onClick={() => togglePaid(player.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                  player.paid
                                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                }`}
                              >
                                {player.paid ? (
                                  <>
                                    <Check className="w-3 h-3" /> Paid
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3" /> Unpaid
                                  </>
                                )}
                              </button>
                            ) : (
                              <div
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border cursor-default ${
                                  player.paid
                                    ? "bg-green-500/10 text-green-400/80 border-green-500/20"
                                    : "bg-red-500/10 text-red-400/80 border-red-500/20"
                                }`}
                              >
                                {player.paid ? (
                                  <>
                                    <Check className="w-3 h-3" /> Paid
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3" /> Unpaid
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right text-sm text-slate-400">
                            {player.paid && player.paidAt ? (
                              <span className="flex items-center justify-end gap-1.5" title={new Date(player.paidAt).toLocaleString()}>
                                <Calendar className="w-3 h-3 opacity-50" />
                                {new Date(player.paidAt).toLocaleDateString()}
                              </span>
                            ) : player.paid ? (
                                <span className="opacity-50">Manual</span>
                            ) : (
                              <span className="opacity-20">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
