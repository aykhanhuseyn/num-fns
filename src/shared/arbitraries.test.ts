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

/**
 * Every integer a `bigint` can hold within `±maxDigits` decimal digits —
 * written as `BigInt(...)` products rather than `10n` literals, since the
 * build targets ES2018 (see `shared/bigint.ts`). Defaults to 30 digits, well
 * past `Number.MAX_SAFE_INTEGER`'s 16, so the `bigint` paths are exercised
 * where a `number` would already have lost digits. `fast-check`'s
 * `fc.bigInt` biases toward the extremes and toward zero, so both small and
 * huge values show up in every run.
 */
export function bigIntArb(maxDigits = 30): fc.Arbitrary<bigint> {
  const max = BigInt(10) ** BigInt(maxDigits) - BigInt(1)
  return fc.bigInt({ min: -max, max })
}

/**
 * A `bigint` within `±Number.MAX_SAFE_INTEGER` — the range where the `bigint`
 * and `number` paths of every function must agree exactly, which is what the
 * "bigint agrees with number" properties assert.
 */
export function safeBigIntArb(): fc.Arbitrary<bigint> {
  const max = BigInt(Number.MAX_SAFE_INTEGER)
  return fc.bigInt({ min: -max, max })
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

describe('bigIntArb', () => {
  it('stays within the requested digit count and produces bigints', () => {
    fc.assert(
      fc.property(bigIntArb(30), (value) => {
        expect(typeof value).toBe('bigint')
        const digits = (value < BigInt(0) ? -value : value).toString()
        expect(digits.length).toBeLessThanOrEqual(30)
      }),
    )
  })

  it('reaches past Number.MAX_SAFE_INTEGER', () => {
    const max = BigInt(Number.MAX_SAFE_INTEGER)
    const sample = fc.sample(bigIntArb(), 200)
    expect(sample.some((value) => value > max || value < -max)).toBe(true)
  })
})

describe('safeBigIntArb', () => {
  it('only produces values a number holds exactly', () => {
    fc.assert(
      fc.property(safeBigIntArb(), (value) => {
        expect(Number.isSafeInteger(Number(value))).toBe(true)
        expect(BigInt(Number(value))).toBe(value)
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
