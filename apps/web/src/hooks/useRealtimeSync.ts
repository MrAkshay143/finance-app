import { useEffect } from 'react';
import { FinanceSocketManager } from '@finance/api-client';
import { getStoredAccessToken } from '../utils/tokenStorage.js';
import { syncAllFinanceData } from '../services/dataSync.js';
import { useAuthStore } from '../store/authStore.js';
import { useSafeQueryClient } from './useSafeQueryClient.js';

export function getSocketBaseUrl(): string | undefined {
  if (typeof window !== 'undefined' && (window as any).__FINANCE_API_URL__) {
    return (window as any).__FINANCE_API_URL__.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const customApi = localStorage.getItem('FINANCE_API_URL');
    if (customApi) {
      return customApi.replace(/\/$/, '');
    }
  }
  if ((import.meta as any).env?.VITE_SOCKET_URL) {
    return (import.meta as any).env.VITE_SOCKET_URL.replace(/\/$/, '');
  }
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL.replace(/\/$/, '');
  }
  return typeof window !== 'undefined' ? window.location.origin : undefined;
}

/**
 * Custom hook that maintains a real-time connection to the backend /dashboard
 * Socket.IO namespace and synchronizes all TanStack queries on mutation signals.
 */
export function useRealtimeSync(): void {
  const queryClient = useSafeQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = getStoredAccessToken();
    if (!token) return;

    const socketUrl = getSocketBaseUrl();
    const socketManager = new FinanceSocketManager({
      url: socketUrl,
      getAccessToken: () => getStoredAccessToken(),
    });

    let activeSocket: any = null;

    socketManager
      .connectDashboard(() => {
        // Automatically sync all queries when backend emits 'refresh'
        syncAllFinanceData(queryClient);
      })
      .then((socket) => {
        activeSocket = socket;
        // Also listen for explicit 'dashboard:refresh' event
        socket.on('dashboard:refresh', () => {
          syncAllFinanceData(queryClient);
        });
      })
      .catch(() => {
        // Socket connection silent failover
      });

    return () => {
      if (activeSocket) {
        activeSocket.off('dashboard:refresh');
      }
      socketManager.disconnectAll();
    };
  }, [isAuthenticated, queryClient]);
}
