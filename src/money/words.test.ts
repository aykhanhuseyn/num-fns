import { describe, expect, it } from 'bun:test'
import { az } from '../locale/az'
import { en } from '../locale/en'
import { enGB } from '../locale/en-gb'
import { es } from '../locale/es'
import { ru } from '../locale/ru'
import type { Locale } from '../locale/types'
import type { CurrencyCode } from './currency'
import { moneyToWords } from './words'

describe('moneyToWords', () => {
  it('defaults to English dollars/cents', () => {
    expect(moneyToWords(1234.5)).toBe('one thousand two hundred thirty-four dollars fifty cents')
  })

  it('uses the singular unit word for exactly one', () => {
    expect(moneyToWords(1)).toBe('one dollar')
  })

  it('omits the minor unit part when it is zero', () => {
    expect(moneyToWords(10)).toBe('ten dollars')
  })

  it('includes a zero minor unit when requested', () => {
    expect(moneyToWords(10, { includeZeroMinor: true })).toBe('ten dollars zero cents')
  })

  it('supports custom unit words', () => {
    expect(moneyToWords(9.99, { majorUnit: 'euro', minorUnit: 'cent' })).toBe(
      'nine euro ninety-nine cent',
    )
  })

  it('prefixes negative amounts with "negative" once', () => {
    expect(moneyToWords(-2.5)).toBe('negative two dollars fifty cents')
  })

  it('carries a rounded minor unit into the major unit', () => {
    expect(moneyToWords(1.999)).toBe('two dollars')
  })

  it('spells zero', () => {
    expect(moneyToWords(0)).toBe('zero dollars')
  })

  it('throws for non-finite values', () => {
    expect(() => moneyToWords(Infinity)).toThrow(RangeError)
    expect(() => moneyToWords(NaN)).toThrow(RangeError)
  })

  describe('{ currency }', () => {
    it("spells the requested currency with the locale's own unit words", () => {
      expect(moneyToWords(1.5, { currency: 'GBP' })).toBe('one pound fifty pence')
      expect(moneyToWords(1.01, { currency: 'GBP' })).toBe('one pound one penny')
      expect(moneyToWords(2.02, { currency: 'EUR' })).toBe('two euros two cents')
      expect(moneyToWords(3, { currency: 'RUB' })).toBe('three rubles')
      expect(moneyToWords(3, { locale: enGB, currency: 'RUB' })).toBe('three roubles')
      expect(moneyToWords(1.01, { currency: 'AZN' })).toBe('one manat one gapik')
    })

    it("defaults to the locale's own currency — pounds for enGB", () => {
      expect(moneyToWords(101.5, { locale: enGB })).toBe('one hundred and one pounds fifty pence')
    })

    it('inflects and gender-agrees the requested currency in ru', () => {
      expect(moneyToWords(2.02, { locale: ru, currency: 'USD' })).toBe('два доллара два цента')
      expect(moneyToWords(21.05, { locale: ru, currency: 'GBP' })).toBe(
        'двадцать один фунт стерлингов пять пенсов',
      )
    })

    it('agrees the feminine "libra" in es', () => {
      expect(moneyToWords(1, { locale: es, currency: 'GBP' })).toBe('una libra')
      expect(moneyToWords(200.01, { locale: es, currency: 'GBP' })).toBe(
        'doscientas libras uno penique',
      )
    })

    it("still honours explicit unit words over the currency's", () => {
      expect(moneyToWords(2, { currency: 'GBP', majorUnit: 'quid' })).toBe('two quid')
    })

    it('throws RangeError for a code the registry does not know', () => {
      expect(() => moneyToWords(1, { currency: 'XYZ' as CurrencyCode })).toThrow(RangeError)
    })

    it('throws RangeError, naming the locale and code, when the locale has no words for the currency', () => {
      const partial: Locale = {
        ...en,
        code: 'xx',
        currency: { ...en.currency, units: { USD: en.currency.units.USD } },
      }
      expect(() => moneyToWords(1, { locale: partial, currency: 'EUR' })).toThrow(
        'moneyToWords: locale "xx" has no unit words for currency "EUR" — it knows USD',
      )
      expect(moneyToWords(1, { locale: partial })).toBe('one dollar')
    })
  })

  describe('{ locale: az }', () => {
    it('spells the major and minor units', () => {
      expect(moneyToWords(1234.5, { locale: az })).toBe('min iki yüz otuz dörd manat əlli qəpik')
    })

    it('omits the minor unit part when it is zero', () => {
      expect(moneyToWords(10, { locale: az })).toBe('on manat')
    })

    it('includes a zero minor unit when requested', () => {
      expect(moneyToWords(10, { locale: az, includeZeroMinor: true })).toBe('on manat sıfır qəpik')
    })

    it('supports custom unit words', () => {
      expect(moneyToWords(9.99, { locale: az, majorUnit: 'dollar', minorUnit: 'sent' })).toBe(
        'doqquz dollar doxsan doqquz sent',
      )
    })

    it('prefixes negative amounts with "mənfi" once', () => {
      expect(moneyToWords(-2.5, { locale: az })).toBe('mənfi iki manat əlli qəpik')
    })
  })

  describe('{ locale: ru }', () => {
    it('resolves the currency unit word for the amount’s plural category', () => {
      expect(moneyToWords(1, { locale: ru })).toBe('один рубль')
      expect(moneyToWords(2, { locale: ru })).toBe('два рубля')
      expect(moneyToWords(5, { locale: ru })).toBe('пять рублей')
    })

    it('spells the masculine major unit and the feminine minor unit ("копейка" bug fix)', () => {
      // Before currency units carried a `gender`, the minor amount always
      // defaulted to masculine ("один копейка"), which is ungrammatical —
      // "копейка" is feminine and takes "одна"/"две".
      expect(moneyToWords(1.01, { locale: ru })).toBe('один рубль одна копейка')
      expect(moneyToWords(2.02, { locale: ru })).toBe('два рубля две копейки')
      expect(moneyToWords(5.05, { locale: ru })).toBe('пять рублей пять копеек')
    })

    it('agrees the minor unit gender through the 11-14 teens plural-category quirk', () => {
      // 11-14 fall in the "many" plural category despite ending in a digit
      // that would otherwise select "few"/"one" — сhecking gender agreement
      // holds through that irregularity too.
      expect(moneyToWords(11.11, { locale: ru })).toBe('одиннадцать рублей одиннадцать копеек')
      expect(moneyToWords(12.12, { locale: ru })).toBe('двенадцать рублей двенадцать копеек')
      expect(moneyToWords(14.14, { locale: ru })).toBe('четырнадцать рублей четырнадцать копеек')
    })

    it('agrees the minor unit gender for a value ending in 21 (one/masculine major, one/feminine minor)', () => {
      expect(moneyToWords(21.21, { locale: ru })).toBe('двадцать один рубль двадцать одна копейка')
    })
  })

  describe('{ locale: es }', () => {
    it('keeps the pre-gender-field output unchanged (both units are masculine)', () => {
      expect(moneyToWords(9.99, { locale: es })).toBe('nueve euros noventa y nueve céntimos')
      expect(moneyToWords(1.01, { locale: es })).toBe('uno euro uno céntimo')
    })
  })

  describe('locales without grammatical gender', () => {
    it('keeps az output byte-identical to before the gender field existed', () => {
      expect(moneyToWords(1234.5, { locale: az })).toBe('min iki yüz otuz dörd manat əlli qəpik')
    })

    it('keeps en output byte-identical to before the gender field existed', () => {
      expect(moneyToWords(1234.5, { locale: en })).toBe(
        'one thousand two hundred thirty-four dollars fifty cents',
      )
    })
  })
})
