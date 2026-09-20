import { guardNumber } from '../shared/no-throw'
/**
 * Returns the smallest value in an array of numbers.
 *
 * @example
 * min([3, 1, 4, 1, 5]); // 1
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
