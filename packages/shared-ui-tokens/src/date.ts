// Centralized date formatting utilities standardizing display to DD-MM-YYYY and 12-hour AM/PM

export type DateFormatType = 'DD-MM-YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD/MM/YYYY';
export type TimeFormatType = '12h' | '24h';

export interface FormatDateOptions {
  // Flag to roll back exclusive midnight boundary by 1ms for inclusive ranges
  isEndDate?: boolean;
  format?: DateFormatType;
}

export interface FormatDateTimeOptions {
  dateFormat?: DateFormatType;
  timeFormat?: TimeFormatType;
}

// Format a date given day, month, and year parts according to pattern
export function assembleDateString(day: string, month: string, year: string | number, format: DateFormatType = 'DD-MM-YYYY'): string {
  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'DD-MM-YYYY':
    default:
      return `${day}-${month}-${year}`;
  }
}

// Parse valid date input and format according to specified or default (DD-MM-YYYY) pattern
export function formatDate(
  date?: string | Date | number | null,
  options?: FormatDateOptions
): string {
  if (date === null || date === undefined || date === '') {
    return '';
  }

  const targetFormat: DateFormatType = options?.format || 'DD-MM-YYYY';

  // Fast path for string formats without timestamps
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return '';

    // Standard YYYY-MM-DD format (e.g. ISO date)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      return assembleDateString(d, m, y, targetFormat);
    }

    // Already in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      if (targetFormat === 'DD-MM-YYYY') return trimmed;
      const [d, m, y] = trimmed.split('-');
      return assembleDateString(d, m, y, targetFormat);
    }

    // Already in DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      if (targetFormat === 'DD/MM/YYYY') return trimmed;
      const [d, m, y] = trimmed.split('/');
      return assembleDateString(d, m, y, targetFormat);
    }

    // Already in MM/DD/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [p1, p2, y] = trimmed.split('/');
      return assembleDateString(p2, p1, y, targetFormat);
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

    return assembleDateString(day, month, year, targetFormat);
  } catch {
    return typeof date === 'string' ? date : '';
  }
}

export interface FormatDateRangeOptions {
  separator?: string;
  format?: DateFormatType;
}

// Format date range into standard DD-MM-YYYY - DD-MM-YYYY (or custom format)
export function formatDateRange(
  startDate?: string | Date | number | null,
  endDate?: string | Date | number | null,
  separatorOrOptions?: string | FormatDateRangeOptions,
  formatParam?: DateFormatType
): string {
  let separator = ' - ';
  let format: DateFormatType = 'DD-MM-YYYY';

  if (typeof separatorOrOptions === 'object' && separatorOrOptions !== null) {
    if (separatorOrOptions.separator) separator = separatorOrOptions.separator;
    if (separatorOrOptions.format) format = separatorOrOptions.format;
  } else if (typeof separatorOrOptions === 'string') {
    separator = separatorOrOptions;
    if (formatParam) format = formatParam;
  }

  const start = formatDate(startDate, { isEndDate: false, format });
  const end = formatDate(endDate, { isEndDate: true, format });

  if (start && end) {
    return `${start}${separator}${end}`;
  }
  return start || end || '';
}

// Format date and time in DD-MM-YYYY hh:mm AM/PM format (defaults to 12h AM/PM per user specification)
export function formatDateTime(
  date?: string | Date | number | null,
  options?: FormatDateTimeOptions
): string {
  if (date === null || date === undefined || date === '') {
    return '';
  }

  const dateFormat: DateFormatType = options?.dateFormat || 'DD-MM-YYYY';
  const timeFormat: TimeFormatType = options?.timeFormat || '12h';

  const datePart = formatDate(date, { format: dateFormat });
  if (!datePart) return '';

  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return datePart;

    const rawHours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');

    if (timeFormat === '24h') {
      const hours24 = String(rawHours).padStart(2, '0');
      return `${datePart} ${hours24}:${minutes}`;
    }

    // Default: 12-hour clock with AM/PM (e.g. 08:30 PM)
    const hours12 = rawHours % 12 || 12;
    const period = rawHours >= 12 ? 'PM' : 'AM';
    return `${datePart} ${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
  } catch {
    return datePart;
  }
}
