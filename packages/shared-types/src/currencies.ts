import { z } from 'zod';

export const SUPPORTED_CURRENCY_CODES = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'SGD',
  'AED',
  'JPY',
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCY_CODES)[number];

export const CurrencyCodeSchema = z.enum(SUPPORTED_CURRENCY_CODES);

export interface CurrencyMetadata {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  decimalPlaces: number;
  numberingSystem: 'indian' | 'standard';
}

export const CURRENCY_REGISTRY: Record<CurrencyCode, CurrencyMetadata> = {
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

export const SUPPORTED_CURRENCIES: CurrencyMetadata[] = Object.values(CURRENCY_REGISTRY);

export function getCurrencyByCode(code: string): CurrencyMetadata {
  const upper = (code || '').toUpperCase() as CurrencyCode;
  return CURRENCY_REGISTRY[upper] || CURRENCY_REGISTRY.INR;
}

export function getCurrencySymbol(code?: string): string {
  if (!code) return '₹';
  return getCurrencyByCode(code).symbol;
}

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return SUPPORTED_CURRENCY_CODES.includes(code as CurrencyCode);
}

export const DEFAULT_CURRENCY: CurrencyCode = 'INR';
