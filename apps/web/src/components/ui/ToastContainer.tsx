import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, ToastType } from '../../store/toastStore.js';

export const ToastContainer: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const toast = useToastStore((state) => state.toast);
  const hideToast = useToastStore((state) => state.hideToast);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined' || !toast) {
    return null;
  }

  const getBadgeConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />,
          badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
          badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
          badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />,
          badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        };
    }
  };

  const { icon, badgeClass } = getBadgeConfig(toast.type);

  return createPortal(
    <div
      className="fixed top-4 sm:top-5 inset-x-0 z-[9999] pointer-events-none flex justify-center px-4 transition-all duration-300"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div
        key={toast.id}
        role={toast.type === 'error' ? 'alert' : 'status'}
        onClick={hideToast}
        className="pointer-events-auto cursor-pointer rounded-full py-2 px-3.5 sm:px-4 max-w-[92vw] sm:max-w-md w-fit mx-auto bg-slate-950/92 dark:bg-black/92 backdrop-blur-2xl text-white shadow-2xl shadow-black/40 border border-white/15 ring-1 ring-black/40 flex items-center gap-2.5 animate-in fade-in zoom-in-95 slide-in-from-top-3 duration-200 active:scale-[0.98] select-none transition-transform"
      >
        <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${badgeClass}`}>
          {icon}
        </div>

        <p className="text-[13px] font-medium tracking-tight text-white/95 leading-none select-none truncate">
          {toast.message}
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            hideToast();
          }}
          aria-label="Dismiss notification"
          className="w-4 h-4 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 active:scale-90 transition-all shrink-0 ml-0.5 focus-visible:outline-none"
        >
          <X className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body
  );
};
