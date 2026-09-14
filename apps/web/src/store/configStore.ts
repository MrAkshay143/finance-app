import { create } from 'zustand';
import { apiClient } from '../services/apiClient.js';

export interface PublicAppConfig {
  platformName: string;
  supportEmail: string;
  allowUserRegistration: boolean;
  pwaInstallEnabled: boolean;
  maintenanceMode: boolean;
  defaultBaseCurrency: string;
  defaultCountry: string;
}

interface ConfigState extends PublicAppConfig {
  isLoaded: boolean;
  fetchConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  platformName: 'Finance Tracker',
  supportEmail: 'support@imakshay.in',
  allowUserRegistration: true,
  pwaInstallEnabled: true,
  maintenanceMode: false,
  defaultBaseCurrency: 'INR',
  defaultCountry: 'IN',
  isLoaded: false,
  fetchConfig: async () => {
    try {
      const response = await apiClient.publicConfig.get();
      // Handle unwrapped payload or raw Axios response
      const cfg = (response as any)?.data?.data || (response as any)?.data || response;
      if (cfg && typeof cfg === 'object') {
        const platformName = cfg.platformName || 'Finance Tracker';
        const supportEmail = cfg.supportEmail || 'support@imakshay.in';
        const allowUserRegistration = cfg.allowUserRegistration ?? true;
        const pwaInstallEnabled = cfg.pwaInstallEnabled ?? true;
        const maintenanceMode = Boolean(cfg.maintenanceMode);
        const defaultBaseCurrency = cfg.defaultBaseCurrency || 'INR';
        const defaultCountry = cfg.defaultCountry || 'IN';

        set({
          platformName,
          supportEmail,
          allowUserRegistration,
          pwaInstallEnabled,
          maintenanceMode,
          defaultBaseCurrency,
          defaultCountry,
          isLoaded: true,
        });

        // Update document title dynamically
        if (typeof document !== 'undefined' && platformName) {
          document.title = platformName;
        }
      }
    } catch (err) {
      console.error('Failed to fetch public config', err);
    }
  },
}));

/**
 * Convenience hook for accessing centralized platform config anywhere in React.
 */
export function useAppConfig(): ConfigState {
  return useConfigStore();
}
