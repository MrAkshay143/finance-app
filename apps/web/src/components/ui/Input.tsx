import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, rightElement, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;
    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-textDefault mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 pointer-events-none text-textMuted shrink-0" aria-hidden="true">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`w-full bg-white border text-sm text-textDefault placeholder-textMuted rounded-xl px-3.5 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus:border-brand-primary disabled:bg-gray-50 disabled:text-textMuted ${
              icon ? 'pl-10' : ''
            } ${rightElement ? 'pr-10' : ''} ${
              error ? 'border-semantic-danger focus-visible:ring-semantic-danger' : 'border-borderDefault'
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3.5 flex items-center text-textMuted">
              {rightElement}
            </div>
          )}
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

Input.displayName = 'Input';
