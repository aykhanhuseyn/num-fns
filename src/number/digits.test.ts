import { describe, expect, it } from 'bun:test'
import { numberToDigitWords } from './digits'

describe('numberToDigitWords', () => {
  it('reads each digit of a number individually', () => {
    expect(numberToDigitWords(90)).toBe('doqquz sıfır')
    expect(numberToDigitWords(123)).toBe('bir iki üç')
  })

  it('preserves leading zeros when given a string', () => {
    expect(numberToDigitWords('055')).toBe('sıfır beş beş')
  })

  it('ignores common phone-number punctuation', () => {
    expect(numberToDigitWords('+994 55 123 45 67')).toBe(
      'doqquz doqquz dörd beş beş bir iki üç dörd beş altı yeddi',
    )
    expect(numberToDigitWords('(012) 345-67')).toBe('sıfır bir iki üç dörd beş altı yeddi')
  })

  it('supports a custom separator', () => {
    expect(numberToDigitWords(12, { separator: '-' })).toBe('bir-iki')
  })

  it('prefixes a negative number with "mənfi"', () => {
    expect(numberToDigitWords(-12)).toBe('mənfi bir iki')
  })

  it('prefixes a leading "-" string with "mənfi"', () => {
    expect(numberToDigitWords('-012')).toBe('mənfi sıfır bir iki')
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
})
