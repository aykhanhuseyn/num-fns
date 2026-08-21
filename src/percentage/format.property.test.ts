import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { az } from '../locale/az'
import { en } from '../locale/en'
import { es } from '../locale/es'
import { ru } from '../locale/ru'
import type { Locale } from '../locale/types'
import { decimalNumber, normalizeZero } from '../shared/arbitraries.test'
import type { PercentageUnit } from '../shared/types'
import { formatPercentage, parsePercentage } from './format'

const LOCALES: ReadonlyArray<readonly [string, Locale]> = [
  ['az', az],
  ['en', en],
  ['ru', ru],
  ['es', es],
]

/** `percent` scales by 100, `permille` by 1000, `basisPoint` by 10000. */
const UNITS: readonly PercentageUnit[] = ['percent', 'permille', 'basisPoint']
const UNIT_SCALE: Record<PercentageUnit, number> = {
  percent: 100,
  permille: 1000,
  basisPoint: 10000,
}

/**
 * Ratios in [-10, 10] with four decimals. A ratio is scaled *up* by 100-10000
 * before formatting, so unlike the other arbitraries here it has to stay small:
 * at `1e9` the scaled value's own floating-point error already exceeds the
 * rounding error the property is trying to bound.
 */
const ratioNumber = fc.integer({ min: -100_000, max: 100_000 }).map((scaled) => scaled / 10_000)

describe.each(LOCALES)('formatPercentage/parsePercentage round trip (%s)', (_code, locale) => {
  it('preserves the value for every unit, decimal count and spacing', () => {
    fc.assert(
      fc.property(
        decimalNumber(4),
        fc.integer({ min: 0, max: 4 }),
        fc.constantFrom(...UNITS),
        fc.boolean(),
        (value, decimals, unit, space) => {
          const options = { locale, decimals, unit, space }
          const roundTrip = parsePercentage(formatPercentage(value, options), options)
          expect(normalizeZero(roundTrip)).toBe(normalizeZero(Number(value.toFixed(decimals))))
        },
      ),
    )
  })

  it('round-trips a ratio through multiplyBy100 and back through asRatio', () => {
    fc.assert(
      fc.property(
        ratioNumber,
        fc.constantFrom(...UNITS),
        fc.integer({ min: 2, max: 6 }),
        (ratio, unit, decimals) => {
          const formatted = formatPercentage(ratio, { locale, unit, decimals, multiplyBy100: true })
          const roundTrip = parsePercentage(formatted, { locale, unit, asRatio: true })
          // Scaling up, rounding to `decimals`, then scaling back down leaves
          // at most half a unit of the last kept digit, divided by the scale.
          const tolerance = (0.5 * 10 ** -decimals) / UNIT_SCALE[unit] + 1e-9
          expect(Math.abs(roundTrip - ratio)).toBeLessThanOrEqual(tolerance)
        },
      ),
    )
  })

  it('emits exactly one unit sign, last, and no other unit’s sign', () => {
    fc.assert(
      fc.property(decimalNumber(2), fc.constantFrom(...UNITS), (value, unit) => {
        const signs: Record<PercentageUnit, string> = {
          percent: '%',
          permille: '‰',
          basisPoint: '‱',
        }
        const formatted = formatPercentage(value, { locale, unit })
        expect(formatted.endsWith(signs[unit])).toBe(true)
        expect(formatted.split(signs[unit]).length - 1).toBe(1)
        for (const other of UNITS) {
          if (other !== unit) expect(formatted).not.toContain(signs[other])
        }
      }),
    )
  })
})
