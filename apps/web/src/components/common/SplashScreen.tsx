import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';

// In-memory session tracking ensures splash screen shows on every fresh app load/open,
// while preventing disruptions during client-side route navigation within the app.
let hasShownInCurrentSession = false;

export const SplashScreen: React.FC = () => {
  const [visible, setVisible] = useState(() => !hasShownInCurrentSession);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    // Start graceful fade-out at 950ms, unmount cleanly at 1250ms
    const timerFade = setTimeout(() => {
      setFading(true);
    }, 950);

    const timerDone = setTimeout(() => {
      hasShownInCurrentSession = true;
      try {
        sessionStorage.setItem('finance_splash_seen', 'true');
      } catch {
        // Ignore quota/access errors
      }
      setVisible(false);
    }, 1250);

    return () => {
      clearTimeout(timerFade);
      clearTimeout(timerDone);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Loading Finance Tracker"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#F8FAFC] transition-opacity duration-300 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Ambient background glow orbs */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* Center content container */}
      <div className="relative flex flex-col items-center text-center px-4 animate-in fade-in zoom-in-95 duration-500">
        {/* App Brand Icon */}
        <div className="relative w-16 h-16 rounded-2xl bg-[#132A5C] border border-[#0B1B3A]/20 shadow-xl shadow-blue-900/15 flex items-center justify-center mb-4 ring-4 ring-white/90 overflow-hidden">
          <Wallet className="w-8 h-8 text-white/40 absolute stroke-[2]" />
          <img
            src="/pwa-192x192.png"
            alt="Finance Tracker"
            className="w-12 h-12 rounded-xl object-cover relative z-10"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Modern App Name */}
        <h1 className="text-xl font-black tracking-tight text-slate-900 mb-1">
          Finance Tracker
        </h1>
        <p className="text-xs font-medium text-slate-500 mb-6">
          Personal Wealth & Spending Hub
        </p>

        {/* Minimalist animated progress bar */}
        <div className="w-32 h-1 bg-slate-200/80 rounded-full overflow-hidden relative">
          <div className="w-full h-full bg-brand-primary rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

