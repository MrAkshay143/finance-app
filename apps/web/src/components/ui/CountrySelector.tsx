import React from 'react';
import { COUNTRIES, CountryMetadata } from '@finance/shared-types';
import { CustomDropdown } from './CustomDropdown.js';

export interface CountrySelectorProps {
  label?: string;
  value: string;
  onChange: (countryCode: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
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
  searchable = true,
  className = '',
  id,
}) => {
  const options = COUNTRIES.map((country: CountryMetadata) => ({
    value: country.code,
    label: country.name,
    icon: <span className="text-sm leading-none mr-1">{country.flag}</span>,
  }));

  return (
    <CustomDropdown
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select Country"
      error={error}
      helperText={helperText}
      disabled={disabled}
      required={required}
      searchable={searchable}
      className={className}
      id={id}
    />
  );
};

