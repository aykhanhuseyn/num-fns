import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { az } from '../locale/az'
import { en } from '../locale/en'
import { enGB } from '../locale/en-gb'
import { es } from '../locale/es'
import { ru } from '../locale/ru'
import type { Locale } from '../locale/types'
import { decimalNumber, normalizeZero } from '../shared/arbitraries.test'
import type { RoundingMode } from '../shared/types'
import { formatNumber, parseNumber } from './format'

/**
 * Property tests for the `formatNumber`/`parseNumber` pair. The example-based
 * suite in `format.test.ts` pins specific strings; these check the invariant
 * that actually matters to a caller — that parsing a formatted number gives
 * the number back — across every locale and every separator combination the
 * launch locales use (`,`/`.`, ` `/`,` and `.`/`,`, which is where a naive
 * string replace goes wrong).
 */
const LOCALES: ReadonlyArray<readonly [string, Locale]> = [
  ['az', az],
  ['en', en],
  ['en-GB', enGB],
  ['ru', ru],
  ['es', es],
]

/** The tie-breaking modes, which all round to the *nearest* kept digit. */
const HALF_ROUNDING_MODES: readonly RoundingMode[] = ['halfUp', 'halfDown', 'halfEven']

describe.each(LOCALES)('formatNumber/parseNumber round trip (%s)', (_code, locale) => {
  it('preserves the value when no decimals option is given', () => {
    fc.assert(
      fc.property(decimalNumber(4), (value) => {
        expect(parseNumber(formatNumber(value, { locale }), { locale })).toBe(value)
      }),
    )
  })

  it('preserves the value rounded to the requested number of decimals', () => {
    fc.assert(
      fc.property(decimalNumber(6), fc.integer({ min: 0, max: 6 }), (value, decimals) => {
        const roundTrip = parseNumber(formatNumber(value, { decimals, locale }), { locale })
        expect(normalizeZero(roundTrip)).toBe(normalizeZero(Number(value.toFixed(decimals))))
      }),
    )
  })

  it('survives explicit separators that shadow another locale’s defaults', () => {
    fc.assert(
      fc.property(
        decimalNumber(3),
        fc.constantFrom('', ' ', ',', '.', "'"),
        fc.constantFrom(',', '.'),
        (value, thousandsSeparator, decimalSeparator) => {
          // Identical separators are excluded, not asserted about: with
          // `{ thousandsSeparator: '.', decimalSeparator: '.' }` the formatted
          // string is genuinely ambiguous, and `parseNumber` currently strips
          // both and silently returns the wrong number (0.001 -> 1) instead of
          // throwing the way the rest of the package does. See `todo.md` §4.
          fc.pre(thousandsSeparator !== decimalSeparator)
          const options = { locale, thousandsSeparator, decimalSeparator }
          expect(parseNumber(formatNumber(value, options), options)).toBe(value)
        },
      ),
    )
  })
})

describe('formatNumber rounding modes', () => {
  // All the bounds below carry a 1e-9 slack: `roundToDecimals` scales by
  // `10 ** decimals` and divides back down, which is not exact in binary
  // floating point.
  it('moves a value by at most half a unit of the last kept digit when rounding to nearest', () => {
    fc.assert(
      fc.property(
        decimalNumber(6),
        fc.integer({ min: 0, max: 4 }),
        fc.constantFrom(...HALF_ROUNDING_MODES),
        (value, decimals, roundingMode) => {
          const rounded = parseNumber(formatNumber(value, { decimals, roundingMode }))
          expect(Math.abs(rounded - value)).toBeLessThanOrEqual(0.5 * 10 ** -decimals + 1e-9)
        },
      ),
    )
  })

  it('rounds ceil upward and floor downward, bracketing the value within one unit', () => {
    fc.assert(
      fc.property(decimalNumber(6), fc.integer({ min: 0, max: 4 }), (value, decimals) => {
        const unit = 10 ** -decimals
        const ceil = parseNumber(formatNumber(value, { decimals, roundingMode: 'ceil' }))
        const floor = parseNumber(formatNumber(value, { decimals, roundingMode: 'floor' }))
        expect(ceil).toBeGreaterThanOrEqual(value - 1e-9)
        expect(floor).toBeLessThanOrEqual(value + 1e-9)
        expect(ceil - value).toBeLessThanOrEqual(unit + 1e-9)
        expect(value - floor).toBeLessThanOrEqual(unit + 1e-9)
        expect(ceil).toBeGreaterThanOrEqual(floor)
      }),
    )
  })
})
