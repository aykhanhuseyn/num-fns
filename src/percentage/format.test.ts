import { describe, expect, it } from 'bun:test'
import { az } from '../locale/az'
import { formatPercentage, parsePercentage } from './format'

describe('formatPercentage', () => {
  it('formats a percentage value with no space by default', () => {
    expect(formatPercentage(45)).toBe('45%')
  })

  it('supports decimals and a space before the sign, using the locale decimal separator', () => {
    expect(formatPercentage(45.5, { decimals: 1, space: true })).toBe('45.5 %')
  })

  it('multiplies a ratio by 100 when requested', () => {
    expect(formatPercentage(0.455, { decimals: 1, multiplyBy100: true })).toBe('45.5%')
  })

  it('formats permille with the ‰ sign', () => {
    expect(formatPercentage(45, { unit: 'permille' })).toBe('45‰')
  })

  it('multiplies a ratio by 1000 for permille when requested', () => {
    expect(formatPercentage(0.0455, { decimals: 1, multiplyBy100: true, unit: 'permille' })).toBe(
      '45.5‰',
    )
  })

  it('formats basis points with the ‱ sign', () => {
    expect(formatPercentage(125, { unit: 'basisPoint' })).toBe('125‱')
  })

  it('multiplies a ratio by 10000 for basis points when requested', () => {
    expect(formatPercentage(0.0125, { decimals: 0, multiplyBy100: true, unit: 'basisPoint' })).toBe(
      '125‱',
    )
  })

  it('applies roundingMode like formatNumber', () => {
    expect(formatPercentage(2.5, { decimals: 0, roundingMode: 'halfDown' })).toBe('2%')
  })

  it('supports a locale for the decimal separator', () => {
    expect(formatPercentage(45.5, { decimals: 1, locale: az })).toBe('45,5%')
  })

  describe('decimal-safe scaling and rounding', () => {
    it('scales a ratio exactly before rounding', () => {
      // 1.005 * 100 is 100.49999999999999, which used to round down to "100%".
      expect(formatPercentage(1.005, { multiplyBy100: true })).toBe('101%')
      expect(formatPercentage(0.07, { decimals: 0, multiplyBy100: true })).toBe('7%')
      // 0.0455 * 1000 is 45.49999999999999, which used to round down to "45‰".
      expect(formatPercentage(0.0455, { multiplyBy100: true, unit: 'permille' })).toBe('46‰')
      expect(formatPercentage(0.0455, { decimals: 1, multiplyBy100: true, unit: 'permille' })).toBe(
        '45.5‰',
      )
      // 1.005 * 10000 is 10049.999999999998.
      expect(formatPercentage(1.005, { multiplyBy100: true, unit: 'basisPoint' })).toBe('10,050‱')
    })

    it('rounds an exact decimal tie per roundingMode', () => {
      expect(formatPercentage(1.005, { decimals: 2 })).toBe('1.01%')
      expect(formatPercentage(1.005, { decimals: 2, roundingMode: 'halfEven' })).toBe('1.00%')
      expect(formatPercentage(1.005, { decimals: 2, roundingMode: 'halfDown' })).toBe('1.00%')
      expect(formatPercentage(0.01005, { decimals: 2, multiplyBy100: true })).toBe('1.01%')
    })

    it('throws RangeError for a non-integer decimals', () => {
      expect(() => formatPercentage(45.5, { decimals: 0.5 })).toThrow(RangeError)
    })
  })

  describe('bigint input', () => {
    it('formats a whole value exactly', () => {
      expect(formatPercentage(BigInt(45))).toBe('45%')
      expect(formatPercentage(BigInt('1234567890123456789'))).toBe('1,234,567,890,123,456,789%')
      expect(formatPercentage(BigInt(45), { space: true })).toBe('45 %')
    })

    it('keeps the sign and formats zero', () => {
      expect(formatPercentage(BigInt(-45))).toBe('-45%')
      expect(formatPercentage(BigInt(0))).toBe('0%')
    })

    it('scales exactly in bigint arithmetic when multiplyBy100 is set', () => {
      expect(formatPercentage(BigInt(3), { multiplyBy100: true })).toBe('300%')
      expect(formatPercentage(BigInt(-3), { multiplyBy100: true })).toBe('-300%')
      expect(formatPercentage(BigInt(3), { multiplyBy100: true, unit: 'permille' })).toBe('3,000‰')
      expect(formatPercentage(BigInt(3), { multiplyBy100: true, unit: 'basisPoint' })).toBe(
        '30,000‱',
      )
      expect(formatPercentage(BigInt('123456789012345678'), { multiplyBy100: true })).toBe(
        '12,345,678,901,234,567,800%',
      )
    })

    it('pads decimals with zeros, using the locale decimal separator, and ignores roundingMode', () => {
      expect(formatPercentage(BigInt(45), { decimals: 1 })).toBe('45.0%')
      expect(formatPercentage(BigInt(45), { decimals: 2, locale: az })).toBe('45,00%')
      expect(formatPercentage(BigInt(45), { decimals: 1, roundingMode: 'floor' })).toBe('45.0%')
    })

    it('throws RangeError for a non-integer decimals', () => {
      expect(() => formatPercentage(BigInt(45), { decimals: 0.5 })).toThrow(RangeError)
    })
  })
})

