import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav.js';
import { AddTransactionPickerModal } from '../finance/AddTransactionPickerModal.js';
import { TransactionFormModal } from '../finance/TransactionFormModal.js';
import { InstallAppBanner } from './InstallAppBanner.js';
import { useRealtimeSync } from '../../hooks/useRealtimeSync.js';

export interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Real-time synchronization active across all layout pages
  useRealtimeSync();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#EDF2F9] flex justify-center py-0">
      <div
        className={`w-full ${
          isAdminRoute ? 'max-w-7xl px-3 sm:px-6 lg:px-8' : 'max-w-[430px]'
        } min-h-screen bg-[#F3F6FC] relative flex flex-col shadow-2xl border-x border-[#E2E8F0] pb-24 overflow-x-clip transition-all duration-150`}
      >
        <main id="main-content" role="main" className="flex-1 flex flex-col">
          {children ?? <Outlet />}
        </main>

        <BottomNav />

        <InstallAppBanner />

        {!isAdminRoute && (
          <>
            <AddTransactionPickerModal />
            <TransactionFormModal />
          </>
        )}
      </div>
    </div>
  );
};
