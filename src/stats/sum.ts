import { guardNumber } from '../shared/no-throw'
import { assertFiniteResult } from '../shared/validation'
/**
 * Sums an array of numbers.
 *
 * @example
 * sum([1, 2, 3]); // 6
 */
export function sum(values: readonly number[]): number {
  return guardNumber(() => {
    if (values.length === 0) {
      throw new RangeError('sum: values must not be empty')
    }

    let total = 0
    for (const value of values) {
      if (!Number.isFinite(value)) {
        throw new RangeError(`sum: all values must be finite, received ${value}`)
      }
      total += value
    }

    assertFiniteResult(total, 'sum')
    return total
  })
}
