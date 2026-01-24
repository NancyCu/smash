"use client";

import React from "react";
import { useGame } from "../../../context/GameContext";

export default function LivePage() {
  const { game } = useGame();

  return (
    <div>
      <h1>Live Game</h1>
      <p>Game ID: {game?.id}</p>
      {/* Other live game details */}
    </div>
  );
}