import { describe, expect, it } from 'bun:test'
import { quantile } from './quantile'

describe('quantile', () => {
  it('computes the median at q=0.5', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3)
  })

  it('matches percentile(values, q * 100)', () => {
    expect(quantile([1, 2, 3, 4], 0.25)).toBe(1.75)
  })

  it('returns the min at q=0 and the max at q=1', () => {
    expect(quantile([1, 2, 3, 4, 5], 0)).toBe(1)
    expect(quantile([1, 2, 3, 4, 5], 1)).toBe(5)
  })

  it('throws when q is out of range', () => {
    expect(() => quantile([1, 2, 3], -0.1)).toThrow(RangeError)
    expect(() => quantile([1, 2, 3], 1.1)).toThrow(RangeError)
  })

  it('throws when values is empty', () => {
    expect(() => quantile([], 0.5)).toThrow(RangeError)
  })
})
