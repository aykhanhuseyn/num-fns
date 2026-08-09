import { describe, expect, it } from 'bun:test'
import { inRange } from './in-range'

describe('inRange', () => {
  it('returns true for values within range, inclusive of both ends', () => {
    expect(inRange(5, 0, 10)).toBe(true)
    expect(inRange(0, 0, 10)).toBe(true)
    expect(inRange(10, 0, 10)).toBe(true)
  })

  it('returns false for values outside range', () => {
    expect(inRange(-1, 0, 10)).toBe(false)
    expect(inRange(11, 0, 10)).toBe(false)
  })

  it('works with negative ranges', () => {
    expect(inRange(-7, -10, -5)).toBe(true)
    expect(inRange(-15, -10, -5)).toBe(false)
  })

  it('throws when value is not finite', () => {
    expect(() => inRange(Number.NaN, 0, 10)).toThrow(RangeError)
    expect(() => inRange(Number.POSITIVE_INFINITY, 0, 10)).toThrow(RangeError)
  })

  it('throws when min or max is not finite', () => {
    expect(() => inRange(5, Number.NaN, 10)).toThrow(RangeError)
    expect(() => inRange(5, 0, Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })

  it('throws when min is greater than max', () => {
    expect(() => inRange(5, 10, 0)).toThrow(RangeError)
  })
})
