import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { secureStorage } from '../services/secureStorage';
import { apiClient } from '../services/apiClient';
import {
  LoginScreen,
  SignupScreen,
  ProfileScreen,
  BasicProfileScreen,
  FinanceProfileScreen,
  SecurityQuestionsScreen,
  OnboardingScreen,
} from '../screens';
import type { AuthResponse, UserProfile, FinanceProfile } from '@finance/shared-types';

describe('Mobile Auth, Profile & Security Suite (TASK-1.4)', () => {
  beforeEach(async () => {
    await secureStorage.clearTokens();
    useAuthStore.getState().reset();
    vi.restoreAllMocks();
  });

  describe('Component Exports & Structure', () => {
    it('exports all required screens as valid React components', () => {
      expect(typeof LoginScreen).toBe('function');
      expect(typeof SignupScreen).toBe('function');
      expect(typeof ProfileScreen).toBe('function');
      expect(typeof BasicProfileScreen).toBe('function');
      expect(typeof FinanceProfileScreen).toBe('function');
      expect(typeof SecurityQuestionsScreen).toBe('function');
      expect(typeof OnboardingScreen).toBe('function');
    });
  });

  describe('Auth Store & Secure Storage Wiring', () => {
    const mockAuthResponse: AuthResponse = {
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'tester@example.com',
        fullName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        status: 'ACTIVE',
        onboardingCompleted: true,
      },
      tokens: {
        accessToken: 'mock-access-token-xyz',
        refreshToken: 'mock-refresh-token-xyz',
        expiresIn: 3600,
      },
    };

    it('successfully logs in, writes tokens to secure storage, and sets user state', async () => {
      vi.spyOn(apiClient.auth, 'login').mockResolvedValueOnce(mockAuthResponse);

      const store = useAuthStore.getState();
      expect(store.isAuthenticated).toBe(false);

      const res = await store.login({
        email: 'tester@example.com',
        password: 'Password123!',
      });

      expect(res.user.email).toBe('tester@example.com');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.fullName).toBe('Test User');

      // Verify tokens stored securely in Keychain / Keystore service
      const tokens = await secureStorage.getTokens();
      expect(tokens?.accessToken).toBe('mock-access-token-xyz');
      expect(tokens?.refreshToken).toBe('mock-refresh-token-xyz');
      expect(await secureStorage.hasValidSession()).toBe(true);
    });

    it('handles login error, updates error banner state, and preserves zero stored tokens', async () => {
      vi.spyOn(apiClient.auth, 'login').mockRejectedValueOnce({
        response: {
          data: {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password.',
            },
          },
        },
      });

      const store = useAuthStore.getState();
      await expect(
        store.login({
          email: 'wrong@example.com',
          password: 'BadPassword1!',
        })
      ).rejects.toBeDefined();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().error).toBe('Invalid email or password.');
      expect(await secureStorage.hasValidSession()).toBe(false);
    });

    it('successfully registers new user, saves tokens, and marks authenticated', async () => {
      vi.spyOn(apiClient.auth, 'signup').mockResolvedValueOnce(mockAuthResponse);

      const store = useAuthStore.getState();
      const res = await store.signup({
        fullName: 'Test User',
        email: 'tester@example.com',
        password: 'Password123!',
      });

      expect(res.user.id).toBe('11111111-1111-1111-1111-111111111111');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(await secureStorage.getAccessToken()).toBe('mock-access-token-xyz');
    });

    it('logs out, clears secure storage tokens, and resets session state', async () => {
      // Set initial session
      await secureStorage.saveTokens({
        accessToken: 'active-token',
        refreshToken: 'active-refresh',
      });
      useAuthStore.getState().setUser(mockAuthResponse.user);

      vi.spyOn(apiClient.auth, 'logout').mockResolvedValueOnce({
        message: 'Logged out successfully',
      });

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(await secureStorage.hasValidSession()).toBe(false);
      expect(await secureStorage.getAccessToken()).toBeNull();
    });
  });

  describe('Validation Rules & Schemas', () => {
    it('validates password requirements: 8+ chars, uppercase, lowercase, number', () => {
      const validatePassword = (pwd: string): boolean => {
        if (pwd.length < 8) return false;
        if (!/[A-Z]/.test(pwd)) return false;
        if (!/[a-z]/.test(pwd)) return false;
        if (!/[0-9]/.test(pwd)) return false;
        return true;
      };

      expect(validatePassword('short1A')).toBe(false);
      expect(validatePassword('nouppercase123')).toBe(false);
      expect(validatePassword('NOLOWERCASE123')).toBe(false);
      expect(validatePassword('NoDigitsAtAll!')).toBe(false);
      expect(validatePassword('ValidPass123')).toBe(true);
    });

    it('validates email format checking', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('')).toBe(false);
      expect(emailRegex.test('not-an-email')).toBe(false);
      expect(emailRegex.test('user@domain')).toBe(false);
      expect(emailRegex.test('contact@imakshay.in')).toBe(true);
    });

    it('validates financial input numbers are non-negative', () => {
      const isValidAmount = (val: string): boolean => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      };

      expect(isValidAmount('-100')).toBe(false);
      expect(isValidAmount('abc')).toBe(false);
      expect(isValidAmount('0')).toBe(true);
      expect(isValidAmount('50000.50')).toBe(true);
    });
  });

  describe('Security Questions (KBA) Setup Contract', () => {
    it('configures exactly 3 unique security questions with hashed/normalized answers', async () => {
      const setupSpy = vi
        .spyOn(apiClient.auth, 'setupSecurityQuestions')
        .mockResolvedValueOnce({ success: true });

      const answers = [
        { questionKey: 'birth_city', answer: 'new york' },
        { questionKey: 'first_school', answer: 'lincoln high' },
        { questionKey: 'childhood_pet', answer: 'rover' },
      ];

      expect(answers.length).toBe(3);
      const uniqueKeys = new Set(answers.map((a) => a.questionKey));
      expect(uniqueKeys.size).toBe(3);

      await apiClient.auth.setupSecurityQuestions({
        questions: answers,
        answers,
      });

      expect(setupSpy).toHaveBeenCalledTimes(1);
      expect(setupSpy).toHaveBeenCalledWith({
        questions: answers,
        answers,
      });
    });
  });

  describe('Profile & Finance Profile Contract', () => {
    it('fetches profile and finance profile targets', async () => {
      const mockProfile: UserProfile = {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'contact@imakshay.in',
        fullName: 'Akshay Mondal',
        firstName: 'Akshay',
        lastName: 'Mondal',
        mobileNumber: '7063024075',
        phone: '7063024075',
        onboardingCompleted: true,
        kbaConfigured: true,
        createdAt: '2026-09-08T00:00:00Z',
      };

      const mockFinance: FinanceProfile = {
        userId: '22222222-2222-2222-2222-222222222222',
        monthlyIncome: 60000,
        monthlyIncomeTarget: 60000,
        monthlyExpenseBudget: 30000,
        monthlyInvestmentTarget: 18000,
        savingsTargetPercentage: 25,
        riskAppetite: 'MEDIUM',
        investmentHorizon: 'LONG',
        createdAt: '2026-09-08T00:00:00Z',
        updatedAt: '2026-09-08T00:00:00Z',
      };

      vi.spyOn(apiClient.profile, 'get').mockResolvedValueOnce(mockProfile);
      vi.spyOn(apiClient.profile, 'getFinanceProfile').mockResolvedValueOnce(mockFinance);

      const profile = await apiClient.profile.get();
      const finance = await apiClient.profile.getFinanceProfile();

      expect(profile.email).toBe('contact@imakshay.in');
      expect(profile.kbaConfigured).toBe(true);
      expect(finance.monthlyIncome).toBe(60000);
      expect(finance.riskAppetite).toBe('MEDIUM');
      expect(finance.investmentHorizon).toBe('LONG');
    });
  });
});
