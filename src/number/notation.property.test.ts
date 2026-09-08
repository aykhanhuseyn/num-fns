import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { round } from '../arithmetic/round'
import { az } from '../locale/az'
import { en } from '../locale/en'
import { enGB } from '../locale/en-gb'
import { es } from '../locale/es'
import { ru } from '../locale/ru'
import type { Locale } from '../locale/types'
import { bigIntArb } from '../shared/arbitraries.test'
import { parseLongNotation, parseShortNotation, toLongNotation, toShortNotation } from './notation'

const LOCALES: ReadonlyArray<readonly [string, Locale]> = [
  ['az', az],
  ['en', en],
  ['en-GB', enGB],
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
        // `''` and digit-bearing separators are excluded here because
        // `toLongNotation` rejects them outright — see the property below.
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

/**
 * `en` with a sixth scale word, so the `bigint` round trip has a locale whose
 * range runs past `Number.MAX_SAFE_INTEGER` — the case the `bigint` paths
 * exist for. Its cap is `1000 ** 6 - 1`, which has no exact `number` form.
 */
const enWithQuadrillion: Locale = {
  ...en,
  words: { ...en.words, scales: [...en.words.scales, 'quadrillion'] },
}

/** The `bigint` counterpart of {@link maxLongNotationValue}, exact for any scale count. */
function maxLongNotationBigInt(locale: Locale): bigint {
  return BigInt(1000) ** BigInt(locale.words.scales.length) - BigInt(1)
}

/** Every integer within ±`max`, biased toward the extremes and zero as `fc.bigInt` is. */
function bigIntWithin(max: bigint): fc.Arbitrary<bigint> {
  return fc.bigInt({ min: -max, max })
}

describe.each(LOCALES)(
  'toShortNotation/parseShortNotation bigint round trip (%s)',
  (_code, locale) => {
    it('formats identically to the number path for every safe integer the locale can scale', () => {
      // Both paths round the exact quotient half up (`scaleToFixed`), so the
      // strings agree on every digit — including true ties like `1005 / 1000`
      // that the double stores just below 1.005 and `toFixed` used to round down.
      fc.assert(
        fc.property(
          fc.integer({ min: -999_999_999_999_999, max: 999_999_999_999_999 }),
          fc.integer({ min: 0, max: 6 }),
          (value, decimals) => {
            const options = { locale, decimals }
            expect(toShortNotation(value, options)).toBe(toShortNotation(BigInt(value), options))
          },
        ),
      )
    })

    it('rounds the mantissa exactly as `round` does at the matching negative precision', () => {
      // Every launch locale's thresholds are powers of ten, so the exact
      // quotient rounded to `decimals` is `round(value, decimals - log10(threshold))`
      // scaled back — an oracle with no float division in it.
      fc.assert(
        fc.property(
          fc.integer({ min: 1000, max: 999_999_999_999_999 }),
          fc.integer({ min: 0, max: 6 }),
          (value, decimals) => {
            const threshold =
              locale.notation.scales.find((scale) => value >= scale.threshold)?.threshold ?? 1
            const exponent = Math.round(Math.log10(threshold))
            fc.pre(10 ** exponent === threshold)
            const options = { locale, decimals }
            const expected = BigInt(round(value, decimals - exponent))
            expect(
              parseShortNotation(toShortNotation(value, options), { ...options, output: 'bigint' }),
            ).toBe(expected)
          },
        ),
      )
    })

    it('recovers a bigint to within the precision the format keeps, at any magnitude', () => {
      fc.assert(
        fc.property(bigIntArb(24), fc.integer({ min: 0, max: 6 }), (value, decimals) => {
          const options = { locale, decimals }
          const formatted = toShortNotation(value, options)
          const roundTrip = parseShortNotation(formatted, { ...options, output: 'bigint' })
          expect(typeof roundTrip).toBe('bigint')
          expect(formatted.startsWith('-')).toBe(value < BigInt(0))
          const magnitude = value < BigInt(0) ? -value : value
          if (magnitude < BigInt(1000)) {
            // Below the smallest threshold the value is emitted verbatim.
            expect(roundTrip).toBe(value)
            return
          }
          // The largest threshold the value clears is the unit the mantissa is
          // written in; half a unit in its last kept digit is the rounding bound.
          const threshold = [...locale.notation.scales]
            .map((scale) => BigInt(scale.threshold))
            .filter((scale) => magnitude >= scale)
            .reduce((largest, scale) => (scale > largest ? scale : largest))
          const halfUnit = threshold / BigInt(2) // ... / 10^decimals, scaled below
          const error =
            (roundTrip > value ? roundTrip - value : value - roundTrip) *
            BigInt(10) ** BigInt(decimals)
          expect(error <= halfUnit).toBe(true)
        }),
      )
    })

    it('is exact for a bigint that is a whole multiple of the unit the format keeps', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 999_999 }),
          fc.integer({ min: 0, max: 3 }),
          fc.integer({ min: 0, max: 6 }),
          fc.boolean(),
          (mantissa, scaleIndex, decimals, negative) => {
            // `notation.scales` is ordered largest first; index 0 here is the smallest.
            const scales = [...locale.notation.scales].reverse()
            const threshold = BigInt((scales[scaleIndex] as { threshold: number }).threshold)
            const nextThreshold = scales[scaleIndex + 1]?.threshold
            // mantissa × threshold / 10^decimals must itself be a whole number
            // for the format to keep every digit.
            const unit = threshold / BigInt(10) ** BigInt(decimals)
            fc.pre(unit * BigInt(10) ** BigInt(decimals) === threshold)
            const magnitude = BigInt(mantissa) * unit
            // Stay within this scale: at or above its threshold, below the next.
            fc.pre(magnitude >= threshold)
            fc.pre(nextThreshold === undefined || magnitude < BigInt(nextThreshold))
            const value = negative ? -magnitude : magnitude
            const options = { locale, decimals }
            expect(
              parseShortNotation(toShortNotation(value, options), { ...options, output: 'bigint' }),
            ).toBe(value)
          },
        ),
      )
    })
  },
)

