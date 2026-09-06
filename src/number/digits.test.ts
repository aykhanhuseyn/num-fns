import { describe, expect, it } from 'bun:test'
import { az } from '../locale/az'
import { numberToDigitWords } from './digits'

describe('numberToDigitWords', () => {
  it('reads each digit of a number individually, defaulting to English', () => {
    expect(numberToDigitWords(90)).toBe('nine zero')
    expect(numberToDigitWords(123)).toBe('one two three')
  })

  it('preserves leading zeros when given a string', () => {
    expect(numberToDigitWords('055')).toBe('zero five five')
  })

  it('ignores common phone-number punctuation', () => {
    expect(numberToDigitWords('+994 55 123 45 67')).toBe(
      'nine nine four five five one two three four five six seven',
    )
    expect(numberToDigitWords('(012) 345-67')).toBe('zero one two three four five six seven')
  })

  it('supports a custom separator', () => {
    expect(numberToDigitWords(12, { separator: '-' })).toBe('one-two')
  })

  it('prefixes a negative number with "negative"', () => {
    expect(numberToDigitWords(-12)).toBe('negative one two')
  })

  it('prefixes a leading "-" string with "negative"', () => {
    expect(numberToDigitWords('-012')).toBe('negative zero one two')
  })

  it('throws for non-finite numeric input', () => {
    expect(() => numberToDigitWords(Infinity)).toThrow(RangeError)
    expect(() => numberToDigitWords(NaN)).toThrow(RangeError)
  })

  it('throws for a non-integer numeric input', () => {
    expect(() => numberToDigitWords(1.5)).toThrow(RangeError)
  })

  it('throws when the string contains no digits', () => {
    expect(() => numberToDigitWords('')).toThrow(SyntaxError)
    expect(() => numberToDigitWords('+ - ()')).toThrow(SyntaxError)
  })

  it('throws when the string contains an unexpected character', () => {
    expect(() => numberToDigitWords('12a34')).toThrow(SyntaxError)
  })

  describe('bigint input', () => {
    it('reads a bigint digit by digit like the equal number', () => {
      expect(numberToDigitWords(BigInt(0))).toBe('zero')
      expect(numberToDigitWords(BigInt(90))).toBe('nine zero')
      expect(numberToDigitWords(BigInt(123))).toBe(numberToDigitWords(123))
    })

    it('prefixes a negative bigint with "negative"', () => {
      expect(numberToDigitWords(BigInt(-12))).toBe('negative one two')
      expect(numberToDigitWords(BigInt(-12), { locale: az })).toBe('mənfi bir iki')
    })

    it('reads every digit of a bigint beyond Number.MAX_SAFE_INTEGER exactly', () => {
      expect(numberToDigitWords(BigInt('123456789012345678901234567890'))).toBe(
        'one two three four five six seven eight nine zero one two three four five six seven eight nine zero one two three four five six seven eight nine zero',
      )
      // 9007199254740993 is MAX_SAFE_INTEGER + 2; as a number it would round to ...992.
      expect(numberToDigitWords(BigInt('9007199254740993'))).toBe(
        'nine zero zero seven one nine nine two five four seven four zero nine nine three',
      )
    })

    it('supports a custom separator for a bigint', () => {
      expect(numberToDigitWords(BigInt(12), { separator: '-' })).toBe('one-two')
    })
  })

  describe('{ locale: az }', () => {
    it('reads each digit of a number individually', () => {
      expect(numberToDigitWords(90, { locale: az })).toBe('doqquz sıfır')
      expect(numberToDigitWords(123, { locale: az })).toBe('bir iki üç')
    })

    it('preserves leading zeros when given a string', () => {
      expect(numberToDigitWords('055', { locale: az })).toBe('sıfır beş beş')
    })

    it('prefixes a negative number with "mənfi"', () => {
      expect(numberToDigitWords(-12, { locale: az })).toBe('mənfi bir iki')
    })
  })
})
