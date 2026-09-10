import React, { useEffect } from 'react';

// Single Unified Splash Screen Controller
// Controls the seamless fade-out and unmount of the HTML splash screen,
// guaranteeing zero duplication or double-splash flicker.
export const SplashScreen: React.FC = () => {
  useEffect(() => {
    const splash = document.getElementById('app-splash');
    if (!splash) return;

    // Display time ~850ms, then buttery-smooth 350ms fade-out
    const timerFade = setTimeout(() => {
      splash.classList.add('fade-out');
    }, 850);

    const timerRemove = setTimeout(() => {
      if (splash && splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
    }, 1250);

    return () => {
      clearTimeout(timerFade);
      clearTimeout(timerRemove);
    };
  }, []);

  return null;
};


