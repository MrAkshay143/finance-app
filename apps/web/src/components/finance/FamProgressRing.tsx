import React from 'react';

export interface AvatarProgressRingProps {
  initials?: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  onClick?: () => void;
}

/**
 * Avatar with two-tone green (#1F9D55) / blue (#2554EE) progress ring
 * per Plan/frontend.md §2 specifications.
 */
export const AvatarProgressRing: React.FC<AvatarProgressRingProps> = ({
  initials = 'FT',
  avatarUrl,
  size = 40,
  className = '',
  onClick,
}) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const halfCircumference = circumference / 2;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="User profile"
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1B3A] active:scale-95 transition-transform ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="w-full h-full -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#132A5C"
          strokeWidth={strokeWidth}
        />
        {/* Green segment (top half) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1F9D55"
          strokeWidth={strokeWidth}
          strokeDasharray={`${halfCircumference * 0.9} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        {/* Blue segment (bottom half) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2554EE"
          strokeWidth={strokeWidth}
          strokeDasharray={`${halfCircumference * 0.85} ${circumference}`}
          strokeDashoffset={-halfCircumference}
          strokeLinecap="round"
        />
      </svg>
      {/* Inner Avatar Content */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Profile Avatar"
          className="absolute rounded-full object-cover shadow-inner"
          style={{
            width: size - strokeWidth * 2 - 2,
            height: size - strokeWidth * 2 - 2,
          }}
        />
      ) : (
        <span
          className="absolute rounded-full bg-[#0E2248] text-white flex items-center justify-center font-bold tracking-tight shadow-inner"
          style={{
            width: size - strokeWidth * 2 - 2,
            height: size - strokeWidth * 2 - 2,
            fontSize: Math.max(11, Math.round(size * 0.32)),
          }}
        >
          {initials}
        </span>
      )}
    </button>
  );
};

export interface FamDonutRingProps {
  score?: number;
  grade?: string;
  statusLabel?: string;
  progressPercentage?: number;
  size?: number;
  label?: string;
  className?: string;
}

/**
 * 3-segment FAM donut ring (Income green, Expense red, Investment purple)
 * per Plan/frontend.md §2 & §3.
 */
export const FamDonutRing: React.FC<FamDonutRingProps> = ({
  score,
  grade = '—',
  statusLabel,
  progressPercentage,
  size = 120,
  label,
  className = '',
}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = (circumference - 18) / 3;

  const displayProgress =
    progressPercentage !== undefined
      ? progressPercentage
      : score !== undefined
      ? score
      : 0;
  const displayLabel = statusLabel || label || (grade === '—' ? 'Unassessed' : 'Assessed');

  // Grade badge styling
  const gradeColor =
    grade === 'A+' || grade === 'A'
      ? 'bg-semantic-success-bg text-semantic-success border-semantic-success/20'
      : grade === 'B'
      ? 'bg-brand-primary-soft text-brand-primary border-brand-primary/20'
      : grade === 'C'
      ? 'bg-semantic-danger-bg text-semantic-danger border-semantic-danger/20'
      : 'bg-gray-100 text-textMuted border-gray-200';

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        className="w-full h-full -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E7ECF5"
          strokeWidth={strokeWidth}
        />
        {/* 1. Income Segment - Green (#1F9D55) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1F9D55"
          strokeWidth={strokeWidth}
          strokeDasharray={`${segmentLength} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        {/* 2. Expense Segment - Red (#E23D3D) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E23D3D"
          strokeWidth={strokeWidth}
          strokeDasharray={`${segmentLength} ${circumference}`}
          strokeDashoffset={-(segmentLength + 6)}
          strokeLinecap="round"
        />
        {/* 3. Investment Segment - Purple (#7C4DE0) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#7C4DE0"
          strokeWidth={strokeWidth}
          strokeDasharray={`${segmentLength} ${circumference}`}
          strokeDashoffset={-(segmentLength * 2 + 12)}
          strokeLinecap="round"
        />
      </svg>
      {/* Center Grade Badge, Label, and Progress Percentage */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
        <span
          className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-md text-[11px] font-extrabold border leading-none ${gradeColor}`}
        >
          {grade}
        </span>
        <span className="text-sm font-extrabold text-textDefault tracking-tight mt-0.5 leading-tight">
          {`${displayProgress}%`}
        </span>
        <span className="text-[9px] text-textMuted leading-tight font-medium truncate max-w-[80%]">
          {displayLabel}
        </span>
      </div>
    </div>
  );
};
