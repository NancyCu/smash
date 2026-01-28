import React from 'react';
import { getUserColor } from '@/utils/colors'; // Make sure you created this file from the previous step!

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
  teamA, teamB, teamALogo, teamBLogo, isScrambled, 
  selectedCell, winningCell, pendingIndices = [], currentUserId 
}: GridProps) {

  // 1. Helper to get ALL users for a specific cell
  const getCellUsers = (r: number, c: number) => squares[`${r}-${c}`] || [];

  // 2. Determine who is selected (Focus Mode logic)
  // We'll use the first user of the selected cell to drive the "Highlight/Dim" logic for now
  const selectedUsers = selectedCell ? getCellUsers(selectedCell.row, selectedCell.col) : [];
  const selectedUserIdToHighlight = selectedUsers.length > 0 ? selectedUsers[0].uid : null;

  return (
    <div className="grid grid-cols-11 border border-white/5 bg-[#0f111a] select-none">
      
      {/* HEADER ROW */}
      <div className="contents">
         {/* Top Left Corner */}
         <div className="bg-[#0B0C15] border-r border-b border-white/5 flex items-center justify-center p-1 overflow-hidden relative">
             {teamALogo && teamBLogo ? (
                 <div className="relative w-full h-full opacity-50 grayscale">
                     <img src={teamALogo} className="absolute top-0 left-0 w-4 h-4 object-contain" alt="Team A" />
                     <img src={teamBLogo} className="absolute bottom-0 right-0 w-4 h-4 object-contain" alt="Team B" />
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
               const users = getCellUsers(rIndex, cIndex);
               const isPending = pendingIndices.includes(rIndex * 10 + cIndex);
               
               // Logic
               const isWinner = winningCell && winningCell.row === rIndex && winningCell.col === cIndex;
               const isExactSelected = selectedCell && selectedCell.row === rIndex && selectedCell.col === cIndex;
               const hasUsers = users.length > 0;

               // Base Container Classes
               let containerClass = "relative w-full aspect-square border-r border-b border-white/5 cursor-pointer transition-all duration-300";
               
               // High-Level Container Highlights (Winner/Selection)
               if (isWinner) {
                   containerClass += " shadow-[inset_0_0_15px_rgba(250,204,21,0.4)] z-30 border-2 border-yellow-500";
               } else if (isExactSelected) {
                   containerClass += " z-20 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.5)] border-2 border-white";
               } else if (isPending) {
                   containerClass += " bg-indigo-900/30 animate-pulse flex items-center justify-center";
               } else if (!hasUsers) {
                   containerClass += " hover:bg-white/5";
               }

               return (
                 <div key={cellKey} onClick={() => onSquareClick(rIndex, cIndex)} className={containerClass}>
                    {/* WINNER CROWN */}
                    {isWinner && <div className="absolute -top-2 -right-2 text-sm z-40">👑</div>}
                    
                    {/* CASE 0: PENDING (Cart) */}
                    {isPending && <span className="text-[8px] font-bold text-indigo-400">PICK</span>}

                    {/* CASE 1: USERS EXIST */}
                    {hasUsers && (
                        <div className={`w-full h-full grid ${users.length === 1 ? 'grid-cols-1' : users.length === 2 ? 'grid-rows-2' : 'grid-cols-2 grid-rows-2'} overflow-hidden`}>
                            {/* Slice to max 4 to prevent breaking layout */}
                            {users.slice(0, 4).map((u, idx) => {
                                const isMe = currentUserId === u.uid;
                                const isFocus = selectedUserIdToHighlight && u.uid === selectedUserIdToHighlight;
                                const isDimmed = selectedUserIdToHighlight && !isFocus;
                                const color = getUserColor(u.name);
                                
                                // Dynamic Style for sub-cell
                                const style = { backgroundColor: color };
                                
                                return (
                                    <div 
                                        key={idx} 
                                        style={isDimmed ? {} : style} 
                                        className={`
                                            flex items-center justify-center 
                                            ${isDimmed ? 'bg-[#0b0c15] grayscale opacity-20' : ''} 
                                            ${users.length > 2 ? 'border-[0.5px] border-black/10' : ''}
                                        `}
                                    >
                                        <span className={`
                                            font-black truncate select-none
                                            ${isDimmed ? 'text-slate-600' : 'text-slate-900'}
                                            ${users.length > 2 ? 'text-[8px] px-[1px]' : 'text-[9px] md:text-[10px] px-1'}
                                        `}>
                                            {/* If crowded (4 users), show shorter name or initials */}
                                            {users.length > 3 ? u.name.substring(0, 2).toUpperCase() : u.name}
                                        </span>
                                    </div>
                                )
                            })}
                            {/* OVERFLOW INDICATOR (If > 4 users) */}
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
      ))}
    </div>
  );
}