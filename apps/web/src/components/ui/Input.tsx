import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export type InputValidationStatus = 'idle' | 'valid' | 'invalid' | 'warning';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  status?: InputValidationStatus;
  validMessage?: string;
  showStatusIcon?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      rightElement,
      status = 'idle',
      validMessage,
      showStatusIcon = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
    const errorId = inputId ? `${inputId}-error` : undefined;
    const helperId = inputId ? `${inputId}-helper` : undefined;
    const validId = inputId ? `${inputId}-valid` : undefined;

    const isInvalid = Boolean(error) || status === 'invalid';
    const isValid = !isInvalid && status === 'valid';
    const isWarning = !isInvalid && status === 'warning';

    const describedBy = isInvalid ? errorId : isValid && validMessage ? validId : helperText ? helperId : undefined;

    // Determine status border and ring styles
    let borderStyles = 'border-borderDefault';
    if (isInvalid) {
      borderStyles = 'border-semantic-danger focus-visible:ring-semantic-danger';
    } else if (isValid) {
      borderStyles = 'border-semantic-success focus-visible:ring-semantic-success';
    } else if (isWarning) {
      borderStyles = 'border-amber-500 focus-visible:ring-amber-500';
    }

    // Determine auto right status icon if requested and no rightElement
    let statusIcon: React.ReactNode = null;
    if (showStatusIcon && !rightElement) {
      if (isInvalid) {
        statusIcon = <AlertCircle className="w-4 h-4 text-semantic-danger shrink-0" aria-hidden="true" />;
      } else if (isValid) {
        statusIcon = <CheckCircle2 className="w-4 h-4 text-semantic-success shrink-0" aria-hidden="true" />;
      } else if (isWarning) {
        statusIcon = <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />;
      }
    }

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
            aria-invalid={isInvalid}
            aria-describedby={describedBy}
            className={`w-full bg-white border text-sm text-textDefault placeholder-textMuted rounded-xl px-3.5 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus:border-brand-primary disabled:bg-gray-50 disabled:text-textMuted ${
              icon ? 'pl-10' : ''
            } ${rightElement || statusIcon ? 'pr-10' : ''} ${borderStyles} ${className}`}
            {...props}
          />
          {(rightElement || statusIcon) && (
            <div className="absolute right-3.5 flex items-center text-textMuted pointer-events-none">
              <span className="pointer-events-auto">{rightElement || statusIcon}</span>
            </div>
          )}
        </div>
        {isInvalid && error ? (
          <p id={errorId} role="alert" className="mt-1 text-xs text-semantic-danger font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : isValid && validMessage ? (
          <p id={validId} className="mt-1 text-xs text-semantic-success font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>{validMessage}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1 text-xs text-textMuted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

