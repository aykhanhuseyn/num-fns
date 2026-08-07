import { describe, expect, it } from 'bun:test';
import { formatNumber, parseNumber } from './format';

describe('formatNumber', () => {
  it('groups thousands with a space by default', () => {
    expect(formatNumber(1234567)).toBe('1 234 567');
  });

  it('formats decimals with a comma by default', () => {
    expect(formatNumber(1234567.891, { decimals: 2 })).toBe('1 234 567,89');
  });

  it('pads decimals to the requested precision', () => {
    expect(formatNumber(5, { decimals: 2 })).toBe('5,00');
  });

  it('keeps natural precision when decimals is omitted', () => {
    expect(formatNumber(1000.5)).toBe('1 000,5');
  });

  it('formats negative numbers with a leading minus', () => {
    expect(formatNumber(-1234.5, { decimals: 1 })).toBe('-1 234,5');
  });

  it('does not prefix zero with a minus sign', () => {
    expect(formatNumber(-0)).toBe('0');
  });

  it('supports custom separators', () => {
    expect(
      formatNumber(1234567.89, { decimals: 2, thousandsSeparator: ',', decimalSeparator: '.' }),
    ).toBe('1,234,567.89');
  });

  it('handles small numbers without a separator', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('throws for non-finite values', () => {
    expect(() => formatNumber(Infinity)).toThrow(RangeError);
    expect(() => formatNumber(NaN)).toThrow(RangeError);
  });
});

describe('parseNumber', () => {
  it('parses a formatted string back into a number', () => {
    expect(parseNumber('1 234 567,89')).toBeCloseTo(1234567.89);
  });

  it('round-trips with formatNumber', () => {
    const formatted = formatNumber(987654.32, { decimals: 2 });
    expect(parseNumber(formatted)).toBeCloseTo(987654.32);
  });

  it('supports custom separators', () => {
    expect(
      parseNumber('1,234,567.89', { thousandsSeparator: ',', decimalSeparator: '.' }),
    ).toBeCloseTo(1234567.89);
  });

  it('parses negative numbers', () => {
    expect(parseNumber('-1 234,5')).toBeCloseTo(-1234.5);
  });

  it('throws on an empty string', () => {
    expect(() => parseNumber('')).toThrow(SyntaxError);
    expect(() => parseNumber('   ')).toThrow(SyntaxError);
  });

  it('throws when the string is not a number', () => {
    expect(() => parseNumber('not a number')).toThrow(SyntaxError);
  });
});
