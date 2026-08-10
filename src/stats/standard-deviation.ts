import type { VarianceOptions } from './variance'
import { variance } from './variance'

/**
 * Computes the standard deviation of an array of numbers — the square root
 * of {@link variance}. Population by default; pass `{ sample: true }` for
 * sample standard deviation.
 *
 * @example
 * standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]); // 2
 */
export function standardDeviation(
  values: readonly number[],
  options: VarianceOptions = {},
): number {
  return Math.sqrt(variance(values, options))
}
