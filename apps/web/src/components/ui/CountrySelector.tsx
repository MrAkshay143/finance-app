import React from 'react';
import { COUNTRIES, CountryMetadata } from '@finance/shared-types';

export interface CountrySelectorProps {
  label?: string;
  value: string;
  onChange: (countryCode: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  id,
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'country-select');

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-textDefault mb-1.5">
          {label} {required && <span className="text-semantic-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-white border text-sm text-textDefault rounded-xl px-3.5 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-50 disabled:text-textMuted ${
            error ? 'border-semantic-danger focus:ring-semantic-danger' : 'border-borderDefault'
          }`}
        >
          {COUNTRIES.map((country: CountryMetadata) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.name} ({country.callingCode})
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-semantic-danger font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-textMuted">{helperText}</p>
      ) : null}
    </div>
  );
};
