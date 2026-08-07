import { describe, expect, it } from 'bun:test';
import { toLongNotation, toShortNotation } from './notation';

describe('toShortNotation', () => {
  it('uses Azerbaijani suffixes by default', () => {
    expect(toShortNotation(1500)).toBe('1,5 min');
    expect(toShortNotation(2500000)).toBe('2,5 mln');
    expect(toShortNotation(3200000000)).toBe('3,2 mlrd');
    expect(toShortNotation(4100000000000)).toBe('4,1 trln');
  });

  it('trims trailing zero decimals', () => {
    expect(toShortNotation(1000000)).toBe('1 mln');
  });

  it('supports the English locale', () => {
    expect(toShortNotation(2500000, { locale: 'en' })).toBe('2.5M');
    expect(toShortNotation(1000, { locale: 'en' })).toBe('1K');
  });

  it('leaves small numbers unscaled', () => {
    expect(toShortNotation(999)).toBe('999');
    expect(toShortNotation(0)).toBe('0');
  });

  it('preserves the sign', () => {
    expect(toShortNotation(-1500)).toBe('-1,5 min');
  });

  it('respects a custom decimal precision', () => {
    expect(toShortNotation(1234, { decimals: 2 })).toBe('1,23 min');
  });

  it('throws for non-finite values', () => {
    expect(() => toShortNotation(Infinity)).toThrow(RangeError);
  });
});

describe('toLongNotation', () => {
  it('pairs digit groups with scale words', () => {
    expect(toLongNotation(1234567)).toBe('1 milyon 234 min 567');
    expect(toLongNotation(1000)).toBe('1 min');
    expect(toLongNotation(1000000)).toBe('1 milyon');
  });

  it('returns "0" for zero', () => {
    expect(toLongNotation(0)).toBe('0');
  });

  it('preserves the sign', () => {
    expect(toLongNotation(-1234567)).toBe('-1 milyon 234 min 567');
  });

  it('supports a custom group separator', () => {
    expect(toLongNotation(1234567, { groupSeparator: ', ' })).toBe('1 milyon, 234 min, 567');
  });

  it('throws for non-integers', () => {
    expect(() => toLongNotation(1.5)).toThrow(TypeError);
  });
});
