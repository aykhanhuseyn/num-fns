import { describe, expect, it } from 'bun:test'
import { az } from '../locale/az'
import { ru } from '../locale/ru'
import { parseLongNotation, parseShortNotation, toLongNotation, toShortNotation } from './notation'

describe('toShortNotation', () => {
  it('uses English K/M/B/T suffixes by default', () => {
    expect(toShortNotation(1500)).toBe('1.5K')
    expect(toShortNotation(2500000)).toBe('2.5M')
    expect(toShortNotation(3200000000)).toBe('3.2B')
    expect(toShortNotation(4100000000000)).toBe('4.1T')
  })

  it('trims trailing zero decimals', () => {
    expect(toShortNotation(1000000)).toBe('1M')
  })

  it('supports the Azerbaijani locale', () => {
    expect(toShortNotation(1500, { locale: az })).toBe('1,5 min')
    expect(toShortNotation(2500000, { locale: az })).toBe('2,5 mln')
  })

  it('supports other locales via their own scale abbreviations', () => {
    expect(toShortNotation(1500, { locale: ru })).toBe('1,5 тыс')
  })

  it('leaves small numbers unscaled', () => {
    expect(toShortNotation(999)).toBe('999')
    expect(toShortNotation(0)).toBe('0')
  })

  it('preserves the sign', () => {
    expect(toShortNotation(-1500)).toBe('-1.5K')
  })

  it('respects a custom decimal precision', () => {
    expect(toShortNotation(1234, { decimals: 2 })).toBe('1.23K')
  })

  it('throws for non-finite values', () => {
    expect(() => toShortNotation(Infinity)).toThrow(RangeError)
  })
})

describe('parseShortNotation', () => {
  it('round-trips with toShortNotation for the English default', () => {
    expect(parseShortNotation('1.5K')).toBe(1500)
    expect(parseShortNotation('2.5M')).toBe(2500000)
    expect(parseShortNotation('3.2B')).toBe(3200000000)
    expect(parseShortNotation('4.1T')).toBe(4100000000000)
  })

  it('parses whole scaled values', () => {
    expect(parseShortNotation('1M')).toBe(1000000)
  })

  it('round-trips with toShortNotation for the Azerbaijani locale', () => {
    expect(parseShortNotation('2,5 mln', { locale: az })).toBe(2500000)
    expect(parseShortNotation('1 min', { locale: az })).toBe(1000)
  })

  it('parses unscaled numbers', () => {
    expect(parseShortNotation('999')).toBe(999)
    expect(parseShortNotation('0')).toBe(0)
  })

  it('preserves the sign', () => {
    expect(parseShortNotation('-1.5K')).toBe(-1500)
  })

  it('is case-insensitive on the suffix', () => {
    expect(parseShortNotation('2.5m')).toBe(2500000)
  })

  it('throws for an empty string', () => {
    expect(() => parseShortNotation('')).toThrow(SyntaxError)
  })

  it('throws for an unparseable string', () => {
    expect(() => parseShortNotation('not a number')).toThrow(SyntaxError)
  })
})

describe('toLongNotation', () => {
  it('pairs digit groups with English scale words by default', () => {
    expect(toLongNotation(1234567)).toBe('1 million 234 thousand 567')
    expect(toLongNotation(1000)).toBe('1 thousand')
    expect(toLongNotation(1000000)).toBe('1 million')
  })

  it('supports the Azerbaijani locale', () => {
    expect(toLongNotation(1234567, { locale: az })).toBe('1 milyon 234 min 567')
  })

  it('resolves plural-inflected scale words via the locale', () => {
    expect(toLongNotation(1000, { locale: ru })).toBe('1 тысяча')
    expect(toLongNotation(2000, { locale: ru })).toBe('2 тысячи')
    expect(toLongNotation(5000, { locale: ru })).toBe('5 тысяч')
  })

  it('returns "0" for zero', () => {
    expect(toLongNotation(0)).toBe('0')
  })

  it('preserves the sign', () => {
    expect(toLongNotation(-1234567)).toBe('-1 million 234 thousand 567')
  })

  it('supports a custom group separator', () => {
    expect(toLongNotation(1234567, { groupSeparator: ', ' })).toBe('1 million, 234 thousand, 567')
  })

  it('throws for non-integers', () => {
    expect(() => toLongNotation(1.5)).toThrow(TypeError)
  })

  it('throws for non-finite values', () => {
    expect(() => toLongNotation(Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => toLongNotation(Number.NEGATIVE_INFINITY)).toThrow(RangeError)
    expect(() => toLongNotation(Number.NaN)).toThrow(RangeError)
  })

  it('spells up to the largest magnitude the locale has a scale word for', () => {
    // `en` stops at "trillion", so 1000 ** 5 - 1 is the ceiling; one more
    // would need a scale word that does not exist in `en.words.scales`.
    expect(toLongNotation(999_999_999_999_999)).toBe(
      '999 trillion 999 billion 999 million 999 thousand 999',
    )
    expect(() => toLongNotation(1e15)).toThrow(RangeError)
  })
})

describe('parseLongNotation', () => {
  it('pairs digit groups with English scale words back into a number', () => {
    expect(parseLongNotation('1 million 234 thousand 567')).toBe(1234567)
    expect(parseLongNotation('1 thousand')).toBe(1000)
    expect(parseLongNotation('1 million')).toBe(1000000)
  })

  it('supports the Azerbaijani locale', () => {
    expect(parseLongNotation('1 milyon 234 min 567', { locale: az })).toBe(1234567)
  })

  it('resolves every plural-inflected surface form of a scale word', () => {
    expect(parseLongNotation('1 тысяча', { locale: ru })).toBe(1000)
    expect(parseLongNotation('2 тысячи', { locale: ru })).toBe(2000)
    expect(parseLongNotation('5 тысяч', { locale: ru })).toBe(5000)
  })

  it('parses "0"', () => {
    expect(parseLongNotation('0')).toBe(0)
  })

  it('preserves the sign', () => {
    expect(parseLongNotation('-1 million 234 thousand 567')).toBe(-1234567)
  })

  it('supports a custom group separator', () => {
    expect(parseLongNotation('1 million, 234 thousand, 567', { groupSeparator: ', ' })).toBe(
      1234567,
    )
  })

  it('round-trips with toLongNotation', () => {
    expect(parseLongNotation(toLongNotation(1234567))).toBe(1234567)
    expect(parseLongNotation(toLongNotation(-987654321))).toBe(-987654321)
  })

  it('throws for an empty string', () => {
    expect(() => parseLongNotation('')).toThrow(SyntaxError)
  })

  it('throws for an unparseable string', () => {
    expect(() => parseLongNotation('abc million')).toThrow(SyntaxError)
  })
})
