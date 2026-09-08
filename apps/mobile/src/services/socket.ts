import { FinanceSocketManager } from '@finance/api-client';
import { secureStorage } from './secureStorage';

const getSocketUrl = (): string => {
  const envUrl = process.env.API_URL || process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/v1\/?$/, '');
  }
  return 'http://localhost:4000';
};

export const socketManager = new FinanceSocketManager({
  url: getSocketUrl(),
  getAccessToken: () => secureStorage.getAccessToken(),
});
