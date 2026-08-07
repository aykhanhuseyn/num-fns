import { describe, expect, it } from 'bun:test';
import { getOrdinalSuffix, toOrdinal, withSuffix } from './suffix';

describe('getOrdinalSuffix', () => {
  it('follows vowel harmony for 1 through 10', () => {
    expect(getOrdinalSuffix(1)).toBe('ci'); // bir
    expect(getOrdinalSuffix(2)).toBe('ci'); // iki
    expect(getOrdinalSuffix(3)).toBe('cü'); // üç
    expect(getOrdinalSuffix(4)).toBe('cü'); // dörd
    expect(getOrdinalSuffix(5)).toBe('ci'); // beş
    expect(getOrdinalSuffix(6)).toBe('cı'); // altı
    expect(getOrdinalSuffix(7)).toBe('ci'); // yeddi
    expect(getOrdinalSuffix(8)).toBe('ci'); // səkkiz
    expect(getOrdinalSuffix(9)).toBe('cu'); // doqquz
    expect(getOrdinalSuffix(10)).toBe('cu'); // on
  });

  it('follows vowel harmony for round tens and hundred', () => {
    expect(getOrdinalSuffix(20)).toBe('ci'); // iyirmi
    expect(getOrdinalSuffix(30)).toBe('cu'); // otuz
    expect(getOrdinalSuffix(40)).toBe('cı'); // qırx
    expect(getOrdinalSuffix(50)).toBe('ci'); // əlli
    expect(getOrdinalSuffix(60)).toBe('cı'); // altmış
    expect(getOrdinalSuffix(70)).toBe('ci'); // yetmiş
    expect(getOrdinalSuffix(80)).toBe('ci'); // səksən
    expect(getOrdinalSuffix(90)).toBe('cı'); // doxsan
    expect(getOrdinalSuffix(100)).toBe('cü'); // yüz
  });

  it('follows vowel harmony for scale words', () => {
    expect(getOrdinalSuffix(1000)).toBe('ci'); // min
    expect(getOrdinalSuffix(1000000)).toBe('cu'); // bir milyon
  });

  it('throws for negative or non-integer values', () => {
    expect(() => getOrdinalSuffix(-1)).toThrow(RangeError);
    expect(() => getOrdinalSuffix(1.5)).toThrow(RangeError);
  });
});

describe('toOrdinal', () => {
  it('formats the ordinal with a hyphen by default', () => {
    expect(toOrdinal(1)).toBe('1-ci');
    expect(toOrdinal(3)).toBe('3-cü');
    expect(toOrdinal(21)).toBe('21-ci');
    expect(toOrdinal(100)).toBe('100-cü');
  });

  it('supports a custom separator', () => {
    expect(toOrdinal(5, ' ')).toBe('5 ci');
  });
});

describe('withSuffix', () => {
  it('joins a value and suffix with a space by default', () => {
    expect(withSuffix(120, 'kg')).toBe('120 kg');
  });

  it('supports a custom separator', () => {
    expect(withSuffix(5, 'cı', { separator: '-' })).toBe('5-cı');
  });
});
