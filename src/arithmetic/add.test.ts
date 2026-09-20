import { describe, expect, it } from 'bun:test'
import { add } from './add'

describe('add', () => {
  it('matches the documented examples', () => {
    expect(add(0.1, 0.2)).toBe(0.3)
    expect(add(1.15, 2.3)).toBe(3.45)
    expect(add(-1.5, 1.5)).toBe(0)
  })

  it('avoids the classic floating-point traps', () => {
    expect(0.1 + 0.2).not.toBe(0.3)
    expect(add(0.1, 0.2)).toBe(0.3)
    expect(add(0.7, 0.1)).toBe(0.8)
    expect(add(1.005, 0.005)).toBe(1.01)
    expect(add(9.95, 0.05)).toBe(10)
  })

  it('adds integers exactly', () => {
    expect(add(2, 3)).toBe(5)
    expect(add(1_000_000, 1)).toBe(1_000_001)
    expect(add(Number.MAX_SAFE_INTEGER, 0)).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('handles negatives and zero', () => {
    expect(add(-0.1, -0.2)).toBe(-0.3)
    expect(add(-1, 0.5)).toBe(-0.5)
    expect(add(0.5, -1)).toBe(-0.5)
    expect(add(0, 0)).toBe(0)
    expect(add(0, 2.5)).toBe(2.5)
    expect(add(-2.5, 0)).toBe(-2.5)
  })

  it('accepts inputs whose String() form uses exponent notation', () => {
    expect(add(1e21, 1e21)).toBe(2e21)
    expect(add(1e21, 1)).toBe(1e21)
    expect(add(1.5e-7, 1)).toBe(1.00000015)
    expect(add(1.5e-7, 1.5e-7)).toBe(3e-7)
    expect(add(1e21, 1.5e-7)).toBe(1e21)
  })

  it('handles operands of very different magnitudes', () => {
    expect(add(1e308, 1e-308)).toBe(1e308)
    expect(add(1e-308, 1e308)).toBe(1e308)
    expect(add(5e-324, 5e-324)).toBe(1e-323)
    expect(add(1e9, 0.001)).toBe(1000000000.001)
  })

  it('gives a signed zero only when both addends are -0 (IEEE 754)', () => {
    expect(Object.is(add(-0, -0), -0)).toBe(true)
    expect(Object.is(add(-0, 0), -0)).toBe(false)
    expect(Object.is(add(0, -0), -0)).toBe(false)
    expect(Object.is(add(-1.5, 1.5), -0)).toBe(false)
    expect(Object.is(add(-0.1, 0.1), -0)).toBe(false)
  })

  it('throws RangeError when a is not finite', () => {
    expect(() => add(Number.NaN, 1)).toThrow(RangeError)
    expect(() => add(Number.POSITIVE_INFINITY, 1)).toThrow(RangeError)
    expect(() => add(Number.NEGATIVE_INFINITY, 1)).toThrow(RangeError)
    expect(() => add(Number.NaN, 1)).toThrow('add: a must be finite, received NaN')
  })

  it('throws RangeError when b is not finite', () => {
    expect(() => add(1, Number.NaN)).toThrow(RangeError)
    expect(() => add(1, Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => add(1, Number.NEGATIVE_INFINITY)).toThrow(RangeError)
    expect(() => add(1, Number.NEGATIVE_INFINITY)).toThrow(
      'add: b must be finite, received -Infinity',
    )
  })

  it('throws RangeError instead of returning Infinity when the sum overflows', () => {
    expect(() => add(1e308, 1e308)).toThrow(RangeError)
    expect(() => add(-1e308, -1e308)).toThrow(RangeError)
    expect(() => add(Number.MAX_VALUE, Number.MAX_VALUE)).toThrow(RangeError)
  })
})
