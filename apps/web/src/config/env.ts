export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && (window as any).__FINANCE_API_URL__) {
    return `${(window as any).__FINANCE_API_URL__.replace(/\/$/, '')}/api/v1`;
  }
  if (typeof window !== 'undefined') {
    const customApi = localStorage.getItem('FINANCE_API_URL');
    if (customApi) {
      return `${customApi.replace(/\/$/, '')}/api/v1`;
    }
  }
  if (import.meta.env?.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/v1`;
  }
  return '/api/v1';
}

export const getApiBase = getApiBaseUrl;
