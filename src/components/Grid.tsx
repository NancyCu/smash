import React from 'react';

interface GridProps {
  rows: number[];
  cols: number[];
  squares: Record<string, { uid: string, name: string }[]>;
  onSquareClick: (row: number, col: number) => void;
  teamA: string;
  teamB: string;
  // Added these back to fix the build error
  teamALogo?: string;
  teamBLogo?: string;
  isScrambled?: boolean; 
  
  selectedCell?: { row: number, col: number } | null;
  winningCell?: { row: number, col: number } | null;
  pendingIndices?: number[];
  currentUserId?: string;
}

export default function Grid({ 
  rows, cols, squares, onSquareClick, 
  teamA, teamB, teamALogo, teamBLogo, isScrambled, // Destructure them here
  selectedCell, winningCell, pendingIndices = [], currentUserId 
}: GridProps) {

  // 1. Helper to get data for a specific cell
  const getCellData = (r: number, c: number) => squares[`${r}-${c}`]?.[0] || null;

  // 2. Determine who is selected
  const selectedOwnerData = selectedCell ? getCellData(selectedCell.row, selectedCell.col) : null;
  const selectedUserIdToHighlight = selectedOwnerData?.uid || null;

  // 3. COLOR GENERATOR
  const getUserColor = (name: string) => {
      const colors = [
          "bg-red-500/20 text-red-200 border-red-500/30",
          "bg-orange-500/20 text-orange-200 border-orange-500/30",
          "bg-amber-500/20 text-amber-200 border-amber-500/30",
          "bg-green-500/20 text-green-200 border-green-500/30",
          "bg-emerald-500/20 text-emerald-200 border-emerald-500/30",
          "bg-teal-500/20 text-teal-200 border-teal-500/30",
          "bg-cyan-500/20 text-cyan-200 border-cyan-500/30",
          "bg-sky-500/20 text-sky-200 border-sky-500/30",
          "bg-blue-500/20 text-blue-200 border-blue-500/30",
          "bg-indigo-500/20 text-indigo-200 border-indigo-500/30",
          "bg-violet-500/20 text-violet-200 border-violet-500/30",
          "bg-purple-500/20 text-purple-200 border-purple-500/30",
          "bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/30",
          "bg-pink-500/20 text-pink-200 border-pink-500/30",
          "bg-rose-500/20 text-rose-200 border-rose-500/30",
      ];
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="grid grid-cols-11 border border-white/5 bg-[#0f111a] select-none">
      
      {/* HEADER ROW */}
      <div className="contents">
         {/* Top Left Corner: Show Logos if available, else VS */}
         <div className="bg-[#0B0C15] border-r border-b border-white/5 flex items-center justify-center p-1 overflow-hidden relative">
             {teamALogo && teamBLogo ? (
                 <div className="relative w-full h-full opacity-50 grayscale">
                     <img src={teamALogo} className="absolute top-0 left-0 w-4 h-4 object-contain" alt="" />
                     <img src={teamBLogo} className="absolute bottom-0 right-0 w-4 h-4 object-contain" alt="" />
                 </div>
             ) : (
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[8px] text-slate-500 font-bold">VS</div>
             )}
         </div>

         {cols.map((num, i) => (
           <div key={`col-${i}`} className={`relative p-1 h-8 md:h-10 flex items-center justify-center border-b border-r border-white/5 bg-[#151725] ${winningCell?.col === i ? 'bg-cyan-900/30' : ''}`}>
             {winningCell?.col === i && <div className="absolute inset-0 border-b-2 border-cyan-400 animate-pulse"></div>}
             <span className={`font-mono font-bold text-sm md:text-lg ${winningCell?.col === i ? 'text-cyan-400' : 'text-cyan-600'}`}>{num}</span>
           </div>
         ))}
      </div>

      {/* GRID ROWS */}
      {rows.map((rowNum, rIndex) => (
        <div key={`row-${rIndex}`} className="contents">
            <div className={`relative w-8 md:w-10 flex items-center justify-center border-r border-b border-white/5 bg-[#151725] ${winningCell?.row === rIndex ? 'bg-pink-900/30' : ''}`}>
               {winningCell?.row === rIndex && <div className="absolute inset-0 border-r-2 border-pink-500 animate-pulse"></div>}
               <span className={`font-mono font-bold text-sm md:text-lg ${winningCell?.row === rIndex ? 'text-pink-500' : 'text-pink-700'}`}>{rowNum}</span>
            </div>
            
            {/* SQUARES */}
            {cols.map((_, cIndex) => {
               const cellKey = `${rIndex}-${cIndex}`;
               const owner = getCellData(rIndex, cIndex);
               const isPending = pendingIndices.includes(rIndex * 10 + cIndex);
               
               // Logic
               const isWinner = winningCell && winningCell.row === rIndex && winningCell.col === cIndex;
               const isExactSelected = selectedCell && selectedCell.row === rIndex && selectedCell.col === cIndex;
               const isTaken = !!owner;
               const belongsToSelectedUser = isTaken && selectedUserIdToHighlight && owner.uid === selectedUserIdToHighlight;
               const isMe = currentUserId && owner?.uid === currentUserId;

               // Base Classes
               let containerClass = "relative w-full aspect-square flex flex-col items-center justify-center border-r border-b border-white/5 cursor-pointer transition-all duration-300";
               let textClass = "text-[8px] md:text-[10px] font-bold truncate max-w-[90%] px-0.5";

               // --- COLOR LOGIC ---
               if (isWinner) {
                   // 1. WINNER (Always Gold)
                   containerClass += " bg-yellow-500/20 shadow-[inset_0_0_15px_rgba(250,204,21,0.4)] z-30 border border-yellow-500";
                   textClass += " text-yellow-200";
               } else if (isExactSelected) {
                   // 2. EXACT SELECTION (Brightest)
                   containerClass += " bg-indigo-500/80 z-20 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.5)] border-2 border-white";
                   textClass += " text-white";
               } else if (belongsToSelectedUser) {
                   // 3. SIBLING HIGHLIGHT (Same User) - Keep their color but make it glow
                   const userColor = getUserColor(owner.name); 
                   containerClass += ` ${userColor.replace('/20', '/40')} z-10 scale-100 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] border border-indigo-400/50`;
               } else if (isPending) {
                   // 4. CART
                   containerClass += " bg-indigo-900/30 animate-pulse";
                   textClass += " text-indigo-300";
               } else if (isTaken && selectedUserIdToHighlight) {
                   // 5. FADED (Someone else is selected) -> GREY OUT
                   containerClass += " bg-[#0b0c15] opacity-20 grayscale"; 
                   textClass += " text-slate-700";
               } else if (isTaken) {
                   // 6. DEFAULT TAKEN (Colorful Mode)
                   const userColor = getUserColor(owner.name);
                   containerClass += ` ${userColor}`; 
                   if (isMe) containerClass += " border-indigo-500/40";
               } else {
                   // 7. EMPTY
                   containerClass += " hover:bg-white/5";
               }

               return (
                 <div key={cellKey} onClick={() => onSquareClick(rIndex, cIndex)} className={containerClass}>
                    {isWinner && <div className="absolute -top-1 -right-1 text-[8px]">👑</div>}
                    
                    {owner ? (
                        <span className={textClass}>{owner.name.slice(0, 6)}</span>
                    ) : isPending ? (
                        <span className="text-[8px] font-bold text-indigo-400">PICK</span>
                    ) : null}
                    
                    {isExactSelected && <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full shadow-sm" />}
                 </div>
               );
            })}
        </div>
      ))}
    </div>
  );
}