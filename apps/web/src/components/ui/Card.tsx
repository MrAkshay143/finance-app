import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  interactive?: boolean;
  as?: 'div' | 'section' | 'article';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  onClick,
  interactive = false,
  as: Component = 'div',
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }[padding];

  const isClickable = Boolean(interactive || onClick);
  const interactiveClasses = isClickable
    ? 'cursor-pointer hover:shadow-card-hover hover:border-blue-200 transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2'
    : '';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
    props.onKeyDown?.(e);
  };

  return (
    <Component
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? (props.role || 'button') : props.role}
      tabIndex={onClick ? (props.tabIndex ?? 0) : props.tabIndex}
      className={`bg-surface rounded-card border border-borderDefault shadow-card ${paddingClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
