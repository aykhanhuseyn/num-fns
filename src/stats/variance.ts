import {
  addDecimals,
  type Decimal,
  fromDecimal,
  multiplyDecimals,
  subtractDecimals,
  toDecimal,
} from '../arithmetic/decimal'
import { divide } from '../arithmetic/divide'
import type { NoThrowOptions } from '../config'
import { guardNumber } from '../shared/no-throw'
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
 * Exact in decimal: each deviation from the {@link mean} is a
 * {@link subtract}, its square a {@link multiply}, the squares are summed
 * exactly and the sum is divided with {@link divide}. So
 * `variance([0.1, 0.2, 0.3])` is `0.006666666666666667`, the correctly
 * rounded value of `1/150`, where plain floats give `0.006666666666666668`.
 *
 * Throws `RangeError` when `values` is empty, when `sample` is set with
 * fewer than 2 values, when a value is not finite, or when the sum of
 * squares is too large for a JavaScript number.
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

    for (const value of values) {
      if (!Number.isFinite(value)) {
        throw new RangeError(`variance: all values must be finite, received ${value}`)
      }
    }

    // Each deviation is squared and summed as an exact decimal — the same
    // result as `subtract`/`multiply`/`add` per element, without converting
    // back to a number in between.
    const average = toDecimal(mean(values))
    let total: Decimal = { digits: BigInt(0), scale: 0 }
    values.forEach((value, index) => {
      const deviation = subtractDecimals(toDecimal(value), average)
      const square = multiplyDecimals(deviation, deviation)
      total = index === 0 ? square : addDecimals(total, square)
    })
    const squaredDiffs = fromDecimal(total.digits, total.scale, 'variance')
    const divisor = sample ? values.length - 1 : values.length

    return divide(squaredDiffs, divisor)
  }, options)
}
