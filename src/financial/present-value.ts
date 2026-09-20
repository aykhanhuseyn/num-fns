import { guardNumber } from '../shared/no-throw'
import { assertFinite, assertFiniteRate, assertNonNegative } from '../shared/validation'

/**
 * Computes the present value of a future amount, discounting it back at a
 * fixed rate compounded once per period — the inverse of {@link futureValue}.
 *
 * @param futureAmount - The amount at the end of `periods` periods, e.g. `1157.625`.
 * @param rate - The discount rate per period, as a decimal (`0.05` = 5%).
 * @param periods - The number of periods to discount over.
 *
 * @example
 * presentValue(1157.625, 0.05, 3); // 1000
 */
export function presentValue(futureAmount: number, rate: number, periods: number): number {
  return guardNumber(() => {
    assertFinite(futureAmount, 'futureAmount', 'presentValue')
    assertFiniteRate(rate, 'presentValue')
    assertNonNegative(periods, 'periods', 'presentValue')

    return futureAmount / (1 + rate) ** periods
  })
}
