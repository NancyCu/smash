"use client";

import React from 'react';
// Import your existing component
import JoinGameForm from '@/components/JoinGameForm'; 

export default function JoinPage() {
  return (
    <main className="min-h-screen pt-12 pb-24 px-4 bg-[#0B0C15] flex flex-col items-center">
      <div className="p-4 rounded-full bg-cyan-900/20 mb-6">
        <span className="text-4xl">🎟️</span>
      </div>
      <h1 className="text-3xl font-teko text-white text-center mb-2 uppercase tracking-wider">
        Join the Action
      </h1>
      <p className="text-gray-400 text-sm mb-8 text-center max-w-xs">
        Enter the game code provided by your host to jump into the grid.
      </p>
      
      {/* RENDER YOUR OLD FORM HERE */}
      <JoinGameForm />
      
    </main>
  );
}