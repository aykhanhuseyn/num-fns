import { guardNumber } from '../shared/no-throw'
/**
 * Returns the largest value in an array of numbers.
 *
 * @param values - The numbers. Must not be empty; every value must be finite.
 * @returns The largest value.
 * @throws {RangeError} When `values` is empty or a value is not finite.
 *
 * @example
 * max([3, 1, 4, 1, 5]); // 5
 *
 * @since 0.2.0
 */
export function max(values: readonly number[]): number {
  return guardNumber(() => {
    if (values.length === 0) {
      throw new RangeError('max: values must not be empty')
    }

    let result = Number.NEGATIVE_INFINITY
    for (const value of values) {
      if (!Number.isFinite(value)) {
        throw new RangeError(`max: all values must be finite, received ${value}`)
      }
      if (value > result) result = value
    }

    return result
  })
}
