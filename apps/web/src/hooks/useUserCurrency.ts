import { useQuery } from '@tanstack/react-query';
import { useSafeQueryClient } from './useSafeQueryClient.js';
import { apiClient } from '../services/apiClient.js';
import { getCurrencySymbol } from '../utils/currency.js';

export function useUserCurrency() {
  const queryClient = useSafeQueryClient();
  const { data: userSettings } = useQuery(
    {
      queryKey: ['userSettings'],
      queryFn: async () => apiClient.settings.get(),
      staleTime: 5 * 60 * 1000,
    },
    queryClient
  );

  const currency = userSettings?.currency || 'INR';
  const symbol = getCurrencySymbol(currency);

  return {
    currency,
    symbol,
    settings: userSettings,
  };
}