describe('parsePercentage', () => {
  it('parses a percentage string', () => {
    expect(parsePercentage('45.5%')).toBeCloseTo(45.5)
  })

  it('returns a ratio when asRatio is set', () => {
    expect(parsePercentage('45.5%', { asRatio: true })).toBeCloseTo(0.455)
  })

  it('parses permille strings', () => {
    expect(parsePercentage('45.5‰', { unit: 'permille' })).toBeCloseTo(45.5)
    expect(parsePercentage('45.5‰', { unit: 'permille', asRatio: true })).toBeCloseTo(0.0455)
  })

  it('parses basis-point strings', () => {
    expect(parsePercentage('125‱', { unit: 'basisPoint' })).toBeCloseTo(125)
    expect(parsePercentage('125‱', { unit: 'basisPoint', asRatio: true })).toBeCloseTo(0.0125)
  })

  it('supports a locale', () => {
    expect(parsePercentage('45,5%', { locale: az })).toBeCloseTo(45.5)
  })

  it('divides by the scale exactly in decimal when asRatio is set', () => {
    expect(parsePercentage('7%', { asRatio: true })).toBe(0.07)
    // 1.1 / 100 is 0.011000000000000001 in floating point.
    expect(parsePercentage('1.1%', { asRatio: true })).toBe(0.011)
    expect(parsePercentage('0.7‰', { unit: 'permille', asRatio: true })).toBe(0.0007)
    expect(parsePercentage('1.1‱', { unit: 'basisPoint', asRatio: true })).toBe(0.00011)
    expect(
      parsePercentage(formatPercentage(1.005, { multiplyBy100: true }), { asRatio: true }),
    ).toBe(1.01)
  })

  describe("{ output: 'bigint' }", () => {
    it('returns a whole value as an exact bigint', () => {
      expect(parsePercentage('45%', { output: 'bigint' })).toBe(BigInt(45))
      expect(parsePercentage('45.00%', { output: 'bigint' })).toBe(BigInt(45))
      expect(parsePercentage('-45%', { output: 'bigint' })).toBe(BigInt(-45))
      expect(parsePercentage('0%', { output: 'bigint' })).toBe(BigInt(0))
      expect(parsePercentage('1,234,567,890,123,456,789%', { output: 'bigint' })).toBe(
        BigInt('1234567890123456789'),
      )
    })

    it('strips the requested unit sign and honours the locale separators', () => {
      expect(parsePercentage('45‰', { unit: 'permille', output: 'bigint' })).toBe(BigInt(45))
      expect(parsePercentage('125‱', { unit: 'basisPoint', output: 'bigint' })).toBe(BigInt(125))
      expect(parsePercentage('1 234,00%', { locale: az, output: 'bigint' })).toBe(BigInt(1234))
    })

    it('round-trips with formatPercentage exactly beyond Number.MAX_SAFE_INTEGER', () => {
      const value = BigInt('-123456789012345678901234567890')
      expect(parsePercentage(formatPercentage(value), { output: 'bigint' })).toBe(value)
      expect(
        parsePercentage(formatPercentage(value, { decimals: 2, locale: az }), {
          locale: az,
          output: 'bigint',
        }),
      ).toBe(value)
    })

    it('throws RangeError when the value is not a whole number', () => {
      expect(() => parsePercentage('45.5%', { output: 'bigint' })).toThrow(RangeError)
      expect(() => parsePercentage('45.5%', { output: 'bigint' })).toThrow(
        'not a whole number and cannot be returned as a bigint',
      )
    })

    it('throws RangeError when combined with asRatio', () => {
      expect(() => parsePercentage('50%', { output: 'bigint', asRatio: true })).toThrow(RangeError)
      expect(() => parsePercentage('50%', { output: 'bigint', asRatio: true })).toThrow(
        'parsePercentage: asRatio produces a fraction and cannot be combined with output "bigint"',
      )
      // Even a value that would divide evenly is refused: the option pair is the problem.
      expect(() => parsePercentage('100%', { output: 'bigint', asRatio: true })).toThrow(RangeError)
    })

    it('throws RangeError for an output value that is neither "number" nor "bigint"', () => {
      expect(() => parsePercentage('45%', { output: 'float' as 'bigint' })).toThrow(RangeError)
      expect(() => parsePercentage('45%', { output: 'float' as 'bigint' })).toThrow(
        'parsePercentage: output must be "number" or "bigint", received float',
      )
      // Validated before anything else, so it wins over the asRatio conflict.
      expect(() => parsePercentage('45%', { output: 'float' as 'bigint', asRatio: true })).toThrow(
        'output must be "number" or "bigint"',
      )
    })

    it("keeps returning a number for output 'number' or when omitted", () => {
      expect(parsePercentage('45.5%', { output: 'number' })).toBeCloseTo(45.5)
      expect(parsePercentage('45.5%', { output: 'number', asRatio: true })).toBe(0.455)
      expect(parsePercentage('45.5%', {})).toBeCloseTo(45.5)
    })
  })
})

describe('percentage separator validation', () => {
  it('surfaces the ambiguous-separator RangeError from the number layer', () => {
    expect(() =>
      formatPercentage(1234.5, { decimals: 1, thousandsSeparator: ',', decimalSeparator: ',' }),
    ).toThrow(RangeError)
    expect(() =>
      parsePercentage('0.001%', { thousandsSeparator: '.', decimalSeparator: '.' }),
    ).toThrow(RangeError)
  })
})
