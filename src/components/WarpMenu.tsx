"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Zap, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { GameData } from '@/context/GameContext';

interface WarpMenuProps {
  liveGames: GameData[];
  onClose: () => void;
}

export default function WarpMenu({ liveGames, onClose }: WarpMenuProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleGameClick = (gameId: string) => {
    router.push(`/game/${gameId}`);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop - Click to close */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={handleBackdropClick}
      />

      {/* Warp Menu - Positioned above FAB */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 animate-slideUp">
        <div className="bg-[#0B0C15]/90 backdrop-blur-2xl border border-[#22d3ee]/30 rounded-2xl p-4 w-64 shadow-[0_0_40px_rgba(34,211,238,0.3)]">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400">Quick Warp</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          </div>

          {/* Live Games List */}
          <div className="space-y-2">
            {liveGames.length === 0 ? (
              <div className="text-center py-4 text-white/40 text-xs">
                No live games found
              </div>
            ) : (
              liveGames.map((game) => {
                const isParticipating = user && (
                  game.participants?.includes(user.uid) || 
                  game.host === user.uid
                );
                
                return (
                  <button
                    key={game.id}
                    onClick={() => handleGameClick(game.id)}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 rounded-xl p-3 transition-all group relative overflow-hidden"
                  >
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Teams */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="text-xs font-bold text-white truncate">{game.teamA}</span>
                            <span className="text-[10px] text-white/40 font-mono">vs</span>
                            <span className="text-xs font-bold text-white truncate">{game.teamB}</span>
                          </div>
                        </div>
                        {isParticipating && (
                          <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                            <Trophy className="w-3 h-3 text-cyan-400" />
                            <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">You</span>
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      <div className="flex items-center justify-center gap-3 text-cyan-400 font-mono font-bold">
                        <span className="text-lg">{game.scores?.teamA || 0}</span>
                        <span className="text-white/30 text-xs">-</span>
                        <span className="text-lg">{game.scores?.teamB || 0}</span>
                      </div>

                      {/* Live Indicator */}
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                        <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Live Now</span>
                      </div>

                      {/* Pot */}
                      <div className="text-center mt-2 pt-2 border-t border-white/10">
                        <span className="text-[10px] text-white/40 uppercase tracking-wider">Pot: </span>
                        <span className="text-xs font-black text-yellow-400">
                          ${game.totalPot || game.pot || (Object.keys(game.squares || {}).length * (game.price || 0))}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Hint */}
          <div className="mt-3 pt-3 border-t border-white/10 text-center">
            <span className="text-[9px] text-white/30 uppercase tracking-wider">Tap to warp</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
