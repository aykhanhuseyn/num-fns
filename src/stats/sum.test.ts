import { describe, expect, it } from 'bun:test'
import { sum } from './sum'

describe('sum', () => {
  it('sums an array of numbers', () => {
    expect(sum([1, 2, 3])).toBe(6)
    expect(sum([10])).toBe(10)
  })

  it('handles negative numbers', () => {
    expect(sum([-1, -2, -3])).toBe(-6)
    expect(sum([-5, 5])).toBe(0)
  })

  it('is exact in decimal, like add', () => {
    expect(sum([0.1, 0.2])).toBe(0.3)
    expect(sum([0.1, 0.2, 0.3])).toBe(0.6)
    expect(sum([1.15, 2.3, 0.05])).toBe(3.5)
    expect(sum([0.1, 0.7, -0.8])).toBe(0)
    expect(sum([1e21, 0.1])).toBe(1e21)
  })

  it('rounds once at the end, not once per step', () => {
    // 1e16 + 1 is not representable, so a step-by-step float sum loses the
    // 1 and ends at 1e16; the exact total 1e16 + 2 is a representable even.
    expect(sum([1e16, 1, 1])).toBe(1e16 + 2)
  })

  it('leaves the fast path for the exact one and gets the same answers', () => {
    // Integer total past the safe range.
    expect(sum([Number.MAX_SAFE_INTEGER, 1])).toBe(Number.MAX_SAFE_INTEGER + 1)
    expect(sum([Number.MAX_SAFE_INTEGER, 2])).toBe(Number.MAX_SAFE_INTEGER + 2)
    expect(sum([Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER, 3])).toBe(3)
    // An integer whose count at the list's scale is not safe.
    expect(sum([0.5, Number.MAX_SAFE_INTEGER])).toBe(2 ** 53) // exact 2^53 - 0.5, tie to even
    // A decimal whose count would pass 2^52.
    expect(sum([2251799813685248.5, 0.5])).toBe(2251799813685249)
    // More fraction digits than the fast path reads.
    expect(sum([1e-16, 1e-16])).toBe(2e-16)
    expect(sum([0.1, 1e-17])).toBe(0.10000000000000001)
    // Mixed scales: the running total is rescaled when a finer value shows up.
    expect(sum([1, 0.5, 0.25, 0.125])).toBe(1.875)
    expect(sum([19.99, 0.001, 5])).toBe(24.991)
  })

  it('follows IEEE 754 for signed zeros', () => {
    expect(Object.is(sum([-0]), -0)).toBe(true)
    expect(Object.is(sum([-0, -0]), -0)).toBe(true)
    expect(Object.is(sum([-0, 0]), 0)).toBe(true)
    expect(Object.is(sum([-1, 1]), 0)).toBe(true)
    expect(Object.is(sum([0, 0]), 0)).toBe(true)
  })

  it('throws when values is empty', () => {
    expect(() => sum([])).toThrow(RangeError)
  })

  it('throws when a value is not finite', () => {
    expect(() => sum([1, Number.NaN, 3])).toThrow(RangeError)
    expect(() => sum([1, Number.POSITIVE_INFINITY])).toThrow(RangeError)
  })

  it('throws RangeError when the total overflows, rather than returning Infinity', () => {
    expect(() => sum([1e308, 1e308])).toThrow(RangeError)
    expect(() => sum([1e308, 1e308])).toThrow(
      'sum: result (about 2e+308) is outside the range of a JavaScript number',
    )
  })
})