describe.each([...LOCALES, ['en + quadrillion', enWithQuadrillion] as const])(
  'toLongNotation/parseLongNotation bigint round trip (%s)',
  (_code, locale) => {
    it('is exact for every bigint the locale has scale words for', () => {
      fc.assert(
        fc.property(bigIntWithin(maxLongNotationBigInt(locale)), (value) => {
          const roundTrip = parseLongNotation(toLongNotation(value, { locale }), {
            locale,
            output: 'bigint',
          })
          expect(typeof roundTrip).toBe('bigint')
          expect(roundTrip).toBe(value)
        }),
      )
    })

    it('is exact for any non-empty group separator', () => {
      fc.assert(
        fc.property(
          bigIntWithin(maxLongNotationBigInt(locale)),
          fc.constantFrom(' ', ', ', ' — ', '\t'),
          (value, groupSeparator) => {
            const options = { locale, groupSeparator }
            expect(
              parseLongNotation(toLongNotation(value, options), { ...options, output: 'bigint' }),
            ).toBe(value)
          },
        ),
      )
    })

    it('agrees with the number path for every safe integer in range', () => {
      const max = Math.min(maxLongNotationValue(locale), Number.MAX_SAFE_INTEGER)
      fc.assert(
        fc.property(fc.integer({ min: -max, max }), (value) => {
          const formatted = toLongNotation(value, { locale })
          expect(toLongNotation(BigInt(value), { locale })).toBe(formatted)
          expect(parseLongNotation(formatted, { locale })).toBe(value)
          expect(parseLongNotation(formatted, { locale, output: 'bigint' })).toBe(BigInt(value))
        }),
      )
    })

    it('throws above the largest magnitude the locale can name, exactly at the boundary', () => {
      const max = maxLongNotationBigInt(locale)
      expect(() => toLongNotation(max, { locale })).not.toThrow()
      expect(() => toLongNotation(-max, { locale })).not.toThrow()
      fc.assert(
        fc.property(fc.bigInt({ min: BigInt(1), max: BigInt(1000) }), (offset) => {
          expect(() => toLongNotation(max + offset, { locale })).toThrow(RangeError)
          expect(() => toLongNotation(-max - offset, { locale })).toThrow(RangeError)
        }),
      )
    })
  },
)

describe('parseLongNotation number output past Number.MAX_SAFE_INTEGER', () => {
  it('throws RangeError for every unsafe value instead of rounding it', () => {
    const maxSafe = BigInt(Number.MAX_SAFE_INTEGER)
    fc.assert(
      fc.property(
        fc.bigInt({ min: maxSafe + BigInt(1), max: maxLongNotationBigInt(enWithQuadrillion) }),
        fc.boolean(),
        (magnitude, negative) => {
          const value = negative ? -magnitude : magnitude
          const formatted = toLongNotation(value, { locale: enWithQuadrillion })
          expect(() => parseLongNotation(formatted, { locale: enWithQuadrillion })).toThrow(
            RangeError,
          )
          expect(
            parseLongNotation(formatted, { locale: enWithQuadrillion, output: 'bigint' }),
          ).toBe(value)
        },
      ),
    )
  })
})

describe('long notation group separator validation', () => {
  it('rejects separators that would glue a scale word to the next digit group', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 999_999_999 }),
        // `''` glues the scale word straight onto the digits
        // ("1 million234 thousand"); a separator containing a digit merges
        // into them. Both make the output unreadable by `parseLongNotation`.
        fc.constantFrom('', '0', '1', ' 0 ', '-2-'),
        (value, groupSeparator) => {
          expect(() => toLongNotation(value, { groupSeparator })).toThrow(RangeError)
          expect(() => parseLongNotation('1 million', { groupSeparator })).toThrow(RangeError)
        },
      ),
    )
  })
})
