import React from 'react';
import { getUserColor } from '@/utils/colors';

interface GridProps {
  rows: number[];
  cols: number[];
  squares: Record<string, { uid: string, name: string }[]>;
  onSquareClick: (row: number, col: number) => void;
  teamA: string;
  teamB: string;
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
  teamA, teamB, teamALogo, teamBLogo, isScrambled = false, 
  selectedCell, winningCell, pendingIndices = [], currentUserId 
}: GridProps) {

  const getCellUsers = (r: number, c: number) => squares[`${r}-${c}`] || [];
  const selectedUsers = selectedCell ? getCellUsers(selectedCell.row, selectedCell.col) : [];
  const selectedUserIdToHighlight = selectedUsers.length > 0 ? selectedUsers[0].uid : null;

  return (
    <div className="relative grid grid-cols-11 border border-white/5 bg-[#0f111a] select-none">
      
      {/* --- OVERLAYS FOR TEAM NAMES (Only visible before Scramble) --- */}
      {!isScrambled && (
        <>
          {/* Top Header Overlay (Team B - CYAN) */}
          <div className="absolute top-0 left-[9.09%] right-0 h-8 md:h-10 z-10 flex items-center justify-center pointer-events-none">
             <span className="font-black text-xl md:text-2xl uppercase tracking-widest text-cyan-400 drop-shadow-[0_2px_10px_rgba(34,211,238,0.3)]">
                {teamB}
             </span>
          </div>

          {/* Left Header Overlay (Team A - PINK) */}
          <div className="absolute top-[32px] md:top-[40px] bottom-0 left-0 w-8 md:w-10 z-10 flex items-center justify-center pointer-events-none">
             <span className="font-black text-xl md:text-2xl uppercase tracking-widest text-pink-500 -rotate-90 whitespace-nowrap drop-shadow-[0_2px_10px_rgba(219,39,119,0.3)]">
                {teamA}
             </span>
          </div>
        </>
      )}

      {/* --- HEADER ROW (Top / Team B) --- */}
      <div className="contents">
         {/* Top Left Corner */}
         <div className="bg-[#0B0C15] border-r border-b border-white/5 flex items-center justify-center p-1 overflow-hidden relative z-20">
             {teamALogo && teamBLogo ? (
                 <div className="relative w-full h-full opacity-50 grayscale">
                     <img src={teamALogo} className="absolute top-0 left-0 w-4 h-4 object-contain" alt="Team A" />
                     <img src={teamBLogo} className="absolute bottom-0 right-0 w-4 h-4 object-contain" alt="Team B" />
                 </div>
             ) : (
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[8px] text-slate-500 font-bold">VS</div>
             )}
         </div>

         {/* Column Headers */}
         {cols.map((num, i) => {
            const isColSelected = selectedCell?.col === i;
            const isColWinner = winningCell?.col === i;

            return (
               <div key={`col-${i}`} className={`relative p-1 h-8 md:h-10 flex items-center justify-center border-b border-r border-white/5 bg-[#151725] transition-colors duration-300 ${isColSelected ? 'bg-cyan-900/20' : ''} ${isColWinner ? 'bg-cyan-900/40' : ''}`}>
                 
                 {/* Highlight Bar for Selection */}
                 {isColSelected && <div className="absolute inset-0 border-b-2 border-cyan-400/50"></div>}
                 {isColWinner && <div className="absolute inset-0 border-b-2 border-cyan-400 animate-pulse"></div>}

                 {isScrambled ? (
                    <span className={`font-mono font-bold text-sm md:text-lg ${isColWinner ? 'text-cyan-400' : isColSelected ? 'text-cyan-200' : 'text-cyan-800'}`}>
                        {num}
                    </span>
                 ) : (
                    teamBLogo && <img src={teamBLogo} alt="" className="h-full w-full object-contain opacity-20 grayscale invert md:p-1" />
                 )}
               </div>
            );
         })}
      </div>

      {/* --- GRID ROWS (Left / Team A) --- */}
      {rows.map((rowNum, rIndex) => {
        const isRowSelected = selectedCell?.row === rIndex;
        const isRowWinner = winningCell?.row === rIndex;

        return (
            <div key={`row-${rIndex}`} className="contents">
                {/* Row Headers */}
                <div className={`relative w-8 md:w-10 flex items-center justify-center border-r border-b border-white/5 bg-[#151725] transition-colors duration-300 ${isRowSelected ? 'bg-pink-900/20' : ''} ${isRowWinner ? 'bg-pink-900/40' : ''}`}>
                
                   {/* Highlight Bar for Selection */}
                   {isRowSelected && <div className="absolute inset-0 border-r-2 border-pink-500/50"></div>}
                   {isRowWinner && <div className="absolute inset-0 border-r-2 border-pink-500 animate-pulse"></div>}

                   {isScrambled ? (
                      <span className={`font-mono font-bold text-sm md:text-lg ${isRowWinner ? 'text-pink-500' : isRowSelected ? 'text-pink-300' : 'text-pink-800'}`}>
                          {rowNum}
                      </span>
                   ) : (
                      teamALogo && <img src={teamALogo} alt="" className="h-full w-full object-contain opacity-20 grayscale invert md:p-1" />
                   )}
                </div>
                
                {/* --- SQUARES --- */}
                {cols.map((_, cIndex) => {
                   const cellKey = `${rIndex}-${cIndex}`;
                   const users = getCellUsers(rIndex, cIndex);
                   const isPending = pendingIndices.includes(rIndex * 10 + cIndex);
                   const isWinner = winningCell && winningCell.row === rIndex && winningCell.col === cIndex;
                   const isExactSelected = selectedCell && selectedCell.row === rIndex && selectedCell.col === cIndex;
                   
                   // Crosshair Logic: Row or Col matches selected cell (but not the exact cell itself)
                   const isCrosshair = selectedCell && (selectedCell.row === rIndex || selectedCell.col === cIndex) && !isExactSelected;
                   const hasUsers = users.length > 0;

                   // Base Container Classes
                   let containerClass = "relative w-full aspect-square border-r border-b border-white/5 cursor-pointer transition-all duration-300";
                   
                   if (isWinner) {
                       containerClass += " shadow-[inset_0_0_15px_rgba(250,204,21,0.4)] z-30 border-2 border-yellow-500";
                   } else if (isExactSelected) {
                       containerClass += " z-20 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.5)] border-2 border-white";
                   } else if (isCrosshair) {
                       // CROSSHAIR HIGHLIGHT (Subtle)
                       containerClass += " bg-white/5"; 
                   } else if (isPending) {
                       containerClass += " bg-indigo-900/30 animate-pulse flex items-center justify-center";
                   } else if (!hasUsers) {
                       containerClass += " hover:bg-white/5";
                   }

                   return (
                     <div key={cellKey} onClick={() => onSquareClick(rIndex, cIndex)} className={containerClass}>
                        {isWinner && <div className="absolute -top-2 -right-2 text-sm z-40">👑</div>}
                        {isPending && <span className="text-[8px] font-bold text-indigo-400">PICK</span>}

                        {hasUsers && (
                            <div className={`w-full h-full grid ${users.length === 1 ? 'grid-cols-1' : users.length === 2 ? 'grid-rows-2' : 'grid-cols-2 grid-rows-2'} overflow-hidden`}>
                                {users.slice(0, 4).map((u, idx) => {
                                    const isFocus = selectedUserIdToHighlight && u.uid === selectedUserIdToHighlight;
                                    const isDimmed = selectedUserIdToHighlight && !isFocus;
                                    const color = getUserColor(u.name);
                                    
                                    const style = { backgroundColor: color };
                                    return (
                                        <div 
                                            key={idx} 
                                            style={isDimmed ? {} : style} 
                                            className={`flex items-center justify-center ${isDimmed ? 'bg-[#0b0c15] grayscale opacity-20' : ''} ${users.length > 2 ? 'border-[0.5px] border-black/10' : ''}`}
                                        >
                                            <span className={`font-black truncate select-none ${isDimmed ? 'text-slate-600' : 'text-slate-900'} ${users.length > 2 ? 'text-[8px] px-[1px]' : 'text-[9px] md:text-[10px] px-1'}`}>
                                                {users.length > 3 ? u.name.substring(0, 2).toUpperCase() : u.name}
                                            </span>
                                        </div>
                                    )
                                })}
                                {users.length > 4 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 pointer-events-none">
                                        <span className="text-white text-[10px] font-bold">+{users.length - 4}</span>
                                    </div>
                                )}
                            </div>
                        )}
                     </div>
                   );
                })}
            </div>
        );
      })}
    </div>
  );
}