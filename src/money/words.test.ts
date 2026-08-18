import { describe, expect, it } from 'bun:test'
import { az } from '../locale/az'
import { ru } from '../locale/ru'
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
  })
})
