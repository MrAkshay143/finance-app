import { FinanceSocketManager } from '@finance/api-client';
import { getSocketBaseUrl } from '../config/env.js';
import { getStoredAccessToken } from '../utils/tokenStorage.js';

let sharedSocketManager: FinanceSocketManager | null = null;

/**
 * Returns the singleton FinanceSocketManager configured with the centralized socket URL.
 */
export function getSocketManager(): FinanceSocketManager {
  if (!sharedSocketManager) {
    sharedSocketManager = new FinanceSocketManager({
      url: getSocketBaseUrl(),
      getAccessToken: () => getStoredAccessToken(),
    });
  }
  return sharedSocketManager;
}

/**
 * Disconnects and resets the shared socket manager (e.g. on logout).
 */
export function resetSocketManager(): void {
  if (sharedSocketManager) {
    sharedSocketManager.disconnectAll();
    sharedSocketManager = null;
  }
}

export const socketService = {
  getManager: getSocketManager,
  reset: resetSocketManager,
};

export default socketService;
