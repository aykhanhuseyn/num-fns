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

    it('joins decimals with "point"', () => {
      expect(numberToWords(12.34, { locale: en })).toBe('twelve point thirty-four')
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

    it('apocopates a trailing "uno" before "mil" ("veintiún mil", not "veintiuno mil")', () => {
      expect(numberToWords(21000, { locale: es })).toBe('veintiún mil')
      expect(numberToWords(231000, { locale: es })).toBe('doscientos treinta y un mil')
    })

    it('joins decimal parts with "coma", RAE\'s standard decimal reading (todo.md §2)', () => {
      expect(numberToWords(12.34, { locale: es })).toBe('doce coma treinta y cuatro')
      expect(numberToWords(0.5, { locale: es })).toBe('cero coma cincuenta')
      expect(numberToWords(-3.5, { locale: es })).toBe('menos tres coma cincuenta')
    })
  })

  describe('{ gender } (todo.md §1 "Grammatical gender" decision)', () => {
    it('defaults to the locale’s masculine citation form, so omitting it changes nothing', () => {
      for (const locale of [ru, es]) {
        for (const value of [1, 2, 21, 200, 1001, 21000]) {
          expect(numberToWords(value, { locale, gender: 'masculine' })).toBe(
            numberToWords(value, { locale }),
          )
        }
      }
    })

    it('spells Russian feminine forms ("одна"/"две") in the units group', () => {
      const options = { locale: ru, gender: 'feminine' } as const
      expect(numberToWords(1, options)).toBe('одна')
      expect(numberToWords(2, options)).toBe('две')
      expect(numberToWords(21, options)).toBe('двадцать одна')
      expect(numberToWords(1001, options)).toBe('одна тысяча одна')
      expect(numberToWords(2002, options)).toBe('две тысячи две')
      expect(numberToWords(-21, options)).toBe('минус двадцать одна')
    })

    it('spells Russian neuter "одно" and keeps "два" (neuter shares the masculine form)', () => {
      const options = { locale: ru, gender: 'neuter' } as const
      expect(numberToWords(1, options)).toBe('одно')
      expect(numberToWords(2, options)).toBe('два')
      expect(numberToWords(21, options)).toBe('двадцать одно')
      expect(numberToWords(1001, options)).toBe('одна тысяча одно')
    })

    it('keeps Russian scale-bound groups agreeing with the scale noun, not the requested gender', () => {
      expect(numberToWords(21000, { locale: ru, gender: 'feminine' })).toBe('двадцать одна тысяча')
      expect(numberToWords(21000, { locale: ru, gender: 'neuter' })).toBe('двадцать одна тысяча')
      expect(numberToWords(1000000, { locale: ru, gender: 'feminine' })).toBe('один миллион')
      expect(numberToWords(21000000, { locale: ru, gender: 'feminine' })).toBe(
        'двадцать один миллион',
      )
    })

    it('spells Spanish feminine forms ("una", "veintiuna", "-cientas") in the units group', () => {
      const options = { locale: es, gender: 'feminine' } as const
      expect(numberToWords(1, options)).toBe('una')
      expect(numberToWords(21, options)).toBe('veintiuna')
      expect(numberToWords(31, options)).toBe('treinta y una')
      expect(numberToWords(200, options)).toBe('doscientas')
      expect(numberToWords(101, options)).toBe('ciento una')
      expect(numberToWords(100, options)).toBe('cien')
      expect(numberToWords(-21, options)).toBe('menos veintiuna')
    })

    it('passes Spanish feminine agreement through the gender-transparent "mil" but not "millón"', () => {
      const options = { locale: es, gender: 'feminine' } as const
      expect(numberToWords(200000, options)).toBe('doscientas mil')
      expect(numberToWords(200500, options)).toBe('doscientas mil quinientas')
      // RAE keeps the apocope before "mil" even in feminine agreement.
      expect(numberToWords(231000, options)).toBe('doscientas treinta y un mil')
      expect(numberToWords(21000, options)).toBe('veintiún mil')
      expect(numberToWords(1000, options)).toBe('mil')
      expect(numberToWords(1000001, options)).toBe('un millón una')
      expect(numberToWords(200000000, options)).toBe('doscientos millones')
    })

    it('applies the requested gender to the decimal-fraction group', () => {
      // ru sets `decimalConnector: 'запятая'`, es sets `decimalConnector:
      // 'coma'` (`todo.md` §2), so both join with their named connector
      // rather than a plain space — the fraction group's gender agreement
      // is unaffected by the connector.
      expect(numberToWords(0.01, { locale: ru, gender: 'feminine' })).toBe('ноль запятая одна')
      expect(numberToWords(0.21, { locale: es, gender: 'feminine' })).toBe('cero coma veintiuna')
    })

    it('throws for a gender the locale has no words for', () => {
      expect(() => numberToWords(1, { gender: 'feminine' })).toThrow(RangeError)
      expect(() => numberToWords(1, { locale: en, gender: 'masculine' })).toThrow(
        'locale "en" has no grammatical gender',
      )
      expect(() => numberToWords(1, { locale: az, gender: 'feminine' })).toThrow(RangeError)
      expect(() => numberToWords(1, { locale: es, gender: 'neuter' })).toThrow(
        'locale "es" does not distinguish the "neuter" gender (supported: "masculine", "feminine")',
      )
    })

    it('throws for a value outside GrammaticalGender before consulting the locale', () => {
      // @ts-expect-error — deliberately invalid gender to exercise the runtime guard
      expect(() => numberToWords(1, { locale: ru, gender: 'common' })).toThrow(RangeError)
      // @ts-expect-error — deliberately invalid gender to exercise the runtime guard
      expect(() => numberToWords(1, { locale: en, gender: 42 })).toThrow(
        'gender must be one of "masculine", "feminine", "neuter", received 42',
      )
    })
  })
})
