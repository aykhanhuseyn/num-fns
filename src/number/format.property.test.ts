import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { round } from '../arithmetic/round'
import { subtract } from '../arithmetic/subtract'
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

  it('preserves the value rounded decimal-safely to the requested number of decimals', () => {
    // The oracle is `round`, not `toFixed`: `formatNumber` rounds the value's
    // shortest decimal form, so `1.005` at two decimals is `1.01`, where
    // `(1.005).toFixed(2)` is `"1.00"`.
    fc.assert(
      fc.property(decimalNumber(6), fc.integer({ min: 0, max: 6 }), (value, decimals) => {
        const roundTrip = parseNumber(formatNumber(value, { decimals, locale }), { locale })
        expect(normalizeZero(roundTrip)).toBe(round(value, decimals))
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
          // Identical separators are rejected outright rather than
          // round-tripped: the formatted string would be genuinely ambiguous.
          // See the dedicated property below.
          fc.pre(thousandsSeparator !== decimalSeparator)
          const options = { locale, thousandsSeparator, decimalSeparator }
          expect(parseNumber(formatNumber(value, options), options)).toBe(value)
        },
      ),
    )
  })
})

describe('formatNumber rounding modes', () => {
  // The distances below are measured with the library's own exact `subtract`
  // and compared against exact decimal bounds (`5e-3`, `1e-2`, …) with no
  // slack: rounding is decimal-safe now, and a plain float `rounded - value`
  // would carry representation error of its own into the comparison (e.g.
  // `-268435456.4764 - -268435456.47635` is not `-0.00005`).
  it('moves a value by at most half a unit of the last kept digit when rounding to nearest', () => {
    fc.assert(
      fc.property(
        decimalNumber(6),
        fc.integer({ min: 0, max: 4 }),
        fc.constantFrom(...HALF_ROUNDING_MODES),
        (value, decimals, roundingMode) => {
          const halfUnit = Number(`5e-${decimals + 1}`)
          const rounded = parseNumber(formatNumber(value, { decimals, roundingMode }))
          expect(Math.abs(subtract(rounded, value))).toBeLessThanOrEqual(halfUnit)
        },
      ),
    )
  })

  it('rounds ceil upward and floor downward, bracketing the value within one unit', () => {
    fc.assert(
      fc.property(decimalNumber(6), fc.integer({ min: 0, max: 4 }), (value, decimals) => {
        const unit = Number(`1e-${decimals}`)
        const ceil = parseNumber(formatNumber(value, { decimals, roundingMode: 'ceil' }))
        const floor = parseNumber(formatNumber(value, { decimals, roundingMode: 'floor' }))
        const aboveByCeil = subtract(ceil, value)
        const belowByFloor = subtract(value, floor)
        expect(aboveByCeil).toBeGreaterThanOrEqual(0)
        expect(belowByFloor).toBeGreaterThanOrEqual(0)
        expect(aboveByCeil).toBeLessThan(unit)
        expect(belowByFloor).toBeLessThan(unit)
        expect(ceil).toBeGreaterThanOrEqual(floor)
      }),
    )
  })

  it('agrees with round for every mode', () => {
    fc.assert(
      fc.property(
        decimalNumber(6),
        fc.integer({ min: 0, max: 4 }),
        fc.constantFrom<RoundingMode>('halfUp', 'halfDown', 'halfEven', 'ceil', 'floor'),
        (value, decimals, roundingMode) => {
          const formatted = parseNumber(formatNumber(value, { decimals, roundingMode }))
          expect(normalizeZero(formatted)).toBe(round(value, decimals, roundingMode))
        },
      ),
    )
  })
})

describe('formatNumber/parseNumber separator validation', () => {
  it('throws on any separator used for both roles, rather than round-tripping it', () => {
    fc.assert(
      fc.property(
        decimalNumber(3),
        fc.constantFrom('', ' ', ',', '.', "'", '\u00a0'),
        (value, separator) => {
          const options = { thousandsSeparator: separator, decimalSeparator: separator }
          expect(() => formatNumber(value, { ...options, decimals: 3 })).toThrow(RangeError)
          expect(() => parseNumber(String(value), options)).toThrow(RangeError)
        },
      ),
    )
  })
})
