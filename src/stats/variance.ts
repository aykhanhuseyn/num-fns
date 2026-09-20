import type { NoThrowOptions } from '../config'
import { guardNumber } from '../shared/no-throw'
import { assertFiniteResult } from '../shared/validation'
import { mean } from './mean'

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
 * @example
 * variance([2, 4, 4, 4, 5, 5, 7, 9]); // 4
 * variance([2, 4, 4, 4, 5, 5, 7, 9], { sample: true }); // 4.571428571428571
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

    for (const value of values) {
      if (!Number.isFinite(value)) {
        throw new RangeError(`variance: all values must be finite, received ${value}`)
      }
    }

    const average = mean(values)
    const squaredDiffs = values.reduce((total, value) => total + (value - average) ** 2, 0)
    const divisor = sample ? values.length - 1 : values.length

    assertFiniteResult(squaredDiffs, 'variance')
    return squaredDiffs / divisor
  }, options)
}
