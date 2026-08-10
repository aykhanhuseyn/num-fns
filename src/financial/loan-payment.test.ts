import { describe, expect, it } from 'bun:test'
import { amortizationSchedule, loanPayment } from './loan-payment'

describe('loanPayment', () => {
  it('computes the fixed payment for a standard amortizing loan', () => {
    expect(loanPayment(200000, 0.06 / 12, 360)).toBeCloseTo(1199.1, 2)
  })

  it('divides principal evenly when rate is 0', () => {
    expect(loanPayment(1000, 0, 10)).toBe(100)
  })

  it('throws when principal is not finite', () => {
    expect(() => loanPayment(Number.NaN, 0.01, 12)).toThrow(RangeError)
  })

  it('throws when rate is not finite or <= -1', () => {
    expect(() => loanPayment(1000, Number.NaN, 12)).toThrow(RangeError)
    expect(() => loanPayment(1000, -1, 12)).toThrow(RangeError)
    expect(() => loanPayment(1000, -1.5, 12)).toThrow(RangeError)
  })

  it('throws when periods is not a positive integer', () => {
    expect(() => loanPayment(1000, 0.01, 0)).toThrow(RangeError)
    expect(() => loanPayment(1000, 0.01, -3)).toThrow(RangeError)
    expect(() => loanPayment(1000, 0.01, 3.5)).toThrow(RangeError)
  })
})

describe('amortizationSchedule', () => {
  it('builds one row per period with a constant payment', () => {
    const schedule = amortizationSchedule(1000, 0.01, 3)

    expect(schedule).toHaveLength(3)
    for (const row of schedule) {
      expect(row.payment).toBeCloseTo(340.022111481469, 9)
    }
  })

  it('splits the first payment into interest on the full principal and the remainder', () => {
    const [first] = amortizationSchedule(1000, 0.01, 3)
    expect(first?.interest).toBeCloseTo(10, 9)
    expect(first?.principal).toBeCloseTo(330.022111481469, 9)
    expect(first?.balance).toBeCloseTo(669.977888518531, 9)
  })

  it('ends at exactly 0 balance and repays exactly the principal', () => {
    const schedule = amortizationSchedule(1000, 0.01, 3)
    const last = schedule[schedule.length - 1]

    expect(last?.balance).toBe(0)

    const totalPrincipal = schedule.reduce((sum, row) => sum + row.principal, 0)
    expect(totalPrincipal).toBeCloseTo(1000, 9)
  })

  it('handles a 0 rate by allocating the full payment to principal', () => {
    const schedule = amortizationSchedule(1000, 0, 4)
    for (const row of schedule) {
      expect(row.interest).toBe(0)
      expect(row.principal).toBe(250)
    }
    expect(schedule[schedule.length - 1]?.balance).toBe(0)
  })

  it('propagates loanPayment validation errors', () => {
    expect(() => amortizationSchedule(Number.NaN, 0.01, 3)).toThrow(RangeError)
    expect(() => amortizationSchedule(1000, -1, 3)).toThrow(RangeError)
    expect(() => amortizationSchedule(1000, 0.01, 0)).toThrow(RangeError)
  })
})
