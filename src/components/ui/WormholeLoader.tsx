'use client';

export default function WormholeLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0C15]/90 backdrop-blur-xl">
      {/* The Rotating Quantum Grid */}
      <div className="relative">
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 bg-[#22d3ee]/20 blur-xl rounded-full animate-pulse" />
        
        {/* The 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2 w-16 h-16 animate-[spin_3s_linear_infinite]">
          {/* Top Left: Cyan */}
          <div className="bg-[#22d3ee] rounded-sm shadow-[0_0_15px_#22d3ee] animate-pulse" />
          
          {/* Top Right: Pink (Delayed) */}
          <div className="bg-[#db2777] rounded-sm shadow-[0_0_15px_#db2777] animate-pulse delay-75" />
          
          {/* Bottom Left: Pink (Delayed more) */}
          <div className="bg-[#db2777] rounded-sm shadow-[0_0_15px_#db2777] animate-pulse delay-150" />
          
          {/* Bottom Right: Cyan (Delayed most) */}
          <div className="bg-[#22d3ee] rounded-sm shadow-[0_0_15px_#22d3ee] animate-pulse delay-300" />
        </div>
      </div>

      {/* Loading Text */}
      <div className="mt-8 text-center space-y-2">
        <h2 className="text-2xl font-black italic tracking-widest uppercase text-white animate-pulse">
          Warping
        </h2>
        <p className="text-[#22d3ee] font-mono text-xs uppercase tracking-[0.3em] opacity-80">
          Syncing Grid Data...
        </p>
      </div>
    </div>
  );
}
