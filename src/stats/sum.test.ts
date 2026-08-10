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

  it('handles decimals', () => {
    expect(sum([0.1, 0.2])).toBeCloseTo(0.3)
  })

  it('throws when values is empty', () => {
    expect(() => sum([])).toThrow(RangeError)
  })

  it('throws when a value is not finite', () => {
    expect(() => sum([1, Number.NaN, 3])).toThrow(RangeError)
    expect(() => sum([1, Number.POSITIVE_INFINITY])).toThrow(RangeError)
  })
})
