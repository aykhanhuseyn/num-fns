import { describe, expect, it } from 'bun:test'
import { median } from './median'

describe('median', () => {
  it('averages the two middle values exactly in decimal', () => {
    expect(median([0.1, 0.2])).toBe(0.15)
    expect(median([0.3, 0.1, 0.2, 0.4])).toBe(0.25)
  })

  it('returns the middle value for an odd-length array', () => {
    expect(median([1, 3, 2])).toBe(2)
    expect(median([5])).toBe(5)
  })

  it('averages the two middle values for an even-length array', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })

  it('does not mutate the input array', () => {
    const input = [3, 1, 2]
    median(input)
    expect(input).toEqual([3, 1, 2])
  })

  it('throws when values is empty', () => {
    expect(() => median([])).toThrow(RangeError)
  })

  it('throws when a value is not finite', () => {
    expect(() => median([1, Number.NaN, 3])).toThrow(RangeError)
  })
})

describe('median rounds once (0.7 review)', () => {
  it('does not overflow on the two middle values', () => {
    expect(median([Number.MAX_VALUE, Number.MAX_VALUE])).toBe(Number.MAX_VALUE)
    expect(median([-Number.MAX_VALUE, -Number.MAX_VALUE])).toBe(-Number.MAX_VALUE)
  })

  it('rounds the exact midpoint', () => {
    // 5000000000000000.5 is a tie; round-half-even gives …000.
    expect(median([1, 1e16])).toBe(5000000000000000)
  })

  it('keeps -0 only when both middle values are -0', () => {
    expect(Object.is(median([-0, -0]), -0)).toBe(true)
    expect(Object.is(median([-0, 0]), 0)).toBe(true)
  })
})
