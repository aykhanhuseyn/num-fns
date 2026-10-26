import {
  addDecimals,
  multiplyDecimals,
  pow10,
  subtractDecimals,
  toDecimal,
} from '../arithmetic/decimal'
import { guardNumber } from '../shared/no-throw'
import { toNumber, validateValues } from './exact'

/**
 * Computes the p-th percentile (0-100) of an array of numbers using linear
 * interpolation between closest ranks — the same method as Excel's
 * PERCENTILE.INC and NumPy's default "linear" interpolation. The rank and
 * the interpolation are exact in decimal and the result is rounded once, so
 * `percentile([0.1, 0.2], 50)` is `0.15`, `percentile(values, 50)` always
 * equals `median(values)`, and no middle step can overflow
 * (`percentile([-Number.MAX_VALUE, Number.MAX_VALUE], 50)` is `0`).
 *
 * Throws `RangeError` when `values` is empty, when `p` is outside `0..100`,
 * or when a value is not finite.
 *
 * @param values - The numbers. Must not be empty; every value must be finite.
 * @param p - The percentile, from 0 to 100 inclusive.
 * @returns The interpolated value, rounded once to the closest JavaScript number.
 * @throws {RangeError} When `values` is empty, `p` is outside `0..100`, or a
 * value is not finite.
 *
 * @example
 * percentile([1, 2, 3, 4, 5], 50); // 3
 * percentile([1, 2, 3, 4], 25); // 1.75
 * percentile([0.1, 0.2], 50); // 0.15
 *
 * @since 0.2.0 (exact in decimal since 0.7.0)
 */
export function percentile(values: readonly number[], p: number): number {
  return guardNumber(() => {
    if (values.length === 0) {
      throw new RangeError('percentile: values must not be empty')
    }
    if (!Number.isFinite(p) || p < 0 || p > 100) {
      throw new RangeError(`percentile: p must be between 0 and 100, received ${p}`)
    }
    validateValues(values, 'percentile')

    const sorted = [...values].sort((a, b) => a - b)
    if (sorted.length === 1) return sorted[0] as number

    // rank = p / 100 × (n - 1), exactly: p's decimal digits times (n - 1),
    // two places further right. Its integer part picks the lower rank and
    // its exact fraction is the interpolation weight, so a rank that is a
    // whole number returns that value as it is.
    const pDecimal = toDecimal(p)
    const rankDigits = pDecimal.digits * BigInt(sorted.length - 1)
    const rankScale = pDecimal.scale + 2
    if (rankScale <= 0) return sorted[Number(rankDigits * pow10(-rankScale))] as number
    const unit = pow10(rankScale)
    const lowerIndex = Number(rankDigits / unit)
    const remainder = rankDigits % unit
    const lowerValue = sorted[lowerIndex] as number
    if (remainder === BigInt(0)) return lowerValue

    const lower = toDecimal(lowerValue)
    const upper = toDecimal(sorted[lowerIndex + 1] as number)
    const weight = { digits: remainder, scale: rankScale }
    const result = addDecimals(lower, multiplyDecimals(subtractDecimals(upper, lower), weight))
    return toNumber(result, 'percentile')
  })
}
