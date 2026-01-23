"use client";

import React from 'react';
import { useRouter } from 'next/navigation'; // Import the router
import CreateGameForm from '@/components/CreateGameForm';

export default function CreatePage() {
  const router = useRouter();

  // This is the missing instruction
  const handleSuccess = () => {
    // 1. Optional: Show a confetti blast or toast here
    // 2. Redirect back to home so they can see their new game
    router.push('/'); 
    // Or router.push('/grid') if you want to go straight to the game
  };

  return (
    <main className="min-h-screen pt-6 pb-24 px-4 bg-[#0B0C15]">
      <h1 className="text-3xl font-teko text-white text-center mb-6 uppercase tracking-wider">
        Host a Game
      </h1>
      
      {/* Pass the function to the component */}
      <CreateGameForm onSuccess={handleSuccess} />
      
    </main>
  );
}