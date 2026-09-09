import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastState {
  toast: ToastItem | null;
  showToast: (type: ToastType, message: string, duration?: number) => void;
  hideToast: () => void;
}

// Module-level timer reference guarantees clean cancellation across all triggers
let activeTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  showToast: (type: ToastType, message: string, duration = 3000) => {
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }

    const id = Date.now();
    set({ toast: { id, type, message, duration } });

    activeTimer = setTimeout(() => {
      set({ toast: null });
      activeTimer = null;
    }, duration);
  },
  hideToast: () => {
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
    set({ toast: null });
  },
}));

// Clean universal imperative API - usable anywhere (components, hooks, event callbacks)
export const toast = {
  success: (message: string, duration = 3000) =>
    useToastStore.getState().showToast('success', message, duration),
  error: (message: string, duration = 4000) =>
    useToastStore.getState().showToast('error', message, duration),
  info: (message: string, duration = 3000) =>
    useToastStore.getState().showToast('info', message, duration),
  warning: (message: string, duration = 3500) =>
    useToastStore.getState().showToast('warning', message, duration),
  dismiss: () => useToastStore.getState().hideToast(),
};
