export type CardNetwork = 'visa' | 'mastercard' | 'rupay' | 'amex' | 'diners' | 'discover';

export const CARD_NETWORK_NAMES: Record<CardNetwork, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  rupay: 'RuPay',
  amex: 'American Express',
  diners: 'Diners Club',
  discover: 'Discover',
};

/**
 * Detect card network from prefix or mask.
 * Uses BIN regex rules:
 * - Visa: /^4/
 * - Mastercard: /^5[1-5]/ or /^2[2-7]/
 * - RuPay: /^(60|65|81|82|508)/
 * - Amex: /^3[47]/
 * - Diners Club: /^(36|38|30[0-5])/
 * - Discover: /^(6011|65)/
 */
export function detectCardNetwork(cardNumberPrefix?: string | null): CardNetwork | null {
  if (!cardNumberPrefix || typeof cardNumberPrefix !== 'string') {
    return null;
  }

  // Remove common masking characters, spaces, and dashes
  const trimmed = cardNumberPrefix.trim();
  const digitsOnly = trimmed.replace(/\D/g, '');

  // Use digits if available, otherwise check raw trimmed string
  const target = digitsOnly.length > 0 ? digitsOnly : trimmed;
  if (!target) return null;

  // 1. Visa: /^4/
  if (/^4/.test(target)) {
    return 'visa';
  }

  // 2. Mastercard: /^5[1-5]/ or /^2[2-7]/
  if (/^(5[1-5]|2[2-7])/.test(target)) {
    return 'mastercard';
  }

  // 3. Amex: /^3[47]/
  if (/^3[47]/.test(target)) {
    return 'amex';
  }

  // 4. Diners Club: /^(36|38|30[0-5])/
  if (/^(36|38|30[0-5])/.test(target)) {
    return 'diners';
  }

  // 5. Discover: /^(6011|65)/ (Test 6011 first before generic 60/65 RuPay)
  if (/^6011/.test(target)) {
    return 'discover';
  }

  // 6. RuPay: /^(60|65|81|82|508)/
  if (/^(60|65|81|82|508)/.test(target)) {
    return 'rupay';
  }

  return null;
}
