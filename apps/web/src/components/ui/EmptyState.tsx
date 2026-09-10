import React from 'react';
import { Button } from './Button.js';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-6 bg-surface rounded-card border border-borderDefault shadow-card ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-primary-soft text-brand-primary flex items-center justify-center mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-base font-bold text-textDefault tracking-tight mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-textMuted max-w-xs leading-relaxed mb-5">
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {actionLabel && onAction && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAction}
            icon={actionIcon}
            className="px-3.5 py-1.5 text-xs font-bold shadow-xs"
          >
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSecondaryAction}
            className="px-3.5 py-1.5 text-xs font-bold shadow-xs"
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
