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

  describe('bigint input', () => {
    it('converts a bigint like the equal number', () => {
      expect(toBase(BigInt(0), 2)).toBe('0')
      expect(toBase(BigInt(10), 2)).toBe('1010')
      expect(toBase(BigInt(255), 16)).toBe('ff')
      expect(toBase(BigInt(-8), 8)).toBe('-10')
      expect(toBase(BigInt(1295), 36)).toBe('zz')
    })

    it('has no safe-integer limit, since a bigint loses no digits', () => {
      expect(toBase(BigInt('123456789012345678901'), 16)).toBe('6b14e9f812f366c35')
      expect(toBase(BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1), 2)).toBe(`1${'0'.repeat(53)}`)
      expect(toBase(BigInt('-123456789012345678901234567890'), 10)).toBe(
        '-123456789012345678901234567890',
      )
    })

    it('still validates the radix for a bigint', () => {
      expect(() => toBase(BigInt(10), 1)).toThrow(RangeError)
      expect(() => toBase(BigInt(10), 37)).toThrow(RangeError)
    })
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

  it('parses "-0" to plain 0 (there is no negative-zero bigint behind it)', () => {
    expect(fromBase('-0', 2)).toBe(0)
    expect(Object.is(fromBase('-0', 2), -0)).toBe(false)
  })

  it('accepts an explicit output: "number"', () => {
    expect(fromBase('ff', 16, { output: 'number' })).toBe(255)
  })

  it('throws RangeError for an invalid output value', () => {
    expect(() => fromBase('ff', 16, { output: 'decimal' as unknown as 'number' })).toThrow(
      RangeError,
    )
  })

  it('throws RangeError instead of rounding when the value exceeds Number.MAX_SAFE_INTEGER', () => {
    // 2^53 = MAX_SAFE_INTEGER + 1 — the first integer a number cannot hold exactly.
    expect(() => fromBase(`1${'0'.repeat(53)}`, 2)).toThrow(RangeError)
    expect(() => fromBase('6b14e9f812f366c35', 16)).toThrow("output: 'bigint'")
    expect(() => fromBase('-6b14e9f812f366c35', 16)).toThrow(RangeError)
    // MAX_SAFE_INTEGER itself is still fine.
    expect(fromBase('1fffffffffffff', 16)).toBe(Number.MAX_SAFE_INTEGER)
    expect(fromBase('-1fffffffffffff', 16)).toBe(-Number.MAX_SAFE_INTEGER)
  })

  describe("{ output: 'bigint' }", () => {
    it('returns an exact bigint', () => {
      expect(fromBase('0', 2, { output: 'bigint' })).toBe(BigInt(0))
      expect(fromBase('1010', 2, { output: 'bigint' })).toBe(BigInt(10))
      expect(fromBase('FF', 16, { output: 'bigint' })).toBe(BigInt(255))
      expect(fromBase('-10', 8, { output: 'bigint' })).toBe(BigInt(-8))
      expect(fromBase('+zz', 36, { output: 'bigint' })).toBe(BigInt(1295))
    })

    it('keeps every digit past Number.MAX_SAFE_INTEGER', () => {
      expect(fromBase('6b14e9f812f366c35', 16, { output: 'bigint' })).toBe(
        BigInt('123456789012345678901'),
      )
      expect(fromBase('-123456789012345678901234567890', 10, { output: 'bigint' })).toBe(
        BigInt('-123456789012345678901234567890'),
      )
    })

    it('round-trips with toBase for a huge bigint', () => {
      const value = BigInt('123456789012345678901')
      expect(fromBase(toBase(value, 16), 16, { output: 'bigint' })).toBe(value)
      expect(fromBase(toBase(-value, 36), 36, { output: 'bigint' })).toBe(-value)
    })

    it('still throws SyntaxError for invalid digits or an empty string', () => {
      expect(() => fromBase('12', 2, { output: 'bigint' })).toThrow(SyntaxError)
      expect(() => fromBase('', 2, { output: 'bigint' })).toThrow(SyntaxError)
      expect(() => fromBase('-', 2, { output: 'bigint' })).toThrow(SyntaxError)
    })
  })
})
