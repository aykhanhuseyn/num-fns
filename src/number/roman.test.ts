import { describe, expect, it } from 'bun:test'
import { fromRoman, toRoman } from './roman'

describe('toRoman', () => {
  it('converts basic values', () => {
    expect(toRoman(1)).toBe('I')
    expect(toRoman(4)).toBe('IV')
    expect(toRoman(9)).toBe('IX')
    expect(toRoman(40)).toBe('XL')
    expect(toRoman(90)).toBe('XC')
    expect(toRoman(400)).toBe('CD')
    expect(toRoman(900)).toBe('CM')
  })

  it('converts composite values', () => {
    expect(toRoman(1994)).toBe('MCMXCIV')
    expect(toRoman(2024)).toBe('MMXXIV')
    expect(toRoman(3999)).toBe('MMMCMXCIX')
  })

  it('throws outside the 1-3999 range', () => {
    expect(() => toRoman(0)).toThrow(RangeError)
    expect(() => toRoman(4000)).toThrow(RangeError)
  })

  it('throws for non-integers', () => {
    expect(() => toRoman(1.5)).toThrow(TypeError)
  })

  describe('bigint input', () => {
    it('converts a bigint like the equal number', () => {
      expect(toRoman(BigInt(1))).toBe('I')
      expect(toRoman(BigInt(1994))).toBe('MCMXCIV')
      expect(toRoman(BigInt(3999))).toBe('MMMCMXCIX')
    })

    it('holds a bigint to the same 1-3999 range', () => {
      expect(() => toRoman(BigInt(0))).toThrow(RangeError)
      expect(() => toRoman(BigInt(-1))).toThrow(RangeError)
      expect(() => toRoman(BigInt(4000))).toThrow(RangeError)
      expect(() => toRoman(BigInt('123456789012345678901234567890'))).toThrow(RangeError)
    })
  })
})

describe('fromRoman', () => {
  it('converts basic values', () => {
    expect(fromRoman('I')).toBe(1)
    expect(fromRoman('IV')).toBe(4)
    expect(fromRoman('IX')).toBe(9)
    expect(fromRoman('XL')).toBe(40)
  })

  it('converts composite values and is case-insensitive', () => {
    expect(fromRoman('MCMXCIV')).toBe(1994)
    expect(fromRoman('mmxxiv')).toBe(2024)
  })

  it('round-trips with toRoman', () => {
    for (const value of [1, 4, 9, 44, 99, 444, 999, 1994, 3999]) {
      expect(fromRoman(toRoman(value))).toBe(value)
    }
  })

  it('returns a number for a numeral produced from a bigint', () => {
    expect(fromRoman(toRoman(BigInt(1994)))).toBe(1994)
  })

  it('throws for invalid roman numerals', () => {
    expect(() => fromRoman('')).toThrow(SyntaxError)
    expect(() => fromRoman('IIII')).toThrow(SyntaxError)
    expect(() => fromRoman('ABC')).toThrow(SyntaxError)
  })
})
