import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, AlertCircle } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface CustomDropdownProps {
  label?: string;
  labelRight?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  labelRight,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error,
  helperText,
  disabled = false,
  required = false,
  searchable = false,
  size = 'md',
  leftIcon,
  className = '',
  id,
  'aria-label': ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const updateCoords = useCallback(() => {
    if (!buttonRef.current || typeof window === 'undefined') return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownMaxHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeAbove = spaceBelow < 180 && spaceAbove > spaceBelow;

    const left = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8));
    const width = Math.min(rect.width, window.innerWidth - 16);

    if (placeAbove) {
      setCoords({
        bottom: window.innerHeight - rect.top + 6,
        left,
        width,
        maxHeight: Math.max(120, Math.min(dropdownMaxHeight, spaceAbove - 16)),
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        left,
        width,
        maxHeight: Math.max(120, Math.min(dropdownMaxHeight, spaceBelow - 16)),
      });
    }
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Update coords on window resize/scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    updateCoords();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        buttonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen, updateCoords]);

  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : options;

  const buttonId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'dropdown-btn');

  const sizeButtonClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded-lg',
    md: 'px-3.5 py-2.5 text-xs rounded-xl',
    lg: 'px-4 py-3 text-sm rounded-xl',
  }[size];

  const sizeOptionClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-xs',
    lg: 'px-4 py-2.5 text-sm',
  }[size];

  const chevronSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  const isClient = typeof window !== 'undefined' && typeof document !== 'undefined';

  const popoverContent = (
    <div
      ref={popoverRef}
      style={
        isClient && coords
          ? {
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
            }
          : undefined
      }
      className={`${
        isClient
          ? 'z-[9999]'
          : 'absolute top-full left-0 mt-1.5 w-full z-[9999]'
      } bg-white border border-borderDefault rounded-xl shadow-modal overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100`}
    >
      {/* Search option only where needed */}
      {searchable && (
        <div className="p-2 border-b border-borderDefault bg-slate-50 flex items-center gap-1.5 shrink-0">
          <Search className="w-3.5 h-3.5 text-textMuted shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-xs text-textDefault placeholder-textMuted focus:outline-none"
            autoFocus
          />
        </div>
      )}

      {/* Options List */}
      <div className="overflow-y-auto flex-1 divide-y divide-slate-100 py-1" role="listbox">
        {filteredOptions.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
                setSearchQuery('');
              }}
              className={`w-full text-left flex items-center justify-between transition-colors hover:bg-slate-50 ${sizeOptionClasses} ${
                isSelected ? 'bg-brand-primary/10 font-semibold text-brand-primary' : 'text-textDefault'
              }`}
            >
              <span className="flex items-center gap-2 truncate mr-2">
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <span className="truncate">{opt.label}</span>
              </span>
              {isSelected && <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" />}
            </button>
          );
        })}
        {filteredOptions.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-textMuted">No options found</div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      {(label || labelRight) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <label htmlFor={buttonId} className="block text-xs font-semibold text-textDefault">
              {label} {required && <span className="text-semantic-danger">*</span>}
            </label>
          )}
          {labelRight && <div className="text-xs">{labelRight}</div>}
        </div>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          ref={buttonRef}
          type="button"
          id={buttonId}
          disabled={disabled}
          aria-label={ariaLabel || label || placeholder}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${buttonId}-error` : undefined}
          onClick={handleToggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full bg-white hover:bg-slate-50 border font-medium text-textDefault flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus-visible:outline-none focus-visible:ring-2 focus:ring-brand-primary focus-visible:ring-brand-primary disabled:bg-gray-50 disabled:text-textMuted ${sizeButtonClasses} ${
            error ? 'border-semantic-danger focus:ring-semantic-danger focus-visible:ring-semantic-danger' : 'border-borderDefault'
          }`}
        >
          <span className="truncate flex items-center gap-2">
            {leftIcon && <span className="shrink-0 flex items-center text-textMuted">{leftIcon}</span>}
            {selectedOption?.icon && <span className="shrink-0 flex items-center">{selectedOption.icon}</span>}
            <span className={`truncate ${!selectedOption ? 'text-textMuted' : ''}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`${chevronSizeClasses} text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Overlay Backdrop & Popover */}
        {isOpen && (
          isClient ? (
            createPortal(
              <>
                {/* Backdrop overlay for dismissing dropdown on click outside */}
                <div
                  className="fixed inset-0 z-[9998] bg-black/[0.04] transition-opacity"
                  aria-hidden="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                />
                {popoverContent}
              </>
              ,
              document.body
            )
          ) : (
            popoverContent
          )
        )}
      </div>

      {error ? (
        <p role="alert" id={`${buttonId}-error`} className="mt-1 text-xs text-semantic-danger font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-textMuted">{helperText}</p>
      ) : null}
    </div>
  );
};
