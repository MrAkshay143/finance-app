/**
 * Centralized Date Formatting Utility for Web
 * Standardizes date formatting to DD-MM-YYYY across web components and pages.
 */
export {
  formatDate,
  formatDateRange,
  formatDateTime,
  type FormatDateOptions,
} from '@finance/shared-ui-tokens';

/**
 * Calculates human-readable relative time string:
 * "just now", "${m}m ago", "${h}h ago", "${d}d ago".
 */
export function formatRelativeTime(dateStr: string | Date): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '';
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return 'just now';
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

/**
 * Formats a date or year-month string to "Month Year" (e.g., "September 2026").
 */
export function formatMonthYear(dateStr: string | Date): string {
  if (!dateStr) return '';
  let d: Date;
  if (typeof dateStr === 'string') {
    const trimmed = dateStr.trim();
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
      const [y, m] = trimmed.split('-').map(Number);
      d = new Date(y, m - 1, 1);
    } else {
      d = new Date(trimmed);
    }
  } else {
    d = dateStr;
  }
  if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

