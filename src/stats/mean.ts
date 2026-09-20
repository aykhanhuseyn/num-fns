import { guardNumber } from '../shared/no-throw'
import { sum } from './sum'

/**
 * Computes the arithmetic mean (average) of an array of numbers.
 *
 * @example
 * mean([1, 2, 3, 4]); // 2.5
 */
export function mean(values: readonly number[]): number {
  return guardNumber(() => {
    if (values.length === 0) {
      throw new RangeError('mean: values must not be empty')
    }

    return sum(values) / values.length
  })
}
