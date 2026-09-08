import { FinanceApiClient } from '@finance/api-client';

const TOKEN_KEY = 'finance_access_token';
const REFRESH_TOKEN_KEY = 'finance_refresh_token';

export function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAccessToken(token: string | null, remember = true): void {
  try {
    if (token) {
      if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
      }
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredRefreshToken(token: string | null, remember = true): void {
  try {
    if (token) {
      if (remember) {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
      }
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredTokens(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Ignore storage errors
  }
}

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/v1`
  : '/api/v1';

export const apiClient = new FinanceApiClient({
  baseURL: apiBase,
  getAccessToken: () => getStoredAccessToken(),
  setAccessToken: (token: string | null) => {
    setStoredAccessToken(token);
  },
  onUnauthorized: () => {
    clearStoredTokens();
  },
});
