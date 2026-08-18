import { describe, expect, it } from 'bun:test'
import { az } from '../locale/az'
import { en } from '../locale/en'
import { es } from '../locale/es'
import { ru } from '../locale/ru'
import { numberToWords } from './words'

describe('numberToWords', () => {
  it('defaults to English', () => {
    expect(numberToWords(0)).toBe('zero')
    expect(numberToWords(1234)).toBe('one thousand two hundred thirty-four')
  })

  it('throws for non-finite values', () => {
    expect(() => numberToWords(Infinity)).toThrow(RangeError)
    expect(() => numberToWords(NaN)).toThrow(RangeError)
  })

  it('throws when the magnitude is out of range', () => {
    expect(() => numberToWords(10 ** 16)).toThrow(RangeError)
  })

  describe('{ locale: en }', () => {
    it('spells zero', () => {
      expect(numberToWords(0, { locale: en })).toBe('zero')
    })

    it('spells single digits', () => {
      expect(numberToWords(1, { locale: en })).toBe('one')
      expect(numberToWords(9, { locale: en })).toBe('nine')
    })

    it('spells teens and tens', () => {
      expect(numberToWords(10, { locale: en })).toBe('ten')
      expect(numberToWords(11, { locale: en })).toBe('eleven')
      expect(numberToWords(21, { locale: en })).toBe('twenty-one')
      expect(numberToWords(99, { locale: en })).toBe('ninety-nine')
    })

    it('never drops "one" before "hundred", unlike Azerbaijani "min"', () => {
      expect(numberToWords(100, { locale: en })).toBe('one hundred')
      expect(numberToWords(200, { locale: en })).toBe('two hundred')
      expect(numberToWords(999, { locale: en })).toBe('nine hundred ninety-nine')
    })

    it('never drops "one" before a scale word', () => {
      expect(numberToWords(1000, { locale: en })).toBe('one thousand')
      expect(numberToWords(2000, { locale: en })).toBe('two thousand')
      expect(numberToWords(1000000, { locale: en })).toBe('one million')
    })

    it('spells composite large numbers', () => {
      expect(numberToWords(1234, { locale: en })).toBe('one thousand two hundred thirty-four')
      expect(numberToWords(1234567, { locale: en })).toBe(
        'one million two hundred thirty-four thousand five hundred sixty-seven',
      )
    })

    it('spells billions and trillions', () => {
      expect(numberToWords(1000000000, { locale: en })).toBe('one billion')
      expect(numberToWords(1000000000000, { locale: en })).toBe('one trillion')
    })

    it('prefixes negative numbers with "negative"', () => {
      expect(numberToWords(-5, { locale: en })).toBe('negative five')
      expect(numberToWords(-1234, { locale: en })).toBe(
        'negative one thousand two hundred thirty-four',
      )
    })

    it('has no decimal-reading convention yet, so decimals join with a plain space', () => {
      expect(numberToWords(12.34, { locale: en })).toBe('twelve thirty-four')
    })
  })

  describe('{ locale: az }', () => {
    it('is byte-identical to the pre-refactor hardcoded implementation', () => {
      expect(numberToWords(0, { locale: az })).toBe('sıfır')
      expect(numberToWords(1, { locale: az })).toBe('bir')
      expect(numberToWords(9, { locale: az })).toBe('doqquz')
      expect(numberToWords(10, { locale: az })).toBe('on')
      expect(numberToWords(11, { locale: az })).toBe('on bir')
      expect(numberToWords(21, { locale: az })).toBe('iyirmi bir')
      expect(numberToWords(99, { locale: az })).toBe('doxsan doqquz')
      expect(numberToWords(100, { locale: az })).toBe('yüz')
      expect(numberToWords(200, { locale: az })).toBe('iki yüz')
      expect(numberToWords(999, { locale: az })).toBe('doqquz yüz doxsan doqquz')
      expect(numberToWords(1000, { locale: az })).toBe('min')
      expect(numberToWords(2000, { locale: az })).toBe('iki min')
      expect(numberToWords(1000000, { locale: az })).toBe('bir milyon')
      expect(numberToWords(1234, { locale: az })).toBe('min iki yüz otuz dörd')
      expect(numberToWords(1234567, { locale: az })).toBe(
        'bir milyon iki yüz otuz dörd min beş yüz altmış yeddi',
      )
      expect(numberToWords(1000000000, { locale: az })).toBe('bir milyard')
      expect(numberToWords(1000000000000, { locale: az })).toBe('bir trilyon')
      expect(numberToWords(-5, { locale: az })).toBe('mənfi beş')
      expect(numberToWords(-1234, { locale: az })).toBe('mənfi min iki yüz otuz dörd')
      expect(numberToWords(12.34, { locale: az })).toBe('on iki tam otuz dörd')
      expect(numberToWords(0.5, { locale: az })).toBe('sıfır tam əlli')
      expect(numberToWords(0.999, { locale: az })).toBe('bir')
    })

    it('throws for non-finite values', () => {
      expect(() => numberToWords(Infinity, { locale: az })).toThrow(RangeError)
      expect(() => numberToWords(NaN, { locale: az })).toThrow(RangeError)
    })

    it('throws when the magnitude is out of range', () => {
      expect(() => numberToWords(10 ** 16, { locale: az })).toThrow(RangeError)
    })
  })

  describe('{ locale: ru }', () => {
    it('spells cardinals, applying gender agreement before the thousands scale', () => {
      expect(numberToWords(0, { locale: ru })).toBe('ноль')
      expect(numberToWords(1, { locale: ru })).toBe('один')
      expect(numberToWords(21, { locale: ru })).toBe('двадцать один')
      expect(numberToWords(1000, { locale: ru })).toBe('одна тысяча')
      expect(numberToWords(2000, { locale: ru })).toBe('две тысячи')
      expect(numberToWords(5000, { locale: ru })).toBe('пять тысяч')
      expect(numberToWords(1000000, { locale: ru })).toBe('один миллион')
      expect(numberToWords(21000, { locale: ru })).toBe('двадцать одна тысяча')
    })

    it('prefixes negative numbers with "минус"', () => {
      expect(numberToWords(-5, { locale: ru })).toBe('минус пять')
    })
  })

  describe('{ locale: es }', () => {
    it('spells cardinals, applying the veinti- contraction, "y", and cien/ciento', () => {
      expect(numberToWords(0, { locale: es })).toBe('cero')
      expect(numberToWords(21, { locale: es })).toBe('veintiuno')
      expect(numberToWords(35, { locale: es })).toBe('treinta y cinco')
      expect(numberToWords(100, { locale: es })).toBe('cien')
      expect(numberToWords(101, { locale: es })).toBe('ciento uno')
      expect(numberToWords(135, { locale: es })).toBe('ciento treinta y cinco')
      expect(numberToWords(1000, { locale: es })).toBe('mil')
      expect(numberToWords(2000, { locale: es })).toBe('dos mil')
      expect(numberToWords(100000, { locale: es })).toBe('cien mil')
      expect(numberToWords(1000000, { locale: es })).toBe('un millón')
      expect(numberToWords(21000000, { locale: es })).toBe('veintiún millones')
      expect(numberToWords(31000000, { locale: es })).toBe('treinta y un millones')
    })

    it('prefixes negative numbers with "menos"', () => {
      expect(numberToWords(-5, { locale: es })).toBe('menos cinco')
    })
  })
})
