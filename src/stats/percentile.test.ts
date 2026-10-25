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

describe('percentile rounds once (0.7 review)', () => {
  it('agrees with median at p = 50', () => {
    expect(percentile([1, 1e16], 50)).toBe(5000000000000000)
  })

  it('does not overflow in a middle step', () => {
    expect(percentile([-Number.MAX_VALUE, Number.MAX_VALUE], 50)).toBe(0)
    expect(percentile([Number.MAX_VALUE, Number.MAX_VALUE], 30)).toBe(Number.MAX_VALUE)
  })

  it('returns the value itself, -0 included, when the rank is whole', () => {
    expect(Object.is(percentile([-0, 1, 2], 0), -0)).toBe(true)
    expect(percentile([1, 2, 3], 100)).toBe(3)
    expect(percentile([5, 1, 3], 50)).toBe(3)
  })

  it('names itself in its errors', () => {
    expect(() => percentile([1, Number.NaN], 50)).toThrow(
      'percentile: all values must be finite, received NaN',
    )
  })
})
