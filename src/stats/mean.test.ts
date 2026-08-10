import { describe, expect, it } from 'bun:test'
import { mean } from './mean'

describe('mean', () => {
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
