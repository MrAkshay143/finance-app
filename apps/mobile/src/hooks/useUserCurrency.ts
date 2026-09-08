import { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { getCurrencySymbol, SUPPORTED_CURRENCIES } from '@finance/shared-ui-tokens';

let cachedCurrency = 'INR';

export function useUserCurrency() {
  const [currency, setCurrency] = useState<string>(cachedCurrency);

  useEffect(() => {
    let isMounted = true;
    const fetchCurrency = async () => {
      try {
        const settings = await apiClient.settings.get();
        if (settings?.currency && isMounted) {
          cachedCurrency = settings.currency;
          setCurrency(settings.currency);
        }
      } catch {
        // Fallback to cachedCurrency or 'INR'
      }
    };
    void fetchCurrency();
    return () => {
      isMounted = false;
    };
  }, []);

  const symbol = getCurrencySymbol(currency);

  return {
    currency,
    symbol,
  };
}
