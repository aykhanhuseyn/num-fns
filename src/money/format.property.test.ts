import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { az } from '../locale/az'
import { en } from '../locale/en'
import { es } from '../locale/es'
import { ru } from '../locale/ru'
import type { Locale } from '../locale/types'
import { decimalNumber, normalizeZero } from '../shared/arbitraries.test'
import { formatMoney, parseMoney } from './format'

/**
 * `formatMoney`/`parseMoney` round trips. The interesting part beyond
 * `formatNumber`'s own properties is the currency symbol: it is glued on with
 * a space and stripped again by `split(symbol).join('')`, which has to survive
 * a symbol before the amount (`en`) and after it (`az`, `ru`, `es`), a
 * negative sign between the two, and a multi-character symbol.
 */
const LOCALES: ReadonlyArray<readonly [string, Locale]> = [
  ['az', az],
  ['en', en],
  ['ru', ru],
  ['es', es],
]

describe.each(LOCALES)('formatMoney/parseMoney round trip (%s)', (_code, locale) => {
  it('preserves the amount rounded to the default two decimals', () => {
    fc.assert(
      fc.property(decimalNumber(4), (value) => {
        const roundTrip = parseMoney(formatMoney(value, { locale }), { locale })
        expect(normalizeZero(roundTrip)).toBe(normalizeZero(Number(value.toFixed(2))))
      }),
    )
  })

  it('preserves the amount for any decimals and either symbol position', () => {
    fc.assert(
      fc.property(
        decimalNumber(4),
        fc.integer({ min: 0, max: 4 }),
        fc.constantFrom<'before' | 'after'>('before', 'after'),
        fc.constantFrom('$', '₼', '€', 'USD', 'ман.'),
        (value, decimals, symbolPosition, symbol) => {
          const options = { locale, decimals, symbolPosition, symbol }
          const roundTrip = parseMoney(formatMoney(value, options), options)
          expect(normalizeZero(roundTrip)).toBe(normalizeZero(Number(value.toFixed(decimals))))
        },
      ),
    )
  })

  it('always emits the symbol exactly once, on the side the options ask for', () => {
    fc.assert(
      fc.property(
        decimalNumber(2),
        fc.constantFrom<'before' | 'after'>('before', 'after'),
        (value, symbolPosition) => {
          const symbol = '¤'
          const formatted = formatMoney(value, { locale, symbolPosition, symbol })
          expect(formatted.split(symbol).length - 1).toBe(1)
          if (symbolPosition === 'before') expect(formatted.startsWith(`${symbol} `)).toBe(true)
          else expect(formatted.endsWith(` ${symbol}`)).toBe(true)
        },
      ),
    )
  })
})
