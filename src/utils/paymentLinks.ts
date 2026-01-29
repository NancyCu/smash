/**
 * Payment Deep-Link Generator
 * Creates dynamic payment links for Venmo, CashApp, and Zelle
 */

export type PaymentType = 'venmo' | 'cashapp' | 'zelle';

export interface PaymentLinkParams {
  type: PaymentType;
  handle: string;
  amount: number;
  gameName: string;
}

/**
 * Generates a payment deep-link based on the payment type and cart total
 * @param type - Payment platform (venmo, cashapp, zelle)
 * @param handle - Payment handle/username/phone (can include prefixes)
 * @param amount - Total amount to charge (cart total)
 * @param gameName - Name of the game for payment note
 * @returns Payment URL or cleaned identifier
 */
export function generatePaymentLink(
  type: PaymentType,
  handle: string,
  amount: number,
  gameName: string
): string {
  const formattedAmount = amount.toFixed(2);
  const encodedGameName = encodeURIComponent(gameName);

  switch (type) {
    case 'venmo': {
      // Strip @, https://venmo.com/, or any other prefix to get raw username
      const username = handle
        .replace(/^@/, '')
        .replace(/^https?:\/\/(www\.)?venmo\.com\//i, '')
        .replace(/^venmo\.com\//i, '')
        .trim();

      // Deep-link format for Venmo app
      return `venmo://paycharge?txn=pay&recipients=${username}&amount=${formattedAmount}&note=Squares%20Royale:%20${encodedGameName}`;
    }

    case 'cashapp': {
      // Strip https://cash.app/$ or $ prefix to get raw cashtag
      const cashtag = handle
        .replace(/^https?:\/\/(www\.)?cash\.app\/\$/i, '')
        .replace(/^\$/, '')
        .trim();

      // Cash App universal link (works on mobile and desktop)
      return `https://cash.app/$${cashtag}/${formattedAmount}`;
    }

    case 'zelle': {
      // Return cleaned phone number (digits only)
      return handle.replace(/\D/g, '');
    }

    default:
      return handle;
  }
}

/**
 * Generates a fallback web link for platforms that support it
 * Used when deep-link fails (e.g., Venmo on desktop)
 */
export function generateFallbackLink(type: PaymentType, handle: string): string {
  switch (type) {
    case 'venmo': {
      const username = handle
        .replace(/^@/, '')
        .replace(/^https?:\/\/(www\.)?venmo\.com\//i, '')
        .replace(/^venmo\.com\//i, '')
        .trim();

      return `https://venmo.com/${username}`;
    }

    case 'cashapp': {
      const cashtag = handle
        .replace(/^https?:\/\/(www\.)?cash\.app\/\$/i, '')
        .replace(/^\$/, '')
        .trim();

      return `https://cash.app/$${cashtag}`;
    }

    default:
      return handle;
  }
}

/**
 * Detects payment type from handle string
 * @param handle - Payment handle/URL
 * @returns Detected payment type or null
 */
export function detectPaymentType(handle: string): PaymentType | null {
  const normalized = handle.toLowerCase().trim();

  if (normalized.includes('venmo.com') || normalized.startsWith('@')) {
    return 'venmo';
  }

  if (normalized.includes('cash.app') || normalized.startsWith('$')) {
    return 'cashapp';
  }

  // Check if it's a phone number (10+ digits)
  const digits = handle.replace(/\D/g, '');
  if (digits.length >= 10) {
    return 'zelle';
  }

  return null;
}

/**
 * Checks if the user is on a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}
