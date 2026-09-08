import { FinanceApiClient } from '@finance/api-client';
import { secureStorage } from './secureStorage';

const getBaseUrl = (): string => {
  // Mobile client endpoint pointing to the backend /api/v1
  const envUrl = process.env.API_URL || process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }
  return 'http://localhost:4000/api/v1';
};

export const apiClient = new FinanceApiClient({
  baseURL: getBaseUrl(),
  getAccessToken: () => secureStorage.getAccessToken(),
  setAccessToken: async (token: string | null) => {
    if (token) {
      await secureStorage.updateAccessToken(token);
    } else {
      await secureStorage.clearTokens();
    }
  },
  onUnauthorized: () => {
    void secureStorage.clearTokens();
  },
});
