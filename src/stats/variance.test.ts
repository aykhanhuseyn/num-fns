import { describe, expect, it } from 'bun:test'
import { variance } from './variance'

const OVERFLOW = 'variance: result (about 1e+400) is outside the range of a JavaScript number'

describe('variance', () => {
  it('computes population variance by default', () => {
    expect(variance([2, 4, 4, 4, 5, 5, 7, 9])).toBe(4)
  })

  it('computes sample variance when requested', () => {
    expect(variance([2, 4, 4, 4, 5, 5, 7, 9], { sample: true })).toBeCloseTo(4.571428571428571)
  })

  it('is exact in decimal', () => {
    expect(variance([0.1, 0.2, 0.3])).toBe(0.006666666666666667)
    expect(variance([0.1, 0.2, 0.3], { sample: true })).toBe(0.01)
    expect(variance([1.1, 1.2])).toBe(0.0025)
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
    expect(() => variance([-1e200, 1e200])).toThrow(OVERFLOW)
  })
})

describe('variance rounds once (0.7 review)', () => {
  it('never rounds the mean: a non-terminating mean stays exact', () => {
    // mean 4/3; exact population variance of [1, 1, 2] is 2/9.
    expect(variance([1, 1, 2])).toBe(2 / 9)
    expect(variance([1, 1, 2], { sample: true })).toBe(1 / 3)
  })

  it('handles values whose total overflows but whose variance fits', () => {
    expect(variance([Number.MAX_VALUE, Number.MAX_VALUE])).toBe(0)
  })

  it('names itself in its errors', () => {
    expect(() => variance([Number.NaN])).toThrow(
      'variance: all values must be finite, received NaN',
    )
  })
})
