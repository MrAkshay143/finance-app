import React from 'react';
import { QueryClient, QueryClientContext } from '@tanstack/react-query';

const defaultFallbackClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

/**
 * Returns the QueryClient from QueryClientProvider context,
 * or a fallback QueryClient when rendering in tests/SSR where Provider is omitted.
 */
export function useSafeQueryClient(): QueryClient {
  const client = React.useContext(QueryClientContext);
  return client || defaultFallbackClient;
}
