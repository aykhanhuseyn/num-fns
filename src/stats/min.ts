import { guardNumber } from '../shared/no-throw'
/**
 * Returns the smallest value in an array of numbers.
 *
 * @param values - The numbers. Must not be empty; every value must be finite.
 * @returns The smallest value.
 * @throws {RangeError} When `values` is empty or a value is not finite.
 *
 * @example
 * min([3, 1, 4, 1, 5]); // 1
 *
 * @since 0.2.0
 */
export function min(values: readonly number[]): number {
  return guardNumber(() => {
    if (values.length === 0) {
      throw new RangeError('min: values must not be empty')
    }

    let result = Number.POSITIVE_INFINITY
    for (const value of values) {
      if (!Number.isFinite(value)) {
        throw new RangeError(`min: all values must be finite, received ${value}`)
      }
      if (value < result) result = value
    }

    return result
  })
}
