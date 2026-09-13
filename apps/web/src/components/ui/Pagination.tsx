import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
  itemLabel = 'items',
}) => {
  // Auto-hide when 1 page or empty
  if (totalPages <= 1 || (totalItems !== undefined && totalItems === 0)) {
    return null;
  }

  const startItem =
    totalItems !== undefined && pageSize !== undefined
      ? Math.min((currentPage - 1) * pageSize + 1, totalItems)
      : undefined;
  const endItem =
    totalItems !== undefined && pageSize !== undefined
      ? Math.min(currentPage * pageSize, totalItems)
      : undefined;

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 sm:py-2.5 sm:px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 my-1.5 ${className}`}
    >
      {/* Summary Capsule / Counter */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100/90 text-xs text-slate-500 font-medium">
          {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
            <span>
              Showing <span className="font-semibold text-slate-700">{`${startItem}–${endItem}`}</span> of{' '}
              <span className="font-semibold text-slate-700">{totalItems}</span> {itemLabel}
            </span>
          ) : (
            <span>
              Page <span className="font-semibold text-slate-700">{currentPage}</span> of{' '}
              <span className="font-semibold text-slate-700">{totalPages}</span>
            </span>
          )}
        </div>
      </div>

      {/* Touch-Friendly Action Buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
        <button
          type="button"
          disabled={isFirstPage}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 sm:h-8 px-3.5 sm:px-3 rounded-xl sm:rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 disabled:opacity-35 disabled:pointer-events-none transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-600" aria-hidden="true" />
          <span>Prev</span>
        </button>

        <div className="px-3 py-1.5 sm:py-1 rounded-xl sm:rounded-lg bg-slate-100/70 border border-slate-200/50 font-semibold text-slate-700 text-xs select-none shrink-0 min-w-[54px] text-center">
          {`${currentPage} / ${totalPages}`}
        </div>

        <button
          type="button"
          disabled={isLastPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 sm:h-8 px-3.5 sm:px-3 rounded-xl sm:rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 disabled:opacity-35 disabled:pointer-events-none transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-600" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
