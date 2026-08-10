import { describe, expect, it } from 'bun:test'
import { mode } from './mode'

describe('mode', () => {
  it('returns the single most frequent value', () => {
    expect(mode([1, 2, 2, 3])).toEqual([2])
  })

  it('returns every value tied for highest frequency, sorted ascending', () => {
    expect(mode([3, 1, 1, 2, 2])).toEqual([1, 2])
  })

  it('returns every value when all frequencies are equal', () => {
    expect(mode([3, 1, 2])).toEqual([1, 2, 3])
  })

  it('handles a single-element array', () => {
    expect(mode([7])).toEqual([7])
  })

  it('throws when values is empty', () => {
    expect(() => mode([])).toThrow(RangeError)
  })

  it('throws when a value is not finite', () => {
    expect(() => mode([1, Number.NaN, 1])).toThrow(RangeError)
  })
})
