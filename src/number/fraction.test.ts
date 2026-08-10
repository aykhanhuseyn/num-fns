import { describe, expect, it } from 'bun:test'
import { fractionToWords } from './fraction'

describe('fractionToWords', () => {
  it('returns the idiomatic "yarım" for one half', () => {
    expect(fractionToWords(1, 2)).toBe('yarım')
  })

  it('reads thirds with front-vowel harmony ("üçdə")', () => {
    expect(fractionToWords(1, 3)).toBe('üçdə bir')
    expect(fractionToWords(2, 3)).toBe('üçdə iki')
  })

  it('reads fourths with front-vowel harmony ("dörddə")', () => {
    expect(fractionToWords(1, 4)).toBe('dörddə bir')
    expect(fractionToWords(3, 4)).toBe('dörddə üç')
  })

  it('reads tenths with back-vowel harmony ("onda")', () => {
    expect(fractionToWords(1, 10)).toBe('onda bir')
    expect(fractionToWords(7, 10)).toBe('onda yeddi')
  })

  it('reads hundredths as "yüzdə", matching the idiom for percent', () => {
    expect(fractionToWords(1, 100)).toBe('yüzdə bir')
  })

  it('attaches the suffix to the last word of a compound denominator', () => {
    expect(fractionToWords(1, 21)).toBe('iyirmi birdə bir')
  })

  it('throws when denominator is not an integer >= 2', () => {
    expect(() => fractionToWords(1, 1)).toThrow(RangeError)
    expect(() => fractionToWords(1, 0)).toThrow(RangeError)
    expect(() => fractionToWords(1, -3)).toThrow(RangeError)
    expect(() => fractionToWords(1, 2.5)).toThrow(RangeError)
    expect(() => fractionToWords(1, Number.NaN)).toThrow(RangeError)
  })

  it('throws when numerator is not an integer in [1, denominator - 1]', () => {
    expect(() => fractionToWords(0, 3)).toThrow(RangeError)
    expect(() => fractionToWords(3, 3)).toThrow(RangeError)
    expect(() => fractionToWords(4, 3)).toThrow(RangeError)
    expect(() => fractionToWords(-1, 3)).toThrow(RangeError)
    expect(() => fractionToWords(1.5, 3)).toThrow(RangeError)
  })
})
