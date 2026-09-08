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
      const profile = await apiClient.profile.get();
      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        firstName: profile.firstName,
        lastName: profile.lastName,
        mobileNumber: profile.mobileNumber ?? profile.phone,
        role: (profile as any).role ?? 'USER',
        status: 'ACTIVE',
        avatarUrl: profile.avatarUrl,
        onboardingCompleted: profile.onboardingCompleted,
      };

      set({ user: authUser, isAuthenticated: true, isLoading: false });
    } catch {
      // In case of profile fetch failure or offline session
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
      // Fallback: ignore network failures on logout
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
