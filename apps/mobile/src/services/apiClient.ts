import { FinanceApiClient } from '@finance/api-client';
import { secureStorage } from './secureStorage';
import { getBaseUrl } from '../config/env';

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
