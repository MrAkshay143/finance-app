import type { AuthUser } from '@finance/shared-types';

export const TOKEN_KEY = 'finance_access_token';
export const REFRESH_TOKEN_KEY = 'finance_refresh_token';
export const USER_STORAGE_KEY = 'finance_user_cache';
export const KBA_STORAGE_KEY = 'finance_kba_cache';

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
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(KBA_STORAGE_KEY);
    sessionStorage.removeItem(KBA_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY) || sessionStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveUserCache(user: AuthUser | null, remember = true): void {
  try {
    if (user) {
      const serialized = JSON.stringify(user);
      if (remember) {
        localStorage.setItem(USER_STORAGE_KEY, serialized);
      } else {
        sessionStorage.setItem(USER_STORAGE_KEY, serialized);
      }
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getStoredKba(): boolean {
  try {
    const raw = localStorage.getItem(KBA_STORAGE_KEY) || sessionStorage.getItem(KBA_STORAGE_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
}

export function saveKbaCache(kba: boolean, remember = true): void {
  try {
    if (remember) {
      localStorage.setItem(KBA_STORAGE_KEY, String(kba));
    } else {
      sessionStorage.setItem(KBA_STORAGE_KEY, String(kba));
    }
  } catch {
    // Ignore storage errors
  }
}
