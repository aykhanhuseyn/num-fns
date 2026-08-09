import { describe, expect, it } from 'bun:test'
import { clamp } from './clamp'

describe('clamp', () => {
  it('returns the value unchanged when already within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })

  it('clamps to min when below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  it('clamps to max when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  it('works with negative ranges', () => {
    expect(clamp(-15, -10, -5)).toBe(-10)
    expect(clamp(-1, -10, -5)).toBe(-5)
    expect(clamp(-7, -10, -5)).toBe(-7)
  })

  it('throws when value is not finite', () => {
    expect(() => clamp(Number.NaN, 0, 10)).toThrow(RangeError)
    expect(() => clamp(Number.POSITIVE_INFINITY, 0, 10)).toThrow(RangeError)
  })

  it('throws when min or max is not finite', () => {
    expect(() => clamp(5, Number.NaN, 10)).toThrow(RangeError)
    expect(() => clamp(5, 0, Number.POSITIVE_INFINITY)).toThrow(RangeError)
  })

  it('throws when min is greater than max', () => {
    expect(() => clamp(5, 10, 0)).toThrow(RangeError)
  })
})
