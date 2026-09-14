import { FinanceSocketManager } from '@finance/api-client';
import { secureStorage } from './secureStorage';
import { getSocketUrl } from '../config/env';

export const socketManager = new FinanceSocketManager({
  url: getSocketUrl(),
  getAccessToken: () => secureStorage.getAccessToken(),
});
