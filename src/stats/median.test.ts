import { describe, expect, it } from 'bun:test'
import { median } from './median'

describe('median', () => {
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
