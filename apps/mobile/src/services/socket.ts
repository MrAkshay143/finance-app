import { FinanceSocketManager } from '@finance/api-client';
import { secureStorage } from './secureStorage';

const getSocketUrl = (): string => {
  const envUrl = process.env.API_URL || process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/v1\/?$/, '');
  }
  return 'https://finance.imakshay.in';
};

export const socketManager = new FinanceSocketManager({
  url: getSocketUrl(),
  getAccessToken: () => secureStorage.getAccessToken(),
});
