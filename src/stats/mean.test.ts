import { describe, expect, it } from 'bun:test'
import { mean } from './mean'

describe('mean', () => {
  it('is exact in decimal', () => {
    expect(mean([0.1, 0.2])).toBe(0.15)
    expect(mean([0.1, 0.2, 0.4])).toBe(0.23333333333333334)
  })

  it('computes the arithmetic mean', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5)
    expect(mean([10])).toBe(10)
  })

  it('handles negative numbers', () => {
    expect(mean([-2, 0, 2])).toBe(0)
  })

  it('throws when values is empty', () => {
    expect(() => mean([])).toThrow(RangeError)
  })

  it('throws when a value is not finite', () => {
    expect(() => mean([1, Number.NaN])).toThrow(RangeError)
  })
})

describe('mean rounds once (0.7 review)', () => {
  it('is the correctly rounded exact mean, not divide(sum, n)', () => {
    // Exact mean 5254541477366989.67; divide(sum(xs), 3) rounded twice to …989.
    expect(mean([4156697733702999, 8126236961112501, 3480689737285469])).toBe(5254541477366990)
  })

  it('rounds a value just past a tie the right way', () => {
    // Exact mean 5000000000000000.50000000005: the 25-digit quotient alone
    // would sit on the tie and round to even (…000).
    expect(mean([1e16, 1.0000000001])).toBe(5000000000000001)
  })

  it('does not overflow when only the total would', () => {
    expect(mean([Number.MAX_VALUE, Number.MAX_VALUE])).toBe(Number.MAX_VALUE)
    expect(mean([-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE])).toBe(-Number.MAX_VALUE)
  })

  it('keeps the sign of an all-negative-zero list', () => {
    expect(Object.is(mean([-0, -0]), -0)).toBe(true)
    expect(Object.is(mean([-0, 0]), 0)).toBe(true)
  })

  it('names itself in its errors', () => {
    expect(() => mean([])).toThrow('mean: values must not be empty')
    expect(() => mean([1, Number.NaN])).toThrow('mean: all values must be finite, received NaN')
  })
})
