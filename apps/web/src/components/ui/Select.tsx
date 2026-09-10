import React from 'react';
import { CustomDropdown, DropdownOption } from './CustomDropdown.js';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  labelRight?: React.ReactNode;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  placeholder?: string;
  searchable?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      labelRight,
      error,
      helperText,
      options = [],
      size = 'md',
      leftIcon,
      className = '',
      id,
      value,
      onChange,
      disabled,
      required,
      placeholder,
      searchable,
      ...props
    },
    ref
  ) => {
    const handleChange = (newVal: string) => {
      if (!onChange) return;
      const syntheticEvent = {
        target: { value: newVal, name: props.name || '' },
        currentTarget: { value: newVal, name: props.name || '' },
      } as React.ChangeEvent<HTMLSelectElement>;

      try {
        (onChange as any)(syntheticEvent);
      } catch {
        (onChange as any)(newVal);
      }
    };

    return (
      <CustomDropdown
        id={id}
        label={label}
        labelRight={labelRight}
        error={error}
        helperText={helperText}
        options={options}
        value={String(value ?? '')}
        onChange={handleChange}
        size={size}
        leftIcon={leftIcon}
        className={className}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        searchable={searchable ?? (options.length > 8)}
        aria-label={props['aria-label']}
      />
    );
  }
);

Select.displayName = 'Select';
