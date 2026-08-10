import { describe, expect, it } from 'bun:test'
import { compoundInterest } from './compound-interest'

describe('compoundInterest', () => {
  it('computes interest earned with annual compounding by default', () => {
    expect(compoundInterest(1000, 0.05, 3)).toBeCloseTo(157.625, 5)
  })

  it('returns 0 when time is 0', () => {
    expect(compoundInterest(1000, 0.05, 0)).toBe(0)
  })

  it('compounds more frequently with compoundsPerPeriod', () => {
    const annual = compoundInterest(1000, 0.05, 3)
    const monthly = compoundInterest(1000, 0.05, 3, { compoundsPerPeriod: 12 })
    expect(monthly).toBeGreaterThan(annual)
  })

  it('throws when principal is not finite', () => {
    expect(() => compoundInterest(Number.NaN, 0.05, 1)).toThrow(RangeError)
  })

  it('throws when rate is not finite or <= -1', () => {
    expect(() => compoundInterest(1000, Number.NaN, 1)).toThrow(RangeError)
    expect(() => compoundInterest(1000, -1, 1)).toThrow(RangeError)
    expect(() => compoundInterest(1000, -1.5, 1)).toThrow(RangeError)
  })

  it('throws when time is not finite or negative', () => {
    expect(() => compoundInterest(1000, 0.05, -1)).toThrow(RangeError)
    expect(() => compoundInterest(1000, 0.05, Number.NaN)).toThrow(RangeError)
  })

  it('throws when compoundsPerPeriod is not finite or <= 0', () => {
    expect(() => compoundInterest(1000, 0.05, 1, { compoundsPerPeriod: 0 })).toThrow(RangeError)
    expect(() => compoundInterest(1000, 0.05, 1, { compoundsPerPeriod: -12 })).toThrow(RangeError)
    expect(() => compoundInterest(1000, 0.05, 1, { compoundsPerPeriod: Number.NaN })).toThrow(
      RangeError,
    )
  })
})
