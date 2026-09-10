// Centralized currency formatting utilities and annual income bracket options

export {
  DEFAULT_CURRENCY,
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

import { DEFAULT_CURRENCY, formatCurrency, getCurrencySymbol } from '@finance/shared-ui-tokens';

/**
 * Returns formatted annual income range bracket options for selects/radios.
 */
export function getIncomeBracketOptions(currencyCode = DEFAULT_CURRENCY): { value: string; label: string }[] {
  if (currencyCode === 'INR') {
    const b1 = formatCurrency(300000, 'INR', { maximumFractionDigits: 0 });
    const b2 = formatCurrency(500000, 'INR', { maximumFractionDigits: 0 });
    const b3 = formatCurrency(1000000, 'INR', { maximumFractionDigits: 0 });
    const b4 = formatCurrency(2500000, 'INR', { maximumFractionDigits: 0 });
    return [
      { value: `Below ${b1}`, label: `Below ${b1}` },
      { value: `${b1} - ${b2}`, label: `${b1} - ${b2}` },
      { value: `${b2} - ${b3}`, label: `${b2} - ${b3}` },
      { value: `${b3} - ${b4}`, label: `${b3} - ${b4}` },
      { value: `Above ${b4}`, label: `Above ${b4}` },
    ];
  }
  const symbol = getCurrencySymbol(currencyCode);
  return [
    { value: `Below ${symbol}30,000`, label: `Below ${symbol}30,000` },
    { value: `${symbol}30,000 - ${symbol}60,000`, label: `${symbol}30,000 - ${symbol}60,000` },
    { value: `${symbol}60,000 - ${symbol}100,000`, label: `${symbol}60,000 - ${symbol}100,000` },
    { value: `${symbol}100,000 - ${symbol}250,000`, label: `${symbol}100,000 - ${symbol}250,000` },
    { value: `Above ${symbol}250,000`, label: `Above ${symbol}250,000` },
  ];
}

/**
 * Automatically computes appropriate income bracket string from monthly income.
 */
export function computeIncomeBracket(
  monthlyIncome: number | string,
  currency = DEFAULT_CURRENCY
): string {
  const num = Number(monthlyIncome);
  if (isNaN(num) || num <= 0) return '';
  const annual = num * 12;

  if (currency === 'INR') {
    const b1 = formatCurrency(300000, 'INR', { maximumFractionDigits: 0 });
    const b2 = formatCurrency(500000, 'INR', { maximumFractionDigits: 0 });
    const b3 = formatCurrency(1000000, 'INR', { maximumFractionDigits: 0 });
    const b4 = formatCurrency(2500000, 'INR', { maximumFractionDigits: 0 });
    if (annual < 300000) return `Below ${b1}`;
    if (annual <= 500000) return `${b1} - ${b2}`;
    if (annual <= 1000000) return `${b2} - ${b3}`;
    if (annual <= 2500000) return `${b3} - ${b4}`;
    return `Above ${b4}`;
  } else {
    const symbol = getCurrencySymbol(currency);
    if (annual < 30000) return `Below ${symbol}30,000`;
    if (annual <= 60000) return `${symbol}30,000 - ${symbol}60,000`;
    if (annual <= 100000) return `${symbol}60,000 - ${symbol}100,000`;
    if (annual <= 250000) return `${symbol}100,000 - ${symbol}250,000`;
    return `Above ${symbol}250,000`;
  }
}

