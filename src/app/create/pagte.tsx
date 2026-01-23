"use client";

import React from 'react';
// IMPORT YOUR EXISTING COMPONENT HERE:
import CreateGameForm from '@/components/CreateGameForm'; 

export default function CreatePage() {
  return (
    <main className="min-h-screen pt-6 pb-24 px-4 bg-[#0B0C15]">
      <h1 className="text-3xl font-teko text-white text-center mb-6 uppercase tracking-wider">
        Host a Game
      </h1>
      
      {/* RENDER YOUR OLD CODE HERE */}
      <CreateGameForm />
      
    </main>
  );
}