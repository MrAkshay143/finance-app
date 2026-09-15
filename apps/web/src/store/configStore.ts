import { create } from 'zustand';
import { apiClient } from '../services/apiClient.js';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
}

export interface PublicAppConfig {
  platformName: string;
  supportEmail: string;
  allowUserRegistration: boolean;
  pwaInstallEnabled: boolean;
  maintenanceMode: boolean;
  defaultBaseCurrency: string;
  defaultCountry: string;
  passwordPolicy: PasswordPolicy;
}

const defaultPasswordPolicy: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: false,
};

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
  passwordPolicy: defaultPasswordPolicy,
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

        // Merge server policy with safe defaults — server wins on any truthy override
        const rawPolicy = cfg.passwordPolicy;
        const passwordPolicy: PasswordPolicy = rawPolicy && typeof rawPolicy === 'object'
          ? {
              minLength: typeof rawPolicy.minLength === 'number' ? rawPolicy.minLength : defaultPasswordPolicy.minLength,
              requireUppercase: rawPolicy.requireUppercase ?? defaultPasswordPolicy.requireUppercase,
              requireLowercase: rawPolicy.requireLowercase ?? defaultPasswordPolicy.requireLowercase,
              requireDigit: rawPolicy.requireDigit ?? defaultPasswordPolicy.requireDigit,
              requireSpecial: rawPolicy.requireSpecial ?? defaultPasswordPolicy.requireSpecial,
            }
          : defaultPasswordPolicy;

        set({
          platformName,
          supportEmail,
          allowUserRegistration,
          pwaInstallEnabled,
          maintenanceMode,
          defaultBaseCurrency,
          defaultCountry,
          passwordPolicy,
          isLoaded: true,
        });

        if (typeof document !== 'undefined' && platformName) {
          document.title = platformName;
        }
      }
    } catch (err) {
      console.error('Failed to fetch public config', err);
    }
  },
}));

// Convenience hook for accessing centralized platform config.
export function useAppConfig(): ConfigState {
  return useConfigStore();
}
