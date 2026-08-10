import type { CompoundInterestOptions } from '../shared/types'

/**
 * Computes compound interest — interest that accrues on both the original
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
  if (!Number.isFinite(principal)) {
    throw new RangeError(`compoundInterest: principal must be finite, received ${principal}`)
  }
  if (!Number.isFinite(rate) || rate <= -1) {
    throw new RangeError(
      `compoundInterest: rate must be finite and greater than -1, received ${rate}`,
    )
  }
  if (!Number.isFinite(time) || time < 0) {
    throw new RangeError(`compoundInterest: time must be a finite number >= 0, received ${time}`)
  }

  const { compoundsPerPeriod = 1 } = options
  if (!Number.isFinite(compoundsPerPeriod) || compoundsPerPeriod <= 0) {
    throw new RangeError(
      `compoundInterest: compoundsPerPeriod must be a finite number > 0, received ${compoundsPerPeriod}`,
    )
  }

  const amount = principal * (1 + rate / compoundsPerPeriod) ** (compoundsPerPeriod * time)
  return amount - principal
}
