import { APP_SETTINGS_KEYS } from '@finance/shared-types';
import { encryptSmtpPassword } from '../lib/smtpCrypto.js';

// Dynamic AppSettings defaults populated from env; SMTP passwords AES-256-GCM encrypted
export function getDefaultAppSettings(): Array<{ key: string; value: any }> {
  const env = process.env;

  const defaultAdminEmail = (env.ADMIN_EMAIL || 'contact@imakshay.in').toLowerCase().trim();
  const defaultSenderEmail = (env.SMTP_SENDER_EMAIL || env.SMTP_FROM_ADDRESS || 'no-reply@imakshay.in').toLowerCase().trim();
  const smtpHost = env.SMTP_HOST || 'smtp.hostinger.com';
  const smtpPort = Number(env.SMTP_PORT) || 465;
  const smtpSecurity = env.SMTP_SECURITY || (smtpPort === 465 ? 'SSL' : 'STARTTLS');
  const smtpUsername = env.SMTP_USERNAME || defaultSenderEmail;
  const rawSmtpPassword = env.SMTP_PASSWORD || '';
  const encryptedSmtpPassword = rawSmtpPassword ? encryptSmtpPassword(rawSmtpPassword) : '';
  const smtpSenderEmail = env.SMTP_SENDER_EMAIL || env.SMTP_FROM_ADDRESS || smtpUsername;
  const smtpSenderName = env.SMTP_SENDER_NAME || env.PLATFORM_NAME || 'Finance Tracker Pro';
  const smtpEnabled = env.SMTP_ENABLED !== undefined ? env.SMTP_ENABLED === 'true' : Boolean(rawSmtpPassword);

  return [
    { key: APP_SETTINGS_KEYS.SESSION_TIMEOUT_MINUTES, value: Number(env.SESSION_TIMEOUT_MINUTES) || 15 },
    { key: APP_SETTINGS_KEYS.MAX_FAILED_ATTEMPTS, value: Number(env.MAX_FAILED_ATTEMPTS) || 5 },
    { key: APP_SETTINGS_KEYS.LOCKOUT_DURATION_MINUTES, value: Number(env.LOCKOUT_DURATION_MINUTES) || 15 },
    { key: APP_SETTINGS_KEYS.REQUIRE_KBA_FOR_SENSITIVE_ACTIONS, value: env.REQUIRE_KBA !== 'false' },

    { key: APP_SETTINGS_KEYS.PASSWORD_MIN_LENGTH, value: Number(env.PASSWORD_MIN_LENGTH) || 8 },
    { key: APP_SETTINGS_KEYS.PASSWORD_REQUIRE_UPPERCASE, value: true },
    { key: APP_SETTINGS_KEYS.PASSWORD_REQUIRE_LOWERCASE, value: true },
    { key: APP_SETTINGS_KEYS.PASSWORD_REQUIRE_DIGIT, value: true },
    { key: APP_SETTINGS_KEYS.PASSWORD_REQUIRE_SPECIAL, value: false },
    { key: APP_SETTINGS_KEYS.PASSWORD_MAX_AGE_DAYS, value: 0 },

    { key: APP_SETTINGS_KEYS.PLATFORM_NAME, value: env.PLATFORM_NAME || 'Finance Tracker Pro' },
    { key: APP_SETTINGS_KEYS.SUPPORT_EMAIL, value: env.SUPPORT_EMAIL || defaultAdminEmail },
    { key: APP_SETTINGS_KEYS.ALLOW_USER_REGISTRATION, value: env.ALLOW_USER_REGISTRATION !== 'false' },
    { key: APP_SETTINGS_KEYS.PWA_INSTALL_ENABLED, value: env.PWA_INSTALL_ENABLED !== 'false' },
    { key: APP_SETTINGS_KEYS.MAINTENANCE_MODE, value: false },
    { key: APP_SETTINGS_KEYS.MAINTENANCE_MESSAGE, value: 'Platform is currently undergoing scheduled maintenance. Please try again shortly.' },
    { key: APP_SETTINGS_KEYS.DEFAULT_COUNTRY, value: env.DEFAULT_COUNTRY || 'IN' },
    { key: APP_SETTINGS_KEYS.DEFAULT_BASE_CURRENCY, value: env.DEFAULT_BASE_CURRENCY || 'INR' },
    { key: APP_SETTINGS_KEYS.DEFAULT_BUDGET_PERIOD, value: env.DEFAULT_BUDGET_PERIOD || 'MONTHLY' },
    { key: APP_SETTINGS_KEYS.FAM_EXPENSE_THRESHOLD_PERCENT, value: 80 },
    { key: APP_SETTINGS_KEYS.FAM_INVESTMENT_THRESHOLD_PERCENT, value: 100 },
    { key: APP_SETTINGS_KEYS.FAM_INCOME_THRESHOLD_PERCENT, value: 100 },

    { key: APP_SETTINGS_KEYS.SMTP_ENABLED, value: smtpEnabled },
    { key: APP_SETTINGS_KEYS.SMTP_HOST, value: smtpHost },
    { key: APP_SETTINGS_KEYS.SMTP_PORT, value: smtpPort },
    { key: APP_SETTINGS_KEYS.SMTP_SECURITY, value: smtpSecurity },
    { key: APP_SETTINGS_KEYS.SMTP_SECURE, value: smtpPort === 465 },
    { key: APP_SETTINGS_KEYS.SMTP_USERNAME, value: smtpUsername },
    { key: APP_SETTINGS_KEYS.SMTP_PASSWORD, value: encryptedSmtpPassword },
    { key: APP_SETTINGS_KEYS.SMTP_SENDER_EMAIL, value: smtpSenderEmail },
    { key: APP_SETTINGS_KEYS.SMTP_SENDER_NAME, value: smtpSenderName },
    { key: APP_SETTINGS_KEYS.SMTP_FROM_ADDRESS, value: smtpSenderEmail },
    { key: APP_SETTINGS_KEYS.SMTP_FROM_NAME, value: smtpSenderName },

    { key: APP_SETTINGS_KEYS.OTP_EXPIRY_MINUTES, value: 10 },
    { key: APP_SETTINGS_KEYS.OTP_MAX_ATTEMPTS, value: 5 },
    { key: APP_SETTINGS_KEYS.OTP_RESEND_COOLDOWN_SECONDS, value: 60 },
    { key: APP_SETTINGS_KEYS.OTP_MAX_RESENDS_PER_HOUR, value: 5 },
    { key: APP_SETTINGS_KEYS.REGISTRATION_REQUIRE_EMAIL_VERIFICATION, value: true },
  ];
}

export const DEFAULT_APP_SETTINGS = getDefaultAppSettings();
