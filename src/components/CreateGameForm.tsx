"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";
import { Loader2, Trophy, DollarSign, Users, Target, Calendar } from "lucide-react";
import { useEspnScores } from "@/hooks/useEspnScores";

interface Props {
  onSuccess: () => void;
}

export default function CreateGameForm({ onSuccess }: Props) {
  const { createGame } = useGame();
  const { games } = useEspnScores();
  const [isLoading, setIsLoading] = useState(false);


  const [formData, setFormData] = useState({
    name: "",
    price: 10,
    teamA: "Chiefs",
    teamB: "Eagles",
    espnGameId: "",
    eventDate: "",
    eventName: "",
    espnLeague: ""
  });

  const sortedGames = [...games].sort((a, b) => {
    if (a.league === "NFL" && b.league !== "NFL") return -1;
    if (a.league !== "NFL" && b.league === "NFL") return 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const handleGameSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gameId = e.target.value;
    const selectedGame = games.find(g => g.id === gameId);
    if (selectedGame) {
      setFormData(prev => ({
        ...prev,
        name: `${selectedGame.awayTeam.name} vs ${selectedGame.homeTeam.name}`,
        teamA: selectedGame.awayTeam.name,
        teamB: selectedGame.homeTeam.name,
        espnGameId: selectedGame.id,
        eventDate: selectedGame.date,
        eventName: selectedGame.name,
        espnLeague: selectedGame.league
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // The Fix: We now pass 8 separate arguments instead of 1 big object
      await createGame(
        formData.name, 
        Number(formData.price), 
        formData.teamA, 
        formData.teamB,
        formData.espnGameId,
        formData.eventDate,
        formData.eventName,
        formData.espnLeague
      );
      onSuccess();
    } catch (err) {
      console.error("Creation failed", err);
      alert("Failed to create game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-white/10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Host a Game</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Set the stakes and invite your crew.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Live Game */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Live Game</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <select
              onChange={handleGameSelect}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none text-slate-900 dark:text-white"
              defaultValue=""
            >
              <option value="" disabled>Choose a live game...</option>
              {sortedGames.map((game) => {
                const date = new Date(game.date);
                const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dateStr = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return (
                  <option key={game.id} value={game.id}>
                    {game.league} - {game.awayTeam.name} vs {game.homeTeam.name} ({day} {dateStr} {time})
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Game Name */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Game Name</label>
          <div className="relative">
            <Target className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input 
              required
              type="text"
              placeholder="e.g. Mike's Super Bowl Bash"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Teams Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Team A (Vertical)</label>
            <input 
              required
              type="text"
              value={formData.teamA}
              onChange={e => setFormData({...formData, teamA: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Team B (Horizontal)</label>
            <input 
              required
              type="text"
              value={formData.teamB}
              onChange={e => setFormData({...formData, teamB: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price Per Square</label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-3.5 w-5 h-5 text-green-600" />
            <input 
              required
              type="number"
              min="0"
              value={formData.price}
              onChange={e => setFormData({...formData, price: Number(e.target.value)})}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-black text-lg text-green-600 outline-none focus:ring-2 focus:ring-green-500 transition-all"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-500/30 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "CREATE GAME BOARD"}
        </button>
      </form>
    </div>
  );
}