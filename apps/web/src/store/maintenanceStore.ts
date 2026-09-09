import { create } from 'zustand';

interface MaintenanceState {
  isMaintenanceActive: boolean;
  message: string;
  setMaintenance: (active: boolean, message?: string) => void;
  clearMaintenance: () => void;
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  isMaintenanceActive: false,
  message: '',
  setMaintenance: (active: boolean, message?: string) =>
    set({
      isMaintenanceActive: active,
      message:
        message ||
        'The platform is currently undergoing scheduled maintenance. Please check back shortly.',
    }),
  clearMaintenance: () => set({ isMaintenanceActive: false, message: '' }),
}));
