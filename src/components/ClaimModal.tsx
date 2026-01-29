"use client";
import React, { useState, useEffect } from "react";
import { X, Check, DollarSign, User } from "lucide-react";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, markPaid: boolean) => void;
  row: number;
  col: number;
  price: number;
  defaultName?: string;
  isAdmin?: boolean;
  isSubmitting?: boolean;
}

export default function ClaimModal({
  isOpen,
  onClose,
  onConfirm,
  row,
  col,
  price,
  defaultName = "",
  isAdmin = false,
  isSubmitting = false,
}: ClaimModalProps) {
  const [name, setName] = useState(defaultName);
  const [markPaid, setMarkPaid] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setMarkPaid(false);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0B0C15]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-[#0f111a] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Gradient Line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#22d3ee] via-purple-500 to-[#db2777]" />

        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider font-teko">
                Claim Square
              </h2>
              <p className="text-[#22d3ee] font-mono text-sm">
                Row {row} • Col {col}
              </p>
            </div>
            <div className="text-right">
              <span className="block text-xs text-white/50 uppercase tracking-widest">Price</span>
              <span className="text-xl font-bold text-white">${price}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wide ml-1">
                Display Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-white/30 group-focus-within:text-[#22d3ee] transition-colors" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="block w-full pl-10 pr-3 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#22d3ee]/50 focus:border-[#22d3ee] transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Admin Toggle: Mark Paid */}
            {isAdmin && (
              <div 
                onClick={() => setMarkPaid(!markPaid)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  markPaid 
                    ? "bg-green-500/10 border-green-500/50" 
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${markPaid ? "bg-green-500 text-black" : "bg-white/10 text-white/40"}`}>
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-bold ${markPaid ? "text-green-400" : "text-white/60"}`}>
                    Mark as Paid Now?
                  </span>
                </div>
                {markPaid && <Check className="w-4 h-4 text-green-400" />}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              disabled={!name.trim() || isSubmitting}
              onClick={() => onConfirm(name, markPaid)}
              className="relative overflow-hidden px-4 py-3 rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#db2777] text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? "Saving..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}