"use client";

import React from "react";
import CreatePropBetForm from "./CreatePropBetForm";

interface Props {
  isAdmin?: boolean;
}

export default function PropBetsList({ isAdmin }: Props) {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-white/5 text-center">
        <div className="text-4xl mb-4">🚧</div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">Coming Soon</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
           We are focusing on the Quarterly Rotation Squares for the big game. Prop bets will return in a future update!
        </p>
      </div>
      
      {/* Keep the admin form hidden/safe but render the placeholder */}
      {isAdmin && <CreatePropBetForm />}
    </div>
  );
}