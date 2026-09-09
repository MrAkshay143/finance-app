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

  return (
    <div className={`flex items-center justify-between gap-2 pt-4 pb-2 px-1 text-xs text-slate-500 ${className}`}>
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

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-borderDefault bg-white text-textDefault hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Prev</span>
        </button>
        <span className="font-semibold text-slate-700 px-1 text-xs select-none">
          {`${currentPage} / ${totalPages}`}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-borderDefault bg-white text-textDefault hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
