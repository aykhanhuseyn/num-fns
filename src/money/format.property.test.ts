import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { round } from '../arithmetic/round'
import { az } from '../locale/az'
import { en } from '../locale/en'
import { enGB } from '../locale/en-gb'
import { es } from '../locale/es'
import { ru } from '../locale/ru'
import type { Locale } from '../locale/types'
import { decimalNumber, normalizeZero } from '../shared/arbitraries.test'
import type { CurrencyCode } from './currency'
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
  ['en-GB', enGB],
  ['ru', ru],
  ['es', es],
]

/**
 * Whole amounts well past `Number.MAX_SAFE_INTEGER` in both directions — the
 * `bigint` path never converts to a `number`, so any magnitude is fair game.
 * Bounds are built with `BigInt(string)`, never a `10n`-style literal, which
 * the ES2018 build target would reject.
 */
const wholeAmount = fc.bigInt({
  min: BigInt('-1000000000000000000000'),
  max: BigInt('1000000000000000000000'),
})

describe.each(LOCALES)('formatMoney/parseMoney round trip (%s)', (_code, locale) => {
  it('preserves the amount rounded decimal-safely to the default two decimals', () => {
    // The oracle is `round`, not `toFixed`: `formatMoney(1.005)` is `"$ 1.01"`.
    fc.assert(
      fc.property(decimalNumber(4), (value) => {
        const roundTrip = parseMoney(formatMoney(value, { locale }), { locale })
        expect(normalizeZero(roundTrip)).toBe(round(value, 2))
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
          expect(normalizeZero(roundTrip)).toBe(round(value, decimals))
        },
      ),
    )
  })

  it('preserves the amount for every registered currency', () => {
    fc.assert(
      fc.property(
        decimalNumber(4),
        fc.constantFrom<CurrencyCode>('AZN', 'USD', 'EUR', 'RUB', 'GBP'),
        (value, currency) => {
          const options = { locale, currency }
          const roundTrip = parseMoney(formatMoney(value, options), options)
          expect(normalizeZero(roundTrip)).toBe(round(value, 2))
        },
      ),
    )
  })

  it('preserves a bigint amount exactly, for any decimals, currency and symbol position', () => {
    fc.assert(
      fc.property(wholeAmount, (amount) => {
        expect(parseMoney(formatMoney(amount, { locale }), { locale, output: 'bigint' })).toBe(
          amount,
        )
      }),
    )
    fc.assert(
      fc.property(
        wholeAmount,
        fc.integer({ min: 0, max: 4 }),
        fc.constantFrom<CurrencyCode>('AZN', 'USD', 'EUR', 'RUB', 'GBP'),
        fc.constantFrom<'before' | 'after'>('before', 'after'),
        (amount, decimals, currency, symbolPosition) => {
          const options = { locale, decimals, currency, symbolPosition }
          const roundTrip = parseMoney(formatMoney(amount, options), {
            ...options,
            output: 'bigint',
          })
          expect(roundTrip).toBe(amount)
        },
      ),
    )
  })

  it('formats a bigint amount identically to the equivalent safe integer number', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }),
        fc.integer({ min: 0, max: 4 }),
        (amount, decimals) => {
          expect(formatMoney(BigInt(amount), { locale, decimals })).toBe(
            formatMoney(amount, { locale, decimals }),
          )
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
