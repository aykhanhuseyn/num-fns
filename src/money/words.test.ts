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
    expect(moneyToWords(999.995)).toBe('one thousand dollars')
  })

  it('rounds the minor unit as written, not as the double is stored', () => {
    // `(2.675 - 2) * 100` is 67.49999999999997, so `Math.round` made this
    // sixty-seven cents; the rounding is `round`'s, exact in decimal.
    expect(moneyToWords(2.675)).toBe('two dollars sixty-eight cents')
    expect(moneyToWords(1.005)).toBe('one dollar one cent')
    expect(moneyToWords(-2.675)).toBe('negative two dollars sixty-eight cents')
    expect(moneyToWords(2.675, { locale: az })).toBe('iki manat altmış səkkiz qəpik')
    expect(moneyToWords(2.675, { locale: ru })).toBe('два рубля шестьдесят восемь копеек')
  })

  it('reads an amount that rounds to zero as plain zero, never "negative zero"', () => {
    expect(moneyToWords(-0.001)).toBe('zero dollars')
    expect(moneyToWords(-0.004, { includeZeroMinor: true })).toBe('zero dollars zero cents')
    expect(moneyToWords(-0.005)).toBe('negative zero dollars one cent')
  })

  it('spells a whole number amount identically as a number and as a bigint', () => {
    for (const amount of [0, 1, 2, 5, 21, 1001, 1234567, 999999999999999]) {
      for (const locale of [en, az, ru, es]) {
        expect(moneyToWords(amount, { locale })).toBe(moneyToWords(BigInt(amount), { locale }))
        expect(moneyToWords(-amount, { locale })).toBe(moneyToWords(BigInt(-amount), { locale }))
      }
    }
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

  describe('bigint input', () => {
    it('spells a whole amount of the major unit with no minor part', () => {
      expect(moneyToWords(BigInt(1234))).toBe('one thousand two hundred thirty-four dollars')
      expect(moneyToWords(BigInt(1))).toBe('one dollar')
      expect(moneyToWords(BigInt(10))).toBe('ten dollars')
    })

    it('spells zero', () => {
      expect(moneyToWords(BigInt(0))).toBe('zero dollars')
    })

    it('includes a zero minor unit when requested', () => {
      expect(moneyToWords(BigInt(10), { includeZeroMinor: true })).toBe('ten dollars zero cents')
      expect(moneyToWords(BigInt(10), { locale: az, includeZeroMinor: true })).toBe(
        'on manat sıfır qəpik',
      )
    })

    it('prefixes a negative amount with the locale negative word once', () => {
      expect(moneyToWords(BigInt(-2))).toBe('negative two dollars')
      expect(moneyToWords(BigInt(-2), { locale: az })).toBe('mənfi iki manat')
      expect(moneyToWords(BigInt(-2), { locale: ru })).toBe('минус два рубля')
    })

    it('reads exactly up to the 999-trillion scale cap of the launch locales', () => {
      expect(moneyToWords(BigInt(1000000000000))).toBe('one trillion dollars')
      expect(moneyToWords(BigInt('999999999999999'))).toBe(
        'nine hundred ninety-nine trillion nine hundred ninety-nine billion nine hundred ninety-nine million nine hundred ninety-nine thousand nine hundred ninety-nine dollars',
      )
      expect(moneyToWords(BigInt('999999999999999'), { locale: az })).toBe(
        'doqquz yüz doxsan doqquz trilyon doqquz yüz doxsan doqquz milyard doqquz yüz doxsan doqquz milyon doqquz yüz doxsan doqquz min doqquz yüz doxsan doqquz manat',
      )
    })

    it('throws RangeError beyond the scale cap', () => {
      expect(() => moneyToWords(BigInt('1000000000000000'))).toThrow(RangeError)
      expect(() => moneyToWords(BigInt('1000000000000000'))).toThrow(
        'exceeds the maximum supported magnitude of 999999999999999',
      )
      expect(() => moneyToWords(BigInt('-1000000000000000'), { locale: ru })).toThrow(RangeError)
    })

    it('honours currency, custom unit words and gender agreement', () => {
      expect(moneyToWords(BigInt(3), { currency: 'GBP' })).toBe('three pounds')
      expect(moneyToWords(BigInt(2), { currency: 'GBP', majorUnit: 'quid' })).toBe('two quid')
      expect(moneyToWords(BigInt(1), { locale: es, currency: 'GBP' })).toBe('una libra')
      expect(moneyToWords(BigInt(200), { locale: es, currency: 'GBP' })).toBe('doscientas libras')
      expect(moneyToWords(BigInt(1234), { locale: az })).toBe('min iki yüz otuz dörd manat')
    })

    it('throws RangeError for an unknown code or a locale without words for it', () => {
      expect(() => moneyToWords(BigInt(1), { currency: 'XYZ' as CurrencyCode })).toThrow(RangeError)
      const partial: Locale = {
        ...en,
        code: 'xx',
        currency: { ...en.currency, units: { USD: en.currency.units.USD } },
      }
      expect(() => moneyToWords(BigInt(1), { locale: partial, currency: 'EUR' })).toThrow(
        RangeError,
      )
    })

    describe('{ locale: ru }', () => {
      it('resolves the unit word for the plural category of the bigint amount', () => {
        expect(moneyToWords(BigInt(1), { locale: ru })).toBe('один рубль')
        expect(moneyToWords(BigInt(2), { locale: ru })).toBe('два рубля')
        expect(moneyToWords(BigInt(5), { locale: ru })).toBe('пять рублей')
        expect(moneyToWords(BigInt(11), { locale: ru })).toBe('одиннадцать рублей')
        expect(moneyToWords(BigInt(21), { locale: ru })).toBe('двадцать один рубль')
        expect(moneyToWords(BigInt(2), { locale: ru, currency: 'USD' })).toBe('два доллара')
      })

      it('agrees the feminine minor unit when a zero minor part is requested', () => {
        expect(moneyToWords(BigInt(1), { locale: ru, includeZeroMinor: true })).toBe(
          'один рубль ноль копеек',
        )
      })

      it('keeps the plural category for an amount beyond Number.MAX_SAFE_INTEGER', () => {
        // A custom locale naming quadrillions can read past the safe range;
        // `locale.plural` still takes a number, so the amount is folded to one
        // with the same last digits: ...993 is "few", ...995 is "many".
        const quadrillion: Locale = {
          ...ru,
          words: {
            ...ru.words,
            scales: [
              ...ru.words.scales,
              { one: 'квадриллион', few: 'квадриллиона', many: 'квадриллионов' },
            ],
          },
        }
        expect(moneyToWords(BigInt('9007199254740993'), { locale: quadrillion })).toBe(
          'девять квадриллионов семь триллионов сто девяносто девять миллиардов двести пятьдесят четыре миллиона семьсот сорок тысяч девятьсот девяносто три рубля',
        )
        expect(moneyToWords(BigInt('9007199254740995'), { locale: quadrillion })).toBe(
          'девять квадриллионов семь триллионов сто девяносто девять миллиардов двести пятьдесят четыре миллиона семьсот сорок тысяч девятьсот девяносто пять рублей',
        )
        expect(moneyToWords(BigInt('9007199254740991'), { locale: quadrillion })).toEndWith(
          'девяносто один рубль',
        )
      })
    })

    it('agrees with the number path for every safe whole amount', () => {
      for (const amount of [0, 1, 2, 5, 21, 100, 1001, 999999999999999]) {
        for (const locale of [en, az, ru, es, enGB]) {
          expect(moneyToWords(BigInt(amount), { locale })).toBe(moneyToWords(amount, { locale }))
          expect(moneyToWords(BigInt(-amount), { locale })).toBe(moneyToWords(-amount, { locale }))
        }
      }
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
