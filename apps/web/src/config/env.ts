import { resolveServiceUrls, resolveAssetUrl as sharedResolveAssetUrl } from '@finance/api-client';

// Resolves backend origin with precedence: __FINANCE_API_URL__ -> localStorage -> VITE_API_URL -> window.location.origin
export function getBackendOrigin(): string {
  if (typeof window !== 'undefined' && (window as any).__FINANCE_API_URL__) {
    const raw = String((window as any).__FINANCE_API_URL__).trim();
    if (raw) return raw.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
  }
  if (typeof window !== 'undefined') {
    const customApi = localStorage.getItem('FINANCE_API_URL');
    if (customApi && customApi.trim()) {
      return customApi.trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '');
    }
  }
  if (import.meta.env?.VITE_API_URL) {
    const raw = String(import.meta.env.VITE_API_URL).trim();
    if (raw) return raw.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
  }
  return typeof window !== 'undefined' ? window.location.origin : 'https://finance.imakshay.in';
}

// Standardized full REST API Base URL with /api/v1 suffix.
export function getApiBaseUrl(): string {
  const origin = getBackendOrigin();
  return `${origin}/api/v1`;
}

export const getApiBase = getApiBaseUrl;

// Standardized WebSocket Base URL for Socket.IO connections.
export function getSocketBaseUrl(): string {
  if (import.meta.env?.VITE_SOCKET_URL) {
    const raw = String(import.meta.env.VITE_SOCKET_URL).trim();
    if (raw) return raw.replace(/\/+$/, '');
  }
  return getBackendOrigin();
}

// Resolves uploaded assets to full valid URLs using the backend origin.
export function resolveAssetUrl(relativePathOrUrl: string | null | undefined): string | undefined {
  return sharedResolveAssetUrl(relativePathOrUrl, getBackendOrigin());
}

export const APP_ENV = {
  getBackendOrigin,
  getApiBaseUrl,
  getSocketBaseUrl,
  resolveAssetUrl,
};

export default APP_ENV;
