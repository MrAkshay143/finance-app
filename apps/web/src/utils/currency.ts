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
