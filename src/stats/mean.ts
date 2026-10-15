import { divide } from '../arithmetic/divide'
import { guardNumber } from '../shared/no-throw'
import { sum } from './sum'

/**
 * Computes the arithmetic mean (average) of an array of numbers, exactly in
 * decimal: the total comes from {@link sum} and the division from
 * {@link divide}, so `mean([0.1, 0.2])` is `0.15`, not
 * `0.15000000000000002`.
 *
 * Throws `RangeError` when `values` is empty or a value is not finite.
 *
 * @example
 * mean([1, 2, 3, 4]); // 2.5
 * mean([0.1, 0.2]); // 0.15
 *
 * @since 0.2.0 (exact in decimal since 0.7.0)
 */
export function mean(values: readonly number[]): number {
  return guardNumber(() => {
    if (values.length === 0) {
      throw new RangeError('mean: values must not be empty')
    }

    return divide(sum(values), values.length)
  })
}
