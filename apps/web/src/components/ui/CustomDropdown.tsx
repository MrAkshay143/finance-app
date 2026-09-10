import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, AlertCircle } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface CustomDropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  className?: string;
  id?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error,
  helperText,
  disabled = false,
  required = false,
  searchable = false,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : options;

  const buttonId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'dropdown-btn');

  return (
    <div className={`w-full ${className}`} ref={dropdownRef}>
      {label && (
        <label htmlFor={buttonId} className="block text-xs font-semibold text-textDefault mb-1.5">
          {label} {required && <span className="text-semantic-danger">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button matching mobile number country code CSS */}
        <button
          type="button"
          id={buttonId}
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              if (isOpen) setSearchQuery('');
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full px-3.5 py-2.5 bg-white hover:bg-slate-50 border rounded-xl text-xs text-textDefault font-medium flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-50 disabled:text-textMuted ${
            error ? 'border-semantic-danger focus:ring-semantic-danger' : 'border-borderDefault'
          }`}
        >
          <span className="truncate flex items-center gap-2">
            {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Popover matching mobile number country code CSS */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-full max-h-60 bg-white border border-borderDefault rounded-xl shadow-modal z-50 overflow-hidden flex flex-col">
            {/* Search option only where needed */}
            {searchable && (
              <div className="p-2 border-b border-borderDefault bg-slate-50 flex items-center gap-1.5">
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
                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors hover:bg-slate-50 ${
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
        )}
      </div>

      {error ? (
        <p role="alert" className="mt-1 text-xs text-semantic-danger font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-textMuted">{helperText}</p>
      ) : null}
    </div>
  );
};
