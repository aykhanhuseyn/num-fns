import { guardNumber } from '../shared/no-throw'
import type { CompoundInterestOptions } from '../shared/types'
import {
  assertFinite,
  assertFiniteRate,
  assertNonNegative,
  assertPositive,
} from '../shared/validation'

/**
 * Computes the compound interest earned on a principal.
 *
 * Compound interest is interest that accrues on both the original
 * principal and previously-accumulated interest.
 *
 * Returns the interest earned, not the resulting balance; add `principal` to
 * the result if you need the final amount, or use {@link futureValue} which
 * returns the balance directly (at the cost of a fixed one-compound-per-period
 * schedule, whereas this function lets you vary `compoundsPerPeriod`).
 *
 * @param principal - The original amount, e.g. `1000`.
 * @param rate - The nominal interest rate per period, as a decimal (`0.05` = 5%).
 * @param time - The number of periods (matching the rate's period, typically years).
 * @param options - `compoundsPerPeriod`: how many times interest compounds in
 * one period. Default `1`.
 * @returns The interest earned, without the principal.
 * @throws {RangeError} When `principal` is not finite, when `rate` is not
 * finite or is `-1` or less, when `time` is negative or not finite, or when
 * `compoundsPerPeriod` is not a finite number greater than `0`.
 * @since 0.2.0
 *
 * @example
 * compoundInterest(1000, 0.05, 3); // 157.6250000000001 (annual compounding)
 * compoundInterest(1000, 0.05, 3, { compoundsPerPeriod: 12 }); // monthly compounding
 */
export function compoundInterest(
  principal: number,
  rate: number,
  time: number,
  options: CompoundInterestOptions = {},
): number {
  return guardNumber(() => {
    assertFinite(principal, 'principal', 'compoundInterest')
    assertFiniteRate(rate, 'compoundInterest')
    assertNonNegative(time, 'time', 'compoundInterest')

    const { compoundsPerPeriod = 1 } = options
    assertPositive(compoundsPerPeriod, 'compoundsPerPeriod', 'compoundInterest')

    const amount = principal * (1 + rate / compoundsPerPeriod) ** (compoundsPerPeriod * time)
    return amount - principal
  }, options)
}
