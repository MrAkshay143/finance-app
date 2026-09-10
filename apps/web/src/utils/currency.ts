/**
 * apps/web/src/utils/currency.ts
 * Delegates to centralized currency tokens in @finance/shared-ui-tokens.
 * Strictly maintains backward compatibility with formatIndianRupees and parseIndianRupees.
 */

export {
  formatCurrency,
  formatCompactCurrency,
  formatIndianRupees,
  parseIndianRupees,
  parseCurrencyAmount,
  getCurrencySymbol,
  getCurrencyConfig,
  SUPPORTED_CURRENCIES,
  CURRENCY_CONFIGS,
} from '@finance/shared-ui-tokens';

export type { CurrencyConfig, FormatCurrencyOptions } from '@finance/shared-ui-tokens';

import { getCurrencySymbol } from '@finance/shared-ui-tokens';

/**
 * Returns formatted annual income range bracket options for selects/radios.
 */
export function getIncomeBracketOptions(currencyCode = 'INR'): { value: string; label: string }[] {
  const symbol = getCurrencySymbol(currencyCode);
  if (currencyCode === 'INR') {
    return [
      { value: 'Below ₹3,00,000', label: 'Below ₹3,00,000' },
      { value: '₹3,00,000 - ₹5,00,000', label: '₹3,00,000 - ₹5,00,000' },
      { value: '₹5,00,000 - ₹10,00,000', label: '₹5,00,000 - ₹10,00,000' },
      { value: '₹10,00,000 - ₹25,00,000', label: '₹10,00,000 - ₹25,00,000' },
      { value: 'Above ₹25,00,000', label: 'Above ₹25,00,000' },
    ];
  }
  return [
    { value: `Below ${symbol}30,000`, label: `Below ${symbol}30,000` },
    { value: `${symbol}30,000 - ${symbol}60,000`, label: `${symbol}30,000 - ${symbol}60,000` },
    { value: `${symbol}60,000 - ${symbol}100,000`, label: `${symbol}60,000 - ${symbol}100,000` },
    { value: `${symbol}100,000 - ${symbol}250,000`, label: `${symbol}100,000 - ${symbol}250,000` },
    { value: `Above ${symbol}250,000`, label: `Above ${symbol}250,000` },
  ];
}

