import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search, Check, Store, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { useSafeQueryClient } from '../../hooks/useSafeQueryClient.js';
import type { Merchant } from '@finance/shared-types';

export interface MerchantAutoSuggestProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const MerchantAutoSuggest: React.FC<MerchantAutoSuggestProps> = ({
  value,
  onChange,
  label = 'Merchant / Counterparty',
  placeholder = 'e.g. Swiggy, Amazon, Netflix, Employer',
  disabled = false,
  className = '',
  id = 'merchant-input',
}) => {
  const queryClient = useSafeQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const justSelectedRef = useRef<boolean>(false);

  // Fetch real user merchants
  const { data: merchants = [] } = useQuery<Merchant[]>(
    {
      queryKey: ['merchants'],
      queryFn: async () => {
        try {
          return await apiClient.merchants.list();
        } catch {
          return [];
        }
      },
    },
    queryClient
  );

  // Filter matching merchants
  const matchingMerchants = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) {
      return merchants.slice(0, 6);
    }
    return merchants
      .filter((m) => m.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [merchants, value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (merchantName: string) => {
    justSelectedRef.current = true;
    onChange(merchantName);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || matchingMerchants.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < matchingMerchants.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : matchingMerchants.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < matchingMerchants.length) {
        e.preventDefault();
        handleSelect(matchingMerchants[highlightedIndex].name);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-textDefault mb-1.5">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-textMuted flex items-center" aria-hidden="true">
          <Building2 className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            if (justSelectedRef.current) {
              justSelectedRef.current = false;
              return;
            }
            if (merchants.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className="w-full bg-white border border-borderDefault rounded-xl pl-10 pr-9 py-2.5 text-sm text-textDefault placeholder:text-textMuted font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:bg-gray-50 disabled:text-textMuted"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Clear merchant"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Auto-Suggest Popover */}
      {isOpen && matchingMerchants.length > 0 && (
        <div
          role="listbox"
          aria-label="Merchant suggestions"
          className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-borderDefault rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-1.5 bg-slate-50/80 flex items-center justify-between text-[11px] font-semibold text-textMuted border-b border-borderDefault/60">
            <span className="flex items-center gap-1">
              <Store className="w-3 h-3 text-textMuted" /> Suggested Merchants
            </span>
            <span>{matchingMerchants.length} matches</span>
          </div>

          <div className="py-1">
            {matchingMerchants.map((m, index) => {
              const isSelected = value.trim().toLowerCase() === m.name.toLowerCase();
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={m.id || m.name}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(m.name)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3.5 py-2 cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors ${
                    isHighlighted ? 'bg-brand-primary-soft/60 text-brand-primary' : 'text-textDefault hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-textMuted shrink-0">
                      <Building2 className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-medium truncate">{m.name}</span>
                  </div>

                  {m.transactionCount !== undefined && m.transactionCount > 0 && (
                    <span className="text-[10px] text-textMuted font-medium px-1.5 py-0.5 rounded-full bg-slate-100 shrink-0">
                      {m.transactionCount} {m.transactionCount === 1 ? 'txn' : 'txns'}
                    </span>
                  )}

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 ml-auto" aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
