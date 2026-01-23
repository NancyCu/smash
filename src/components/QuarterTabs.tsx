"use client";

import React from 'react';

// Type definition for the component's props
interface QuarterTabsProps {
  activeQuarter: 'q1' | 'q2' | 'q3' | 'final';
  setActiveQuarter: (quarter: 'q1' | 'q2' | 'q3' | 'final') => void;
  isGameStarted: boolean;
}

const QuarterTabs: React.FC<QuarterTabsProps> = ({ activeQuarter, setActiveQuarter, isGameStarted }) => {
  const quarters = [
    { id: 'q1', label: 'Q1' },
    { id: 'q2', label: 'Q2' },
    { id: 'q3', label: 'Q3' },
    { id: 'final', label: 'FINAL' },
  ] as const; // Use 'as const' to infer the strictest possible type

  return (
    <div className="w-full max-w-md mx-auto mb-4 px-4">
      <div className="flex bg-[#0B0C15] p-1 rounded-xl border border-slate-200 dark:border-white/10 relative">
        {quarters.map((q) => (
          <button
            key={q.id}
            onClick={() => setActiveQuarter(q.id)}
            disabled={!isGameStarted}
            className={`
              flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200
              ${activeQuarter === q.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' // Active State
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200' // Inactive State
              }
              ${!isGameStarted && 'cursor-not-allowed opacity-60'}
            `}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuarterTabs;
