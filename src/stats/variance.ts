import {
  addDecimals,
  type Decimal,
  divideDecimals,
  multiplyDecimals,
  subtractDecimals,
  toDecimal,
} from '../arithmetic/decimal'
import type { NoThrowOptions } from '../config'
import { guardNumber } from '../shared/no-throw'
import { exactSum, integerDecimal, toNumber, validateValues } from './exact'

/**
 * Options for {@link variance} and {@link standardDeviation}.
 *
 * @since 0.2.0
 */
export interface VarianceOptions extends NoThrowOptions {
  /**
   * When true, computes sample variance (divides by n - 1, Bessel's
   * correction) instead of population variance (divides by n). Requires at
   * least 2 values. Defaults to false.
   */
  sample?: boolean
}

/**
 * Computes the variance of an array of numbers. Population variance by
 * default; pass `{ sample: true }` for sample variance.
 *
 * Exact in decimal: the deviations from the mean, their squares and the
 * sum of squares are computed exactly (the deviations scaled by the count,
 * so the mean never has to be rounded), and the one division at the end is
 * the only rounding. So
 * `variance([0.1, 0.2, 0.3])` is `0.006666666666666667`, the correctly
 * rounded value of `1/150`, where plain floats give `0.006666666666666668`.
 *
 * Throws `RangeError` when `values` is empty, when `sample` is set with
 * fewer than 2 values, when a value is not finite, or when the variance is
 * too large for a JavaScript number.
 *
 * @param values - The numbers. Must not be empty; every value must be finite.
 * @param options - `sample: true` for sample variance; `noThrow` to return `NaN` instead of throwing.
 * @returns The variance, rounded once to the closest JavaScript number.
 * @throws {RangeError} When `values` is empty, `sample` is set with fewer than
 * 2 values, a value is not finite, or the variance is too large for a
 * JavaScript number.
 *
 * @example
 * variance([2, 4, 4, 4, 5, 5, 7, 9]); // 4
 * variance([2, 4, 4, 4, 5, 5, 7, 9], { sample: true }); // 4.571428571428571
 * variance([0.1, 0.2, 0.3]); // 0.006666666666666667
 *
 * @since 0.2.0 (exact in decimal since 0.7.0)
 */
export function variance(values: readonly number[], options: VarianceOptions = {}): number {
  return guardNumber(() => {
    if (values.length === 0) {
      throw new RangeError('variance: values must not be empty')
    }

    const { sample = false } = options
    if (sample && values.length < 2) {
      throw new RangeError('variance: sample variance requires at least 2 values')
    }

    validateValues(values, 'variance')

    // The mean S / n is usually not a terminating decimal, so the
    // deviations are scaled by n to stay exact: with D_i = n·x_i − S,
    // variance = Σ D_i² / (n² · divisor). Everything up to that one
    // division is exact integer arithmetic, and the quotient is rounded once.
    const n = integerDecimal(values.length)
    const total = exactSum(values)
    let squares: Decimal = integerDecimal(0)
    for (const value of values) {
      const deviation = subtractDecimals(multiplyDecimals(n, toDecimal(value)), total)
      squares = addDecimals(squares, multiplyDecimals(deviation, deviation))
    }
    const count = BigInt(values.length)
    const divisor = integerDecimal(count * count * (sample ? count - BigInt(1) : count))
    return toNumber(divideDecimals(squares, divisor), 'variance')
  }, options)
}
