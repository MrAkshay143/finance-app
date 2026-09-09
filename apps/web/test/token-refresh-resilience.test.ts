import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_STORAGE_KEY,
  KBA_STORAGE_KEY,
  getStoredAccessToken,
  setStoredAccessToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
  clearStoredTokens,
  getStoredUser,
  saveUserCache,
  getStoredKba,
  saveKbaCache,
} from '../src/utils/tokenStorage.js';
import { apiClient } from '../src/services/apiClient.js';
import { FinanceApiClient } from '@finance/api-client';
import type { AuthUser } from '@finance/shared-types';

class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('Token Storage & Refresh Resilience Test Suite', () => {
  const dummyUser: AuthUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'user@example.com',
    fullName: 'Test User',
    role: 'USER',
    status: 'ACTIVE',
    avatarUrl: null,
    onboardingCompleted: true,
  };

  beforeEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Token & User Storage Helper Isolation', () => {
    it('stores and retrieves access tokens correctly in localStorage and sessionStorage', () => {
      expect(getStoredAccessToken()).toBeNull();

      setStoredAccessToken('access-token-123', true);
      expect(mockLocalStorage.getItem(TOKEN_KEY)).toBe('access-token-123');
      expect(getStoredAccessToken()).toBe('access-token-123');

      setStoredAccessToken(null);
      expect(getStoredAccessToken()).toBeNull();

      // Session storage variant
      setStoredAccessToken('access-session-123', false);
      expect(mockSessionStorage.getItem(TOKEN_KEY)).toBe('access-session-123');
      expect(getStoredAccessToken()).toBe('access-session-123');
    });

    it('stores and retrieves refresh tokens correctly in localStorage and sessionStorage', () => {
      expect(getStoredRefreshToken()).toBeNull();

      setStoredRefreshToken('refresh-token-456', true);
      expect(mockLocalStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-token-456');
      expect(getStoredRefreshToken()).toBe('refresh-token-456');

      setStoredRefreshToken(null);
      expect(getStoredRefreshToken()).toBeNull();

      setStoredRefreshToken('refresh-session-456', false);
      expect(mockSessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-session-456');
      expect(getStoredRefreshToken()).toBe('refresh-session-456');
    });

    it('clears all stored tokens correctly', () => {
      setStoredAccessToken('access-123');
      setStoredRefreshToken('refresh-456');
      expect(getStoredAccessToken()).toBe('access-123');
      expect(getStoredRefreshToken()).toBe('refresh-456');

      clearStoredTokens();
      expect(getStoredAccessToken()).toBeNull();
      expect(getStoredRefreshToken()).toBeNull();
    });

    it('persists and retrieves user cache and kba cache without throwing', () => {
      expect(getStoredUser()).toBeNull();
      expect(getStoredKba()).toBe(false);

      saveUserCache(dummyUser, true);
      saveKbaCache(true, true);

      expect(getStoredUser()).toEqual(dummyUser);
      expect(getStoredKba()).toBe(true);

      saveUserCache(null);
      saveKbaCache(false);
      expect(getStoredUser()).toBeNull();
      expect(getStoredKba()).toBe(false);
    });
  });

  describe('2. Circular Dependency Resolution in apiClient', () => {
    it('apiClient re-exports storage helpers without circular import error', () => {
      expect(apiClient).toBeDefined();
      expect(apiClient.rawAxios).toBeDefined();
      expect(getStoredAccessToken).toBeTypeOf('function');
      expect(getStoredRefreshToken).toBeTypeOf('function');
    });
  });

  describe('3. ApiClient 401 Refresh with Refresh Token in Body', () => {
    it('FinanceApiClient includes storedRefreshToken in POST /auth/refresh request', async () => {
      let capturedRefreshBody: any = null;
      let setRefreshTokenCalledWith: string | null = null;
      let setAccessTokenCalledWith: string | null = null;

      const mockClient = new FinanceApiClient({
        baseURL: 'http://localhost:3000/api/v1',
        getAccessToken: () => 'expired-token',
        setAccessToken: (t) => {
          setAccessTokenCalledWith = t;
        },
        getRefreshToken: () => 'stored-valid-refresh-token',
        setRefreshToken: (t) => {
          setRefreshTokenCalledWith = t;
        },
      });

      // Spy on rawAxios post
      vi.spyOn(mockClient.rawAxios, 'post').mockImplementation(async (url: string, data?: any) => {
        if (url === '/auth/refresh') {
          capturedRefreshBody = data;
          return {
            status: 200,
            data: {
              success: true,
              data: {
                user: dummyUser,
                tokens: {
                  accessToken: 'new-access-token',
                  refreshToken: 'new-rotated-refresh-token',
                  expiresIn: 3600,
                },
              },
            },
          } as any;
        }
        return { status: 200, data: { success: true } } as any;
      });

      // Mock client itself when invoked for retry
      vi.spyOn(mockClient.rawAxios, 'request').mockResolvedValue({
        status: 200,
        data: { success: true, data: [] },
      } as any);

      // Simulate 401 intercepted retry call
      const dummyError = {
        config: { headers: {}, url: 'http://localhost:3000/api/v1/transactions' },
        response: { status: 401 },
      };

      // Call response interceptor error handler
      const responseInterceptor = (mockClient.rawAxios.interceptors.response as any).handlers[0];

      // Invoke error handler
      try {
        await responseInterceptor.rejected(dummyError);
      } catch {
        // May reject or resolve depending on client invoke mock
      }

      expect(capturedRefreshBody).toEqual({ refreshToken: 'stored-valid-refresh-token' });
      expect(setAccessTokenCalledWith).toBe('new-access-token');
      expect(setRefreshTokenCalledWith).toBe('new-rotated-refresh-token');
    });
  });
});
