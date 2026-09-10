import { create } from 'zustand';
import type { AuthUser, LoginInput, SignupInput, AuthResponse } from '@finance/shared-types';
import { apiClient } from '../services/apiClient';
import { secureStorage } from '../services/secureStorage';

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (input: LoginInput) => Promise<AuthResponse>;
  signup: (input: SignupInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  reset: () => void;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const hasSession = await secureStorage.hasValidSession();
      if (!hasSession) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Session exists, attempt to fetch current user profile
      const profileRes: any = await apiClient.profile.get();
      const u = profileRes?.user || profileRes?.data?.user || profileRes?.data || profileRes;
      const authUser: AuthUser = {
        id: u?.id || '',
        email: u?.email || '',
        fullName: u?.fullName || `${u?.firstName || ''} ${u?.lastName || ''}`.trim(),
        firstName: u?.firstName || '',
        lastName: u?.lastName || '',
        mobileNumber: u?.mobileNumber ?? u?.phone ?? '',
        role: u?.role ?? 'USER',
        status: u?.status ?? 'ACTIVE',
        avatarUrl: u?.avatarUrl ?? null,
        onboardingCompleted: Boolean(u?.onboardingCompleted ?? profileRes?.onboardingCompleted),
      };

      set({ user: authUser, isAuthenticated: true, isLoading: false });
    } catch {
      // Check local session validity if remote profile fetch fails or device is offline
      const hasToken = await secureStorage.hasValidSession();
      set({ isAuthenticated: hasToken, isLoading: false });
    }
  },

  login: async (input: LoginInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.auth.login(input);
      await secureStorage.saveTokens(response.tokens);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return response;
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Login failed. Please check your credentials.';
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw err;
    }
  },

  signup: async (input: SignupInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.auth.signup(input);
      await secureStorage.saveTokens(response.tokens);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return response;
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Registration failed. Please review your inputs.';
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiClient.auth.logout();
    } catch {
      // Ignore network errors during logout so local session always clears
    } finally {
      await secureStorage.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  reset: () => set({ user: null, isAuthenticated: false, isLoading: false, error: null }),
  clearError: () => set({ error: null }),
  setUser: (user: AuthUser | null) => set({ user, isAuthenticated: Boolean(user) }),
}));
