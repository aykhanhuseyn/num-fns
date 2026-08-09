import { describe, expect, it } from 'bun:test'
import { isEven, isOdd } from './predicates'

describe('isEven', () => {
  it('returns true for even integers', () => {
    expect(isEven(4)).toBe(true)
    expect(isEven(0)).toBe(true)
    expect(isEven(-4)).toBe(true)
  })

  it('returns false for odd integers', () => {
    expect(isEven(3)).toBe(false)
    expect(isEven(-3)).toBe(false)
  })

  it('throws for non-integers', () => {
    expect(() => isEven(1.5)).toThrow(TypeError)
    expect(() => isEven(Number.NaN)).toThrow(TypeError)
  })
})

describe('isOdd', () => {
  it('returns true for odd integers', () => {
    expect(isOdd(3)).toBe(true)
    expect(isOdd(-3)).toBe(true)
  })

  it('returns false for even integers', () => {
    expect(isOdd(4)).toBe(false)
    expect(isOdd(0)).toBe(false)
    expect(isOdd(-4)).toBe(false)
  })

  it('throws for non-integers', () => {
    expect(() => isOdd(1.5)).toThrow(TypeError)
    expect(() => isOdd(Number.NaN)).toThrow(TypeError)
  })
})
