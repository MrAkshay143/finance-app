import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Phone, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  COUNTRIES,
  CountryCode,
  COUNTRY_REGISTRY,
  parsePhoneNumber,
  validateAndNormalizePhone,
} from '@finance/shared-types';
import { validatePhoneRealtime } from '../../utils/validation';

export interface PhoneInputWithCountryProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  defaultCountry?: CountryCode;
  placeholder?: string;
  showLiveStatus?: boolean;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  label,
  value = '',
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  id,
  className = '',
  defaultCountry = 'IN',
  placeholder,
  showLiveStatus = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse initial or current value to identify country and national number
  const parsed = parsePhoneNumber(value, defaultCountry);
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(parsed.countryCode);
  const [nationalNumber, setNationalNumber] = useState<string>(parsed.nationalNumber);

  // Sync internal state when external value changes
  useEffect(() => {
    const updated = parsePhoneNumber(value, defaultCountry);
    setSelectedCountryCode(updated.countryCode);
    setNationalNumber(updated.nationalNumber);
  }, [value, defaultCountry]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  const activeCountry = COUNTRY_REGISTRY[selectedCountryCode] || COUNTRY_REGISTRY.IN;

  const handleCountrySelect = (code: CountryCode) => {
    setSelectedCountryCode(code);
    setIsOpen(false);
    setSearchQuery('');

    const newCountry = COUNTRY_REGISTRY[code];
    const newFullNumber = nationalNumber ? `${newCountry.callingCode}${nationalNumber}` : '';
    onChange?.(newFullNumber);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleNationalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s-]/g, '');
    const cleanDigits = raw.replace(/\D/g, '');
    setNationalNumber(cleanDigits);

    const fullNumber = cleanDigits ? `${activeCountry.callingCode}${cleanDigits}` : '';
    onChange?.(fullNumber);
  };

  const filteredCountries = COUNTRIES.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.callingCode.includes(q)
    );
  });

  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'phone-input');
  const activePlaceholder = placeholder || activeCountry.phonePlaceholder;

  const liveResult = showLiveStatus && nationalNumber ? validatePhoneRealtime(nationalNumber, selectedCountryCode) : null;
  const isLiveValid = liveResult?.isValid ?? false;

  let inputBorderClass = 'border-borderDefault focus:ring-brand-primary';
  if (error) {
    inputBorderClass = 'border-semantic-danger focus:ring-semantic-danger';
  } else if (isLiveValid) {
    inputBorderClass = 'border-semantic-success focus:ring-semantic-success';
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-textDefault mb-1.5">
          {label} {required && <span className="text-semantic-danger">*</span>}
        </label>
      )}

      <div className="relative flex items-center gap-2" ref={dropdownRef}>
        {/* Calling Code / Country Selector Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border rounded-xl text-xs text-textDefault font-medium flex items-center gap-1.5 shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60 disabled:pointer-events-none ${
            error ? 'border-semantic-danger' : isLiveValid ? 'border-semantic-success' : 'border-borderDefault'
          }`}
        >
          <span className="text-sm leading-none" aria-hidden="true">
            {activeCountry.flag}
          </span>
          <span>{activeCountry.callingCode}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Local National Number Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            id={inputId}
            type="tel"
            disabled={disabled}
            placeholder={activePlaceholder}
            value={nationalNumber}
            onChange={handleNationalNumberChange}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs text-textDefault placeholder-textMuted transition-colors focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-textMuted ${
              isLiveValid ? 'pr-9' : ''
            } ${inputBorderClass}`}
          />
          {isLiveValid && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <CheckCircle2 className="w-4 h-4 text-semantic-success" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-64 max-h-64 bg-white border border-borderDefault rounded-xl shadow-modal z-50 overflow-hidden flex flex-col">
            {/* Search filter input */}
            <div className="p-2 border-b border-borderDefault bg-slate-50 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-textMuted shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code..."
                className="w-full bg-transparent text-xs text-textDefault placeholder-textMuted focus:outline-none"
                autoFocus
              />
            </div>

            {/* Country List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100" role="listbox">
              {filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountryCode;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleCountrySelect(c.code)}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors hover:bg-slate-50 ${
                      isSelected ? 'bg-brand-primary/10 font-semibold text-brand-primary' : 'text-textDefault'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate mr-2">
                      <span className="text-sm">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="text-textMuted font-mono text-[11px] shrink-0">{c.callingCode}</span>
                  </button>
                );
              })}
              {filteredCountries.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-textMuted">No countries found</div>
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
      ) : liveResult && nationalNumber && liveResult.status === 'invalid' ? (
        <p className="mt-1 text-xs font-medium flex items-center gap-1 text-semantic-danger">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-semantic-danger" aria-hidden="true" />
          <span>{liveResult.message}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-textMuted">{helperText}</p>
      ) : null}
    </div>
  );
};
