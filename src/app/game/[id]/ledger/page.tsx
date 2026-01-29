"use client";

import { useParams } from "next/navigation";
import { useGame } from "@/context/GameContext";
import HostLedger from "@/components/HostLedger";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LedgerPage() {
  const params = useParams();
  const gameId = params?.id as string;
  const { setGameId } = useGame();

  useEffect(() => {
    if (gameId) setGameId(gameId);
  }, [gameId, setGameId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0b1a] via-[#151725] to-[#1a1b2e] p-4">
      {/* Back Button */}
      <Link 
        href={`/game/${gameId}`}
        className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-all"
      >
        <ArrowLeft size={18} />
        Back to Game
      </Link>

      {/* Host Ledger Component */}
      <HostLedger />
    </div>
  );
}
