import { multiply } from '../arithmetic/multiply'
import { guardNumber } from '../shared/no-throw'
import { percentile } from './percentile'

/**
 * Computes the q-th quantile (0-1) of an array of numbers. A thin wrapper
 * over {@link percentile}: `quantile(values, q) === percentile(values, q * 100)`,
 * with the scaling done by {@link multiply} so `q = 0.07` reaches
 * `percentile` as `7`, not `7.000000000000001`.
 *
 * Throws `RangeError` when `q` is outside `0..1`, plus everything
 * `percentile` throws.
 *
 * @example
 * quantile([1, 2, 3, 4, 5], 0.5); // 3
 * quantile([0.1, 0.2], 0.5); // 0.15
 *
 * @since 0.2.0 (exact in decimal since 0.7.0)
 */
export function quantile(values: readonly number[], q: number): number {
  return guardNumber(() => {
    if (!Number.isFinite(q) || q < 0 || q > 1) {
      throw new RangeError(`quantile: q must be between 0 and 1, received ${q}`)
    }

    return percentile(values, multiply(q, 100))
  })
}
