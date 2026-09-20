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

  it('keeps the minus sign of a negative zero', () => {
    expect(formatNumber(-0)).toBe('-0')
    expect(formatNumber(0)).toBe('0')
    // `-0n` does not exist, so a bigint zero is never signed.
    expect(formatNumber(BigInt('-0'))).toBe('0')
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

  it('keeps the minus sign of a value that rounds away to zero', () => {
    expect(formatNumber(-0.4, { decimals: 0 })).toBe('-0')
    expect(formatNumber(-0.001, { decimals: 2 })).toBe('-0.00')
    expect(formatNumber(0.4, { decimals: 0 })).toBe('0')
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

  describe('bigint', () => {
    it('groups a bigint exactly like the equivalent number', () => {
      expect(formatNumber(BigInt(1234567))).toBe('1,234,567')
      expect(formatNumber(BigInt(1234567))).toBe(formatNumber(1234567))
      expect(formatNumber(BigInt(42))).toBe('42')
      expect(formatNumber(BigInt(999))).toBe('999')
      expect(formatNumber(BigInt(1000))).toBe('1,000')
    })

    it('formats zero without a sign or fraction', () => {
      expect(formatNumber(BigInt(0))).toBe('0')
      expect(formatNumber(BigInt(0), { decimals: 2 })).toBe('0.00')
    })

    it('formats negative values with a leading minus', () => {
      expect(formatNumber(BigInt(-1234))).toBe('-1,234')
      expect(formatNumber(BigInt('-1234567890123456789'))).toBe('-1,234,567,890,123,456,789')
    })

    it('pads with zeros to the requested number of decimals', () => {
      expect(formatNumber(BigInt(10), { decimals: 2 })).toBe('10.00')
      expect(formatNumber(BigInt(1234567), { decimals: 3 })).toBe('1,234,567.000')
      expect(formatNumber(BigInt(-5), { decimals: 1 })).toBe('-5.0')
    })

    it('emits no fraction for decimals: 0', () => {
      expect(formatNumber(BigInt(10), { decimals: 0 })).toBe('10')
      expect(formatNumber(BigInt(10), { decimals: 0 })).not.toContain('.')
    })

    it('keeps every digit of a value past Number.MAX_SAFE_INTEGER', () => {
      expect(formatNumber(BigInt('1234567890123456789'))).toBe('1,234,567,890,123,456,789')
      expect(formatNumber(BigInt('9007199254740993'))).toBe('9,007,199,254,740,993')
      expect(formatNumber(BigInt('1000000000000000000000'))).toBe('1,000,000,000,000,000,000,000')
    })

    it("uses the locale's separators", () => {
      expect(formatNumber(BigInt('1234567890123456789'), { locale: az })).toBe(
        '1 234 567 890 123 456 789',
      )
      expect(formatNumber(BigInt('1234567890123456789'), { locale: az, decimals: 2 })).toBe(
        '1 234 567 890 123 456 789,00',
      )
    })

    it('lets explicit separators override the locale default', () => {
      expect(
        formatNumber(BigInt(1234567), {
          decimals: 2,
          thousandsSeparator: '.',
          decimalSeparator: ',',
        }),
      ).toBe('1.234.567,00')
      expect(formatNumber(BigInt(1234567), { thousandsSeparator: '' })).toBe('1234567')
    })

    it('still rejects one separator for both roles', () => {
      expect(() =>
        formatNumber(BigInt(1234), { thousandsSeparator: '.', decimalSeparator: '.' }),
      ).toThrow(RangeError)
      expect(() =>
        formatNumber(BigInt(1234), { thousandsSeparator: '', decimalSeparator: '' }),
      ).toThrow(RangeError)
    })

    it('rejects the same invalid decimals values as the number path', () => {
      expect(() => formatNumber(BigInt(1234), { decimals: -1 })).toThrow(RangeError)
      expect(() => formatNumber(BigInt(1234), { decimals: 1.5 })).toThrow(RangeError)
      expect(() => formatNumber(BigInt(1234), { decimals: NaN })).toThrow(RangeError)
      expect(() => formatNumber(BigInt(1234), { decimals: Infinity })).toThrow(RangeError)
      expect(() => formatNumber(BigInt(1234), { decimals: 1.5 })).toThrow(
        'formatNumber: decimals must be a non-negative integer, received 1.5',
      )
    })

    it('ignores roundingMode, since there is nothing to round', () => {
      const value = BigInt(-1234567)
      for (const roundingMode of ['halfUp', 'halfDown', 'halfEven', 'ceil', 'floor'] as const) {
        expect(formatNumber(value, { roundingMode })).toBe('-1,234,567')
        expect(formatNumber(value, { decimals: 2, roundingMode })).toBe('-1,234,567.00')
      }
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

  describe("{ output: 'bigint' }", () => {
    it('returns an exact bigint for a value past Number.MAX_SAFE_INTEGER', () => {
      const parsed = parseNumber('1,234,567,890,123,456,789', { output: 'bigint' })
      expect(typeof parsed).toBe('bigint')
      expect(parsed).toBe(BigInt('1234567890123456789'))
      expect(parseNumber('9,007,199,254,740,993', { output: 'bigint' })).toBe(
        BigInt('9007199254740993'),
      )
    })

    it('round-trips with formatNumber exactly', () => {
      const value = BigInt('-1234567890123456789')
      expect(parseNumber(formatNumber(value), { output: 'bigint' })).toBe(value)
      expect(parseNumber(formatNumber(value, { decimals: 2 }), { output: 'bigint' })).toBe(value)
    })

    it('accepts a fraction made only of zeros', () => {
      expect(parseNumber('1,234.00', { output: 'bigint' })).toBe(BigInt(1234))
      expect(parseNumber('0.0', { output: 'bigint' })).toBe(BigInt(0))
    })

    it('parses small and negative values', () => {
      expect(parseNumber('42', { output: 'bigint' })).toBe(BigInt(42))
      expect(parseNumber('-42', { output: 'bigint' })).toBe(BigInt(-42))
      expect(parseNumber('0', { output: 'bigint' })).toBe(BigInt(0))
      expect(parseNumber('-0', { output: 'bigint' })).toBe(BigInt(0))
    })

    it('reads exponent notation exactly', () => {
      expect(parseNumber('1e3', { output: 'bigint' })).toBe(BigInt(1000))
      expect(parseNumber('1.5e3', { output: 'bigint' })).toBe(BigInt(1500))
      expect(parseNumber('1e21', { output: 'bigint' })).toBe(BigInt('1000000000000000000000'))
    })

    it('throws RangeError for a value that is not a whole number', () => {
      expect(() => parseNumber('1.5', { output: 'bigint' })).toThrow(RangeError)
      expect(() => parseNumber('1,234.56', { output: 'bigint' })).toThrow(RangeError)
      expect(() => parseNumber('1e-3', { output: 'bigint' })).toThrow(RangeError)
      expect(() => parseNumber('1.5', { output: 'bigint' })).toThrow(
        'parseNumber: "1.5" is not a whole number and cannot be returned as a bigint',
      )
    })

    it('throws RangeError for a form Number() accepts but a bigint cannot hold', () => {
      expect(() => parseNumber('Infinity', { output: 'bigint' })).toThrow(RangeError)
      expect(() => parseNumber('Infinity', { output: 'bigint' })).toThrow(
        'parseNumber: "Infinity" is not a finite number',
      )
      expect(() => parseNumber('-Infinity', { output: 'bigint' })).toThrow(RangeError)
      expect(() => parseNumber('0x1f', { output: 'bigint' })).toThrow(RangeError)
    })

    it("uses the locale's separators", () => {
      expect(parseNumber('1 234 567 890 123 456 789', { locale: az, output: 'bigint' })).toBe(
        BigInt('1234567890123456789'),
      )
      expect(parseNumber('1 234,00', { locale: az, output: 'bigint' })).toBe(BigInt(1234))
      expect(() => parseNumber('1 234,50', { locale: az, output: 'bigint' })).toThrow(RangeError)
    })

    it('honours explicit separators', () => {
      expect(
        parseNumber('1.234.567,00', {
          thousandsSeparator: '.',
          decimalSeparator: ',',
          output: 'bigint',
        }),
      ).toBe(BigInt(1234567))
    })

    it('still throws SyntaxError for an empty string', () => {
      expect(() => parseNumber('', { output: 'bigint' })).toThrow(SyntaxError)
      expect(() => parseNumber('   ', { output: 'bigint' })).toThrow(SyntaxError)
    })

    it('still throws SyntaxError for garbage, before any bigint conversion', () => {
      expect(() => parseNumber('not a number', { output: 'bigint' })).toThrow(SyntaxError)
      expect(() => parseNumber('1.2.3', { output: 'bigint' })).toThrow(SyntaxError)
      expect(() => parseNumber('12abc', { output: 'bigint' })).toThrow(SyntaxError)
    })

    it('still rejects one separator for both roles', () => {
      expect(() =>
        parseNumber('1.000', { thousandsSeparator: '.', decimalSeparator: '.', output: 'bigint' }),
      ).toThrow(RangeError)
    })
  })

  describe("{ output: 'number' }", () => {
    it('behaves exactly like the default', () => {
      expect(parseNumber('1,234,567.89', { output: 'number' })).toBe(parseNumber('1,234,567.89'))
      expect(parseNumber('1,234,567.89', { output: 'number' })).toBeCloseTo(1234567.89)
      expect(parseNumber('-42', { output: 'number' })).toBe(-42)
      expect(typeof parseNumber('42', { output: 'number' })).toBe('number')
    })

    it('is not exact past Number.MAX_SAFE_INTEGER, which is what output: bigint is for', () => {
      // `Number()` rounds, so the number path silently returns a neighbour.
      expect(parseNumber('9,007,199,254,740,993')).toBe(9007199254740992)
      expect(parseNumber('9,007,199,254,740,993', { output: 'bigint' })).toBe(
        BigInt('9007199254740993'),
      )
    })
  })

  it('throws RangeError for an output value other than "number" or "bigint"', () => {
    // @ts-expect-error — deliberately invalid output to exercise the runtime guard
    expect(() => parseNumber('1', { output: 'string' })).toThrow(RangeError)
    // @ts-expect-error — deliberately invalid output to exercise the runtime guard
    expect(() => parseNumber('1', { output: 'BigInt' })).toThrow(
      'parseNumber: output must be "number" or "bigint", received BigInt',
    )
  })

  it('types the result through the output option (compile-time check)', () => {
    // These assignments are the test: `check:type` fails if the overloads
    // resolve to the wrong return type. The runtime assertions just keep the
    // declared types honest.
    const asBigInt: bigint = parseNumber('1', { output: 'bigint' })
    const asNumber: number = parseNumber('1')
    const asNumberExplicit: number = parseNumber('1', { output: 'number' })
    const asNumberWithLocale: number = parseNumber('1', { locale: az })
    const dynamicOutput = (Math.random() < 2 ? 'bigint' : 'number') as 'bigint' | 'number'
    const either: number | bigint = parseNumber('1', { output: dynamicOutput })
    expect(typeof asBigInt).toBe('bigint')
    expect(typeof asNumber).toBe('number')
    expect(typeof asNumberExplicit).toBe('number')
    expect(typeof asNumberWithLocale).toBe('number')
    expect(typeof either).toBe('bigint')
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
