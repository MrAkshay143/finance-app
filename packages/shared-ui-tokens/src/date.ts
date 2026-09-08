/**
 * Centralized Date Formatting Utilities
 * Standardizes display dates across the entire application to DD-MM-YYYY format
 * (e.g. 01-09-2026, 30-09-2026).
 */

export interface FormatDateOptions {
  /**
   * Set true when formatting an exclusive range end boundary that may be at midnight
   * (00:00:00.000). It will roll back 1 millisecond so the date falls on the inclusive
   * last day of the intended range.
   */
  isEndDate?: boolean;
}

/**
 * Parses any valid date representation (Date, ISO string, timestamp, YYYY-MM-DD, DD-MM-YYYY)
 * and formats it strictly as DD-MM-YYYY.
 *
 * @param date - Date instance, ISO string, timestamp, or string
 * @param options - FormatDateOptions
 * @returns Formatted date string in DD-MM-YYYY format, or empty string if invalid/missing
 *
 * @example
 * formatDate('2026-09-01') // "01-09-2026"
 * formatDate(new Date(2026, 8, 1)) // "01-09-2026"
 * formatDate('2026-08-31T18:30:00.000Z') // "01-09-2026" (in IST UTC+5:30)
 */
export function formatDate(
  date?: string | Date | number | null,
  options?: FormatDateOptions
): string {
  if (date === null || date === undefined || date === '') {
    return '';
  }

  // Fast path for string formats without timestamps
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return '';

    // Already in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // Standard YYYY-MM-DD format (no time component)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      return `${d}-${m}-${y}`;
    }
  }

  try {
    let d: Date;
    if (date instanceof Date) {
      d = new Date(date.getTime());
    } else if (typeof date === 'number') {
      d = new Date(date);
    } else {
      d = new Date(String(date));
    }

    if (isNaN(d.getTime())) {
      return typeof date === 'string' ? date : '';
    }

    // Roll back exclusive midnight boundary by 1ms if flagged
    if (options?.isEndDate && d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) {
      d = new Date(d.getTime() - 1);
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  } catch {
    return typeof date === 'string' ? date : '';
  }
}

/**
 * Formats a date range into standard DD-MM-YYYY — DD-MM-YYYY format.
 * Handles both ISO timestamp boundaries and clean YYYY-MM-DD inputs.
 *
 * @example
 * formatDateRange('2026-09-01', '2026-09-30') // "01-09-2026 — 30-09-2026"
 * formatDateRange('2026-08-31T18:30:00.000Z', '2026-09-30T18:30:00.000Z') // "01-09-2026 — 30-09-2026"
 */
export function formatDateRange(
  startDate?: string | Date | number | null,
  endDate?: string | Date | number | null,
  separator = ' — '
): string {
  const start = formatDate(startDate, { isEndDate: false });
  const end = formatDate(endDate, { isEndDate: true });

  if (start && end) {
    return `${start}${separator}${end}`;
  }
  return start || end || '';
}

/**
 * Formats a date and time in DD-MM-YYYY HH:mm format.
 *
 * @example
 * formatDateTime('2026-09-01T14:30:00Z') // "01-09-2026 20:00" (in IST)
 */
export function formatDateTime(
  date?: string | Date | number | null
): string {
  if (date === null || date === undefined || date === '') {
    return '';
  }

  const datePart = formatDate(date);
  if (!datePart) return '';

  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return datePart;

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${datePart} ${hours}:${minutes}`;
  } catch {
    return datePart;
  }
}
