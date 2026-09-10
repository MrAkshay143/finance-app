// Centralized country presentation tokens and selector options

export interface CountryOption {
  code: string;
  name: string;
  callingCode: string;
  defaultCurrency: string;
  flag: string;
  phonePlaceholder: string;
}

export const COUNTRIES: CountryOption[] = [
  {
    code: 'IN',
    name: 'India',
    callingCode: '+91',
    defaultCurrency: 'INR',
    flag: '🇮🇳',
    phonePlaceholder: '98765 43210',
  },
  {
    code: 'US',
    name: 'United States',
    callingCode: '+1',
    defaultCurrency: 'USD',
    flag: '🇺🇸',
    phonePlaceholder: '(555) 019-2834',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    callingCode: '+44',
    defaultCurrency: 'GBP',
    flag: '🇬🇧',
    phonePlaceholder: '7911 123456',
  },
  {
    code: 'CA',
    name: 'Canada',
    callingCode: '+1',
    defaultCurrency: 'CAD',
    flag: '🇨🇦',
    phonePlaceholder: '(555) 019-2834',
  },
  {
    code: 'AU',
    name: 'Australia',
    callingCode: '+61',
    defaultCurrency: 'AUD',
    flag: '🇦🇺',
    phonePlaceholder: '412 345 678',
  },
  {
    code: 'SG',
    name: 'Singapore',
    callingCode: '+65',
    defaultCurrency: 'SGD',
    flag: '🇸🇬',
    phonePlaceholder: '8123 4567',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    callingCode: '+971',
    defaultCurrency: 'AED',
    flag: '🇦🇪',
    phonePlaceholder: '50 123 4567',
  },
  {
    code: 'DE',
    name: 'Germany',
    callingCode: '+49',
    defaultCurrency: 'EUR',
    flag: '🇩🇪',
    phonePlaceholder: '151 23456789',
  },
  {
    code: 'FR',
    name: 'France',
    callingCode: '+33',
    defaultCurrency: 'EUR',
    flag: '🇫🇷',
    phonePlaceholder: '6 12 34 56 78',
  },
  {
    code: 'JP',
    name: 'Japan',
    callingCode: '+81',
    defaultCurrency: 'JPY',
    flag: '🇯🇵',
    phonePlaceholder: '90 1234 5678',
  },
].sort((a, b) => a.name.localeCompare(b.name));

export function getCountryOption(code: string): CountryOption {
  const upper = (code || 'IN').toUpperCase();
  return COUNTRIES.find((c) => c.code === upper) || COUNTRIES.find((c) => c.code === 'IN')!;
}

export function getCallingCode(code: string): string {
  return getCountryOption(code).callingCode;
}
