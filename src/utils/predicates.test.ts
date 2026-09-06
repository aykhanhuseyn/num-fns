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

  it('tests a bigint exactly at any magnitude', () => {
    expect(isEven(BigInt(0))).toBe(true)
    expect(isEven(BigInt(4))).toBe(true)
    expect(isEven(BigInt(-4))).toBe(true)
    expect(isEven(BigInt(3))).toBe(false)
    expect(isEven(BigInt(-3))).toBe(false)
    expect(isEven(BigInt('123456789012345678901234567890'))).toBe(true)
    expect(isEven(BigInt('123456789012345678901234567891'))).toBe(false)
    expect(isEven(BigInt('-123456789012345678901234567891'))).toBe(false)
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

  it('tests a bigint exactly at any magnitude', () => {
    expect(isOdd(BigInt(0))).toBe(false)
    expect(isOdd(BigInt(3))).toBe(true)
    expect(isOdd(BigInt(-3))).toBe(true)
    expect(isOdd(BigInt(4))).toBe(false)
    expect(isOdd(BigInt(-4))).toBe(false)
    expect(isOdd(BigInt('123456789012345678901234567891'))).toBe(true)
    expect(isOdd(BigInt('-123456789012345678901234567891'))).toBe(true)
    expect(isOdd(BigInt('123456789012345678901234567890'))).toBe(false)
  })

  it('is the complement of isEven for every bigint', () => {
    for (const value of [BigInt(0), BigInt(7), BigInt(-8), BigInt('98765432109876543210')]) {
      expect(isOdd(value)).toBe(!isEven(value))
    }
  })
})
