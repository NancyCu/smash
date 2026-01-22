"use client";

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";

export default function CreatePropBetForm() {
  const { createPropBet } = useGame();
  const [question, setQuestion] = useState("");
  const [entryFee, setEntryFee] = useState(5);
  const [optionsStr, setOptionsStr] = useState("Yes, No");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const options = optionsStr.split(",").map(s => s.trim()).filter(Boolean);
        if (options.length < 2) throw new Error("At least 2 options required.");
        
        await createPropBet(question, Number(entryFee), options);
        setQuestion("");
        setEntryFee(5);
        setOptionsStr("Yes, No");
        alert("Prop bet posted!");
    } catch (error) {
        alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
        setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
       <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">Post New Prop Bet</h3>
       
       <div>
         <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Question</label>
         <input 
           type="text" 
           value={question}
           onChange={e => setQuestion(e.target.value)}
           placeholder="e.g. Who wins the coin toss?"
           className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
           required
         />
       </div>

       <div>
         <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Entry Fee ($)</label>
         <input 
           type="number" 
           value={entryFee}
           onChange={e => setEntryFee(Number(e.target.value))}
           min={1}
           className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
           required
         />
       </div>

       <div>
         <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Options (Comma separated)</label>
         <input 
           type="text" 
           value={optionsStr}
           onChange={e => setOptionsStr(e.target.value)}
           placeholder="Heads, Tails"
           className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
           required
         />
       </div>
       
       <button 
         type="submit" 
         disabled={loading}
         className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
       >
         {loading ? "Posting..." : "POST BET"}
       </button>
    </form>
  );
}
