import { describe, expect, it } from 'bun:test'
import { parseLongNotation, parseShortNotation, toLongNotation, toShortNotation } from './notation'

describe('toShortNotation', () => {
  it('uses Azerbaijani suffixes by default', () => {
    expect(toShortNotation(1500)).toBe('1,5 min')
    expect(toShortNotation(2500000)).toBe('2,5 mln')
    expect(toShortNotation(3200000000)).toBe('3,2 mlrd')
    expect(toShortNotation(4100000000000)).toBe('4,1 trln')
  })

  it('trims trailing zero decimals', () => {
    expect(toShortNotation(1000000)).toBe('1 mln')
  })

  it('supports the English locale', () => {
    expect(toShortNotation(2500000, { locale: 'en' })).toBe('2.5M')
    expect(toShortNotation(1000, { locale: 'en' })).toBe('1K')
  })

  it('leaves small numbers unscaled', () => {
    expect(toShortNotation(999)).toBe('999')
    expect(toShortNotation(0)).toBe('0')
  })

  it('preserves the sign', () => {
    expect(toShortNotation(-1500)).toBe('-1,5 min')
  })

  it('respects a custom decimal precision', () => {
    expect(toShortNotation(1234, { decimals: 2 })).toBe('1,23 min')
  })

  it('throws for non-finite values', () => {
    expect(() => toShortNotation(Infinity)).toThrow(RangeError)
  })
})

describe('parseShortNotation', () => {
  it('round-trips with toShortNotation for Azerbaijani suffixes', () => {
    expect(parseShortNotation('1,5 min')).toBe(1500)
    expect(parseShortNotation('2,5 mln')).toBe(2500000)
    expect(parseShortNotation('3,2 mlrd')).toBe(3200000000)
    expect(parseShortNotation('4,1 trln')).toBe(4100000000000)
  })

  it('parses whole scaled values', () => {
    expect(parseShortNotation('1 mln')).toBe(1000000)
  })

  it('round-trips with toShortNotation for the English locale', () => {
    expect(parseShortNotation('2.5M', { locale: 'en' })).toBe(2500000)
    expect(parseShortNotation('1K', { locale: 'en' })).toBe(1000)
  })

  it('parses unscaled numbers', () => {
    expect(parseShortNotation('999')).toBe(999)
    expect(parseShortNotation('0')).toBe(0)
  })

  it('preserves the sign', () => {
    expect(parseShortNotation('-1,5 min')).toBe(-1500)
  })

  it('is case-insensitive on the suffix', () => {
    expect(parseShortNotation('2.5m', { locale: 'en' })).toBe(2500000)
  })

  it('throws for an empty string', () => {
    expect(() => parseShortNotation('')).toThrow(SyntaxError)
  })

  it('throws for an unparseable string', () => {
    expect(() => parseShortNotation('not a number')).toThrow(SyntaxError)
  })
})

describe('toLongNotation', () => {
  it('pairs digit groups with scale words', () => {
    expect(toLongNotation(1234567)).toBe('1 milyon 234 min 567')
    expect(toLongNotation(1000)).toBe('1 min')
    expect(toLongNotation(1000000)).toBe('1 milyon')
  })

  it('returns "0" for zero', () => {
    expect(toLongNotation(0)).toBe('0')
  })

  it('preserves the sign', () => {
    expect(toLongNotation(-1234567)).toBe('-1 milyon 234 min 567')
  })

  it('supports a custom group separator', () => {
    expect(toLongNotation(1234567, { groupSeparator: ', ' })).toBe('1 milyon, 234 min, 567')
  })

  it('throws for non-integers', () => {
    expect(() => toLongNotation(1.5)).toThrow(TypeError)
  })
})

describe('parseLongNotation', () => {
  it('pairs digit groups with scale words back into a number', () => {
    expect(parseLongNotation('1 milyon 234 min 567')).toBe(1234567)
    expect(parseLongNotation('1 min')).toBe(1000)
    expect(parseLongNotation('1 milyon')).toBe(1000000)
  })

  it('parses "0"', () => {
    expect(parseLongNotation('0')).toBe(0)
  })

  it('preserves the sign', () => {
    expect(parseLongNotation('-1 milyon 234 min 567')).toBe(-1234567)
  })

  it('supports a custom group separator', () => {
    expect(parseLongNotation('1 milyon, 234 min, 567', { groupSeparator: ', ' })).toBe(1234567)
  })

  it('round-trips with toLongNotation', () => {
    expect(parseLongNotation(toLongNotation(1234567))).toBe(1234567)
    expect(parseLongNotation(toLongNotation(-987654321))).toBe(-987654321)
  })

  it('throws for an empty string', () => {
    expect(() => parseLongNotation('')).toThrow(SyntaxError)
  })

  it('throws for an unparseable string', () => {
    expect(() => parseLongNotation('abc milyon')).toThrow(SyntaxError)
  })
})
