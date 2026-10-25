import { describe, expect, it } from 'bun:test'
import fc from 'fast-check'
import { add } from '../arithmetic/add'
import { divide } from '../arithmetic/divide'
import { multiply } from '../arithmetic/multiply'
import { subtract } from '../arithmetic/subtract'
import { decimalNumber } from '../shared/arbitraries.test'
import { mean } from './mean'
import { median } from './median'
import { percentile } from './percentile'
import { quantile } from './quantile'
import { standardDeviation } from './standard-deviation'
import { sum } from './sum'
import { variance } from './variance'

/**
 * The 0.7-2 invariants (`docs/development-plan.md`): the statistics agree
 * with the exact arithmetic they are built from. `decimalNumber(4)` keeps
 * every running total well inside a number's 17 significant digits, which is
 * the one precondition — past it, `sum` (one rounding at the end) is more
 * exact than a `reduce` over `add` (one rounding per step), not equal to it.
 */
const values = fc.array(decimalNumber(4), { minLength: 1, maxLength: 50 })
const RUNS = { numRuns: 10_000 }

describe('stats (property)', () => {
  it('sum(xs) === xs.reduce(add, 0)', () => {
    fc.assert(
      fc.property(values, (xs) => {
        expect(sum(xs)).toBe(xs.reduce(add, 0))
      }),
      RUNS,
    )
  })

  it('sum(xs) does not depend on the order of xs', () => {
    fc.assert(
      fc.property(values, (xs) => {
        expect(sum([...xs].reverse())).toBe(sum(xs))
      }),
      RUNS,
    )
  })

  it('mean(xs) === divide(sum(xs), xs.length)', () => {
    fc.assert(
      fc.property(values, (xs) => {
        expect(mean(xs)).toBe(divide(sum(xs), xs.length))
      }),
      RUNS,
    )
  })

  it('median(xs) === percentile(xs, 50) === quantile(xs, 0.5)', () => {
    fc.assert(
      fc.property(values, (xs) => {
        const m = median(xs)
        expect(percentile(xs, 50)).toBe(m)
        expect(quantile(xs, 0.5)).toBe(m)
      }),
      RUNS,
    )
  })

  it('percentile(xs, p) interpolates with exact arithmetic', () => {
    fc.assert(
      fc.property(values, fc.integer({ min: 0, max: 100 }), (xs, p) => {
        const sorted = [...xs].sort((a, b) => a - b)
        const rank = divide(multiply(p, sorted.length - 1), 100)
        const lower = sorted[Math.floor(rank)] as number
        const upper = sorted[Math.ceil(rank)] as number
        const expected = add(
          lower,
          multiply(subtract(upper, lower), subtract(rank, Math.floor(rank))),
        )
        expect(percentile(xs, p)).toBe(expected)
      }),
      RUNS,
    )
  })

  it('variance(xs) is the exact sum of squared deviations over n', () => {
    // Small amounts in cents whose total is a multiple of the length, so the
    // mean, every deviation and every square are short decimals and the
    // `subtract`/`multiply`/`sum`/`divide` reference is itself exact.
    const exactMeanList = fc
      .array(fc.integer({ min: -100_000, max: 100_000 }), { minLength: 1, maxLength: 50 })
      .map((cents) => {
        const total = cents.reduce((a, b) => a + b, 0)
        const remainder = ((total % cents.length) + cents.length) % cents.length
        const adjusted = [...cents]
        adjusted[0] = (adjusted[0] as number) - remainder
        return adjusted.map((c) => c / 100)
      })
    fc.assert(
      fc.property(exactMeanList, (xs) => {
        const average = mean(xs)
        const squares = xs.map((x) => multiply(subtract(x, average), subtract(x, average)))
        expect(variance(xs)).toBe(divide(sum(squares), xs.length))
        if (xs.length > 1) {
          expect(variance(xs, { sample: true })).toBe(divide(sum(squares), xs.length - 1))
        }
        expect(standardDeviation(xs)).toBe(Math.sqrt(variance(xs)))
      }),
      RUNS,
    )
  })

  it('variance(xs) is never negative and is 0 for a constant list', () => {
    fc.assert(
      fc.property(values, fc.integer({ min: 1, max: 20 }), (xs, n) => {
        expect(variance(xs)).toBeGreaterThanOrEqual(0)
        expect(variance(Array.from({ length: n }, () => xs[0] as number))).toBe(0)
      }),
      RUNS,
    )
  })

  it('an integer list takes the fast path to the same answer as the exact path', () => {
    const ints = fc.array(fc.integer({ min: -1_000_000, max: 1_000_000 }), {
      minLength: 1,
      maxLength: 50,
    })
    fc.assert(
      fc.property(ints, (xs) => {
        // 1e-16 has sixteen fraction digits, one past the fast path's limit,
        // so appending it and its negation forces the exact BigInt path
        // without changing the total.
        expect(sum([...xs, 1e-16, -1e-16])).toBe(sum(xs))
      }),
      RUNS,
    )
  })

  it('the exact path rounds once: sum of many-digit decimals equals a BigInt oracle', () => {
    // Each value is k × 10^-s with |k| < 10^15, so its shortest decimal is
    // exactly that (a double round-trips 15 significant digits), and s > 15
    // keeps `sum` off the fast path. The oracle adds the k's at scale 10^-20
    // in BigInt and converts once, which is the correctly rounded total.
    const SCALE = 20
    const term = fc.record({
      k: fc.integer({ min: -(10 ** 15) + 1, max: 10 ** 15 - 1 }),
      s: fc.integer({ min: 16, max: SCALE }),
    })
    fc.assert(
      fc.property(fc.array(term, { minLength: 1, maxLength: 30 }), (terms) => {
        const xs = terms.map(({ k, s }) => Number(`${k}e-${s}`))
        const total = terms.reduce(
          (acc, { k, s }) => acc + BigInt(k) * BigInt(10) ** BigInt(SCALE - s),
          BigInt(0),
        )
        const expected = Number(`${total}e-${SCALE}`)
        // `+ 0` folds a signed zero: the oracle's BigInt has no -0.
        expect(sum(xs) + 0).toBe(expected)
      }),
      RUNS,
    )
  })
})
