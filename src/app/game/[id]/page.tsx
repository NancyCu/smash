"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../../../context/GameContext";

export default function LivePage() {
  const { game } = useGame();
  const router = useRouter();

  useEffect(() => {
    const storedGameId = localStorage.getItem("activeGameId");
    const targetGameId = game?.id || storedGameId;

    if (targetGameId) {
      router.push(`/game/${targetGameId}`);
    }
  }, [game?.id, router]);

  return (
    <div>
      <h1>Live Game</h1>
      {/* Other live game details */}
    </div>
  );
}