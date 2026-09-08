import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ArrowLeftRight, Plus, BarChart3, MoreHorizontal } from 'lucide-react';
import { useUiStore } from '../../store/uiStore.js';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const openPicker = useUiStore((state) => state.openPicker);

  const pathname = location.pathname;

  // Shared Reports / Analytics slot per Plan/frontend.md §2
  const isAnalyticsActive = pathname.startsWith('/analytics');
  const isReportsActive = pathname.startsWith('/reports');
  const reportsLabel = isAnalyticsActive ? 'Analytics' : 'Reports';
  const reportsTo = isAnalyticsActive ? '/analytics' : '/reports';

  const isHomeActive = pathname === '/' || pathname.startsWith('/dashboard');
  const isTransactionsActive = pathname.startsWith('/transactions');
  const isMoreActive = pathname.startsWith('/more') || pathname.startsWith('/menu');

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[430px] bg-white border-t border-borderDefault px-2 py-2 flex items-center justify-around z-40 shadow-lg"
    >
      {/* 1. Home */}
      <NavLink
        to="/dashboard"
        aria-label="Home"
        className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
          isHomeActive ? 'text-brand-primary font-semibold' : 'text-textMuted hover:text-brand-primary'
        }`}
      >
        <Home className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
        <span className="text-[11px] mt-1 tracking-tight">Home</span>
      </NavLink>

      {/* 2. Transactions */}
      <NavLink
        to="/transactions"
        aria-label="Transactions"
        className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
          isTransactionsActive ? 'text-brand-primary font-semibold' : 'text-textMuted hover:text-brand-primary'
        }`}
      >
        <ArrowLeftRight className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
        <span className="text-[11px] mt-1 tracking-tight">Transactions</span>
      </NavLink>

      {/* 3. Raised Center FAB (+) */}
      <div className="-mt-7 flex flex-col items-center">
        <button
          type="button"
          onClick={openPicker}
          aria-label="Add transaction"
          className="w-13 h-13 w-[54px] h-[54px] rounded-full bg-brand-primary hover:bg-blue-700 active:scale-90 text-white flex items-center justify-center shadow-fab border-4 border-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>

      {/* 4. Reports / Analytics (Shared slot) */}
      <NavLink
        to={reportsTo}
        aria-label={reportsLabel}
        className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
          isReportsActive || isAnalyticsActive
            ? 'text-brand-primary font-semibold'
            : 'text-textMuted hover:text-brand-primary'
        }`}
      >
        <BarChart3 className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
        <span className="text-[11px] mt-1 tracking-tight">{reportsLabel}</span>
      </NavLink>

      {/* 5. More */}
      <NavLink
        to="/more"
        aria-label="More"
        className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
          isMoreActive ? 'text-brand-primary font-semibold' : 'text-textMuted hover:text-brand-primary'
        }`}
      >
        <MoreHorizontal className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
        <span className="text-[11px] mt-1 tracking-tight">More</span>
      </NavLink>
    </nav>
  );
};
