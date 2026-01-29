"use client";

import React from 'react';
// IMPORT YOUR EXISTING COMPONENTS HERE:
import PropBetsList from '@/components/PropBetsList';
import CreatePropBetForm from '@/components/CreatePropBetForm'; // Optional: If you want to create props here too

export default function PropsPage() {
  return (
    <main className="min-h-screen pt-6 px-4 bg-[#0B0C15]">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-3xl font-teko text-white uppercase tracking-wider">
          Prop Bets
        </h1>
        <p className="text-gray-400 text-xs">Side hustles & extra action</p>
      </div>

      {/* RENDER YOUR OLD CODE HERE */}
      <div className="space-y-8">
        {/* If this component handles fetching/displaying bets, just drop it in */}
        <PropBetsList />
        
        {/* Optional: Add a divider or section for creating new ones */}
        <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/50">
           <h2 className="text-xl font-teko text-gray-300 mb-4">Add Custom Prop</h2>
           <CreatePropBetForm />
        </div>
      </div>
    </main>
  );
}