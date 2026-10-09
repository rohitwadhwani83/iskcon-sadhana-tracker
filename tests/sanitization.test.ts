import { describe, it, expect } from 'vitest';
import {
  sanitizeCsvField,
  generateCsv,
  normalizeToE164,
  isValidE164,
} from '../src/lib/utils/sanitization';

describe('Sanitization & Security Utilities', () => {
  it('prevents CSV formula injection by prepending single quote to formula prefixes', () => {
    // Formula characters: =, +, -, @, \t, \r
    expect(sanitizeCsvField('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"');
    expect(sanitizeCsvField('+12345')).toBe('"\'+12345"');
    expect(sanitizeCsvField('-5+cmd|')).toBe('"\'-5+cmd|"');
    expect(sanitizeCsvField('@dangerous')).toBe('"\'@dangerous"');
    expect(sanitizeCsvField('\tcmd')).toBe('"\'\tcmd"');

    // Safe regular strings
    expect(sanitizeCsvField('Srila Prabhupada')).toBe('"Srila Prabhupada"');
    expect(sanitizeCsvField('16')).toBe('"16"');
  });

  it('escapes internal quotes in CSV cells according to RFC-4180', () => {
    expect(sanitizeCsvField('Reading "Bhagavad-gita"')).toBe('"Reading ""Bhagavad-gita"""');
  });

  it('generates fully sanitized CSV string for reporting exports', () => {
    const headers = ['Devotee Name', 'Rounds', 'Formula Note'];
    const rows = [
      ['Rupa Goswami', 16, '=MALICIOUS()'],
      ['Sanatana Goswami', 16, 'Normal reflection'],
    ];

    const csv = generateCsv(headers, rows);
    expect(csv).toContain('"Devotee Name","Rounds","Formula Note"');
    expect(csv).toContain('"Rupa Goswami","16","\'=MALICIOUS()"');
    expect(csv).toContain('"Sanatana Goswami","16","Normal reflection"');
  });

  it('normalizes phone numbers to standard E.164 format', () => {
    // Indian numbers with different domestic formats
    expect(normalizeToE164('9876543210')).toBe('+919876543210');
    expect(normalizeToE164('09876543210')).toBe('+919876543210');
    expect(normalizeToE164('+91 98765 43210')).toBe('+919876543210');
    expect(normalizeToE164('+91-98765-43210')).toBe('+919876543210');

    // US number
    expect(normalizeToE164('+1 (415) 555-2671')).toBe('+14155552671');

    // International with 00 prefix
    expect(normalizeToE164('00447911123456')).toBe('+447911123456');
  });

  it('validates E.164 phone numbers correctly', () => {
    expect(isValidE164('+919876543210')).toBe(true);
    expect(isValidE164('+14155552671')).toBe(true);
    expect(isValidE164('9876543210')).toBe(false); // missing '+'
    expect(isValidE164('+01234')).toBe(false); // invalid starting digit
    expect(isValidE164('')).toBe(false);
  });
});
