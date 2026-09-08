import React from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  'aria-label'?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
  'aria-label': ariaLabelProp,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const effectiveAriaLabel = ariaLabelProp || ariaLabel || 'Options';
  const containerPadding = size === 'sm' ? 'p-1 gap-1' : 'p-1.5 gap-1.5';
  const itemPadding = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs';

  return (
    <div
      role="tablist"
      aria-label={effectiveAriaLabel}
      className={`flex items-center overflow-x-auto no-scrollbar bg-gray-100/80 rounded-pill ${containerPadding} ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center justify-center font-semibold rounded-pill whitespace-nowrap transition-all duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${itemPadding} ${
              isSelected
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-textMuted hover:text-textDefault hover:bg-white/60'
            }`}
          >
            {option.icon && <span className="mr-1.5 shrink-0" aria-hidden="true">{option.icon}</span>}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-textMuted'
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
