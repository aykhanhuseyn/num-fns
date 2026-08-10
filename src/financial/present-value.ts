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
  if (!Number.isFinite(futureAmount)) {
    throw new RangeError(`presentValue: futureAmount must be finite, received ${futureAmount}`)
  }
  if (!Number.isFinite(rate) || rate <= -1) {
    throw new RangeError(`presentValue: rate must be finite and greater than -1, received ${rate}`)
  }
  if (!Number.isFinite(periods) || periods < 0) {
    throw new RangeError(`presentValue: periods must be a finite number >= 0, received ${periods}`)
  }

  return futureAmount / (1 + rate) ** periods
}
