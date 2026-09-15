import { useEffect, useRef } from 'react';
import { FinanceSocketManager } from '@finance/api-client';
import { getStoredAccessToken } from '../utils/tokenStorage.js';
import { handleSilentSyncEvent, syncAllFinanceData } from '../services/dataSync.js';
import { useAuthStore } from '../store/authStore.js';
import { useSafeQueryClient } from './useSafeQueryClient.js';

export { getSocketBaseUrl } from '../config/env.js';
import { getSocketManager } from '../services/socketService.js';

// Maintains real-time Socket.IO sync for TanStack queries with reconnect catch-up.
export function useRealtimeSync(): void {
  const queryClient = useSafeQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socketManager = getSocketManager();

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
      .catch(() => {});

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


