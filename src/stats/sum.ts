import { guardNumber } from '../shared/no-throw'
import { exactSum, sumFast, toNumber, validateValues } from './exact'

/**
 * Sums an array of numbers exactly in decimal, the same way {@link add}
 * does: `sum([0.1, 0.2])` is `0.3`, not `0.30000000000000004`. Every value
 * is read at its shortest decimal, the total is computed exactly, and the
 * result is the closest JavaScript number to that total — one rounding at
 * the end, so `sum(values)` agrees with `values.reduce(add, 0)` wherever
 * the running total fits a number's precision, and is at least as exact
 * where it does not.
 *
 * Values with a few fraction digits (prices, measurements) add exactly as
 * integer counts of their smallest digit, so the common case takes a fast
 * path that skips the `BigInt` machinery; `bench/BASELINE.md` has the cost
 * of the exact path, which only long or huge decimals reach.
 *
 * Throws `RangeError` when `values` is empty, when a value is not finite,
 * or when the total is too large for a JavaScript number. Signed zeros
 * follow IEEE 754: the total is `-0` only when every value is `-0`.
 *
 * @example
 * sum([1, 2, 3]); // 6
 * sum([0.1, 0.2]); // 0.3
 * sum([1.15, 2.3, 0.05]); // 3.5
 *
 * @since 0.2.0 (exact in decimal since 0.7.0)
 */
export function sum(values: readonly number[]): number {
  return guardNumber(() => {
    const negativeZero = validateValues(values, 'sum')
    const fast = sumFast(values)
    if (fast !== undefined) {
      const total = fast.scale === 0 ? fast.total : Number(`${fast.total}e-${fast.scale}`)
      return total === 0 && negativeZero ? -0 : total
    }
    return toNumber(exactSum(values), 'sum', negativeZero)
  })
}
