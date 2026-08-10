import { assertFinite, assertFiniteRate, assertNonNegative } from '../shared/validation'

/**
 * Computes the future value of a present amount, compounding once per period
 * at a fixed rate — the balance you'd have after `periods` periods, not just
 * the interest earned (contrast with `compoundInterest`, which returns
 * interest only but supports sub-period compounding).
 *
 * @param presentAmount - The amount today, e.g. `1000`.
 * @param rate - The interest rate per period, as a decimal (`0.05` = 5%).
 * @param periods - The number of periods to compound over.
 *
 * @example
 * futureValue(1000, 0.05, 3); // 1157.625
 */
export function futureValue(presentAmount: number, rate: number, periods: number): number {
  assertFinite(presentAmount, 'presentAmount', 'futureValue')
  assertFiniteRate(rate, 'futureValue')
  assertNonNegative(periods, 'periods', 'futureValue')

  return presentAmount * (1 + rate) ** periods
}
