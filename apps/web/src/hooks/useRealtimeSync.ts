import { useEffect, useRef } from 'react';
import { FinanceSocketManager } from '@finance/api-client';
import { getStoredAccessToken } from '../utils/tokenStorage.js';
import { handleSilentSyncEvent, syncAllFinanceData } from '../services/dataSync.js';
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
 * Socket.IO namespace and synchronizes affected TanStack queries on mutation signals.
 *
 * F3 fix: On reconnect after a drop, we trigger a full sync so any mutations missed
 * during the disconnect window are caught up. The first connect is skipped via the
 * isInitialConnect flag to avoid duplicating the connect-time sync.
 */
export function useRealtimeSync(): void {
  const queryClient = useSafeQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    let isInitialConnect = true; // skip catch-up sync on first connect

    const onIncomingEvent = (eventData?: any) => {
      // Coalesce rapid successive events into a single surgical sync pass
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        handleSilentSyncEvent(queryClient, eventData).catch(() => {});
        debounceTimerRef.current = null;
      }, 150);
    };

    const onReconnect = () => {
      if (isInitialConnect) {
        // First connect is handled by the surrounding page load — skip catch-up
        isInitialConnect = false;
        return;
      }
      // Reconnect after a drop: pull everything fresh so missed mutations are caught up
      syncAllFinanceData(queryClient).catch(() => {});
    };

    socketManager
      .connectDashboard(onIncomingEvent)
      .then((socket) => {
        activeSocket = socket;
        socket.on('sync:event', onIncomingEvent);
        // Register reconnect handler — fires on every subsequent connect event
        socket.on('connect', onReconnect);
        // Mark initial connect as done after we attach the listener
        isInitialConnect = false;
      })
      .catch(() => {
        // Socket connection silent failover
      });

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (activeSocket) {
        activeSocket.off('dashboard:refresh', onIncomingEvent);
        activeSocket.off('sync:event', onIncomingEvent);
        activeSocket.off('connect', onReconnect);
      }
      socketManager.disconnectAll();
    };
  }, [isAuthenticated, queryClient]);
}

