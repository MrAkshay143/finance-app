import React, { useState, useMemo } from 'react';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useUserDateTime } from '../../hooks/useUserDateTime.js';

export interface DatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
  isDob?: boolean;
  className?: string;
  id?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label = 'Date of Birth',
  value,
  onChange,
  error: externalError,
  helperText,
  disabled = false,
  required = false,
  min,
  max,
  isDob = false,
  className = '',
  id,
}) => {
  const { dateFormat, formatDate } = useUserDateTime();
  const [internalWarning, setInternalWarning] = useState<string | null>(null);

  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'date-picker');

  // Compute 120 years boundary
  const { defaultMin, defaultMax } = useMemo(() => {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    const maxDate = today;
    return {
      defaultMin: minDate.toISOString().split('T')[0],
      defaultMax: maxDate.toISOString().split('T')[0],
    };
  }, []);

  const effectiveMin = min ?? (isDob ? defaultMin : undefined);
  const effectiveMax = max ?? (isDob ? defaultMax : undefined);

  const validateInputDate = (dateVal: string) => {
    if (!dateVal) {
      setInternalWarning(null);
      return;
    }
    const parsed = new Date(dateVal);
    if (isNaN(parsed.getTime())) {
      setInternalWarning('Invalid date of birth');
      return;
    }

    if (isDob) {
      const year = parsed.getFullYear();
      const todayYear = new Date().getFullYear();
      if (todayYear - year > 120 || parsed > new Date()) {
        setInternalWarning('Invalid date of birth');
        return;
      }
    }
    setInternalWarning(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    validateInputDate(val);
    onChange(val);
  };

  const handleFocus = () => {
    if (isDob && !value) {
      // Default initial jump to year 2000 for effortless adult DOB selection
      onChange('2000-01-01');
      setInternalWarning(null);
    }
  };

  const activeError = externalError || internalWarning;

  const isValidDate = Boolean(value && !activeError);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={inputId} className="block text-xs font-semibold text-textDefault">
            {label} {required && <span className="text-semantic-danger">*</span>}
          </label>
          <span className="text-[11px] text-textMuted font-mono uppercase">
            {dateFormat}
          </span>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          {isValidDate ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <Calendar className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <input
          id={inputId}
          type="date"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          disabled={disabled}
          min={effectiveMin}
          max={effectiveMax}
          className={`relative w-full bg-white border text-sm text-textDefault rounded-xl pl-10 pr-3.5 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-gray-50 disabled:text-textMuted ${
            activeError
              ? 'border-semantic-danger focus:ring-semantic-danger'
              : isValidDate
              ? 'border-semantic-success focus:ring-semantic-success'
              : 'border-borderDefault'
          }`}
        />
      </div>

      {activeError ? (
        <div className="mt-1 flex items-center gap-1 text-xs text-semantic-danger font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{activeError}</span>
        </div>
      ) : helperText ? (
        <p className="mt-1 text-xs text-textMuted">{helperText}</p>
      ) : null}
    </div>
  );
};
