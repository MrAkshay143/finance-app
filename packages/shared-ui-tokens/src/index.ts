export * from './colors.js';
export * from './spacing.js';
export * from './radii.js';
export * from './typography.js';
export * from './shadows.js';
export * from './date.js';
export * from './confirmDialogs.js';
export * from './currency.js';
export * from './countries.js';

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
      card: shadows.card,
      'card-hover': shadows.cardHover,
      modal: shadows.modal,
      fab: shadows.fab,
      header: shadows.header,
    },
  },
};
