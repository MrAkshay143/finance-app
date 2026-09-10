import React from 'react';
import { QueryClient, QueryClientContext } from '@tanstack/react-query';
import { queryClient as rootQueryClient } from '../queries/queryClient.js';

/**
 * Returns the QueryClient from QueryClientProvider context,
 * or the canonical root QueryClient when rendering where Provider context is omitted.
 */
export function useSafeQueryClient(): QueryClient {
  const client = React.useContext(QueryClientContext);
  return client || rootQueryClient;
}

