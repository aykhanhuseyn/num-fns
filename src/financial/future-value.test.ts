import { describe, expect, it } from 'bun:test'
import { futureValue } from './future-value'

describe('futureValue', () => {
  it('computes the compounded balance after N periods', () => {
    expect(futureValue(1000, 0.05, 3)).toBeCloseTo(1157.625, 5)
  })

  it('returns the present amount unchanged when periods is 0', () => {
    expect(futureValue(1000, 0.05, 0)).toBe(1000)
  })

  it('throws when presentAmount is not finite', () => {
    expect(() => futureValue(Number.NaN, 0.05, 1)).toThrow(RangeError)
  })

  it('throws when rate is not finite or <= -1', () => {
    expect(() => futureValue(1000, Number.NaN, 1)).toThrow(RangeError)
    expect(() => futureValue(1000, -1, 1)).toThrow(RangeError)
  })

  it('throws when periods is not finite or negative', () => {
    expect(() => futureValue(1000, 0.05, -1)).toThrow(RangeError)
    expect(() => futureValue(1000, 0.05, Number.NaN)).toThrow(RangeError)
  })
})
