import { describe, expect, it } from 'bun:test'
import { moneyToWords } from './words'

describe('moneyToWords', () => {
  it('spells the major and minor units', () => {
    expect(moneyToWords(1234.5)).toBe('min iki yüz otuz dörd manat əlli qəpik')
  })

  it('omits the minor unit part when it is zero', () => {
    expect(moneyToWords(10)).toBe('on manat')
  })

  it('includes a zero minor unit when requested', () => {
    expect(moneyToWords(10, { includeZeroMinor: true })).toBe('on manat sıfır qəpik')
  })

  it('supports custom unit words', () => {
    expect(moneyToWords(9.99, { majorUnit: 'dollar', minorUnit: 'sent' })).toBe(
      'doqquz dollar doxsan doqquz sent',
    )
  })

  it('prefixes negative amounts with "mənfi" once', () => {
    expect(moneyToWords(-2.5)).toBe('mənfi iki manat əlli qəpik')
  })

  it('carries a rounded minor unit into the major unit', () => {
    expect(moneyToWords(1.999)).toBe('iki manat')
  })

  it('spells zero', () => {
    expect(moneyToWords(0)).toBe('sıfır manat')
  })

  it('throws for non-finite values', () => {
    expect(() => moneyToWords(Infinity)).toThrow(RangeError)
    expect(() => moneyToWords(NaN)).toThrow(RangeError)
  })
})
