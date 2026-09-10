import { createStore } from 'zustand/vanilla';
import { useSyncExternalStore } from 'react';
import type {
  AuthUser,
  AuthTokens,
  LoginInput,
  SignupInput,
  AuthResponse,
} from '@finance/shared-types';
import { apiClient } from '../services/apiClient.js';
import {
  getStoredAccessToken,
  setStoredAccessToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
  clearStoredTokens,
  getStoredUser,
  saveUserCache,
  getStoredKba,
  saveKbaCache,
} from '../utils/tokenStorage.js';
import { queryClient } from '../queries/queryClient.js';


export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  kbaConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  lockoutUntil: number | null; // Timestamp in ms when lockout ends

  // Actions
  login: (credentials: LoginInput, rememberMe?: boolean) => Promise<AuthResponse>;
  signup: (input: SignupInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => void;
  setKbaConfigured: (configured: boolean) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearError: () => void;
  setAuth: (user: AuthUser, tokens: AuthTokens, kbaConfigured?: boolean) => void;
  reset: () => void;
}

const initialToken = getStoredAccessToken();
const initialUser = getStoredUser();
const initialKba = getStoredKba();

export const authStore = createStore<AuthState>((set, get) => ({
  user: initialUser,
  tokens: initialToken ? ({ accessToken: initialToken, refreshToken: '', expiresIn: 3600 } as AuthTokens) : null,
  isAuthenticated: Boolean(initialUser),
  onboardingCompleted: initialUser?.onboardingCompleted ?? false,
  kbaConfigured: initialKba,
  isLoading: false,
  error: null,
  lockoutUntil: null,

  login: async (credentials: LoginInput, rememberMe = true) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.auth.login(credentials);
      const user = res.user;
      const tokens = res.tokens;

      setStoredAccessToken(tokens.accessToken, rememberMe);
      setStoredRefreshToken(tokens.refreshToken, rememberMe);
      saveUserCache(user, rememberMe);

      const onboardingCompleted = Boolean(user.onboardingCompleted);

      set({
        user,
        tokens,
        isAuthenticated: true,
        onboardingCompleted,
        isLoading: false,
        error: null,
        lockoutUntil: null,
      });

      // Fetch profile to verify KBA setup status in background
      get().fetchProfile().catch(() => {});

      return res;
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please check your credentials.';

      let lockoutUntil: number | null = null;
      if (
        err?.response?.status === 429 ||
        message.toLowerCase().includes('locked') ||
        message.toLowerCase().includes('too many failed')
      ) {
        lockoutUntil = Date.now() + 15 * 60 * 1000;
      }

      set({
        isLoading: false,
        error: message,
        lockoutUntil,
      });
      throw err;
    }
  },

  signup: async (input: SignupInput) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiClient.auth.signup(input);
      const user = res.user;
      const tokens = res.tokens;

      setStoredAccessToken(tokens.accessToken, true);
      setStoredRefreshToken(tokens.refreshToken, true);
      saveUserCache(user, true);

      set({
        user,
        tokens,
        isAuthenticated: true,
        onboardingCompleted: Boolean(user.onboardingCompleted),
        kbaConfigured: false,
        isLoading: false,
        error: null,
        lockoutUntil: null,
      });

      return res;
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please check your details.';

      set({
        isLoading: false,
        error: message,
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      queryClient.clear(); // evict all cached data to prevent cross-user data leakage
      clearStoredTokens();
      saveUserCache(null);
      saveKbaCache(false);
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        onboardingCompleted: false,
        kbaConfigured: false,
        isLoading: false,
        error: null,
        lockoutUntil: null,
      });
    }
  },


  fetchProfile: async () => {
    try {
      const profileData = await apiClient.profile.get();
      if (profileData) {
        const u = profileData.user;
        const kba = Boolean(profileData.kbaConfigured);
        const onboarded = Boolean(profileData.onboardingCompleted ?? u?.onboardingCompleted);

        saveKbaCache(kba);
        if (u) {
          saveUserCache(u);
        }

        set((state) => ({
          user: u ? { ...state.user, ...u } : state.user,
          kbaConfigured: kba,
          onboardingCompleted: onboarded,
        }));
      }
    } catch {
      // Silent catch on background profile fetch
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      await get().fetchProfile();
      set({ isAuthenticated: true, isLoading: false });
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  setOnboardingCompleted: (completed: boolean) => {
    set((state) => {
      const updatedUser = state.user
        ? { ...state.user, onboardingCompleted: completed }
        : null;
      if (updatedUser) {
        saveUserCache(updatedUser);
      }
      return {
        onboardingCompleted: completed,
        user: updatedUser,
      };
    });
  },

  setKbaConfigured: (configured: boolean) => {
    saveKbaCache(configured);
    set({ kbaConfigured: configured });
  },

  updateUser: (updates: Partial<AuthUser>) => {
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...updates };
      saveUserCache(updated);
      return { user: updated };
    });
  },

  clearError: () => set({ error: null }),

  setAuth: (user: AuthUser, tokens: AuthTokens, kbaConfigured = false) => {
    setStoredAccessToken(tokens.accessToken, true);
    setStoredRefreshToken(tokens.refreshToken, true);
    saveUserCache(user, true);
    saveKbaCache(kbaConfigured, true);
    set({
      user,
      tokens,
      isAuthenticated: true,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      kbaConfigured,
      isLoading: false,
      error: null,
      lockoutUntil: null,
    });
  },

  reset: () => {
    queryClient.clear(); // evict cached data on forced reset / session expiry
    clearStoredTokens();
    saveUserCache(null);
    saveKbaCache(false);
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      onboardingCompleted: false,
      kbaConfigured: false,
      isLoading: false,
      error: null,
      lockoutUntil: null,
    });
  },

}));

export function useAuthStore(): AuthState;
export function useAuthStore<T>(selector: (state: AuthState) => T): T;
export function useAuthStore<T = AuthState>(selector?: (state: AuthState) => T): T {
  return useSyncExternalStore(
    authStore.subscribe,
    () => (selector ? selector(authStore.getState()) : (authStore.getState() as any)),
    () => (selector ? selector(authStore.getState()) : (authStore.getState() as any))
  );
}

useAuthStore.getState = authStore.getState;
useAuthStore.setState = authStore.setState;
useAuthStore.subscribe = authStore.subscribe;

