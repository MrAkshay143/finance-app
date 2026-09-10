import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
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

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-400 shrink-0" aria-hidden="true" />;
    }
  };

  return createPortal(
    <div
      className="fixed top-5 left-0 right-0 z-[9999] pointer-events-none flex justify-center px-3 transition-all duration-300"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div
        key={toast.id}
        role={toast.type === 'error' ? 'alert' : 'status'}
        onClick={hideToast}
        className="pointer-events-auto cursor-pointer rounded-full py-1.5 px-3.5 max-w-[92vw] sm:max-w-sm w-fit mx-auto bg-slate-900/92 backdrop-blur-xl text-white shadow-xl shadow-slate-950/25 border border-white/10 flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200 select-none"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {getIcon(toast.type)}
          <p className="text-xs font-medium text-slate-100 leading-snug truncate">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            hideToast();
          }}
          aria-label="Dismiss notification"
          className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all shrink-0 focus-visible:outline-none"
        >
          <X className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body
  );
};
