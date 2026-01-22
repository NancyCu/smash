"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import CreatePropBetForm from "./CreatePropBetForm";
import PropBetCard from "./PropBetCard";

interface PropBetsListProps {
  isAdmin: boolean;
}

export default function PropBetsList({ isAdmin }: PropBetsListProps) {
  const { propBets } = useGame();
  
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-24">
       <div className="text-center space-y-2">
         <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Prop Bets</h2>
         <p className="text-slate-500">Side hustles for the real degenerates.</p>
       </div>

       {isAdmin && (
         <CreatePropBetForm />
       )}

       <div className="space-y-4">
         {propBets.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic">No prop bets open yet.</div>
         ) : (
            propBets.map(prop => (
                <PropBetCard key={prop.id} prop={prop} isAdmin={isAdmin} />
            ))
         )}
       </div>
    </div>
  );
}
