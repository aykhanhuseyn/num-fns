import { describe, expect, it } from 'bun:test'
import { max } from './max'

describe('max', () => {
  it('returns the largest value', () => {
    expect(max([3, 1, 4, 1, 5])).toBe(5)
    expect(max([10])).toBe(10)
  })

  it('handles negative numbers', () => {
    expect(max([-3, -1, -4])).toBe(-1)
  })

  it('throws when values is empty', () => {
    expect(() => max([])).toThrow(RangeError)
  })

  it('throws when a value is not finite', () => {
    expect(() => max([1, Number.NaN, 3])).toThrow(RangeError)
  })
})
