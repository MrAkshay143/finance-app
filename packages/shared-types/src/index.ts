export * from './enums.js';
export * from './api.js';
export * from './auth.js';
export * from './transactions.js';
export * from './accounts.js';
export * from './budgets.js';
export * from './profile.js';
export * from './settings.js';
export * from './audit.js';
export * from './importExport.js';
export * from './fam.js';
export * from './categories.js';
export * from './merchants.js';
export * from './admin.js';
export * from './dashboard.js';
export * from './analytics.js';
export * from './reports.js';
export * from './recurring.js';
export * from './reminders.js';
export * from './notifications.js';
export * from './investments.js';
export * from './aiAnalysis.js';
export * from './countries.js';
export * from './currencies.js';

// Standard pagination constants
export const DEFAULT_PAGE_SIZE = 15;
export const MAX_PAGE_SIZE = 100;
export const PAGE_SIZE_TABLE = 10;
export const PAGE_SIZE_GRID = 12;

// Default user settings
export const DEFAULT_USER_SETTINGS = {
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  financialMonthStartDay: 1,
  dateFormat: 'DD-MM-YYYY',
  timeFormat: '12h',
  quickAddEnabled: false,
};
