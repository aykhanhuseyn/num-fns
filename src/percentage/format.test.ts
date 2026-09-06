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
