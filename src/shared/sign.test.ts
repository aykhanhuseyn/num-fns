import { describe, expect, it } from 'bun:test'
import { isNegativeZero, isPositiveZero, isSigned } from './sign'

describe('isNegativeZero', () => {
  it('is true only for -0', () => {
    expect(isNegativeZero(-0)).toBe(true)
    expect(isNegativeZero(0)).toBe(false)
    expect(isNegativeZero(-1)).toBe(false)
    expect(isNegativeZero(Number.NaN)).toBe(false)
  })

  it('is false for every bigint, since -0n does not exist', () => {
    expect(isNegativeZero(BigInt(0))).toBe(false)
    expect(isNegativeZero(BigInt('-0'))).toBe(false)
  })
})

describe('isPositiveZero', () => {
  it('is true only for +0', () => {
    expect(isPositiveZero(0)).toBe(true)
    expect(isPositiveZero(-0)).toBe(false)
    expect(isPositiveZero(1)).toBe(false)
  })
})

describe('isSigned', () => {
  it('is true for negative numbers and for -0', () => {
    expect(isSigned(-1.5)).toBe(true)
    expect(isSigned(-0)).toBe(true)
    expect(isSigned(BigInt(-7))).toBe(true)
  })

  it('is false for zero and positive values', () => {
    expect(isSigned(0)).toBe(false)
    expect(isSigned(1.5)).toBe(false)
    expect(isSigned(BigInt(0))).toBe(false)
  })
})
