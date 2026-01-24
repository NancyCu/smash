"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";

export default function LiveRedirectPage() {
  const router = useRouter();
  const { game } = useGame();

  useEffect(() => {
    const storedGameId = typeof window !== "undefined" ? localStorage.getItem("activeGameId") : null;
    const targetGameId = game?.id || storedGameId;

    if (targetGameId) {
      router.replace("/?view=game");
    } else {
      router.replace("/join");
    }
  }, [game?.id, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B0C15]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        <p className="text-sm text-cyan-300 font-bold uppercase tracking-widest">Warping to Live Grid...</p>
      </div>
    </main>
  );
}
