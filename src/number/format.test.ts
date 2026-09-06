import { describe, expect, it } from 'bun:test'
import { az } from '../locale/az'
import { formatNumber, parseNumber } from './format'

describe('formatNumber', () => {
  it('groups thousands with a comma by default', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
  })

  it('formats decimals with a period by default', () => {
    expect(formatNumber(1234567.891, { decimals: 2 })).toBe('1,234,567.89')
  })

  it('pads decimals to the requested precision', () => {
    expect(formatNumber(5, { decimals: 2 })).toBe('5.00')
  })

  it('keeps natural precision when decimals is omitted', () => {
    expect(formatNumber(1000.5)).toBe('1,000.5')
  })

  it('formats negative numbers with a leading minus', () => {
    expect(formatNumber(-1234.5, { decimals: 1 })).toBe('-1,234.5')
  })

  it('does not prefix zero with a minus sign', () => {
    expect(formatNumber(-0)).toBe('0')
  })

  it('supports custom separators, overriding the locale default', () => {
    expect(
      formatNumber(1234567.89, { decimals: 2, thousandsSeparator: ' ', decimalSeparator: ',' }),
    ).toBe('1 234 567,89')
  })

  it('handles small numbers without a separator', () => {
    expect(formatNumber(42)).toBe('42')
  })

  it('throws for non-finite values', () => {
    expect(() => formatNumber(Infinity)).toThrow(RangeError)
    expect(() => formatNumber(NaN)).toThrow(RangeError)
  })

  it('does not prefix a value that rounds to zero with a minus sign', () => {
    expect(formatNumber(-0.4, { decimals: 0 })).toBe('0')
    expect(formatNumber(-0.001, { decimals: 2 })).toBe('0.00')
  })

  describe('decimal-safe rounding', () => {
    it('rounds the value as written, not as the binary float is stored', () => {
      // (1.005).toFixed(2) is "1.00" because 1.005 * 100 is 100.49999999999999.
      expect(formatNumber(1.005, { decimals: 2 })).toBe('1.01')
      expect(formatNumber(2.675, { decimals: 2 })).toBe('2.68')
      expect(formatNumber(-1.005, { decimals: 2 })).toBe('-1.01')
      expect(formatNumber(1.255, { decimals: 2 })).toBe('1.26')
      expect(formatNumber(8.345, { decimals: 2 })).toBe('8.35')
    })

    it('pads with zeros once the value has fewer digits than requested', () => {
      expect(formatNumber(1.005, { decimals: 4 })).toBe('1.0050')
      expect(formatNumber(0.1, { decimals: 3 })).toBe('0.100')
    })

    it('keeps large values exact after rounding', () => {
      expect(formatNumber(268435456.47635, { decimals: 4 })).toBe('268,435,456.4764')
      expect(formatNumber(-268435456.47635, { decimals: 4 })).toBe('-268,435,456.4764')
    })

    it('throws RangeError for a non-integer decimals', () => {
      expect(() => formatNumber(1.234, { decimals: 1.5 })).toThrow(RangeError)
      expect(() => formatNumber(1.234, { decimals: NaN })).toThrow(RangeError)
    })

    it('throws RangeError for a negative decimals', () => {
      expect(() => formatNumber(1234, { decimals: -1 })).toThrow(RangeError)
    })
  })

  describe('roundingMode', () => {
    it('defaults to halfUp (rounds half away from zero)', () => {
      expect(formatNumber(2.5, { decimals: 0 })).toBe('3')
      expect(formatNumber(-2.5, { decimals: 0 })).toBe('-3')
    })

    it('halfDown rounds half toward zero', () => {
      expect(formatNumber(2.5, { decimals: 0, roundingMode: 'halfDown' })).toBe('2')
      expect(formatNumber(-2.5, { decimals: 0, roundingMode: 'halfDown' })).toBe('-2')
    })

    it('halfEven rounds a tie to the nearest even digit', () => {
      expect(formatNumber(2.5, { decimals: 0, roundingMode: 'halfEven' })).toBe('2')
      expect(formatNumber(3.5, { decimals: 0, roundingMode: 'halfEven' })).toBe('4')
    })

    it('ceil always rounds toward positive infinity', () => {
      expect(formatNumber(1.1, { decimals: 0, roundingMode: 'ceil' })).toBe('2')
      expect(formatNumber(-1.5, { decimals: 0, roundingMode: 'ceil' })).toBe('-1')
    })

    it('floor always rounds toward negative infinity', () => {
      expect(formatNumber(1.9, { decimals: 0, roundingMode: 'floor' })).toBe('1')
      expect(formatNumber(-1.5, { decimals: 0, roundingMode: 'floor' })).toBe('-2')
    })

    it('has no effect when decimals is omitted', () => {
      expect(formatNumber(1.9, { roundingMode: 'floor' })).toBe('1.9')
    })

    describe('on an exact decimal tie that toFixed would miss', () => {
      // 2.675 is stored as 2.67499999999999982236431605997495353221893310546875,
      // so (2.675).toFixed(2) is "2.67"; decimal-safe rounding sees the tie.
      it('halfUp rounds the tie away from zero', () => {
        expect(formatNumber(2.675, { decimals: 2, roundingMode: 'halfUp' })).toBe('2.68')
        expect(formatNumber(-2.675, { decimals: 2, roundingMode: 'halfUp' })).toBe('-2.68')
      })

      it('halfDown rounds the tie toward zero', () => {
        expect(formatNumber(2.675, { decimals: 2, roundingMode: 'halfDown' })).toBe('2.67')
        expect(formatNumber(-2.675, { decimals: 2, roundingMode: 'halfDown' })).toBe('-2.67')
      })

      it('halfEven rounds the tie to the even digit', () => {
        expect(formatNumber(2.675, { decimals: 2, roundingMode: 'halfEven' })).toBe('2.68')
        expect(formatNumber(2.665, { decimals: 2, roundingMode: 'halfEven' })).toBe('2.66')
        expect(formatNumber(1.005, { decimals: 2, roundingMode: 'halfEven' })).toBe('1.00')
      })

      it('ceil and floor are unaffected by the tie but still see the exact digits', () => {
        expect(formatNumber(2.675, { decimals: 2, roundingMode: 'ceil' })).toBe('2.68')
        expect(formatNumber(2.675, { decimals: 2, roundingMode: 'floor' })).toBe('2.67')
        expect(formatNumber(-2.675, { decimals: 2, roundingMode: 'ceil' })).toBe('-2.67')
        expect(formatNumber(-2.675, { decimals: 2, roundingMode: 'floor' })).toBe('-2.68')
        // 1.1 * 100 is 110.00000000000001, which Math.ceil would push to 111;
        // 4.35 * 100 is 434.99999999999994, which Math.floor would drop to 434.
        expect(formatNumber(1.1, { decimals: 2, roundingMode: 'ceil' })).toBe('1.10')
        expect(formatNumber(4.35, { decimals: 2, roundingMode: 'floor' })).toBe('4.35')
      })
    })
  })

  describe('{ locale: az }', () => {
    it('groups thousands with a space and formats decimals with a comma', () => {
      expect(formatNumber(1234567, { locale: az })).toBe('1 234 567')
      expect(formatNumber(1234567.891, { decimals: 2, locale: az })).toBe('1 234 567,89')
    })

    it('lets an explicit separator override the locale default', () => {
      expect(formatNumber(1234567.89, { decimals: 2, locale: az, decimalSeparator: '.' })).toBe(
        '1 234 567.89',
      )
    })
  })
})

