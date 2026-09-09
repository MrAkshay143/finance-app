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
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400 shrink-0" aria-hidden="true" />;
    }
  };

  const getBorderAccent = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30';
      case 'error':
        return 'border-rose-500/40';
      case 'warning':
        return 'border-amber-500/40';
      case 'info':
      default:
        return 'border-blue-500/30';
    }
  };

  return createPortal(
    <div
      className="fixed top-5 left-0 right-0 mx-auto w-[calc(100%-32px)] max-w-[390px] z-[9999] pointer-events-none flex justify-center transition-all duration-300"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <div
        key={toast.id}
        role={toast.type === 'error' ? 'alert' : 'status'}
        className={`w-full bg-slate-900/95 text-white shadow-2xl backdrop-blur-md border ${getBorderAccent(
          toast.type
        )} rounded-2xl px-4 py-3 flex items-center justify-between gap-3 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-200`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {getIcon(toast.type)}
          <p className="text-xs font-medium text-slate-100 leading-snug break-words line-clamp-3">
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={hideToast}
          aria-label="Dismiss notification"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body
  );
};
