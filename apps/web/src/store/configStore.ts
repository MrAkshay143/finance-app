import { create } from 'zustand';
import { apiClient } from '../services/apiClient.js';

interface ConfigState {
  platformName: string;
  supportEmail: string;
  allowUserRegistration: boolean;
  isLoaded: boolean;
  fetchConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  platformName: 'Finance Tracker',
  supportEmail: 'support@imakshay.in',
  allowUserRegistration: true,
  isLoaded: false,
  fetchConfig: async () => {
    try {
      const response = await (apiClient as any).publicConfig?.get?.();
      const data = response?.data || response;
      if (data?.success && data?.data) {
        set({
          platformName: data.data.platformName || 'Finance Tracker',
          supportEmail: data.data.supportEmail || 'support@imakshay.in',
          allowUserRegistration: data.data.allowUserRegistration ?? true,
          isLoaded: true,
        });
        
        // Update document title dynamically
        if (typeof document !== 'undefined' && data.data.platformName) {
          document.title = data.data.platformName;
        }
      }
    } catch (err) {
      console.error('Failed to fetch public config', err);
    }
  },
}));
