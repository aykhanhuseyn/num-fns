import { add } from '../arithmetic/add'
import { divide } from '../arithmetic/divide'
import { multiply } from '../arithmetic/multiply'
import { subtract } from '../arithmetic/subtract'
import { guardNumber } from '../shared/no-throw'

/**
 * Computes the p-th percentile (0-100) of an array of numbers using linear
 * interpolation between closest ranks — the same method as Excel's
 * PERCENTILE.INC and NumPy's default "linear" interpolation. The rank and
 * the interpolation are exact in decimal (`add`/`subtract`/`multiply`/
 * `divide`), so `percentile([0.1, 0.2], 50)` is `0.15`.
 *
 * Throws `RangeError` when `values` is empty, when `p` is outside `0..100`,
 * or when a value is not finite.
 *
 * @example
 * percentile([1, 2, 3, 4, 5], 50); // 3
 * percentile([1, 2, 3, 4], 25); // 1.75
 * percentile([0.1, 0.2], 50); // 0.15
 *
 * @since 0.2.0 (exact in decimal since 0.7.0)
 */
export function percentile(values: readonly number[], p: number): number {
  return guardNumber(() => {
    if (values.length === 0) {
      throw new RangeError('percentile: values must not be empty')
    }
    if (!Number.isFinite(p) || p < 0 || p > 100) {
      throw new RangeError(`percentile: p must be between 0 and 100, received ${p}`)
    }

    const sorted = [...values].sort((a, b) => a - b)
    for (const value of sorted) {
      if (!Number.isFinite(value)) {
        throw new RangeError(`percentile: all values must be finite, received ${value}`)
      }
    }

    if (sorted.length === 1) {
      return sorted[0] as number
    }

    // rank = p / 100 * (n - 1), exactly: `(p / 100) * (n - 1)` in floats
    // gives 0.30000000000000004 * ... for p = 30, and a rank that is off by
    // one ulp can land on the wrong side of an integer.
    const rank = divide(multiply(p, sorted.length - 1), 100)
    const lowerIndex = Math.floor(rank)
    const upperIndex = Math.ceil(rank)
    const lowerValue = sorted[lowerIndex] as number
    const upperValue = sorted[upperIndex] as number
    if (lowerIndex === upperIndex) {
      return lowerValue
    }

    const weight = subtract(rank, lowerIndex)
    return add(lowerValue, multiply(subtract(upperValue, lowerValue), weight))
  })
}
