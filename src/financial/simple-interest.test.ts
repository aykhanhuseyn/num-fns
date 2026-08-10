import { describe, expect, it } from 'bun:test'
import { simpleInterest } from './simple-interest'

describe('simpleInterest', () => {
  it('computes interest earned, not the final balance', () => {
    expect(simpleInterest(1000, 0.05, 3)).toBe(150)
    expect(simpleInterest(1000, 0.05, 0)).toBe(0)
  })

  it('supports a negative rate (e.g. depreciation-style scenarios)', () => {
    expect(simpleInterest(1000, -0.1, 2)).toBe(-200)
  })

  it('throws when principal is not finite', () => {
    expect(() => simpleInterest(Number.NaN, 0.05, 1)).toThrow(RangeError)
    expect(() => simpleInterest(Number.POSITIVE_INFINITY, 0.05, 1)).toThrow(RangeError)
  })

  it('throws when rate is not finite', () => {
    expect(() => simpleInterest(1000, Number.NaN, 1)).toThrow(RangeError)
  })

  it('throws when time is not finite or negative', () => {
    expect(() => simpleInterest(1000, 0.05, -1)).toThrow(RangeError)
    expect(() => simpleInterest(1000, 0.05, Number.NaN)).toThrow(RangeError)
  })
})
