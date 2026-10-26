import { guardNumber } from '../shared/no-throw'
import type { VarianceOptions } from './variance'
import { variance } from './variance'

/**
 * Computes the standard deviation of an array of numbers — the square root
 * of {@link variance}. Population by default; pass `{ sample: true }` for
 * sample standard deviation.
 *
 * The variance is exact in decimal; `Math.sqrt` is the one floating-point
 * step, and it is correctly rounded by the language.
 *
 * Throws everything `variance` throws.
 *
 * @param values - The numbers. Must not be empty; every value must be finite.
 * @param options - `sample: true` for sample standard deviation; `noThrow` to return `NaN` instead of throwing.
 * @returns The square root of the variance.
 * @throws {RangeError} In every case where {@link variance} throws.
 *
 * @example
 * standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]); // 2
 * standardDeviation([2, 4, 4, 4, 5, 5, 7, 9], { sample: true }); // 2.138089935299395
 *
 * @since 0.2.0 (exact up to `sqrt` since 0.7.0)
 */
export function standardDeviation(
  values: readonly number[],
  options: VarianceOptions = {},
): number {
  return guardNumber(() => {
    return Math.sqrt(variance(values, options))
  }, options)
}
