import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav.js';
import { AddTransactionPickerModal } from '../finance/AddTransactionPickerModal.js';
import { TransactionFormModal } from '../finance/TransactionFormModal.js';

export interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#EDF2F9] flex justify-center py-0 sm:py-4">
      {/* Centered mobile viewport container (~390-430px wide) */}
      <div className="w-full max-w-[430px] min-h-screen bg-[#F3F6FC] relative flex flex-col shadow-2xl border-x border-[#E2E8F0] pb-24 overflow-x-hidden">
        {/* Dynamic Page Content */}
        <main id="main-content" role="main" className="flex-1 flex flex-col">
          {children ?? <Outlet />}
        </main>

        {/* Fixed Bottom Navigation (5 items) */}
        <BottomNav />

        {/* Global Modals */}
        <AddTransactionPickerModal />
        <TransactionFormModal />
      </div>
    </div>
  );
};
