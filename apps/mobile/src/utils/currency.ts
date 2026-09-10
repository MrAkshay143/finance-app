// Delegates currency formatting to @finance/shared-ui-tokens with mobile 2-decimal default precision

import {
  formatCurrency as baseFormatCurrency,
  FormatCurrencyOptions,
} from '@finance/shared-ui-tokens';

export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = 'INR',
  options?: FormatCurrencyOptions
): string {
  const mergedOptions: FormatCurrencyOptions = {
    minimumFractionDigits: options?.minimumFractionDigits !== undefined ? options.minimumFractionDigits : 2,
    maximumFractionDigits: options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 2,
    ...options,
  };
  return baseFormatCurrency(amount, currency, mergedOptions);
}

export {
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
