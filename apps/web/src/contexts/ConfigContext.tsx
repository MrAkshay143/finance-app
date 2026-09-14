import React, { createContext, useContext, useEffect } from 'react';
import { useConfigStore, type PublicAppConfig } from '../store/configStore.js';

const ConfigContext = createContext<PublicAppConfig | null>(null);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = useConfigStore();

  useEffect(() => {
    if (!config.isLoaded) {
      useConfigStore.getState().fetchConfig();
    }
  }, [config.isLoaded]);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
};

export function useConfig(): PublicAppConfig {
  const context = useContext(ConfigContext);
  if (!context) {
    // Fallback directly to Zustand store for components outside ConfigProvider
    return useConfigStore();
  }
  return context;
}

export { useConfigStore, type PublicAppConfig };
export default ConfigProvider;
