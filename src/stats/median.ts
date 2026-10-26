import { addDecimals, divideDecimals, toDecimal } from '../arithmetic/decimal'
import { guardNumber } from '../shared/no-throw'
import { isNegativeZero } from '../shared/sign'
import { integerDecimal, toNumber, validateValues } from './exact'

/**
 * Computes the median of an array of numbers — the middle value once
 * sorted, or the average of the two middle values for an even-length array.
 * That average is exact in decimal and rounded once, so
 * `median([0.1, 0.2])` is `0.15` and the two middle values never overflow on
 * their own (`median([Number.MAX_VALUE, Number.MAX_VALUE])` is
 * `Number.MAX_VALUE`).
 *
 * Throws `RangeError` when `values` is empty or a value is not finite.
 *
 * @param values - The numbers. Must not be empty; every value must be finite.
 * @returns The middle value, or the exact average of the two middle values.
 * @throws {RangeError} When `values` is empty or a value is not finite.
 *
 * @example
 * median([1, 3, 2]); // 2
 * median([1, 2, 3, 4]); // 2.5
 * median([0.1, 0.2]); // 0.15
 *
 * @since 0.2.0 (exact in decimal since 0.7.0)
 */
export function median(values: readonly number[]): number {
  return guardNumber(() => {
    validateValues(values, 'median')
    const sorted = [...values].sort((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    if (sorted.length % 2 === 1) return sorted[middle] as number

    // The midpoint of the two middle values, exactly: their sum is never
    // rounded or overflowed on its own (`median([MAX_VALUE, MAX_VALUE])`).
    const low = sorted[middle - 1] as number
    const high = sorted[middle] as number
    const total = addDecimals(toDecimal(low), toDecimal(high))
    const midpoint = divideDecimals(total, integerDecimal(2))
    return toNumber(midpoint, 'median', isNegativeZero(low) && isNegativeZero(high))
  })
}
