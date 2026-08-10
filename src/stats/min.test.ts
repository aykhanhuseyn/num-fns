import { describe, expect, it } from 'bun:test'
import { min } from './min'

describe('min', () => {
  it('returns the smallest value', () => {
    expect(min([3, 1, 4, 1, 5])).toBe(1)
    expect(min([10])).toBe(10)
  })

  it('handles negative numbers', () => {
    expect(min([-3, -1, -4])).toBe(-4)
  })

  it('throws when values is empty', () => {
    expect(() => min([])).toThrow(RangeError)
  })

  it('throws when a value is not finite', () => {
    expect(() => min([1, Number.NaN, 3])).toThrow(RangeError)
  })
})
