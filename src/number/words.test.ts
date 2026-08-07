import { describe, expect, it } from 'bun:test';
import { numberToWords } from './words';

describe('numberToWords', () => {
  it('spells zero', () => {
    expect(numberToWords(0)).toBe('sıfır');
  });

  it('spells single digits', () => {
    expect(numberToWords(1)).toBe('bir');
    expect(numberToWords(9)).toBe('doqquz');
  });

  it('spells teens and tens', () => {
    expect(numberToWords(10)).toBe('on');
    expect(numberToWords(11)).toBe('on bir');
    expect(numberToWords(21)).toBe('iyirmi bir');
    expect(numberToWords(99)).toBe('doxsan doqquz');
  });

  it('drops "bir" before "yüz" for exactly one hundred', () => {
    expect(numberToWords(100)).toBe('yüz');
    expect(numberToWords(200)).toBe('iki yüz');
    expect(numberToWords(999)).toBe('doqquz yüz doxsan doqquz');
  });

  it('drops "bir" before "min" but keeps it before "milyon"', () => {
    expect(numberToWords(1000)).toBe('min');
    expect(numberToWords(2000)).toBe('iki min');
    expect(numberToWords(1000000)).toBe('bir milyon');
  });

  it('spells composite large numbers', () => {
    expect(numberToWords(1234)).toBe('min iki yüz otuz dörd');
    expect(numberToWords(1234567)).toBe('bir milyon iki yüz otuz dörd min beş yüz altmış yeddi');
  });

  it('spells billions and trillions', () => {
    expect(numberToWords(1000000000)).toBe('bir milyard');
    expect(numberToWords(1000000000000)).toBe('bir trilyon');
  });

  it('prefixes negative numbers with "mənfi"', () => {
    expect(numberToWords(-5)).toBe('mənfi beş');
    expect(numberToWords(-1234)).toBe('mənfi min iki yüz otuz dörd');
  });

  it('reads decimals as a whole number joined by "tam"', () => {
    expect(numberToWords(12.34)).toBe('on iki tam otuz dörd');
    expect(numberToWords(0.5)).toBe('sıfır tam əlli');
  });

  it('carries a rounded decimal into the integer part', () => {
    expect(numberToWords(0.999)).toBe('bir');
  });

  it('throws for non-finite values', () => {
    expect(() => numberToWords(Infinity)).toThrow(RangeError);
    expect(() => numberToWords(NaN)).toThrow(RangeError);
  });

  it('throws when the magnitude is out of range', () => {
    expect(() => numberToWords(10 ** 16)).toThrow(RangeError);
  });
});
