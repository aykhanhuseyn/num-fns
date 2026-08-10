import { describe, expect, it } from 'bun:test'
import { futureValue } from './future-value'
import { presentValue } from './present-value'

describe('presentValue', () => {
  it('discounts a future amount back to today', () => {
    expect(presentValue(1157.625, 0.05, 3)).toBeCloseTo(1000, 5)
  })

  it('returns the future amount unchanged when periods is 0', () => {
    expect(presentValue(1000, 0.05, 0)).toBe(1000)
  })

  it('round-trips with futureValue', () => {
    const original = 2500
    const rate = 0.07
    const periods = 5
    expect(presentValue(futureValue(original, rate, periods), rate, periods)).toBeCloseTo(
      original,
      5,
    )
  })

  it('throws when futureAmount is not finite', () => {
    expect(() => presentValue(Number.NaN, 0.05, 1)).toThrow(RangeError)
  })

  it('throws when rate is not finite or <= -1', () => {
    expect(() => presentValue(1000, Number.NaN, 1)).toThrow(RangeError)
    expect(() => presentValue(1000, -1, 1)).toThrow(RangeError)
  })

  it('throws when periods is not finite or negative', () => {
    expect(() => presentValue(1000, 0.05, -1)).toThrow(RangeError)
    expect(() => presentValue(1000, 0.05, Number.NaN)).toThrow(RangeError)
  })
})
