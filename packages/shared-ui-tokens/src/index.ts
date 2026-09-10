export * from './colors.js';
export * from './spacing.js';
export * from './radii.js';
export * from './typography.js';
export * from './shadows.js';
export * from './date.js';
export * from './confirmDialogs.js';
export * from './currency.js';
export * from './countries.js';
export * from './institutionAliases.js';
export * from './institutionStopwords.js';

import { colors } from './colors.js';
import { radii } from './radii.js';
import { shadows } from './shadows.js';

export const tailwindThemeConfig = {
  extend: {
    colors: {
      brand: {
        primary: colors.primary,
        'primary-soft': colors.primarySoft,
        'navy-start': colors.navyHeaderStart,
        'navy-end': colors.navyHeaderEnd,
      },
      semantic: {
        success: colors.success,
        'success-bg': colors.successBg,
        danger: colors.danger,
        'danger-bg': colors.dangerBg,
        investment: colors.investment,
        'investment-bg': colors.investmentBg,
        transfer: colors.transfer,
        'transfer-bg': colors.transferBg,
        warning: colors.warning,
        'warning-bg': colors.warningBg,
      },
      surface: colors.surface,
      pageBackground: colors.background,
      borderDefault: colors.border,
      textDefault: colors.text,
      textMuted: colors.textMuted,
    },
    borderRadius: {
      card: radii.card,
      modal: radii.modal,
      pill: radii.pill,
    },
    boxShadow: {
      xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      card: shadows.card,
      'card-hover': shadows.cardHover,
      modal: shadows.modal,
      fab: shadows.fab,
      header: shadows.header,
    },
  },
};
