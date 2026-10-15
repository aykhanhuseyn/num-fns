import { describe, expect, it } from 'bun:test'
import { percentile } from './percentile'

describe('percentile', () => {
  it('interpolates exactly in decimal', () => {
    expect(percentile([0.1, 0.2], 50)).toBe(0.15)
    expect(percentile([0.1, 0.2, 0.3], 30)).toBe(0.16)
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 30)).toBe(4)
  })

  it('computes the median at p=50', () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3)
  })

  it('interpolates between closest ranks', () => {
    expect(percentile([1, 2, 3, 4], 25)).toBe(1.75)
  })

  it('returns the min at p=0 and the max at p=100', () => {
    expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1)
    expect(percentile([1, 2, 3, 4, 5], 100)).toBe(5)
  })

  it('returns the single value for a single-element array', () => {
    expect(percentile([7], 50)).toBe(7)
  })

  it('throws when values is empty', () => {
    expect(() => percentile([], 50)).toThrow(RangeError)
  })

  it('throws when p is out of range', () => {
    expect(() => percentile([1, 2, 3], -1)).toThrow(RangeError)
    expect(() => percentile([1, 2, 3], 101)).toThrow(RangeError)
  })

  it('throws when a value is not finite', () => {
    expect(() => percentile([1, Number.NaN, 3], 50)).toThrow(RangeError)
  })
})
