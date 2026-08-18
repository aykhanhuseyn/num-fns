import { describe, expect, it } from 'bun:test'
import { az } from '../locale/az'
import { ru } from '../locale/ru'
import { fractionToWords } from './fraction'

describe('fractionToWords', () => {
  it('defaults to English', () => {
    expect(fractionToWords(1, 2)).toBe('half')
    expect(fractionToWords(1, 3)).toBe('one third')
    expect(fractionToWords(2, 3)).toBe('two thirds')
    expect(fractionToWords(3, 4)).toBe('three fourths')
    expect(fractionToWords(7, 10)).toBe('seven tenths')
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

  it('throws for a locale that does not define fraction words yet', () => {
    expect(() => fractionToWords(1, 3, { locale: ru })).toThrow(RangeError)
  })

  describe('{ locale: az }', () => {
    it('returns the idiomatic "yarım" for one half', () => {
      expect(fractionToWords(1, 2, { locale: az })).toBe('yarım')
    })

    it('reads thirds with front-vowel harmony ("üçdə")', () => {
      expect(fractionToWords(1, 3, { locale: az })).toBe('üçdə bir')
      expect(fractionToWords(2, 3, { locale: az })).toBe('üçdə iki')
    })

    it('reads fourths with front-vowel harmony ("dörddə")', () => {
      expect(fractionToWords(1, 4, { locale: az })).toBe('dörddə bir')
      expect(fractionToWords(3, 4, { locale: az })).toBe('dörddə üç')
    })

    it('reads tenths with back-vowel harmony ("onda")', () => {
      expect(fractionToWords(1, 10, { locale: az })).toBe('onda bir')
      expect(fractionToWords(7, 10, { locale: az })).toBe('onda yeddi')
    })

    it('reads hundredths as "yüzdə", matching the idiom for percent', () => {
      expect(fractionToWords(1, 100, { locale: az })).toBe('yüzdə bir')
    })

    it('attaches the suffix to the last word of a compound denominator', () => {
      expect(fractionToWords(1, 21, { locale: az })).toBe('iyirmi birdə bir')
    })
  })
})
