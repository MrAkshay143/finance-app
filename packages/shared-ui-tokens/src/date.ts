// Centralized date formatting utilities standardizing display to DD-MM-YYYY

export interface FormatDateOptions {
  // Flag to roll back exclusive midnight boundary by 1ms for inclusive ranges
  isEndDate?: boolean;
}

// Parse valid date input and format strictly as DD-MM-YYYY
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

// Format date range into standard DD-MM-YYYY - DD-MM-YYYY
export function formatDateRange(
  startDate?: string | Date | number | null,
  endDate?: string | Date | number | null,
  separator = ' - '
): string {
  const start = formatDate(startDate, { isEndDate: false });
  const end = formatDate(endDate, { isEndDate: true });

  if (start && end) {
    return `${start}${separator}${end}`;
  }
  return start || end || '';
}

// Format date and time in DD-MM-YYYY HH:mm format
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
