import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall.js';
import { Button } from '../ui/Button.js';

export const InstallAppBanner: React.FC = () => {
  const { isInstallable, installApp } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (!isInstallable) {
      setIsDismissed(true);
      return;
    }
    const dismissedAt = localStorage.getItem('finance_pwa_banner_dismissed');
    if (dismissedAt) {
      const diffMs = Date.now() - Number(dismissedAt);
      // Dismiss for 7 days
      if (diffMs < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
        return;
      }
    }
    setIsDismissed(false);
  }, [isInstallable]);

  if (!isInstallable || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('finance_pwa_banner_dismissed', String(Date.now()));
  };

  const handleInstall = async () => {
    await installApp();
  };

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 p-3 max-w-lg mx-auto pointer-events-none">
      <div className="bg-[#0B1B3A] text-white p-3.5 rounded-2xl shadow-xl border border-white/20 flex items-center justify-between gap-3 pointer-events-auto backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/pwa-192x192.png"
            alt="Finance App Icon"
            className="w-10 h-10 rounded-xl object-cover shadow-md shrink-0 border border-white/20"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white tracking-tight truncate">
              Install Finance App
            </h4>
            <p className="text-[11px] text-slate-300 truncate">
              Add to home screen for quick access.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleInstall}
            className="!py-1 !px-2.5 !text-xs !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 whitespace-nowrap"
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Install
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallAppBanner;
