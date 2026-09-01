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
