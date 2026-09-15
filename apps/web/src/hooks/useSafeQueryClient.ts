import React from 'react';
import { QueryClient, QueryClientContext } from '@tanstack/react-query';
import { queryClient as rootQueryClient } from '../queries/queryClient.js';

// Returns QueryClient from context or falls back to root QueryClient.
export function useSafeQueryClient(): QueryClient {
  const client = React.useContext(QueryClientContext);
  return client || rootQueryClient;
}

