import { z } from 'zod';

export const UserRoleSchema = z.enum(['USER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const TxnTypeSchema = z.enum(['INCOME', 'EXPENSE', 'INVESTMENT']);
export type TxnType = z.infer<typeof TxnTypeSchema>;

export const TxnDirectionSchema = z.enum(['CREDIT', 'DEBIT']);
export type TxnDirection = z.infer<typeof TxnDirectionSchema>;

export const RecordStatusSchema = z.enum(['ACTIVE', 'DELETED']);
export type RecordStatus = z.infer<typeof RecordStatusSchema>;

export const AccountStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
export type AccountStatus = z.infer<typeof AccountStatusSchema>;

export const AccountTypeSchema = z.enum(['BANK', 'CREDIT_CARD', 'WALLET', 'INVESTMENT', 'CASH', 'LOAN']);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const RecurringFrequencySchema = z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']);
export type RecurringFrequency = z.infer<typeof RecurringFrequencySchema>;

export const RecurringStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'DELETED']);
export type RecurringStatus = z.infer<typeof RecurringStatusSchema>;

export const RiskAppetiteSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const v = val.toUpperCase().trim();
    if (v === 'LOW' || v === 'CONSERVATIVE') return 'LOW';
    if (v === 'MEDIUM' || v === 'MODERATE') return 'MEDIUM';
    if (v === 'HIGH' || v === 'AGGRESSIVE') return 'HIGH';
  }
  return val;
}, z.enum(['LOW', 'MEDIUM', 'HIGH']));
export type RiskAppetite = z.infer<typeof RiskAppetiteSchema>;

export const InvestmentHorizonSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const v = val.toUpperCase().trim();
    if (v === 'SHORT' || v === 'SHORT_TERM') return 'SHORT';
    if (v === 'MEDIUM' || v === 'MEDIUM_TERM') return 'MEDIUM';
    if (v === 'LONG' || v === 'LONG_TERM') return 'LONG';
  }
  return val;
}, z.enum(['SHORT', 'MEDIUM', 'LONG']));
export type InvestmentHorizon = z.infer<typeof InvestmentHorizonSchema>;

export const NotificationTypeSchema = z.enum([
  'DUE_DATE',
  'REMINDER',
  'BUDGET_ALERT',
  'SECURITY',
  'SYSTEM',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const FamGradeSchema = z.enum(['A_PLUS', 'B', 'C', 'NOT_AVAILABLE']);
export type FamGrade = z.infer<typeof FamGradeSchema>;
