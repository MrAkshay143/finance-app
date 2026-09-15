import { FinanceSocketManager } from '@finance/api-client';
import { getSocketBaseUrl } from '../config/env.js';
import { getStoredAccessToken } from '../utils/tokenStorage.js';

let sharedSocketManager: FinanceSocketManager | null = null;

// Returns singleton FinanceSocketManager configured with centralized socket URL.
export function getSocketManager(): FinanceSocketManager {
  if (!sharedSocketManager) {
    sharedSocketManager = new FinanceSocketManager({
      url: getSocketBaseUrl(),
      getAccessToken: () => getStoredAccessToken(),
    });
  }
  return sharedSocketManager;
}

// Disconnects and resets shared socket manager on logout.
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
