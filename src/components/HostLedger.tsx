"use client";

import { useMemo } from "react";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import { Check, X } from "lucide-react";

interface PlayerLedgerEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  squareCount: number;
  totalOwed: number;
  allPaid: boolean;
}

export default function HostLedger() {
  const { game, togglePaymentStatus } = useGame();
  const { user } = useAuth();

  // Aggregate player data
  const ledgerEntries = useMemo(() => {
    if (!game) return [];

    const playerMap = new Map<string, PlayerLedgerEntry>();

    // Iterate through all squares
    for (let i = 0; i < 100; i++) {
      const square = game.squares[i];
      if (!square) continue;

      // Handle both single and array claims
      const claims = Array.isArray(square) ? square : [square];

      claims.forEach((claim) => {
        if (!playerMap.has(claim.userId)) {
          playerMap.set(claim.userId, {
            userId: claim.userId,
            displayName: claim.displayName || "Anonymous",
            photoURL: claim.photoURL,
            squareCount: 0,
            totalOwed: 0,
            allPaid: true,
          });
        }

        const entry = playerMap.get(claim.userId)!;
        entry.squareCount += 1;
        entry.totalOwed += game.price || 0;

        // If any square is unpaid, mark allPaid as false
        if (!claim.paid) {
          entry.allPaid = false;
        }
      });
    }

    // Convert to array and sort by totalOwed (highest first)
    return Array.from(playerMap.values()).sort((a, b) => b.totalOwed - a.totalOwed);
  }, [game]);

  // Host-only access check
  if (!game || !user || game.host !== user.uid) {
    return (
      <div className="text-center text-red-400 p-6">
        ⚠️ Host Access Only
      </div>
    );
  }

  const handleToggle = async (userId: string, currentStatus: boolean) => {
    await togglePaymentStatus(userId, !currentStatus);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-2">💰 Payment Ledger</h2>
        <p className="text-gray-400">
          Total Players: <span className="text-cyan-400">{ledgerEntries.length}</span>
          {" • "}
          Total Pot: <span className="text-green-400">${ledgerEntries.reduce((sum, e) => sum + e.totalOwed, 0)}</span>
        </p>
      </div>

      {/* Glassmorphism Table */}
      <div className="bg-[#151725]/60 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left p-4 text-gray-300 font-semibold">Player</th>
              <th className="text-center p-4 text-gray-300 font-semibold">Squares</th>
              <th className="text-center p-4 text-gray-300 font-semibold">Total Owed</th>
              <th className="text-center p-4 text-gray-300 font-semibold">Status</th>
              <th className="text-center p-4 text-gray-300 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {ledgerEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-gray-500">
                  No players yet
                </td>
              </tr>
            ) : (
              ledgerEntries.map((entry) => (
                <tr
                  key={entry.userId}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  {/* Player */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {entry.photoURL && (
                        <img
                          src={entry.photoURL}
                          alt={entry.displayName}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span className="text-white font-medium">{entry.displayName}</span>
                    </div>
                  </td>

                  {/* Squares */}
                  <td className="text-center p-4">
                    <span className="text-cyan-400 font-bold">{entry.squareCount}</span>
                  </td>

                  {/* Total Owed */}
                  <td className="text-center p-4">
                    <span className="text-green-400 font-bold">${entry.totalOwed}</span>
                  </td>

                  {/* Status */}
                  <td className="text-center p-4">
                    {entry.allPaid ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-green-400 text-sm font-semibold">
                        <Check size={14} />
                        PAID
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 border border-red-400/30 rounded-full text-red-400 text-sm font-semibold">
                        <X size={14} />
                        UNPAID
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="text-center p-4">
                    <button
                      onClick={() => handleToggle(entry.userId, entry.allPaid)}
                      className={`px-4 py-2 rounded-lg font-bold transition-all ${
                        entry.allPaid
                          ? "bg-gray-600/50 text-gray-400 hover:bg-red-500/30 hover:text-red-400 hover:border-red-400/50"
                          : "bg-green-500/20 text-green-400 border border-green-400/30 hover:bg-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                      }`}
                    >
                      {entry.allPaid ? "MARK UNPAID" : "MARK AS PAID"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Confirmation Placeholder */}
      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-400/30 rounded-lg">
        <p className="text-purple-300 text-sm">
          <strong>🔔 Future Feature:</strong> When you mark a payment as confirmed, the player will receive an in-app notification via Cloud Functions.
        </p>
      </div>
    </div>
  );
}
