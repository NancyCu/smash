"use client";

import React, { useState } from "react";
import { X, ExternalLink, Phone, Check } from "lucide-react";
import { 
  generatePaymentLink, 
  generateFallbackLink, 
  detectPaymentType, 
  isMobileDevice
} from "@/utils/paymentLinks";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentLink?: string | null;
  zellePhone?: string | null;
  hostName?: string;
  totalOwed: number;
  gameName: string;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  paymentLink, 
  zellePhone, 
  hostName = "Host",
  totalOwed,
  gameName
}: PaymentModalProps) {
  const [zelleCopied, setZelleCopied] = useState(false);
  const isMobile = isMobileDevice();
  const [venmoFallback, setVenmoFallback] = useState(false);

  if (!isOpen) return null;

  // Detect payment type and generate deep links
  const paymentType = paymentLink ? detectPaymentType(paymentLink) : null;
  const isVenmo = paymentType === 'venmo';
  const isCashApp = paymentType === 'cashapp';

  // Generate dynamic deep-link with cart total
  const dynamicPaymentLink = paymentLink && paymentType
    ? generatePaymentLink(paymentType, paymentLink, totalOwed, gameName)
    : paymentLink;

  // Fallback link for Venmo on desktop
  const fallbackLink = paymentLink && isVenmo
    ? generateFallbackLink('venmo', paymentLink)
    : null;

  // Handle payment link click (with Venmo fallback)
  const handlePaymentClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isVenmo && !isMobile) {
      // On desktop, use web fallback for Venmo
      e.preventDefault();
      window.open(fallbackLink || paymentLink || '', '_blank');
      setVenmoFallback(true);
      setTimeout(() => setVenmoFallback(false), 3000);
    }
    // For mobile or CashApp, use the deep link (default behavior)
  };

  const handleCopyZelle = async () => {
    if (!zellePhone) return;
    
    try {
      // Use utility to clean phone number
      const cleanPhone = generatePaymentLink('zelle', zellePhone, totalOwed, gameName);
      await navigator.clipboard.writeText(cleanPhone);
      setZelleCopied(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setZelleCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const hasPaymentLink = paymentLink && paymentLink.trim() !== '';
  const hasZelle = zellePhone && zellePhone.trim() !== '';

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
        <div className="relative p-6 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-2xl">💳</span>
            </div>
            <div>
              <h2 className="text-white font-black text-lg uppercase tracking-tight">
                Payment Options
              </h2>
              <p className="text-white/50 text-xs font-medium">
                Pay {hostName} • ${totalOwed.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Venmo/CashApp Option */}
          {hasPaymentLink && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/50 text-xs font-bold uppercase tracking-widest">
                <ExternalLink className="w-3 h-3" />
                <span>Option 1: {isVenmo ? 'Venmo' : isCashApp ? 'Cash App' : 'Payment Link'}</span>
              </div>
              <a
                href={dynamicPaymentLink || '#'}
                onClick={handlePaymentClick}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] text-white font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:scale-[1.02] transition-all active:scale-95 text-center"
              >
                <span className="flex items-center justify-center gap-2">
                  {venmoFallback ? (
                    <>Opening Venmo Web... <Check className="w-4 h-4" /></>
                  ) : (
                    <>
                      {isVenmo ? 'Pay with Venmo' : isCashApp ? 'Pay with Cash App' : 'Open Payment Link'}
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </span>
              </a>
              {isVenmo && !isMobile && (
                <p className="text-white/40 text-xs text-center font-medium">
                  Opens Venmo website (mobile app not detected)
                </p>
              )}
              {isCashApp && (
                <p className="text-white/40 text-xs text-center font-medium">
                  Amount pre-filled: ${totalOwed.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Divider */}
          {hasPaymentLink && hasZelle && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs font-bold uppercase">Or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          )}

          {/* Zelle Option */}
          {hasZelle && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/50 text-xs font-bold uppercase tracking-widest">
                <Phone className="w-3 h-3" />
                <span>Option {hasPaymentLink ? '2' : '1'}: Zelle</span>
              </div>
              <button
                onClick={handleCopyZelle}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-95 text-center ${
                  zelleCopied
                    ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                    : 'bg-gradient-to-r from-[#db2777] to-[#9333ea] text-white shadow-[0_0_20px_rgba(219,39,119,0.3)] hover:shadow-[0_0_30px_rgba(219,39,119,0.5)] hover:scale-[1.02]'
                }`}
              >
                {zelleCopied ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    Copied! ✅
                  </span>
                ) : (
                  <span className="flex flex-col items-center gap-1">
                    <span className="text-xs opacity-70">Tap to Copy</span>
                    <span className="text-lg font-mono">{zellePhone}</span>
                  </span>
                )}
              </button>
              {!zelleCopied && (
                <p className="text-white/40 text-xs text-center font-medium">
                  Opens your Zelle app to send payment
                </p>
              )}
            </div>
          )}

          {/* No payment methods */}
          {!hasPaymentLink && !hasZelle && (
            <div className="py-8 text-center">
              <div className="text-white/30 text-sm font-medium">
                Host hasn't set up payment methods yet.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
