import { describe, expect, it } from 'bun:test'
import { fromBase, toBase } from './base'

describe('toBase', () => {
  it('converts to binary, octal, and hex', () => {
    expect(toBase(10, 2)).toBe('1010')
    expect(toBase(8, 8)).toBe('10')
    expect(toBase(255, 16)).toBe('ff')
  })

  it('converts to base36', () => {
    expect(toBase(35, 36)).toBe('z')
    expect(toBase(1295, 36)).toBe('zz')
  })

  it('handles zero and negative values', () => {
    expect(toBase(0, 2)).toBe('0')
    expect(toBase(-8, 8)).toBe('-10')
  })

  it('throws for a non-integer value', () => {
    expect(() => toBase(1.5, 2)).toThrow(TypeError)
  })

  it('throws for an unsafe integer value', () => {
    expect(() => toBase(Number.MAX_SAFE_INTEGER + 1, 2)).toThrow(RangeError)
  })

  it('throws for an out-of-range radix', () => {
    expect(() => toBase(10, 1)).toThrow(RangeError)
    expect(() => toBase(10, 37)).toThrow(RangeError)
    expect(() => toBase(10, 2.5)).toThrow(RangeError)
  })
})

describe('fromBase', () => {
  it('parses binary, octal, and hex', () => {
    expect(fromBase('1010', 2)).toBe(10)
    expect(fromBase('10', 8)).toBe(8)
    expect(fromBase('ff', 16)).toBe(255)
  })

  it('is case-insensitive', () => {
    expect(fromBase('FF', 16)).toBe(255)
  })

  it('accepts a leading sign', () => {
    expect(fromBase('-10', 8)).toBe(-8)
    expect(fromBase('+10', 8)).toBe(8)
  })

  it('round-trips with toBase', () => {
    for (const [value, radix] of [
      [255, 16],
      [10, 2],
      [-8, 8],
      [1295, 36],
    ] as const) {
      expect(fromBase(toBase(value, radix), radix)).toBe(value)
    }
  })

  it('throws for characters outside the radix alphabet', () => {
    expect(() => fromBase('12', 2)).toThrow(SyntaxError)
    expect(() => fromBase('fg', 16)).toThrow(SyntaxError)
  })

  it('throws for an empty string', () => {
    expect(() => fromBase('', 2)).toThrow(SyntaxError)
    expect(() => fromBase('-', 2)).toThrow(SyntaxError)
  })

  it('throws for an out-of-range radix', () => {
    expect(() => fromBase('10', 1)).toThrow(RangeError)
    expect(() => fromBase('10', 37)).toThrow(RangeError)
  })
})
