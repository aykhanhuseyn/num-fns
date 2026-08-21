import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { az } from '../locale/az'
import { en } from '../locale/en'
import { es } from '../locale/es'
import { ru } from '../locale/ru'
import type { Locale } from '../locale/types'
import { parseLongNotation, parseShortNotation, toLongNotation, toShortNotation } from './notation'

const LOCALES: ReadonlyArray<readonly [string, Locale]> = [
  ['az', az],
  ['en', en],
  ['ru', ru],
  ['es', es],
]

/**
 * Every launch locale has five scale words (units through trillions), so
 * `1000 ** 5 - 1` is the largest value `toLongNotation` can name. Asserted
 * here rather than hardcoded so a locale gaining a scale word doesn't quietly
 * narrow the tested range.
 */
function maxLongNotationValue(locale: Locale): number {
  return 1000 ** locale.words.scales.length - 1
}

describe.each(LOCALES)('toShortNotation/parseShortNotation round trip (%s)', (_code, locale) => {
  it('recovers a scaled value to within the precision the format keeps', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -999_999_999_999_999, max: 999_999_999_999_999 }),
        fc.integer({ min: 0, max: 6 }),
        (value, decimals) => {
          const options = { locale, decimals }
          const roundTrip = parseShortNotation(toShortNotation(value, options), options)
          if (Math.abs(value) < 1000) {
            // Below the smallest threshold the value is only rounded to an
            // integer, not scaled — a plain `toFixed(0)`.
            expect(Math.abs(roundTrip - value)).toBeLessThanOrEqual(0.5)
            return
          }
          const relativeError = Math.abs(roundTrip - value) / Math.abs(value)
          expect(relativeError).toBeLessThanOrEqual(0.5 * 10 ** -decimals + 1e-9)
        },
      ),
    )
  })

  it('keeps the sign and never emits a scaled magnitude below 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: -999_999_999_999_999, max: 999_999_999_999_999 }), (value) => {
        const formatted = toShortNotation(value, { locale })
        expect(formatted.startsWith('-')).toBe(value < 0)
        const roundTrip = parseShortNotation(formatted, { locale })
        expect(Math.sign(roundTrip) === Math.sign(value) || roundTrip === 0).toBe(true)
      }),
    )
  })
})

describe.each(LOCALES)('toLongNotation/parseLongNotation round trip (%s)', (_code, locale) => {
  it('is exact for every integer the locale has scale words for', () => {
    const max = maxLongNotationValue(locale)
    fc.assert(
      fc.property(fc.integer({ min: -max, max }), (value) => {
        expect(parseLongNotation(toLongNotation(value, { locale }), { locale })).toBe(value)
      }),
    )
  })

  it('is exact for any non-empty group separator', () => {
    const max = maxLongNotationValue(locale)
    fc.assert(
      fc.property(
        fc.integer({ min: -max, max }),
        // A `''` separator is excluded: it glues a scale word onto the next
        // digit group ("1 million234 thousand"), which is not parseable and is
        // not a format `toLongNotation` claims to produce.
        fc.constantFrom(' ', ', ', ' — ', '\t'),
        (value, groupSeparator) => {
          const options = { locale, groupSeparator }
          expect(parseLongNotation(toLongNotation(value, options), options)).toBe(value)
        },
      ),
    )
  })

  it('throws above the largest magnitude the locale can name', () => {
    const max = maxLongNotationValue(locale)
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (offset) => {
        expect(() => toLongNotation(max + offset, { locale })).toThrow(RangeError)
      }),
    )
  })
})
