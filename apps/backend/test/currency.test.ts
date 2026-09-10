import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { toPaise } from '../src/utils/currency.js';
import { ValidationError } from '../src/utils/errors.js';

describe('Currency Utility (toPaise)', () => {
  it('converts positive numbers to BigInt paise', () => {
    expect(toPaise(100)).toBe(10000n);
    expect(toPaise(10.5)).toBe(1050n);
    expect(toPaise(0.01)).toBe(1n);
  });

  it('converts string representation of amount to BigInt paise', () => {
    expect(toPaise('100')).toBe(10000n);
    expect(toPaise('49.99')).toBe(4999n);
  });

  it('converts Prisma.Decimal to BigInt paise', () => {
    const dec = new Prisma.Decimal('123.45');
    expect(toPaise(dec)).toBe(12345n);
  });

  it('returns bigint as-is when valid', () => {
    expect(toPaise(5000n)).toBe(5000n);
  });

  it('handles zero correctly based on allowZero flag', () => {
    expect(() => toPaise(0, false)).toThrow(ValidationError);
    expect(toPaise(0, true)).toBe(0n);
    expect(toPaise('0', true)).toBe(0n);
    expect(toPaise(0n, true)).toBe(0n);
    expect(() => toPaise(0n, false)).toThrow(ValidationError);
  });

  it('rejects negative amounts even with allowZero', () => {
    expect(() => toPaise(-10, false)).toThrow(ValidationError);
    expect(() => toPaise(-10, true)).toThrow(ValidationError);
    expect(() => toPaise(-5n, true)).toThrow(ValidationError);
    expect(() => toPaise('-15.5', true)).toThrow(ValidationError);
  });

  it('rejects invalid inputs like NaN, null, undefined', () => {
    expect(() => toPaise('abc')).toThrow(ValidationError);
    expect(() => toPaise(NaN)).toThrow(ValidationError);
    expect(() => toPaise(null)).toThrow(ValidationError);
    expect(() => toPaise(undefined)).toThrow(ValidationError);
    expect(toPaise(null, true)).toBe(0n);
    expect(toPaise(undefined, true)).toBe(0n);
  });
});
