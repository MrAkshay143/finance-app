import React, { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, ArrowLeftRight, X, ChevronRight } from 'lucide-react';
import { useUiStore, TransactionType } from '../../store/uiStore.js';

export interface AddTransactionPickerModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelectType?: (type: TransactionType) => void;
}

export const AddTransactionPickerModal: React.FC<AddTransactionPickerModalProps> = (props) => {
  const storePickerOpen = useUiStore((state) => state.isPickerOpen);
  const closePicker = useUiStore((state) => state.closePicker);
  const openAddModal = useUiStore((state) => state.openAddModal);

  const isOpen = props.isOpen !== undefined ? props.isOpen : storePickerOpen;
  const handleClose = props.onClose || closePicker;
  const handleSelect = props.onSelectType || openAddModal;

  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0]?.focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);

      if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSelectType = (type: TransactionType) => {
    handleSelect(type);
  };

  const options: Array<{
    type: TransactionType;
    label: string;
    description: string;
    icon: React.ReactNode;
    bgClass: string;
    textClass: string;
    badgeClass: string;
  }> = [
    {
      type: 'income',
      label: 'Add Income',
      description: 'Salary, freelance, dividends, or other earnings',
      icon: <TrendingUp className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />,
      bgClass: 'bg-semantic-success-bg',
      textClass: 'text-semantic-success',
      badgeClass: 'border-semantic-success/30',
    },
    {
      type: 'expense',
      label: 'Add Expense',
      description: 'Bills, groceries, shopping, dining, and daily spend',
      icon: <TrendingDown className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />,
      bgClass: 'bg-semantic-danger-bg',
      textClass: 'text-semantic-danger',
      badgeClass: 'border-semantic-danger/30',
    },
    {
      type: 'investment',
      label: 'Add Investment',
      description: 'Stocks, mutual funds, retirement funds, and assets',
      icon: <PiggyBank className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />,
      bgClass: 'bg-semantic-investment-bg',
      textClass: 'text-semantic-investment',
      badgeClass: 'border-semantic-investment/30',
    },
    {
      type: 'transfer',
      label: 'Add Transfer',
      description: 'Transfer funds between your accounts or wallets',
      icon: <ArrowLeftRight className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />,
      bgClass: 'bg-semantic-transfer-bg',
      textClass: 'text-semantic-transfer',
      badgeClass: 'border-semantic-transfer/30',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-transaction-picker-title"
      aria-describedby="add-transaction-picker-subtitle"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-[390px] bg-white rounded-modal shadow-modal border border-borderDefault overflow-hidden animate-in fade-in zoom-in-95 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 pt-5 pb-4 border-b border-borderDefault flex items-center justify-between">
          <div>
            <h2 id="add-transaction-picker-title" className="text-base font-bold text-textDefault tracking-tight leading-tight">
              Add Transaction
            </h2>
            <p id="add-transaction-picker-subtitle" className="text-xs text-textMuted mt-0.5 leading-normal">
              Select transaction category to record
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full text-textMuted hover:text-textDefault hover:bg-gray-100 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Options List */}
        <div className="p-4 space-y-2.5">
          {options.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => handleSelectType(option.type)}
              className="w-full p-3.5 rounded-2xl border border-borderDefault hover:border-blue-300 hover:bg-blue-50/40 active:scale-[0.98] transition-all flex items-center justify-between text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${option.bgClass} ${option.textClass} ${option.badgeClass}`}
                >
                  {option.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-textDefault group-hover:text-brand-primary transition-colors">
                    {option.label}
                  </div>
                  <div className="text-xs text-textMuted leading-tight mt-0.5">
                    {option.description}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-textMuted group-hover:text-brand-primary shrink-0 transition-colors ml-2" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
