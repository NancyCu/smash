"use client";

import React, { useState } from "react";
import { Plus, Shield, Calendar, DollarSign, ListChecks, Lock } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { useAuth } from "@/context/AuthContext";
import { useEspnScores } from "@/hooks/useEspnScores";

interface CreateGameFormProps {
  onSuccess?: () => void;
}

export default function CreateGameForm({ onSuccess }: CreateGameFormProps) {
  const { user } = useAuth();
  const { createGame } = useGame();
  const { games: espnGames } = useEspnScores();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    gameName: "",
    password: "",
    selectedGameId: "",
    pricePerSquare: 50,
    rules: "",
    payoutFrequency: "Manual",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsCreating(true);
    
    let teamA = "Team A";
    let teamB = "Team B";
    let eventName = "";
    let eventLeague = "";
    let eventDate = "";
    let espnGameId = "";

    const selectedEspnGame = espnGames.find((g) => g.id === formData.selectedGameId);

    if (selectedEspnGame) {
      teamA = selectedEspnGame.awayTeam.name;
      teamB = selectedEspnGame.homeTeam.name;
      eventName = selectedEspnGame.name;
      eventLeague = selectedEspnGame.league;
      eventDate = selectedEspnGame.date;
      espnGameId = selectedEspnGame.id;
    }

    try {
      await createGame({
        hostUserId: user.uid,
        hostName: user.displayName || "Anonymous",
        password: formData.password,
        settings: {
          name: formData.gameName || "New Game",
          pricePerSquare: Number(formData.pricePerSquare),
          teamA,
          teamB,
          eventName,
          espnGameId,
          espnLeague: eventLeague,
          eventDate,
          rules: formData.rules,
          payoutFrequency: formData.payoutFrequency as any,
          payouts: [
            { label: "Q1 Winner", amount: 0 },
            { label: "Q2 Winner", amount: 0 },
            { label: "Q3 Winner", amount: 0 },
            { label: "Final Winner", amount: 0 },
          ],
        },
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to create game", error);
      alert("Failed to create game. Check console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 transition-colors duration-300">
        <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Host a Game</h2>
            <p className="text-pink-100 font-bold text-xs uppercase tracking-widest mt-1">Set up your squares grid in seconds</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 text-slate-700 dark:text-slate-200">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Plus className="w-3 h-3 text-cyan-600 dark:text-cyan-500" />
                  Game Name
                </label>
                <input
                  type="text"
                  name="gameName"
                  placeholder="e.g. Season Opener 2024"
                  aria-label="Game Name"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all font-bold"
                  value={formData.gameName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-3 h-3 text-cyan-600 dark:text-cyan-500" />
                  Game Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Min 4 characters"
                  aria-label="Game Password"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all font-mono"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3 text-cyan-600 dark:text-cyan-500" />
                Game Event
              </label>
              <select
                name="selectedGameId"
                aria-label="Game Event"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 rounded-xl text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all appearance-none"
                value={formData.selectedGameId}
                onChange={handleChange}
              >
                <option value="">Manual matchup</option>
                {espnGames
                  .filter((g) => g.status !== "post")
                  .map((game) => {
                    const gameDate = new Date(game.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    });
                    return (
                      <option key={game.id} value={game.id}>
                        [{game.league}] {game.awayTeam.name} @ {game.homeTeam.name} ({game.isLive ? "LIVE" : gameDate})
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
                Wager Per Square ($)
              </label>
              <input
                type="number"
                name="pricePerSquare"
                aria-label="Wager Per Square"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 rounded-xl text-emerald-600 dark:text-emerald-400 font-black placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-lg"
                value={formData.pricePerSquare}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ListChecks className="w-3 h-3 text-cyan-600 dark:text-cyan-500" />
                Payout Structure
              </label>
              <div className="space-y-2 mb-4">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payout Frequency</label>
                 <select
                    name="payoutFrequency"
                    aria-label="Payout Frequency"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                    value={formData.payoutFrequency}
                    onChange={handleChange}
                  >
                    <option value="Manual">Manual</option>
                    <option value="NBA_Standard">NBA Standard (Quarterly)</option>
                    <option value="NBA_Frequent">NBA Frequent (Every 6 mins)</option>
                  </select>
                  {formData.payoutFrequency === "NBA_Frequent" && (
                    <p className="text-[10px] text-orange-500 font-bold">
                       Warning: Used for high-pace games. Payouts trigger at 6:00 and 0:00 of each quarter.
                    </p>
                  )}
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-3">
                  Payouts are automatically calculated from the total pot:
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                   <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/5">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">Q1</div>
                      <div className="font-black text-indigo-500">20%</div>
                   </div>
                   <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/5">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">Q2</div>
                      <div className="font-black text-indigo-500">20%</div>
                   </div>
                   <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/5">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">Q3</div>
                      <div className="font-black text-indigo-500">20%</div>
                   </div>
                   <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/5">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">Final</div>
                      <div className="font-black text-emerald-500">40%</div>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rules</label>
              <textarea
                name="rules"
                rows={3}
                placeholder="Enter any custom rules..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50 rounded-xl text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                value={formData.rules}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-cyan-500/20 transition-all transform hover:-translate-y-1 active:scale-95"
          >
            {isCreating ? "Creating..." : "Create Game"}
          </button>
        </form>
      </div>
    </div>
  );
}
