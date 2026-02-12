"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronLeft, Skull, Activity, Scale, Stethoscope } from "lucide-react";
import ToothGame from "./ToothGame";
import BloodPressureGame from "./BloodPressureGame";
import WeightGame from "./WeightGame";

type SystemLevel = 1 | 2 | 3 | 5;

export default function SystemFailureView() {
  const [level, setLevel] = useState<SystemLevel>(2);

  const getLevelTitle = (lvl: SystemLevel) => {
    switch(lvl) {
        case 1: return "GREASE GAUGE";
        case 2: return "HEMODYNAMIC STRESS";
        case 3: return "SURGICAL REVIEW";
        case 5: return "BIOMASS AUDIT";
        default: return "UNKNOWN";
    }
  };

  return (
    <div className="bg-[#0b0c15] min-h-[500px] border-t-2 border-red-900/50">
        {/* Level Navigation Bar */}
        <div className="bg-black/40 border-b border-white/5 p-2 flex items-center justify-between">
            <button 
                onClick={() => setLevel(prev => prev === 2 ? 2 : prev === 3 ? 2 : prev === 5 ? 3 : 2)}
                disabled={level === 2}
                className="p-2 text-red-500 disabled:opacity-20 hover:bg-white/5 rounded"
            >
                <ChevronLeft size={20} />
            </button>
            
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-red-500 font-bold tracking-[0.2em] uppercase mb-0.5">
                    SYSTEM DIAGNOSTIC
                </span>
                <span className="text-white font-mono font-black text-sm">
                    LVL {level}: {getLevelTitle(level)}
                </span>
            </div>

            <button 
                onClick={() => setLevel(prev => prev === 2 ? 3 : prev === 3 ? 5 : 5)}
                disabled={level === 5}
                className="p-2 text-red-500 disabled:opacity-20 hover:bg-white/5 rounded"
            >
                <ChevronRight size={20} />
            </button>
        </div>

        {/* Game Container */}
        <div className="p-4 md:p-6">
            {level === 1 && (
                <div className="text-center text-white/50 p-10">
                    <Activity className="mx-auto mb-4 text-red-500" size={40} />
                    <p>Level 1 (Artery) is available in the main dashboard.</p>
                </div>
            )}
            
            {level === 2 && <BloodPressureGame />}
            
            {level === 3 && <ToothGame />}
            
            {level === 5 && <WeightGame />}
        </div>

        {/* Quick Jump Footer */}
        <div className="grid grid-cols-4 gap-1 p-2 border-t border-white/5 bg-black/20">
             <LevelIcon lvl={1} active={level === 1} icon={<Activity size={14} />} onClick={() => {/* handled by main nav usually but here placeholder */}} label="LIPID" />
             <LevelIcon lvl={2} active={level === 2} icon={<Stethoscope size={14} />} onClick={() => setLevel(2)} label="BP" />
             <LevelIcon lvl={3} active={level === 3} icon={<Skull size={14} />} onClick={() => setLevel(3)} label="TEETH" />
             <LevelIcon lvl={5} active={level === 5} icon={<Scale size={14} />} onClick={() => setLevel(5)} label="MASS" />
        </div>
    </div>
  );
}

function LevelIcon({ lvl, active, icon, onClick, label }: { lvl: number, active: boolean, icon: React.ReactNode, onClick: () => void, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-2 rounded transition-colors ${active ? "bg-red-500/20 text-red-400 border border-red-500/50" : "text-slate-600 hover:bg-white/5"}`}
        >
            {icon}
            <span className="text-[9px] font-bold mt-1 tracking-wider">{label}</span>
        </button>
    )
}
