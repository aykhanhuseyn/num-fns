import { describe, expect, it } from 'bun:test'
import { variance } from './variance'

describe('variance', () => {
  it('computes population variance by default', () => {
    expect(variance([2, 4, 4, 4, 5, 5, 7, 9])).toBe(4)
  })

  it('computes sample variance when requested', () => {
    expect(variance([2, 4, 4, 4, 5, 5, 7, 9], { sample: true })).toBeCloseTo(4.571428571428571)
  })

  it('returns 0 for a single-element array (population)', () => {
    expect(variance([5])).toBe(0)
  })

  it('throws when values is empty', () => {
    expect(() => variance([])).toThrow(RangeError)
  })

  it('throws for sample variance with fewer than 2 values', () => {
    expect(() => variance([5], { sample: true })).toThrow(RangeError)
  })

  it('throws when a value is not finite', () => {
    expect(() => variance([1, Number.NaN, 3])).toThrow(RangeError)
  })

  it('throws RangeError when the squared deviations overflow', () => {
    expect(() => variance([-1e200, 1e200])).toThrow(RangeError)
    expect(() => variance([-1e200, 1e200])).toThrow(
      'variance: result Infinity is outside the range of a JavaScript number',
    )
  })
})
