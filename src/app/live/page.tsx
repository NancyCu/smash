"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import WormholeLoader from "@/components/ui/WormholeLoader";

export default function LiveRedirectPage() {
  const router = useRouter();
  const { game } = useGame();

  useEffect(() => {
    // Small delay to show off the loader (and ensure hydration)
    const timer = setTimeout(() => {
      const storedGameId =
        typeof window !== "undefined"
          ? localStorage.getItem("activeGameId")
          : null;
      // Prefer context game ID, fall back to local storage
      const targetGameId = game?.id || storedGameId;

      if (targetGameId) {
        // Redirect to the dynamic game route
        router.replace(`/game/${targetGameId}`);
      } else {
        // No game found? Go to create/join
        router.replace("/join");
      }
    }, 1500); // 1.5s simulated warp time

    return () => clearTimeout(timer);
  }, [game?.id, router]);

  return <WormholeLoader />;
}
