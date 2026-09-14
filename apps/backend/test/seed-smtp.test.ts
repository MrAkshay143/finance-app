import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import {
  DEFAULT_EMAIL_TEMPLATES,
  DEFAULT_APP_SETTINGS,
  getDefaultAppSettings,
  SYSTEM_CATEGORIES,
  seed,
  ensureSoleAdminUser,
} from '../prisma/seed.js';
import { encryptSmtpPassword, decryptSmtpPassword } from '../src/lib/smtpCrypto.js';

describe('Data Seeder & Hostinger SMTP Security Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Default Email Templates Verification', () => {
    it('contains all default transactional email templates', () => {
      const keys = DEFAULT_EMAIL_TEMPLATES.map((t) => t.key);
      expect(keys).toContain('password_reset');
      expect(keys).toContain('welcome');
      expect(keys).toContain('security_alert');
      expect(keys).toContain('account_locked');
      expect(keys).toContain('session_warning');
      expect(keys).toContain('email_verification');
      expect(keys).toContain('password_reset_otp');
      expect(DEFAULT_EMAIL_TEMPLATES.length).toBe(7);
    });

    it('defines required interpolation variables for each template', () => {
      const pwReset = DEFAULT_EMAIL_TEMPLATES.find((t) => t.key === 'password_reset');
      expect(pwReset?.variables).toContain('firstName');
      expect(pwReset?.variables).toContain('resetLink');
      expect(pwReset?.variables).toContain('appName');
      expect(pwReset?.htmlContent).toContain('{{resetLink}}');

      const welcome = DEFAULT_EMAIL_TEMPLATES.find((t) => t.key === 'welcome');
      expect(welcome?.variables).toContain('firstName');
      expect(welcome?.variables).toContain('appName');

      const secAlert = DEFAULT_EMAIL_TEMPLATES.find((t) => t.key === 'security_alert');
      expect(secAlert?.variables).toContain('ipAddress');
      expect(secAlert?.variables).toContain('userAgent');
    });
  });

  describe('2. Dynamic AppSettings & Zero Hardcoded Secrets', () => {
    it('generates settings dynamically without hardcoding passwords', () => {
      delete process.env.SMTP_PASSWORD;
      const settings = getDefaultAppSettings();
      const pwSetting = settings.find((s) => s.key === 'smtp_password');
      expect(pwSetting).toBeDefined();
      expect(pwSetting?.value).toBe('');
    });

    it('dynamically reflects environment overrides for platform branding and SMTP', () => {
      process.env.PLATFORM_NAME = 'Custom Institutional Wealth';
      process.env.SUPPORT_EMAIL = 'support@custominstitutional.com';
      process.env.SMTP_HOST = 'smtp.hostinger.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_USERNAME = 'contact@imakshay.in';
      process.env.DEFAULT_BASE_CURRENCY = 'INR';

      const settings = getDefaultAppSettings();

      expect(settings.find((s) => s.key === 'platform_name')?.value).toBe('Custom Institutional Wealth');
      expect(settings.find((s) => s.key === 'support_email')?.value).toBe('support@custominstitutional.com');
      expect(settings.find((s) => s.key === 'smtp_host')?.value).toBe('smtp.hostinger.com');
      expect(settings.find((s) => s.key === 'smtp_port')?.value).toBe(465);
      expect(settings.find((s) => s.key === 'smtp_username')?.value).toBe('contact@imakshay.in');
      expect(settings.find((s) => s.key === 'default_base_currency')?.value).toBe('INR');
    });

    it('encrypts SMTP_PASSWORD using AES-256-GCM when supplied in environment', () => {
      const plaintextPass = 'SuperSecretSmtpPass!2026';
      process.env.SMTP_PASSWORD = plaintextPass;
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-min-32-chars-long-12345';

      const settings = getDefaultAppSettings();
      const pwSetting = settings.find((s) => s.key === 'smtp_password');
      expect(pwSetting).toBeDefined();
      expect(pwSetting?.value).not.toBe('');
      expect(pwSetting?.value).not.toBe(plaintextPass); // NEVER plaintext

      // Must be valid base64
      expect(() => Buffer.from(pwSetting!.value, 'base64')).not.toThrow();

      // Must decrypt back to the original plaintext password
      const decrypted = decryptSmtpPassword(pwSetting!.value);
      expect(decrypted).toBe(plaintextPass);
    });
  });

  describe('3. Database Seeder Execution', () => {
    it('executes seed cleanly against mocked Prisma Client including email templates and settings', async () => {
      const mockCategoryFindFirst = vi.fn().mockResolvedValue(null);
      const mockCategoryCreate = vi.fn().mockResolvedValue({ id: 'cat-1' });
      const mockCategoryUpdate = vi.fn().mockResolvedValue({ id: 'cat-1' });
      const mockAppSettingUpsert = vi.fn().mockResolvedValue({ key: 'setting-1', value: {} });
      const mockEmailTemplateUpsert = vi.fn().mockResolvedValue({ id: 'tmpl-1' });

      const mockPrisma = {
        category: {
          findFirst: mockCategoryFindFirst,
          create: mockCategoryCreate,
          update: mockCategoryUpdate,
        },
        appSetting: {
          upsert: mockAppSettingUpsert,
        },
        emailTemplate: {
          upsert: mockEmailTemplateUpsert,
        },
      } as unknown as PrismaClient;

      await seed(mockPrisma);

      expect(mockCategoryCreate).toHaveBeenCalledTimes(SYSTEM_CATEGORIES.length);
      expect(mockAppSettingUpsert).toHaveBeenCalledTimes(DEFAULT_APP_SETTINGS.length);
      expect(mockEmailTemplateUpsert).toHaveBeenCalledTimes(DEFAULT_EMAIL_TEMPLATES.length);
    });
  });

  describe('4. Hostinger SMTP Mail Configuration & Encryption Integration', () => {
    it('seeds and encrypts Hostinger no-reply@imakshay.in SMTP credentials correctly', () => {
      process.env.SMTP_ENABLED = 'true';
      process.env.SMTP_HOST = 'smtp.hostinger.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_SECURITY = 'SSL';
      process.env.SMTP_USERNAME = 'no-reply@imakshay.in';
      process.env.SMTP_PASSWORD = 'Yourcart@2024';
      process.env.SMTP_SENDER_EMAIL = 'no-reply@imakshay.in';
      process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-min-32-chars-long-12345';

      const settings = getDefaultAppSettings();

      expect(settings.find((s) => s.key === 'smtp_enabled')?.value).toBe(true);
      expect(settings.find((s) => s.key === 'smtp_host')?.value).toBe('smtp.hostinger.com');
      expect(settings.find((s) => s.key === 'smtp_port')?.value).toBe(465);
      expect(settings.find((s) => s.key === 'smtp_security')?.value).toBe('SSL');
      expect(settings.find((s) => s.key === 'smtp_secure')?.value).toBe(true);
      expect(settings.find((s) => s.key === 'smtp_username')?.value).toBe('no-reply@imakshay.in');
      expect(settings.find((s) => s.key === 'smtp_sender_email')?.value).toBe('no-reply@imakshay.in');

      const encryptedPw = settings.find((s) => s.key === 'smtp_password')?.value;
      expect(encryptedPw).toBeDefined();
      expect(encryptedPw).not.toBe('Yourcart@2024'); // Must be encrypted
      expect(decryptSmtpPassword(encryptedPw)).toBe('Yourcart@2024'); // Decrypts cleanly
    });
  });

  describe('5. Sole Admin User Seeding & No Duplicate Admin Enforcement', () => {
    it('provisions contact@imakshay.in as the sole ADMIN user when no admin exists', async () => {
      const mockFindUnique = vi.fn().mockResolvedValue(null);
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'admin-1',
        email: 'contact@imakshay.in',
        role: UserRole.ADMIN,
      });
      const mockUpdate = vi.fn();
      const mockUpdateMany = vi.fn().mockResolvedValue({ count: 0 });

      const mockPrisma = {
        user: {
          findUnique: mockFindUnique,
          create: mockCreate,
          update: mockUpdate,
          updateMany: mockUpdateMany,
        },
      } as unknown as PrismaClient;

      await ensureSoleAdminUser(mockPrisma);

      expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: 'contact@imakshay.in' } });
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const createArgs = mockCreate.mock.calls[0][0];
      expect(createArgs.data.email).toBe('contact@imakshay.in');
      expect(createArgs.data.role).toBe(UserRole.ADMIN);
      expect(createArgs.data.status).toBe(UserStatus.ACTIVE);
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          role: UserRole.ADMIN,
          email: { not: 'contact@imakshay.in' },
        },
        data: {
          role: UserRole.USER,
        },
      });
    });

    it('verifies and updates existing contact@imakshay.in without creating duplicate admin', async () => {
      const mockFindUnique = vi.fn().mockResolvedValue({
        id: 'admin-existing-1',
        email: 'contact@imakshay.in',
        role: UserRole.ADMIN,
      });
      const mockCreate = vi.fn();
      const mockUpdate = vi.fn().mockResolvedValue({
        id: 'admin-existing-1',
        email: 'contact@imakshay.in',
        role: UserRole.ADMIN,
      });
      const mockUpdateMany = vi.fn().mockResolvedValue({ count: 0 });

      const mockPrisma = {
        user: {
          findUnique: mockFindUnique,
          create: mockCreate,
          update: mockUpdate,
          updateMany: mockUpdateMany,
        },
      } as unknown as PrismaClient;

      await ensureSoleAdminUser(mockPrisma);

      expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: 'contact@imakshay.in' } });
      expect(mockCreate).not.toHaveBeenCalled(); // NO duplicate created!
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate.mock.calls[0][0].data.role).toBe(UserRole.ADMIN);
      expect(mockUpdate.mock.calls[0][0].data.status).toBe(UserStatus.ACTIVE);
    });

    it('demotes any other admin user so only contact@imakshay.in has ADMIN role', async () => {
      const mockFindUnique = vi.fn().mockResolvedValue({
        id: 'admin-existing-1',
        email: 'contact@imakshay.in',
        role: UserRole.ADMIN,
      });
      const mockUpdate = vi.fn().mockResolvedValue({});
      const mockUpdateMany = vi.fn().mockResolvedValue({ count: 2 }); // 2 unauthorized/duplicate admins demoted

      const mockPrisma = {
        user: {
          findUnique: mockFindUnique,
          update: mockUpdate,
          updateMany: mockUpdateMany,
        },
      } as unknown as PrismaClient;

      await ensureSoleAdminUser(mockPrisma);

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          role: UserRole.ADMIN,
          email: { not: 'contact@imakshay.in' },
        },
        data: {
          role: UserRole.USER,
        },
      });
    });
  });
});

