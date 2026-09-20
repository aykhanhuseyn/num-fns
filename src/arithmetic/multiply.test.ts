import { describe, expect, it } from 'bun:test'
import { multiply } from './multiply'

describe('multiply', () => {
  it('matches the documented examples', () => {
    expect(multiply(0.1, 3)).toBe(0.3)
    expect(multiply(1.1, 1.1)).toBe(1.21)
    expect(multiply(19.99, 100)).toBe(1999)
  })

  it('avoids the classic floating-point traps', () => {
    expect(0.1 * 3).not.toBe(0.3)
    expect(1.1 * 1.1).not.toBe(1.21)
    expect(multiply(0.1, 3)).toBe(0.3)
    expect(multiply(1.1, 1.1)).toBe(1.21)
    expect(multiply(0.1, 0.2)).toBe(0.02)
    expect(multiply(1.005, 100)).toBe(100.5)
    expect(multiply(4.35, 100)).toBe(435)
  })

  it('multiplies integers exactly', () => {
    expect(multiply(6, 7)).toBe(42)
    expect(multiply(12345, 6789)).toBe(83_810_205)
    expect(multiply(1, 1)).toBe(1)
  })

  it('handles negatives and zero', () => {
    expect(multiply(-0.1, 3)).toBe(-0.3)
    expect(multiply(0.1, -3)).toBe(-0.3)
    expect(multiply(-1.1, -1.1)).toBe(1.21)
    expect(multiply(0, 0)).toBe(0)
    expect(multiply(0, 2.5)).toBe(0)
    expect(multiply(2.5, 0)).toBe(0)
    expect(multiply(1, 2.5)).toBe(2.5)
    expect(multiply(-1, 2.5)).toBe(-2.5)
  })

  it('accepts inputs whose String() form uses exponent notation', () => {
    expect(multiply(1e21, 2)).toBe(2e21)
    expect(multiply(1e21, 1e21)).toBe(1e42)
    expect(multiply(1.5e-7, 2)).toBe(3e-7)
    expect(multiply(1.5e-7, 1e7)).toBe(1.5)
    expect(multiply(1e21, 1.5e-7)).toBe(1.5e14)
  })

  it('handles operands of very different magnitudes', () => {
    expect(multiply(1e308, 1e-308)).toBe(1)
    expect(multiply(1e-308, 1e308)).toBe(1)
    expect(multiply(1e300, 1e-300)).toBe(1)
  })

  it('signs a zero product by the factors, like IEEE 754', () => {
    expect(Object.is(multiply(-1, 0), -0)).toBe(true)
    expect(Object.is(multiply(0, -1), -0)).toBe(true)
    expect(Object.is(multiply(-0, 5), -0)).toBe(true)
    expect(Object.is(multiply(-2.5, 0), -0)).toBe(true)
    expect(Object.is(multiply(-0, -0), -0)).toBe(false)
    expect(Object.is(multiply(0, 0), -0)).toBe(false)
  })

  it('keeps the sign of a negative product that underflows', () => {
    expect(Object.is(multiply(-1e-308, 1e-308), -0)).toBe(true)
    expect(Object.is(multiply(-5e-324, 0.1), -0)).toBe(true)
    expect(Object.is(multiply(1e-308, 1e-308), -0)).toBe(false)
  })

  it('throws RangeError when a is not finite', () => {
    expect(() => multiply(Number.NaN, 1)).toThrow(RangeError)
    expect(() => multiply(Number.POSITIVE_INFINITY, 1)).toThrow(RangeError)
    expect(() => multiply(Number.NEGATIVE_INFINITY, 1)).toThrow(RangeError)
    expect(() => multiply(Number.NaN, 1)).toThrow('multiply: a must be finite, received NaN')
  })

  it('throws RangeError when b is not finite', () => {
    expect(() => multiply(1, Number.NaN)).toThrow(RangeError)
    expect(() => multiply(1, Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => multiply(1, Number.NEGATIVE_INFINITY)).toThrow(RangeError)
    expect(() => multiply(1, Number.NaN)).toThrow('multiply: b must be finite, received NaN')
  })

  it('throws RangeError instead of returning Infinity when the product overflows', () => {
    expect(() => multiply(1e200, 1e200)).toThrow(RangeError)
    expect(() => multiply(1e200, 1e200)).toThrow(
      'multiply: result 1e400 is outside the range of a JavaScript number',
    )
    expect(() => multiply(-1e200, 1e200)).toThrow(RangeError)
    expect(() => multiply(Number.MAX_VALUE, 2)).toThrow(RangeError)
  })
})
