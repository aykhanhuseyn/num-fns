import { describe, expect, it } from 'bun:test'
import { standardDeviation } from './standard-deviation'

describe('standardDeviation', () => {
  it('computes population standard deviation by default', () => {
    expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2)
  })

  it('computes sample standard deviation when requested', () => {
    expect(standardDeviation([2, 4, 4, 4, 5, 5, 7, 9], { sample: true })).toBeCloseTo(2.1381)
  })

  it('returns 0 for a single-element array (population)', () => {
    expect(standardDeviation([5])).toBe(0)
  })

  it('throws when values is empty', () => {
    expect(() => standardDeviation([])).toThrow(RangeError)
  })

  it('throws when a value is not finite', () => {
    expect(() => standardDeviation([1, Number.NaN, 3])).toThrow(RangeError)
  })
})
