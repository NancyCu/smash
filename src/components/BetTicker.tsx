'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Ticket } from 'lucide-react'; // Assuming you use lucide-react

interface Bet {
  id: string;
  title: string;
  amount: number;
  label?: string; // e.g. "YOU"
}

// Mock data - replace with your real props
const MOCK_BETS: Bet[] = [
  { id: '1', title: 'Cavaliers vs Lakers', amount: 0, label: 'YOU' },
  { id: '2', title: 'Red Storm vs Bulldogs', amount: 0, label: 'YOU' },
  { id: '3', title: 'Pacers vs Heat', amount: 10, label: 'YOU' },
];

export default function BetTicker() {
  const [isCompact, setIsCompact] = useState(true);

  return (
    <div className="w-full flex flex-col gap-2 mb-2 transition-all duration-300 ease-in-out">
      {/* Header Row: Title + Toggle */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[#22d3ee] text-xs font-bold tracking-widest uppercase opacity-80 flex items-center gap-2">
          <Ticket className="w-3 h-3" /> Active Bets
        </h3>
        <button
          onClick={() => setIsCompact(!isCompact)}
          className="text-white/50 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
        >
          {isCompact ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Scrollable Container */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {MOCK_BETS.map((bet) => (
          <div
            key={bet.id}
            className={`
              relative flex-shrink-0 transition-all duration-300 ease-spring border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm snap-start
              ${isCompact 
                ? 'h-9 px-3 flex items-center gap-3 min-w-fit hover:border-[#22d3ee]/50' // Compact Styles
                : 'h-24 w-40 p-3 flex flex-col justify-between hover:bg-white/10' // Expanded Styles
              }
            `}
          >
            {/* Logic for rendering content based on state */}
            {isCompact ? (
              // COMPACT CONTENT (Single Line)
              <>
                <span className="text-[10px] font-bold text-white truncate max-w-[120px]">
                  {bet.title}
                </span>
                <span className={`text-[10px] font-mono ${bet.amount > 0 ? 'text-[#22d3ee]' : 'text-white/50'}`}>
                  ${bet.amount}
                </span>
              </>
            ) : (
              // EXPANDED CONTENT (Full Card)
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-white leading-tight line-clamp-2">
                    {bet.title}
                  </span>
                  {bet.label && (
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">
                      {bet.label}
                    </span>
                  )}
                </div>
                <div className="mt-auto pt-2 border-t border-white/10">
                  <span className={`text-sm font-mono font-bold ${bet.amount > 0 ? 'text-[#22d3ee]' : 'text-gray-400'}`}>
                    ${bet.amount}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
