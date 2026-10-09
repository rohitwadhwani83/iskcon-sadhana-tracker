/**
 * Sanitizes a field for CSV export to prevent Formula Injection (CWE-1236).
 * Values beginning with '=', '+', '-', '@', '\t', or '\r' can be interpreted
 * as executable formulas or commands by spreadsheet applications (Excel, Calc, Google Sheets).
 */
export function sanitizeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }

  let str = String(val);

  // Check dangerous prefixes before stripping leading tabs or whitespace
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some((prefix) => str.startsWith(prefix))) {
    str = `'${str}`;
  } else {
    // Also check trimmed string for formulas that might be padded with spaces
    const trimmed = str.trimStart();
    if (dangerousPrefixes.some((prefix) => trimmed.startsWith(prefix))) {
      str = `'${str}`;
    }
  }

  // Escape internal double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Builds a valid RFC-4180 CSV string with sanitization against formula injection.
 */
export function generateCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const headerLine = headers.map((h) => sanitizeCsvField(h)).join(',');
  const rowLines = rows.map((row) =>
    row.map((cell) => sanitizeCsvField(cell)).join(',')
  );
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Normalizes a phone number to standard E.164 format.
 * E.164 numbers start with '+' followed by country code and subscriber number (up to 15 digits).
 * Examples: "+919876543210", "+14155552671"
 */
export function normalizeToE164(rawPhone: string, defaultCountryCode = '+91'): string {
  if (!rawPhone) return '';

  // Remove spaces, hyphens, parentheses, and dots
  let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '');

  // If already starts with '+', ensure only digits follow
  if (cleaned.startsWith('+')) {
    const digitsOnly = cleaned.slice(1).replace(/\D/g, '');
    return digitsOnly ? `+${digitsOnly}` : '';
  }

  // If starts with 00 (international call prefix), replace with '+'
  if (cleaned.startsWith('00')) {
    const digitsOnly = cleaned.slice(2).replace(/\D/g, '');
    return digitsOnly ? `+${digitsOnly}` : '';
  }

  // Remove leading 0 (domestic trunk prefix) if present
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return '';

  // If 10 digits and default country code is provided
  if (digits.length === 10) {
    const prefix = defaultCountryCode.startsWith('+')
      ? defaultCountryCode
      : `+${defaultCountryCode}`;
    return `${prefix}${digits}`;
  }

  // If already contains country code (e.g., 919876543210 with 12 digits)
  return `+${digits}`;
}

/**
 * Validates whether an E.164 formatted string meets length and structure standards.
 */
export function isValidE164(phone: string): boolean {
  // Regex: starts with +, followed by 7 to 15 digits
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  return e164Regex.test(phone);
}
