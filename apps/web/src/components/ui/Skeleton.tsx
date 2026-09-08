import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-md ${className}`}
      {...props}
    />
  );
};

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="bg-surface rounded-card border border-borderDefault p-4 space-y-3 shadow-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-7 w-24 rounded" />
      <div className="space-y-2 pt-1">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-3 w-1/3 rounded" />
            <Skeleton className="h-3 w-1/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const TransactionItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-3.5 bg-surface rounded-2xl border border-borderDefault shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-2.5 w-16 rounded" />
        </div>
      </div>
      <div className="space-y-1.5 text-right flex flex-col items-end">
        <Skeleton className="h-3.5 w-16 rounded" />
        <Skeleton className="h-2.5 w-10 rounded" />
      </div>
    </div>
  );
};

export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface rounded-card border border-borderDefault p-4 shadow-card space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-6 w-28 rounded" />
      <Skeleton className="h-2.5 w-full rounded-full mt-2" />
    </div>
  );
};
