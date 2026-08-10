/**
 * Returns the largest value in an array of numbers.
 *
 * @example
 * max([3, 1, 4, 1, 5]); // 5
 */
export function max(values: readonly number[]): number {
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
}
