import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      size = 'md',
      leftIcon,
      className = '',
      id,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
    const errorId = selectId ? `${selectId}-error` : undefined;
    const helperId = selectId ? `${selectId}-helper` : undefined;
    const describedBy = error ? errorId : helperText ? helperId : undefined;

    const sizeClasses = {
      sm: 'text-xs px-2.5 py-1.5 pr-8 rounded-lg',
      md: 'text-sm px-3.5 py-2.5 pr-10 rounded-xl',
      lg: 'text-base px-4 py-3 pr-10 rounded-xl',
    }[size];

    const chevronClasses = {
      sm: 'w-3.5 h-3.5 right-2.5',
      md: 'w-4 h-4 right-3.5',
      lg: 'w-4 h-4 right-3.5',
    }[size];

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-textDefault mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 pointer-events-none text-textMuted flex items-center" aria-hidden="true">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`w-full bg-white border font-medium text-textDefault appearance-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus:border-brand-primary disabled:bg-gray-50 disabled:text-textMuted ${sizeClasses} ${
              leftIcon ? 'pl-9' : ''
            } ${
              error ? 'border-semantic-danger focus-visible:ring-semantic-danger' : 'border-borderDefault'
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className={`absolute pointer-events-none text-textMuted flex items-center ${chevronClasses}`} aria-hidden="true">
            <ChevronDown className="w-full h-full" />
          </div>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="mt-1 text-xs text-semantic-danger font-medium">{error}</p>
        ) : helperText ? (
          <p id={helperId} className="mt-1 text-xs text-textMuted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
