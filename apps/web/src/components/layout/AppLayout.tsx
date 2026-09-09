import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav.js';
import { AddTransactionPickerModal } from '../finance/AddTransactionPickerModal.js';
import { TransactionFormModal } from '../finance/TransactionFormModal.js';
import { InstallAppBanner } from './InstallAppBanner.js';

export interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#EDF2F9] flex justify-center py-0">
      {/* Centered mobile viewport container (~390-430px wide) */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#F3F6FC] relative flex flex-col shadow-2xl border-x border-[#E2E8F0] pb-24 overflow-x-clip">
        {/* Dynamic Page Content */}
        <main id="main-content" role="main" className="flex-1 flex flex-col">
          {children ?? <Outlet />}
        </main>

        {/* Fixed Bottom Navigation (5 items) */}
        <BottomNav />

        {/* PWA Install Banner */}
        <InstallAppBanner />

        {/* Global Modals: Suppressed on admin routes */}
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
