// Sanitizes cell values against CSV/formula injection (RFC 4180) while preserving pure numbers
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';

  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // Check if this value is a pure number (integers, floats, negative/positive numbers)
  const isPureNumber =
    typeof val === 'number' ||
    (!isNaN(Number(str)) && /^[+-]?\d+(\.\d+)?$/.test(str.trim()));

  if (!isPureNumber) {
    const trimmed = str.trimStart();
    const firstChar = trimmed.charAt(0);
    // Neutralize formula trigger characters
    if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === '\t' || firstChar === '\r') {
      str = `'${str}`;
    }
  }

  // RFC 4180 CSV escaping: wrap in quotes if contains comma, quote, newline, or carriage return
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}
