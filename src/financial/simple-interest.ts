import { guardNumber } from '../shared/no-throw'
import { assertFinite, assertNonNegative } from '../shared/validation'

/**
 * Computes the simple interest earned on a principal.
 *
 * Simple interest is interest that accrues linearly on the original
 * principal only, with no compounding.
 *
 * Returns the interest earned, not the resulting balance; add `principal` to
 * the result yourself if you need the final amount (see {@link futureValue}
 * for a compounding equivalent that already includes the principal).
 *
 * @param principal - The original amount, e.g. `1000`.
 * @param rate - The interest rate per period, as a decimal (`0.05` = 5%).
 * @param time - The number of periods (matching the rate's period, typically years).
 * @returns The interest earned, without the principal.
 * @throws {RangeError} When `principal` or `rate` is not finite, or when
 * `time` is negative or not finite.
 * @since 0.2.0
 *
 * @example
 * simpleInterest(1000, 0.05, 3); // 150 (1000 * 0.05 * 3)
 */
export function simpleInterest(principal: number, rate: number, time: number): number {
  return guardNumber(() => {
    assertFinite(principal, 'principal', 'simpleInterest')
    assertFinite(rate, 'rate', 'simpleInterest')
    assertNonNegative(time, 'time', 'simpleInterest')

    return principal * rate * time
  })
}
