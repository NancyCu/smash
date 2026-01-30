"use client";

import React, { useState, useEffect } from "react";
import { Check, Trophy, Trash2, Edit2, Shuffle, Save, Share2, Copy, MoveRight, ArrowDownRight, CreditCard, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getDisplayPeriods, getPeriodLabel, type SportType } from "@/lib/sport-config";
import PaymentModal from "@/components/PaymentModal";
interface GameInfoProps {
  gameId: string;
  gameName: string;
  host: string;
  pricePerSquare: number;
  totalPot: number;
  payouts: any; 
  winners: any[]; 
  matchup: { teamA: string; teamB: string };
  scores: any;
  isAdmin: boolean;
  isScrambled: boolean;
  eventDate: string;
  onUpdateScores: (scores: any) => Promise<void>;
  onDeleteGame: () => Promise<void>;
  onScrambleGridDigits: () => Promise<void>;
  onResetGridDigits: () => Promise<void>;
  selectedEventId?: string;
  availableGames?: any[];
  sportType?: SportType;
  paymentLink?: string | null;
  zellePhone?: string | null;
}

export default function GameInfo({
  gameId, gameName, host, pricePerSquare, totalPot,
  payouts, winners, matchup, scores, isAdmin, isScrambled,
  eventDate, onUpdateScores, onDeleteGame,
  onScrambleGridDigits, onResetGridDigits, sportType = 'default',
  paymentLink, zellePhone
}: GameInfoProps) {
  
  const { user } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isEditingScores, setIsEditingScores] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [editScores, setEditScores] = useState({ 
     teamA: scores?.teamA || 0, 
     teamB: scores?.teamB || 0 
  });

  // Sync edit state with props when they change
  useEffect(() => {
    if (scores) {
        setEditScores({
            teamA: scores.teamA || 0,
            teamB: scores.teamB || 0
        });
    }
  }, [scores]);

  const handleShare = async () => {
    const shareData = {
      title: 'Join my Super Bowl Squares!',
      text: 'Bet on the game with me.',
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // Share cancelled or failed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = () => {
      navigator.clipboard.writeText(gameId);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSaveScores = async () => {
    await onUpdateScores(editScores);
    setIsEditingScores(false);
  };

  // --- FIXED SCRAMBLE HANDLER ---
  const handleToggleScramble = async () => {
      if (isScrambled) {
          // Safety check before resetting (Unlocking)
          if (confirm("⚠️ Unlock Grid? This will reset the row and column numbers. Are you sure?")) {
              await onResetGridDigits();
          }
      } else {
          // No confirm needed to Lock & Scramble
          await onScrambleGridDigits();
      }
  };

  // --- DYNAMIC PAYOUT RENDERER WITH ROLLOVER FLOW ---
  const renderPayouts = () => {
      const periods = getDisplayPeriods(sportType);
      
      const displayPayouts = periods.map(key => ({
          key,
          label: getPeriodLabel(key, sportType),
          amount: payouts?.[key] ?? 0
      }));

      // Dynamic grid columns based on period count
      const gridClass = periods.length === 3 ? "grid-cols-3" : "grid-cols-4";

      return (
        <div className={`grid ${gridClass} gap-3 mt-2`}>
            {displayPayouts.map((p, i) => {
                const winnerObj = winners?.find(w => w.key === p.key);
                const nextPeriod = displayPayouts[i + 1];
                const nextWinnerObj = nextPeriod ? winners?.find(w => w.key === nextPeriod.key) : null;
                
                // Determine Status
                // 1. Real Winner: Object exists AND rollover is false
                const isRealWinner = winnerObj && !winnerObj.rollover && winnerObj.winner;
                
                // 2. Rollover: Object exists with rollover=true OR amount is 0 w/ no winner
                const isRollover = (winnerObj && winnerObj.rollover) || (winnerObj && winnerObj.winner === '' && !winnerObj.rollover);
                
                // 3. Recipient Winner: Has rolloverAmount from previous quarters AND has won
                const isRecipient = isRealWinner && winnerObj.rolloverAmount > 0;
                
                // 4. Pending with incoming rollover: Not won yet but has rolloverAmount allocated
                const isPendingWithRollover = !isRealWinner && !isRollover && winnerObj && winnerObj.rolloverAmount > 0;
                
                // 5. Next quarter receives this rollover
                const hasRolloverToNext = isRollover && nextWinnerObj && nextWinnerObj.rolloverAmount > 0;
                
                return (
                    <div key={i} className={`flex flex-col items-center rounded-lg p-2 border relative group transition-all ${
                        isRealWinner 
                        ? "bg-green-500/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.3)] backdrop-blur-sm" 
                        : isRollover 
                            ? "bg-amber-500/10 border-amber-500/30 backdrop-blur-sm" 
                            : "bg-white/5 border-white/10 backdrop-blur-sm"
                    }`}>
                        {/* Connector Line - Shows flow to next quarter */}
                        {hasRolloverToNext && i < displayPayouts.length - 1 && (
                            <div className="absolute -right-[14px] top-1/2 -translate-y-1/2 z-10">
                                <MoveRight className="w-4 h-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse" />
                            </div>
                        )}
                        
                        {/* Winner Dot */}
                        {isRealWinner && <div className="absolute top-0 right-0 p-1"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"/></div>}
                        
                        <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${
                            isRealWinner ? "text-green-300" : 
                            isRollover ? "text-amber-500/60" : 
                            "text-white/50"
                        }`}>{p.label}</span>
                        
                        {/* ROLLOVER QUARTER (The Giver) */}
                        {isRollover && (
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-black text-white/30 line-through">${winnerObj && typeof winnerObj.baseAmount === 'number' ? winnerObj.baseAmount : p.amount}</span>
                                    <ArrowDownRight className="w-3 h-3 text-amber-400 animate-bounce" />
                                </div>
                                <span className="text-[7px] text-amber-500/60 font-bold uppercase tracking-wider">
                                    {p.key === 'p3' ? '→ Final' : '50/50 Split'}
                                </span>
                            </div>
                        )}
                        
                        {/* RECIPIENT QUARTER (The Receiver) */}
                        {isRecipient && (
                            <div className="flex flex-col items-center gap-0.5 w-full">
                                <span className="text-xs text-white/40 line-through font-mono">${winnerObj?.baseAmount}</span>
                                <span className="text-lg font-black text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.8)]">
                                    ${winnerObj.amount}
                                </span>
                                <span className="text-[9px] text-green-300/70 font-bold">
                                    (+${winnerObj.rolloverAmount} Rollover)
                                </span>
                            </div>
                        )}
                        
                        {/* REGULAR WINNER (No Rollover) */}
                        {isRealWinner && !isRecipient && (
                            <span className="text-lg font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">${winnerObj.amount}</span>
                        )}
                        
                        {/* PENDING WITH INCOMING ROLLOVER (Not won yet but has money allocated) */}
                        {isPendingWithRollover && (
                            <div className="flex flex-col items-center gap-0.5 w-full">
                                <span className="text-xs text-white/40 line-through font-mono">${winnerObj?.baseAmount}</span>
                                <span className="text-lg font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                                    ${winnerObj && typeof winnerObj.baseAmount === 'number' && typeof winnerObj.rolloverAmount === 'number' ? winnerObj.baseAmount + winnerObj.rolloverAmount : 0}
                                </span>
                                <span className="text-[9px] text-amber-300/70 font-bold">
                                    (+${winnerObj.rolloverAmount} Rollover)
                                </span>
                                <span className="text-[9px] text-white/40 uppercase font-bold tracking-wide mt-0.5">Pending</span>
                            </div>
                        )}
                        
                        {/* PENDING QUARTER (Not finished yet, no rollover) */}
                        {!isRealWinner && !isRollover && !isPendingWithRollover && (
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-lg font-black text-white">${winnerObj && typeof winnerObj.baseAmount === 'number' ? winnerObj.baseAmount : p.amount}</span>
                                <span className="text-[9px] text-white/40 uppercase font-bold tracking-wide">Pending</span>
                            </div>
                        )}

                        {/* Footer Text */}
                        {isRealWinner && (
                            <span className="text-[9px] text-green-200 font-bold text-center leading-tight max-w-full break-words mt-1">{winnerObj.winner}</span>
                        )}
                        
                        {isRollover && (
                            <span className="text-[9px] text-amber-400/60 font-bold text-center leading-tight uppercase tracking-wide mt-1">Rolled</span>
                        )}
                    </div>
                );
            })}
        </div>
      );
  };

  return (
    <div className="bg-[#0B0C15]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* GAME HEADER */}
        <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wide leading-none drop-shadow-md">{gameName}</h2>
            <div className="flex items-center gap-3 mt-2 text-xs text-white/60 font-mono">
                <button 
                  onClick={handleCopyCode} 
                  className="hover:text-white transition-colors flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-white/10"
                  title="Copy Game Code"
                >
                  <span>Code: <span className="font-bold">{gameId.slice(0, 6)}</span></span>
                  {codeCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
                
                <button onClick={handleShare} className="hover:text-white transition-colors flex items-center gap-1 ml-auto md:ml-0">
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Share2 className="w-3 h-3" />}
                    <span className="text-[10px] uppercase font-bold underline">Share Link</span>
                </button>
            </div>
            <div className="mt-1 text-xs text-white/50">
                Host: <span className="text-white/90 font-bold">{host === user?.uid ? "You" : "User"}</span>
            </div>
        </div>

        {/* POT INFO */}
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-4 border border-indigo-400/30 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest text-shadow-sm">Total Pot</span>
                <span className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">${totalPot}</span>
            </div>
            <div className="text-xs text-white/40 flex justify-between border-t border-white/10 pt-2 mt-1">
                <span>Price per Square:</span>
                <span className="text-white font-bold">${pricePerSquare}</span>
            </div>
            
            {/* Pay Host Button */}
            {!isAdmin && (paymentLink || zellePhone) && (
              <button
                id="tour-pay-btn" // <--- ADD THIS
              onClick={() => setShowPaymentModal(true)}
                className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Pay Host
              </button>
            )}

             {/* Make Payment Button */}
             {isAdmin && !paymentLink && !zellePhone && (
              <button
                id="tour-make-pay-btn" // <--- ADD THIS
                onClick={() => router.push(`/game/${gameId}/payments`)}
                className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Setup Payments
              </button>
             )}
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          paymentLink={paymentLink}
          zellePhone={zellePhone}
          hostName={"Host"}
          totalOwed={pricePerSquare}
          gameName={gameName}
        />

        {/* PAYOUTS */}
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                    <Trophy className="w-3 h-3 text-yellow-400 drop-shadow-md" /> Payout Schedule
                </h3>
            </div>
            
            {/* ROLLOVER EXPLANATION BANNER */}
            <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-amber-200 uppercase tracking-wide mb-1">50/50 Split Rollover</p>
                        <p className="text-[9px] text-amber-300/80 leading-relaxed">
                            If Q1 or Q2 has no winner, the pot splits 50/50 between the next quarter and Final. 
                            Q3 rolls 100% to Final.
                        </p>
                    </div>
                </div>
            </div>
            
            {renderPayouts()}
        </div>

        {/* ADMIN TOOLS */}
        {isAdmin && (
            <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Host Controls</span>
                
                {/* SCRAMBLE TOGGLE */}
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4 text-pink-400" />
                        <span className="text-xs font-bold text-white/80">Lock & Scramble</span>
                    </div>
                    <button 
                        id="tour-scramble-btn"  // <--- ADD THIS LINE HERE
                        onClick={handleToggleScramble}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full transition-colors shadow-lg ${isScrambled ? "bg-red-500/80 text-white shadow-red-500/20" : "bg-green-500/80 text-white shadow-green-500/20"}`}
                    >
                        {isScrambled ? "Locked" : "Open"}
                    </button>
                </div>

                {/* SCORE KEEPER */}
                <div 
                id="tour-scoreboard" // <--- ADD THIS ID
                className="bg-white/5 p-3 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <Edit2 className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold text-white/80">Manual Scores</span>
                        </div>
                        <button onClick={() => isEditingScores ? handleSaveScores() : setIsEditingScores(true)} className="text-xs text-indigo-300 hover:text-white transition-colors">
                            {isEditingScores ? <Save className="w-4 h-4" /> : "Edit"}
                        </button>
                    </div>
                    {isEditingScores ? (
                        <div className="flex gap-2">
                             <input type="number" value={editScores.teamA} onChange={e => setEditScores({...editScores, teamA: Number(e.target.value)})} className="w-full bg-black/20 border border-white/20 rounded px-2 py-1 text-white text-center font-mono focus:outline-none focus:border-cyan-400" placeholder="Team A"/>
                             <input type="number" value={editScores.teamB} onChange={e => setEditScores({...editScores, teamB: Number(e.target.value)})} className="w-full bg-black/20 border border-white/20 rounded px-2 py-1 text-white text-center font-mono focus:outline-none focus:border-cyan-400" placeholder="Team B"/>
                        </div>
                    ) : (
                        <div className="flex justify-between text-xs text-white/60 font-mono px-2">
                            <span>{matchup.teamA}: {scores.teamA}</span>
                            <span>{matchup.teamB}: {scores.teamB}</span>
                        </div>
                    )}
                </div>

                {/* DELETE */}
                <button onClick={onDeleteGame} className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border border-red-500/10 hover:border-red-500/30">
                    <Trash2 className="w-4 h-4" /> Delete Game
                </button>
            </div>
        )}

        {/* NAVIGATION LINKS */}
        <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={() => router.push('/winners')} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white/70 uppercase border border-white/5 hover:border-white/20 transition-all">Hall of Fame</button>
            <button onClick={() => router.push(`/game/${gameId}/ledger`)} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white/70 uppercase border border-white/5 hover:border-white/20 transition-all">Payment Ledger</button>
        </div>

    </div>
  );
}