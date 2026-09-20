import { describe, expect, it } from 'bun:test'
import { subtract } from './subtract'

describe('subtract', () => {
  it('matches the documented examples', () => {
    expect(subtract(0.3, 0.1)).toBe(0.2)
    expect(subtract(1.5, 1.5)).toBe(0)
    expect(subtract(1, 0.9)).toBe(0.1)
  })

  it('avoids the classic floating-point traps', () => {
    expect(0.3 - 0.1).not.toBe(0.2)
    expect(subtract(0.3, 0.1)).toBe(0.2)
    expect(subtract(1.1, 1)).toBe(0.1)
    expect(subtract(10, 9.99)).toBe(0.01)
    expect(subtract(0.1, 0.3)).toBe(-0.2)
  })

  it('subtracts integers exactly', () => {
    expect(subtract(5, 3)).toBe(2)
    expect(subtract(3, 5)).toBe(-2)
    expect(subtract(1_000_001, 1)).toBe(1_000_000)
  })

  it('handles negatives and zero', () => {
    expect(subtract(-0.1, -0.2)).toBe(0.1)
    expect(subtract(-1, 0.5)).toBe(-1.5)
    expect(subtract(0.5, -1)).toBe(1.5)
    expect(subtract(0, 0)).toBe(0)
    expect(subtract(0, 2.5)).toBe(-2.5)
    expect(subtract(-2.5, 0)).toBe(-2.5)
  })

  it('accepts inputs whose String() form uses exponent notation', () => {
    expect(subtract(1e21, 1)).toBe(1e21)
    expect(subtract(2e21, 1e21)).toBe(1e21)
    expect(subtract(1, 1.5e-7)).toBe(0.99999985)
    expect(subtract(3e-7, 1.5e-7)).toBe(1.5e-7)
  })

  it('handles operands of very different magnitudes', () => {
    expect(subtract(1e308, 1e-308)).toBe(1e308)
    expect(subtract(1e-308, 1e308)).toBe(-1e308)
    expect(subtract(1e9, 0.001)).toBe(999999999.999)
  })

  it('gives a signed zero only for (-0) - 0 (IEEE 754)', () => {
    expect(Object.is(subtract(-0, 0), -0)).toBe(true)
    expect(Object.is(subtract(0, 0), -0)).toBe(false)
    expect(Object.is(subtract(-0, -0), -0)).toBe(false)
    expect(Object.is(subtract(-1.5, -1.5), -0)).toBe(false)
    expect(Object.is(subtract(0.1, 0.1), -0)).toBe(false)
  })

  it('throws RangeError when a is not finite', () => {
    expect(() => subtract(Number.NaN, 1)).toThrow(RangeError)
    expect(() => subtract(Number.POSITIVE_INFINITY, 1)).toThrow(RangeError)
    expect(() => subtract(Number.NEGATIVE_INFINITY, 1)).toThrow(RangeError)
    expect(() => subtract(Number.NaN, 1)).toThrow('subtract: a must be finite, received NaN')
  })

  it('throws RangeError when b is not finite', () => {
    expect(() => subtract(1, Number.NaN)).toThrow(RangeError)
    expect(() => subtract(1, Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => subtract(1, Number.NEGATIVE_INFINITY)).toThrow(RangeError)
    expect(() => subtract(1, Number.POSITIVE_INFINITY)).toThrow(
      'subtract: b must be finite, received Infinity',
    )
  })

  it('throws RangeError instead of returning Infinity when the difference overflows', () => {
    expect(() => subtract(1e308, -1e308)).toThrow(RangeError)
    expect(() => subtract(-1e308, 1e308)).toThrow(RangeError)
    expect(() => subtract(-Number.MAX_VALUE, Number.MAX_VALUE)).toThrow(RangeError)
  })
})
