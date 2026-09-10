import React from 'react';
import { SUPPORTED_CURRENCIES, CurrencyConfig } from '@finance/shared-ui-tokens';
import { CustomDropdown } from './CustomDropdown.js';

export interface CurrencySelectorProps {
  label?: string;
  value: string;
  onChange: (currencyCode: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  label = 'Currency',
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  id,
}) => {
  const options = SUPPORTED_CURRENCIES.map((curr: CurrencyConfig) => ({
    value: curr.code,
    label: `${curr.symbol} ${curr.code}`,
  }));

  return (
    <CustomDropdown
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Select Currency"
      error={error}
      helperText={helperText}
      disabled={disabled}
      required={required}
      searchable={false}
      className={className}
      id={id}
    />
  );
};

