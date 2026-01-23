"use client";

import React from 'react';
import { useRouter } from 'next/navigation'; // Import the router
import CreateGameForm from '@/components/CreateGameForm';

export default function CreatePage() {
  const router = useRouter();

  // Redirect straight into the active game grid after creation
  const handleSuccess = () => {
    router.push('/?view=game');
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