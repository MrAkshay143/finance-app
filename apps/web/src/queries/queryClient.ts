import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient instance with production finance caching defaults:
 * - staleTime: 60s (eliminates duplicate fetches on route navigation)
 * - gcTime: 10m (retains query caches during session transitions)
 * - refetchOnWindowFocus: false (avoids disruptive focus storms, relies on WebSockets)
 * - refetchOnReconnect: true (ensures freshness when regaining connectivity)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});
