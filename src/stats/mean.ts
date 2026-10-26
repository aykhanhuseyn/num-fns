import { divideDecimals } from '../arithmetic/decimal'
import { guardNumber } from '../shared/no-throw'
import { exactSum, integerDecimal, toNumber, validateValues } from './exact'

/**
 * Computes the arithmetic mean (average) of an array of numbers, exactly in
 * decimal: the exact total is divided by the count and the quotient is
 * rounded once, so `mean([0.1, 0.2])` is `0.15`, not `0.15000000000000002`,
 * and the result is the correctly rounded mean even where the total itself
 * would not fit a `number` (`mean([Number.MAX_VALUE, Number.MAX_VALUE])` is
 * `Number.MAX_VALUE`).
 *
 * Throws `RangeError` when `values` is empty or a value is not finite.
 * Signed zeros follow {@link sum}: the mean is `-0` only when every value is.
 *
 * @param values - The numbers. Must not be empty; every value must be finite.
 * @returns The mean, rounded once to the closest JavaScript number.
 * @throws {RangeError} When `values` is empty or a value is not finite.
 *
 * @example
 * mean([1, 2, 3, 4]); // 2.5
 * mean([0.1, 0.2]); // 0.15
 *
 * @since 0.2.0 (exact in decimal since 0.7.0)
 */
export function mean(values: readonly number[]): number {
  return guardNumber(() => {
    const negativeZero = validateValues(values, 'mean')
    const quotient = divideDecimals(exactSum(values), integerDecimal(values.length))
    return toNumber(quotient, 'mean', negativeZero)
  })
}
