"use client";

import React, { useState } from "react";
import { X, Save, Link, Phone, Loader2 } from "lucide-react";
import { useGame } from "@/context/GameContext";
import CyberInput from "@/components/ui/CyberInput";

interface PaymentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPaymentLink?: string | null;
  initialZellePhone?: string | null;
}

export default function PaymentSettingsModal({ 
  isOpen, 
  onClose, 
  initialPaymentLink,
  initialZellePhone
}: PaymentSettingsModalProps) {
  const { updatePaymentInfo } = useGame();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    paymentLink: initialPaymentLink || "",
    zellePhone: initialZellePhone || ""
  });

  // Sync form data when props change (e.g., after a save or when re-opening)
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        paymentLink: initialPaymentLink || "",
        zellePhone: initialZellePhone || ""
      });
      setError(null);
    }
  }, [isOpen, initialPaymentLink, initialZellePhone]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updatePaymentInfo(
          formData.paymentLink || null, 
          formData.zellePhone || null
      );
      onClose();
    } catch (err) {
      console.error("Failed to update payment info", err);
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#151725] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-90 duration-300">
        
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-white font-black text-lg uppercase tracking-tight">
                Payment Settings
              </h2>
              <p className="text-white/50 text-xs font-medium">
                Update how players pay you
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          <CyberInput
                label="PAYMENT LINK (Venmo/CashApp)"
                icon={<Link className="w-5 h-5" />}
                placeholder="https://venmo.com/..."
                value={formData.paymentLink}
                onChange={e => setFormData({...formData, paymentLink: e.target.value})}
            />

            <CyberInput
                label="ZELLE NUMBER"
                icon={<Phone className="w-5 h-5" />}
                placeholder="Phone number"
                value={formData.zellePhone}
                onChange={e => setFormData({...formData, zellePhone: e.target.value})}
            />

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <div className="pt-2">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Save Changes <Save className="w-4 h-4" /></>}
                </button>
            </div>

        </form>

      </div>
    </div>
  );
}
