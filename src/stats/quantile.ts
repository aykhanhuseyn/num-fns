import { guardNumber } from '../shared/no-throw'
import { percentile } from './percentile'

/**
 * Computes the q-th quantile (0-1) of an array of numbers. A thin wrapper
 * over {@link percentile}: `quantile(values, q) === percentile(values, q * 100)`.
 *
 * @example
 * quantile([1, 2, 3, 4, 5], 0.5); // 3
 */
export function quantile(values: readonly number[], q: number): number {
  return guardNumber(() => {
    if (!Number.isFinite(q) || q < 0 || q > 1) {
      throw new RangeError(`quantile: q must be between 0 and 1, received ${q}`)
    }

    return percentile(values, q * 100)
  })
}
