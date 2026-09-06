import { describe, expect, it } from 'bun:test'
import { type CurrencyCode, getCurrency } from './currency'

describe('getCurrency', () => {
  it.each([
    ['AZN', '₼'],
    ['USD', '$'],
    ['EUR', '€'],
    ['RUB', '₽'],
    ['GBP', '£'],
  ] as const)(
    'returns the %s record with its symbol %s and two minor-unit digits',
    (code, symbol) => {
      expect(getCurrency(code)).toEqual({ code, symbol, decimals: 2 })
    },
  )

  it('throws RangeError naming the code and the known codes for an unknown one', () => {
    expect(() => getCurrency('XYZ' as CurrencyCode)).toThrow(RangeError)
    expect(() => getCurrency('XYZ' as CurrencyCode)).toThrow(
      'getCurrency: unknown currency code "XYZ" — expected one of AZN, USD, EUR, RUB, GBP',
    )
  })

  it('does not leak Object.prototype members as currencies', () => {
    expect(() => getCurrency('constructor' as CurrencyCode)).toThrow(RangeError)
    expect(() => getCurrency('toString' as CurrencyCode)).toThrow(RangeError)
  })
})
