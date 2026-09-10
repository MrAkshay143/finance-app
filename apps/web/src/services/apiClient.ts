import { FinanceApiClient } from '@finance/api-client';
import { useMaintenanceStore } from '../store/maintenanceStore.js';
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
} from '../utils/tokenStorage.js';

export {
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
};

export { getFriendlyErrorMessage } from '@finance/api-client';

function getApiBase(): string {
  if (typeof window !== 'undefined' && (window as any).__FINANCE_API_URL__) {
    return `${(window as any).__FINANCE_API_URL__.replace(/\/$/, '')}/api/v1`;
  }
  if (typeof window !== 'undefined') {
    const customApi = localStorage.getItem('FINANCE_API_URL');
    if (customApi) {
      return `${customApi.replace(/\/$/, '')}/api/v1`;
    }
  }
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/v1`;
  }
  return '/api/v1';
}

export const apiClient = new FinanceApiClient({
  baseURL: getApiBase(),
  getAccessToken: () => getStoredAccessToken(),
  setAccessToken: (token: string | null) => {
    setStoredAccessToken(token);
  },
  getRefreshToken: () => getStoredRefreshToken(),
  setRefreshToken: (token: string | null) => {
    setStoredRefreshToken(token);
  },
  onUnauthorized: () => {
    clearStoredTokens();
    saveUserCache(null);
    saveKbaCache(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('finance-auth-storage');
        localStorage.removeItem('finance_user_cache');
        sessionStorage.removeItem('finance_user_cache');
      } catch {
        // Ignore storage access errors
      }
      const currentPath = window.location.pathname;
      if (
        !currentPath.startsWith('/login') &&
        !currentPath.startsWith('/signup') &&
        !currentPath.startsWith('/forgot-password')
      ) {
        window.location.href = `/login?reason=session_expired&from=${encodeURIComponent(currentPath)}`;
      }
    }
  },
});

// Maintenance mode response interception
apiClient.rawAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 503 &&
      error?.response?.data?.error?.code === 'MAINTENANCE_MODE'
    ) {
      try {
        const userRole = getStoredUser()?.role;
        if (userRole !== 'ADMIN') {
          const msg = error.response?.data?.error?.message;
          useMaintenanceStore.getState().setMaintenance(true, msg);
        }
      } catch {
        // Ignore store access errors
      }
    }
    return Promise.reject(error);
  }
);
