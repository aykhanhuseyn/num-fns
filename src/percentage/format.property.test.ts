import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { divide } from '../arithmetic/divide'
import { round } from '../arithmetic/round'
import { subtract } from '../arithmetic/subtract'
import { az } from '../locale/az'
import { en } from '../locale/en'
import { enGB } from '../locale/en-gb'
import { es } from '../locale/es'
import { ru } from '../locale/ru'
import type { Locale } from '../locale/types'
import { decimalNumber, normalizeZero } from '../shared/arbitraries.test'
import type { PercentageUnit } from '../shared/types'
import { formatPercentage, parsePercentage } from './format'

const LOCALES: ReadonlyArray<readonly [string, Locale]> = [
  ['az', az],
  ['en', en],
  ['en-GB', enGB],
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

describe.each(LOCALES)('formatPercentage/parsePercentage round trip (%s)', (_code, locale) => {
  it('preserves the value, rounded decimal-safely, for every unit, decimal count and spacing', () => {
    // The oracle is `round`, not `toFixed`: rounding goes through
    // `formatNumber` and is decimal-safe (`1.005` at two decimals is `1.01`).
    fc.assert(
      fc.property(
        decimalNumber(4),
        fc.integer({ min: 0, max: 4 }),
        fc.constantFrom(...UNITS),
        fc.boolean(),
        (value, decimals, unit, space) => {
          const options = { locale, decimals, unit, space }
          const roundTrip = parsePercentage(formatPercentage(value, options), options)
          expect(normalizeZero(roundTrip)).toBe(round(value, decimals))
        },
      ),
    )
  })

  it('round-trips a ratio through multiplyBy100 and back through asRatio', () => {
    // The ratio is scaled up with `multiply` and back down with `divide`, both
    // exact in decimal, so the only thing that can move it is the rounding to
    // `decimals` in between: at most half a unit of the last kept digit,
    // divided by the scale. Both the distance and the bound are computed
    // exactly, with no floating-point slack.
    fc.assert(
      fc.property(
        decimalNumber(4),
        fc.constantFrom(...UNITS),
        fc.integer({ min: 0, max: 6 }),
        (ratio, unit, decimals) => {
          const formatted = formatPercentage(ratio, { locale, unit, decimals, multiplyBy100: true })
          const roundTrip = parsePercentage(formatted, { locale, unit, asRatio: true })
          const tolerance = divide(Number(`5e-${decimals + 1}`), UNIT_SCALE[unit])
          expect(Math.abs(subtract(roundTrip, ratio))).toBeLessThanOrEqual(tolerance)
        },
      ),
    )
  })

  it('round-trips a ratio exactly when no digits are dropped', () => {
    // A four-decimal ratio scaled by 100-10000 has at most two fraction
    // digits, so with two or more `decimals` nothing is rounded and the ratio
    // comes back bit-for-bit — the payoff of exact scaling over `value * scale`.
    fc.assert(
      fc.property(
        decimalNumber(4),
        fc.constantFrom(...UNITS),
        fc.integer({ min: 2, max: 6 }),
        (ratio, unit, decimals) => {
          const formatted = formatPercentage(ratio, { locale, unit, decimals, multiplyBy100: true })
          expect(parsePercentage(formatted, { locale, unit, asRatio: true })).toBe(ratio)
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
