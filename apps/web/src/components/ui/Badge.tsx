import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'investment'
  | 'transfer'
  | 'neutral'
  | 'primary';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 rounded-full font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 rounded-full font-semibold',
  }[size];

  const variantClasses: Record<BadgeVariant, string> = {
    success: 'bg-semantic-success-bg text-semantic-success',
    danger: 'bg-semantic-danger-bg text-semantic-danger',
    warning: 'bg-semantic-warning-bg text-semantic-warning',
    investment: 'bg-semantic-investment-bg text-semantic-investment',
    transfer: 'bg-semantic-transfer-bg text-semantic-transfer',
    neutral: 'bg-gray-100 text-textMuted',
    primary: 'bg-brand-primary-soft text-brand-primary',
  };

  return (
    <span
      className={`inline-flex items-center shrink-0 tracking-wide ${sizeClasses} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
