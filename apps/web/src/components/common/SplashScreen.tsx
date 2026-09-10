import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';

const SPLASH_STORAGE_KEY = 'finance_splash_seen';

export const SplashScreen: React.FC = () => {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem(SPLASH_STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    // Start fade-out at 1000ms, unmount at 1350ms
    const timerFade = setTimeout(() => {
      setFading(true);
    }, 1000);

    const timerDone = setTimeout(() => {
      try {
        sessionStorage.setItem(SPLASH_STORAGE_KEY, 'true');
      } catch {
        // Ignore quota/access errors
      }
      setVisible(false);
    }, 1350);

    return () => {
      clearTimeout(timerFade);
      clearTimeout(timerDone);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Loading application"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8FAFC] transition-opacity duration-300 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient background glow orbs */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* Center content container */}
      <div className="relative flex flex-col items-center text-center px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-primary/20 mb-4 ring-4 ring-white">
          <Wallet className="w-8 h-8 text-white stroke-[2.2]" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-slate-900 mb-1">
          Finance Hub
        </h1>
        <p className="text-xs font-medium text-slate-500 mb-6">
          Smart wealth tracking & analytics
        </p>

        {/* Minimalist progress shimmer */}
        <div className="w-28 h-1 bg-slate-200/80 rounded-full overflow-hidden">
          <div className="w-full h-full bg-brand-primary rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};
