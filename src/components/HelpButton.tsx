'use client';

import { HelpCircle } from 'lucide-react';

export const HelpButton = () => {
  const handleClick = () => {
    console.log('Open Help');
  };

  return (
    <button 
      onClick={handleClick}
      className="
        group flex items-center gap-2 px-3 py-1 
        text-xs font-semibold uppercase tracking-wider
        text-cyan-400 border border-cyan-400/30 rounded-md
        transition-all duration-200 
        hover:border-pink-500 hover:text-pink-500 hover:shadow-[0_0_12px_rgba(219,39,119,0.4)]
        active:scale-95
      "
    >
      <HelpCircle size={14} className="group-hover:animate-pulse" />
      <span>Help</span>
    </button>
  );
};
