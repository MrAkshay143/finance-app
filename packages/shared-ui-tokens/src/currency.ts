/**
 * packages/shared-ui-tokens/src/currency.ts
 * Centralized, universal currency formatting and token system.
 * Supports all registered currencies (INR, USD, EUR, GBP, CAD, AUD, SGD, AED, JPY),
 * with strict adherence to regional numbering systems (Indian Lakhs/Crores vs Western Millions/Billions).
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimalPlaces: number;
  numberingSystem: 'indian' | 'standard';
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    locale: 'en-IN',
    decimalPlaces: 2,
    numberingSystem: 'indian',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimalPlaces: 2,
    numberingSystem: 'standard',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    decimalPlaces: 2,
    numberingSystem: 'standard',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
    decimalPlaces: 2,
    numberingSystem: 'standard',
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    locale: 'en-CA',
    decimalPlaces: 2,
    numberingSystem: 'standard',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    locale: 'en-AU',
    decimalPlaces: 2,
    numberingSystem: 'standard',
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    locale: 'en-SG',
    decimalPlaces: 2,
    numberingSystem: 'standard',
  },
  AED: {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    locale: 'ar-AE',
    decimalPlaces: 2,
    numberingSystem: 'standard',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    locale: 'ja-JP',
    decimalPlaces: 0,
    numberingSystem: 'standard',
  },
};

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = Object.values(CURRENCY_CONFIGS);

export function getCurrencyConfig(code?: string): CurrencyConfig {
  const upper = (code || 'INR').toUpperCase();
  return CURRENCY_CONFIGS[upper] || CURRENCY_CONFIGS.INR;
}

export function getCurrencySymbol(code?: string): string {
  return getCurrencyConfig(code).symbol;
}

export interface FormatCurrencyOptions {
  includeSymbol?: boolean;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
}

/**
 * Universal Currency Formatter.
 * Respects user's active currency, correct symbol, and regional numbering systems.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'INR',
  options?: FormatCurrencyOptions
): string {
  const config = getCurrencyConfig(currency);
  const defaultDecimals = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 0;
  const minDecimals = options?.minimumFractionDigits !== undefined ? options.minimumFractionDigits : 0;
  const includeSymbol = options?.includeSymbol !== false;

  if (amount === null || amount === undefined || amount === '') {
    const sym = includeSymbol ? config.symbol : '';
    const formattedZero = minDecimals > 0 ? `0.${'0'.repeat(minDecimals)}` : '0';
    return `${sym}${formattedZero}`;
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || !Number.isFinite(num)) {
    const sym = includeSymbol ? config.symbol : '';
    const formattedZero = minDecimals > 0 ? `0.${'0'.repeat(minDecimals)}` : '0';
    return `${sym}${formattedZero}`;
  }

  const isNegative = num < 0;
  const absVal = Math.abs(num);

  const formatted = new Intl.NumberFormat(config.locale, {
    maximumFractionDigits: defaultDecimals,
    minimumFractionDigits: minDecimals,
  }).format(absVal);

  const prefix = isNegative ? '-' : '';
  const sym = includeSymbol ? config.symbol : '';

  return `${prefix}${sym}${formatted}`;
}

/**
 * Compact Currency Formatter for Charts, Badges, and Micro-Stat cards.
 * E.g., INR: ₹1.5Cr, ₹2.4L, ₹45k, ₹500
 * E.g., USD: $1.5B, $2.4M, $45k, $500
 */
export function formatCompactCurrency(
  amount: number | string | null | undefined,
  currency: string = 'INR'
): string {
  const config = getCurrencyConfig(currency);
  if (amount === null || amount === undefined || amount === '') {
    return `${config.symbol}0`;
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || !Number.isFinite(num)) {
    return `${config.symbol}0`;
  }

  const isNegative = num < 0;
  const absVal = Math.abs(num);
  const prefix = isNegative ? '-' : '';
  const sym = config.symbol;

  if (config.numberingSystem === 'indian') {
    if (absVal >= 10000000) {
      const val = (absVal / 10000000).toFixed(1).replace(/\.0$/, '');
      return `${prefix}${sym}${val}Cr`;
    }
    if (absVal >= 100000) {
      const val = (absVal / 100000).toFixed(1).replace(/\.0$/, '');
      return `${prefix}${sym}${val}L`;
    }
    if (absVal >= 1000) {
      const val = (absVal / 1000).toFixed(1).replace(/\.0$/, '');
      return `${prefix}${sym}${val}k`;
    }
    return `${prefix}${sym}${Math.round(absVal)}`;
  }

  // Western Standard Numbering
  if (absVal >= 1000000000) {
    const val = (absVal / 1000000000).toFixed(1).replace(/\.0$/, '');
    return `${prefix}${sym}${val}B`;
  }
  if (absVal >= 1000000) {
    const val = (absVal / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${prefix}${sym}${val}M`;
  }
  if (absVal >= 1000) {
    const val = (absVal / 1000).toFixed(1).replace(/\.0$/, '');
    return `${prefix}${sym}${val}k`;
  }
  return `${prefix}${sym}${Math.round(absVal)}`;
}

/**
 * Backward compatibility alias for Indian Rupees formatting.
 */
export function formatIndianRupees(
  amount: number | string | null | undefined,
  options?: FormatCurrencyOptions
): string {
  return formatCurrency(amount, 'INR', options);
}

/**
 * Strips non-numeric characters and parses monetary input strings.
 */
export function parseCurrencyAmount(val: string): number {
  const cleaned = (val || '').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export const parseIndianRupees = parseCurrencyAmount;
