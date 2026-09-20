import { guardList, guardNumber } from '../shared/no-throw'
import { assertFinite, assertFiniteRate, assertPositiveInteger } from '../shared/validation'

/**
 * One row of an {@link amortizationSchedule} — the interest/principal split
 * for a single payment period and the balance remaining after it.
 */
export interface AmortizationScheduleEntry {
  /** 1-indexed period number. */
  period: number
  /** The fixed payment amount for this period (same value every row). */
  payment: number
  /** Portion of `payment` that reduces the outstanding balance. */
  principal: number
  /** Portion of `payment` that pays interest accrued on the prior balance. */
  interest: number
  /** Outstanding balance after this payment. Exactly `0` on the final row. */
  balance: number
}

/**
 * Computes the fixed periodic payment (`PMT`) that fully repays `principal`
 * over `periods` equal payments at a constant per-period `rate` — a
 * fixed-rate mortgage or amortizing-loan payment.
 *
 * Assumes an ordinary annuity (payments due at the end of each period, not
 * the start). When `rate` is `0`, the payment is simply `principal / periods`.
 *
 * @param principal - The loan amount, e.g. `200000`.
 * @param rate - The interest rate per period, as a decimal (`0.005` = 0.5%
 * per period — for a 6% annual rate paid monthly, pass `0.06 / 12`).
 * @param periods - The total number of payments, e.g. `360` for a 30-year
 * monthly mortgage.
 *
 * @example
 * loanPayment(200000, 0.06 / 12, 360); // 1199.100... (30-year, 6% APR mortgage)
 * loanPayment(1000, 0, 10); // 100 (no interest)
 */
export function loanPayment(principal: number, rate: number, periods: number): number {
  return guardNumber(() => {
    assertFinite(principal, 'principal', 'loanPayment')
    assertFiniteRate(rate, 'loanPayment')
    assertPositiveInteger(periods, 'periods', 'loanPayment')

    if (rate === 0) return principal / periods
    return (principal * rate) / (1 - (1 + rate) ** -periods)
  })
}

/**
 * Builds the full period-by-period amortization schedule for a fixed-rate
 * loan — the interest/principal split of each {@link loanPayment} payment and
 * the balance remaining afterward.
 *
 * The final row's `principal`/`balance` are adjusted so the schedule always
 * ends at exactly `0`, correcting the floating-point drift that accumulates
 * from repeatedly subtracting a fixed payment over many periods.
 *
 * @param principal - The loan amount, e.g. `200000`.
 * @param rate - The interest rate per period, as a decimal (see {@link loanPayment}).
 * @param periods - The total number of payments.
 *
 * @example
 * amortizationSchedule(1000, 0.01, 3);
 * // [
 * //   { period: 1, payment: 340.02, interest: 10,    principal: 330.02, balance: 669.98 },
 * //   { period: 2, payment: 340.02, interest: 6.70,  principal: 333.32, balance: 336.66 },
 * //   { period: 3, payment: 340.02, interest: 3.37,  principal: 336.66, balance: 0      },
 * // ]
 */
export function amortizationSchedule(
  principal: number,
  rate: number,
  periods: number,
): AmortizationScheduleEntry[] {
  return guardList(() => {
    const payment = loanPayment(principal, rate, periods)

    const schedule: AmortizationScheduleEntry[] = []
    let balance = principal

    for (let period = 1; period <= periods; period++) {
      const interest = balance * rate
      let principalPaid = payment - interest
      balance -= principalPaid

      if (period === periods) {
        principalPaid += balance
        balance = 0
      }

      schedule.push({ period, payment, principal: principalPaid, interest, balance })
    }

    return schedule
  })
}
