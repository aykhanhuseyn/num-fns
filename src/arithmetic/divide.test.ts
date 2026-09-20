import { describe, expect, it } from 'bun:test'
import { divide } from './divide'

describe('divide', () => {
  it('matches the documented examples', () => {
    expect(divide(0.3, 0.1)).toBe(3)
    expect(divide(1, 3)).toBe(0.3333333333333333)
    expect(divide(1999, 100)).toBe(19.99)
  })

  it('avoids the classic floating-point traps', () => {
    expect(0.3 / 0.1).not.toBe(3)
    expect(divide(0.3, 0.1)).toBe(3)
    expect(divide(0.6, 0.2)).toBe(3)
    expect(divide(1.21, 1.1)).toBe(1.1)
    expect(divide(0.02, 0.1)).toBe(0.2)
  })

  it('is exact for terminating quotients', () => {
    expect(divide(1, 8)).toBe(0.125)
    expect(divide(10, 4)).toBe(2.5)
    expect(divide(1, 1e21)).toBe(1e-21)
    expect(divide(6, 3)).toBe(2)
    expect(divide(1, 1)).toBe(1)
  })

  it('agrees with the correctly rounded float quotient when the result does not terminate', () => {
    expect(divide(1, 3)).toBe(1 / 3)
    expect(divide(2, 3)).toBe(2 / 3)
    expect(divide(-2, 3)).toBe(-0.6666666666666666)
    expect(divide(22, 7)).toBe(22 / 7)
    expect(divide(1, 7)).toBe(0.14285714285714285)
    expect(divide(0.1, 3)).toBe(0.03333333333333333)
  })

  it('handles negatives and zero dividends', () => {
    expect(divide(-1999, 100)).toBe(-19.99)
    expect(divide(1999, -100)).toBe(-19.99)
    expect(divide(-1999, -100)).toBe(19.99)
    expect(divide(0, 5)).toBe(0)
    expect(divide(0, 0.1)).toBe(0)
  })

  it('accepts inputs whose String() form uses exponent notation', () => {
    expect(divide(1e21, 1e-7)).toBe(1e28)
    expect(divide(1e21, 1e21)).toBe(1)
    expect(divide(1.5e-7, 3)).toBe(5e-8)
    expect(divide(1.5e-7, 1.5e-7)).toBe(1)
    expect(divide(3, 1.5e-7)).toBe(2e7)
  })

  it('handles operands of very different magnitudes', () => {
    expect(divide(1e308, 1e308)).toBe(1)
    expect(divide(1e-308, 1e-308)).toBe(1)
    expect(divide(1e-308, 1e308)).toBe(0)
    expect(divide(1e300, 1e-8)).toBe(1e308)
  })

  it('signs a zero quotient by the operands, like IEEE 754', () => {
    expect(Object.is(divide(0, -5), -0)).toBe(true)
    expect(Object.is(divide(-0, 5), -0)).toBe(true)
    expect(Object.is(divide(-0, -5), -0)).toBe(false)
    expect(Object.is(divide(0, 5), -0)).toBe(false)
  })

  it('keeps the sign of a negative quotient that underflows', () => {
    expect(Object.is(divide(-1e-308, 1e308), -0)).toBe(true)
    expect(Object.is(divide(1e-308, 1e308), -0)).toBe(false)
  })

  it('throws RangeError when dividend is not finite', () => {
    expect(() => divide(Number.NaN, 1)).toThrow(RangeError)
    expect(() => divide(Number.POSITIVE_INFINITY, 1)).toThrow(RangeError)
    expect(() => divide(Number.NEGATIVE_INFINITY, 1)).toThrow(RangeError)
    expect(() => divide(Number.NaN, 1)).toThrow('divide: dividend must be finite, received NaN')
  })

  it('throws RangeError when divisor is not finite', () => {
    expect(() => divide(1, Number.NaN)).toThrow(RangeError)
    expect(() => divide(1, Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => divide(1, Number.NEGATIVE_INFINITY)).toThrow(RangeError)
    expect(() => divide(1, Number.NaN)).toThrow('divide: divisor must be finite, received NaN')
  })

  it('throws RangeError when divisor is zero', () => {
    expect(() => divide(1, 0)).toThrow(RangeError)
    expect(() => divide(1, -0)).toThrow(RangeError)
    expect(() => divide(0, 0)).toThrow(RangeError)
    expect(() => divide(1, 0)).toThrow('divide: divisor must not be zero')
  })

  it('throws RangeError instead of returning Infinity when the quotient overflows', () => {
    expect(() => divide(1e308, 1e-10)).toThrow(RangeError)
    expect(() => divide(-1e308, 1e-10)).toThrow(RangeError)
    expect(() => divide(1e308, 0.5)).toThrow(RangeError)
  })
})