describe('parseNumber', () => {
  it('parses a formatted string back into a number', () => {
    expect(parseNumber('1,234,567.89')).toBeCloseTo(1234567.89)
  })

  it('round-trips with formatNumber', () => {
    const formatted = formatNumber(987654.32, { decimals: 2 })
    expect(parseNumber(formatted)).toBeCloseTo(987654.32)
  })

  it('supports custom separators', () => {
    expect(
      parseNumber('1 234 567,89', { thousandsSeparator: ' ', decimalSeparator: ',' }),
    ).toBeCloseTo(1234567.89)
  })

  it('parses negative numbers', () => {
    expect(parseNumber('-1,234.5')).toBeCloseTo(-1234.5)
  })

  it('throws on an empty string', () => {
    expect(() => parseNumber('')).toThrow(SyntaxError)
    expect(() => parseNumber('   ')).toThrow(SyntaxError)
  })

  it('throws when the string is not a number', () => {
    expect(() => parseNumber('not a number')).toThrow(SyntaxError)
  })

  it('supports a locale', () => {
    expect(parseNumber('1 234 567,89', { locale: az })).toBeCloseTo(1234567.89)
  })
})

describe('separator validation', () => {
  it('throws when formatNumber is given one separator for both roles', () => {
    expect(() =>
      formatNumber(1234.5, { decimals: 2, thousandsSeparator: '.', decimalSeparator: '.' }),
    ).toThrow(RangeError)
    expect(() =>
      formatNumber(1.5, { decimals: 1, thousandsSeparator: '', decimalSeparator: '' }),
    ).toThrow(RangeError)
  })

  it('throws when parseNumber is given one separator for both roles', () => {
    // Silently returned 1 before 2026-09-01: both separators were stripped.
    expect(() => parseNumber('0.001', { thousandsSeparator: '.', decimalSeparator: '.' })).toThrow(
      RangeError,
    )
  })

  it('still accepts an empty thousands separator alongside a real decimal one', () => {
    expect(formatNumber(1234.5, { decimals: 1, thousandsSeparator: '' })).toBe('1234.5')
    expect(parseNumber('1234.5', { thousandsSeparator: '' })).toBeCloseTo(1234.5)
  })
})
