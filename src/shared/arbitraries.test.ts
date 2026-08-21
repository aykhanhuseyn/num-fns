import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'

/**
 * Shared fast-check arbitraries for the `*.property.test.ts` files, plus the
 * self-tests that keep them honest.
 *
 * This lives in a `*.test.ts` file rather than a plain module so that the
 * build ignores it: `vite.config.ts` excludes `src/**\/*.test.ts` from both the
 * bundle and the emitted declarations, and nothing test-only should end up in
 * `dist/`.
 */

/**
 * Numbers with at most `maxFractionDigits` decimal places, built up from
 * integer parts rather than drawn from `fc.double`, so that the value's
 * shortest representation is exactly the decimal string it was built from:
 * at most 14 significant digits, and never large enough for `String()` to
 * switch to exponent notation.
 *
 * Both of those are documented preconditions of every format/parse round trip
 * in this package, not bugs worth generating counterexamples for — a value
 * like `1e21` has no plain-digit form for `formatNumber` to group, and a
 * 17-significant-digit double does not survive `String()` intact.
 */
export function decimalNumber(maxFractionDigits: number): fc.Arbitrary<number> {
  return fc
    .tuple(
      fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }),
      fc.integer({ min: 0, max: 10 ** maxFractionDigits - 1 }),
    )
    .map(([whole, fraction]) => {
      const digits = String(fraction).padStart(maxFractionDigits, '0')
      return Number(`${whole}.${digits}`)
    })
}

/**
 * `-0` and `0` are the same number to a caller but not to `Object.is`, which
 * is what `expect(...).toBe(...)` uses. Rounding a small negative value to
 * zero decimals is the usual way one shows up.
 */
export function normalizeZero(value: number): number {
  return value === 0 ? 0 : value
}

describe('decimalNumber', () => {
  it('generates values that round-trip through String() unchanged', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 6 }), (maxFractionDigits) => {
        fc.assert(
          fc.property(decimalNumber(maxFractionDigits), (value) => {
            expect(Number(String(value))).toBe(value)
            expect(String(value)).not.toContain('e')
          }),
          { numRuns: 20 },
        )
      }),
      { numRuns: 7 },
    )
  })

  it('respects the requested number of fraction digits', () => {
    fc.assert(
      fc.property(decimalNumber(3), (value) => {
        const [, fraction = ''] = String(Math.abs(value)).split('.')
        expect(fraction.length).toBeLessThanOrEqual(3)
      }),
    )
  })
})

describe('normalizeZero', () => {
  it('collapses negative zero and leaves everything else alone', () => {
    expect(normalizeZero(-0)).toBe(0)
    expect(normalizeZero(0)).toBe(0)
    fc.assert(
      fc.property(decimalNumber(2), (value) => {
        if (value !== 0) expect(normalizeZero(value)).toBe(value)
      }),
    )
  })
})
