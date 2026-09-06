import { describe, expect, it } from 'bun:test'
import { az } from '../locale/az'
import { enGB } from '../locale/en-gb'
import { ru } from '../locale/ru'
import type { CurrencyCode } from './currency'
import { formatMoney, parseMoney } from './format'

describe('formatMoney', () => {
  it('formats with the dollar sign before the amount by default', () => {
    expect(formatMoney(1234.5)).toBe('$ 1,234.50')
  })

  it('supports a custom symbol and position', () => {
    expect(formatMoney(9.99, { symbol: '€', symbolPosition: 'after' })).toBe('9.99 €')
  })

  it('supports a custom decimal precision', () => {
    expect(formatMoney(10, { decimals: 0 })).toBe('$ 10')
  })

  it('rounds decimal-safely to the currency minor unit', () => {
    // (1.005).toFixed(2) is "1.00"; decimal-safe rounding sees the tie.
    expect(formatMoney(1.005)).toBe('$ 1.01')
    expect(formatMoney(2.675, { locale: az })).toBe('2,68 ₼')
    expect(formatMoney(1.005, { decimals: 2, roundingMode: 'halfEven' })).toBe('$ 1.00')
    expect(formatMoney(-1.005, { decimals: 2 })).toBe('$ -1.01')
    expect(formatMoney(1234.5, { decimals: 0, roundingMode: 'halfDown' })).toBe('$ 1,234')
  })

  it('throws RangeError for a non-integer decimals', () => {
    expect(() => formatMoney(1, { decimals: 1.5 })).toThrow(RangeError)
  })

  describe('{ currency }', () => {
    it("selects the symbol by ISO 4217 code, keeping the locale's placement", () => {
      expect(formatMoney(1234.5, { currency: 'EUR' })).toBe('€ 1,234.50')
      expect(formatMoney(1234.5, { currency: 'GBP' })).toBe('£ 1,234.50')
      expect(formatMoney(1234.5, { locale: az, currency: 'USD' })).toBe('1 234,50 $')
      expect(formatMoney(1234.5, { locale: ru, currency: 'AZN' })).toBe('1 234,50 ₼')
    })

    it("defaults to the locale's own currency — GBP for enGB", () => {
      expect(formatMoney(1234.5, { locale: enGB })).toBe('£ 1,234.50')
    })

    it("lets an explicit symbol override the code's symbol", () => {
      expect(formatMoney(9.99, { currency: 'USD', symbol: 'US$' })).toBe('US$ 9.99')
    })

    it('throws RangeError for a code the registry does not know', () => {
      expect(() => formatMoney(1, { currency: 'XYZ' as CurrencyCode })).toThrow(RangeError)
      expect(() => formatMoney(1, { currency: 'XYZ' as CurrencyCode })).toThrow(
        'unknown currency code "XYZ"',
      )
    })
  })

  describe('{ locale: az }', () => {
    it('formats with the manat symbol after the amount by default', () => {
      expect(formatMoney(1234.5, { locale: az })).toBe('1 234,50 ₼')
    })

    it('supports a custom symbol and position', () => {
      expect(formatMoney(9.99, { locale: az, symbol: '$', symbolPosition: 'before' })).toBe(
        '$ 9,99',
      )
    })
  })
})

describe('parseMoney', () => {
  it('round-trips with formatMoney', () => {
    expect(parseMoney(formatMoney(1234.5))).toBeCloseTo(1234.5)
  })

  it('strips a custom symbol', () => {
    expect(parseMoney('€ 9.99', { symbol: '€' })).toBeCloseTo(9.99)
  })

  it('supports a locale', () => {
    expect(parseMoney('1 234,50 ₼', { locale: az })).toBeCloseTo(1234.5)
  })

  it('strips the symbol of the requested currency', () => {
    expect(parseMoney('€ 1,234.50', { currency: 'EUR' })).toBeCloseTo(1234.5)
    expect(parseMoney('1 234,50 £', { locale: az, currency: 'GBP' })).toBeCloseTo(1234.5)
    expect(parseMoney(formatMoney(-9.99, { locale: enGB }), { locale: enGB })).toBeCloseTo(-9.99)
  })

  it('throws RangeError for a code the registry does not know', () => {
    expect(() => parseMoney('1', { currency: 'XYZ' as CurrencyCode })).toThrow(RangeError)
  })
})

describe('money separator validation', () => {
  it('surfaces the ambiguous-separator RangeError from the number layer', () => {
    expect(() => formatMoney(1234.5, { thousandsSeparator: ',', decimalSeparator: ',' })).toThrow(
      RangeError,
    )
    expect(() => parseMoney('$ 0.001', { thousandsSeparator: '.', decimalSeparator: '.' })).toThrow(
      RangeError,
    )
  })
})
