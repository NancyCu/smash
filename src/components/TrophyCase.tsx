"use client";

import React from 'react';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define a type for a single winner entry
export interface Winner {
  id: string;
  period: number;
  label: string;
  amount: number;
  winnerName: string;
  isPaid?: boolean;
}

// Define the props for the TrophyCase component
interface TrophyCaseProps {
  payouts: { label: string; amount: number }[];
  history: Winner[];
  totalPot: number;
}

const TrophyCase: React.FC<TrophyCaseProps> = ({ payouts, history, totalPot }) => {
  // Create a map of historical winners for quick lookup by label
  const historyMap = new Map(history.map(h => [h.label, h]));

  // Determine the display data for each required payout period
  const displayData = payouts.map(payout => {
    const winner = historyMap.get(payout.label);
    return {
      key: payout.label.replace(/\s+/g, '').toLowerCase(),
      label: payout.label.replace(' Winner', ''),
      status: winner ? 'won' : 'pending',
      name: winner ? winner.winnerName : 'Waiting...',
      amount: `$${payout.amount}`,
    };
  });

  return (
    <div className="w-full max-w-2xl mx-auto px-2 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {displayData.map((data) => (
          <div key={data.key} className={cn(
            'flex flex-col items-center p-2.5 rounded-lg border text-center',
            data.status === 'won' 
              ? 'bg-slate-100/50 dark:bg-slate-800/80 border-green-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
              : 'bg-slate-100/30 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 opacity-70'
          )}>
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1 tracking-widest">
              {data.label}
            </span>
            
            {data.status === 'won' ? (
              <>
                <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-full">
                  {data.name}
                </span>
                <span className="text-xs text-green-600 dark:text-green-400 font-mono font-bold">
                  {data.amount}
                </span>
              </>
            ) : (
              <span className="text-[10px] text-slate-500 dark:text-slate-500 italic">
                --
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrophyCase;
