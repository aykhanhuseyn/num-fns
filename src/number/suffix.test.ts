import { describe, expect, it } from 'bun:test'
import { az } from '../locale/az'
import { es } from '../locale/es'
import {
  cardinalToOrdinalWords,
  getOrdinalSuffix,
  ordinalToWords,
  toOrdinal,
  withSuffix,
} from './suffix'

describe('getOrdinalSuffix', () => {
  it('defaults to English st/nd/rd/th', () => {
    expect(getOrdinalSuffix(1)).toBe('st')
    expect(getOrdinalSuffix(2)).toBe('nd')
    expect(getOrdinalSuffix(3)).toBe('rd')
    expect(getOrdinalSuffix(4)).toBe('th')
    expect(getOrdinalSuffix(11)).toBe('th')
    expect(getOrdinalSuffix(21)).toBe('st')
  })

  it('throws for negative or non-integer values', () => {
    expect(() => getOrdinalSuffix(-1)).toThrow(RangeError)
    expect(() => getOrdinalSuffix(1.5)).toThrow(RangeError)
  })

  describe('bigint input', () => {
    it('behaves like the equal number for a safe integer', () => {
      expect(getOrdinalSuffix(BigInt(0))).toBe('th')
      expect(getOrdinalSuffix(BigInt(1))).toBe('st')
      expect(getOrdinalSuffix(BigInt(22))).toBe('nd')
      expect(getOrdinalSuffix(BigInt(103))).toBe('rd')
      expect(getOrdinalSuffix(BigInt(Number.MAX_SAFE_INTEGER))).toBe(
        getOrdinalSuffix(Number.MAX_SAFE_INTEGER),
      )
      expect(getOrdinalSuffix(BigInt(3), { locale: az })).toBe('cü')
    })

    it('throws for a negative bigint like a negative number', () => {
      expect(() => getOrdinalSuffix(BigInt(-1))).toThrow(RangeError)
    })

    it('throws RangeError beyond Number.MAX_SAFE_INTEGER, since the locale hook takes a number', () => {
      expect(() => getOrdinalSuffix(BigInt('9007199254740993'))).toThrow(RangeError)
      expect(() => getOrdinalSuffix(BigInt('9007199254740993'))).toThrow(
        'ordinal hooks take a number',
      )
      expect(() => getOrdinalSuffix(BigInt('123456789012345678901234567890'))).toThrow(RangeError)
    })
  })

  describe('{ locale: az }', () => {
    it('follows vowel harmony for 1 through 10', () => {
      expect(getOrdinalSuffix(1, { locale: az })).toBe('ci') // bir
      expect(getOrdinalSuffix(2, { locale: az })).toBe('ci') // iki
      expect(getOrdinalSuffix(3, { locale: az })).toBe('cü') // üç
      expect(getOrdinalSuffix(4, { locale: az })).toBe('cü') // dörd
      expect(getOrdinalSuffix(5, { locale: az })).toBe('ci') // beş
      expect(getOrdinalSuffix(6, { locale: az })).toBe('cı') // altı
      expect(getOrdinalSuffix(7, { locale: az })).toBe('ci') // yeddi
      expect(getOrdinalSuffix(8, { locale: az })).toBe('ci') // səkkiz
      expect(getOrdinalSuffix(9, { locale: az })).toBe('cu') // doqquz
      expect(getOrdinalSuffix(10, { locale: az })).toBe('cu') // on
    })

    it('follows vowel harmony for round tens and hundred', () => {
      expect(getOrdinalSuffix(20, { locale: az })).toBe('ci') // iyirmi
      expect(getOrdinalSuffix(30, { locale: az })).toBe('cu') // otuz
      expect(getOrdinalSuffix(40, { locale: az })).toBe('cı') // qırx
      expect(getOrdinalSuffix(50, { locale: az })).toBe('ci') // əlli
      expect(getOrdinalSuffix(60, { locale: az })).toBe('cı') // altmış
      expect(getOrdinalSuffix(70, { locale: az })).toBe('ci') // yetmiş
      expect(getOrdinalSuffix(80, { locale: az })).toBe('ci') // səksən
      expect(getOrdinalSuffix(90, { locale: az })).toBe('cı') // doxsan
      expect(getOrdinalSuffix(100, { locale: az })).toBe('cü') // yüz
    })

    it('follows vowel harmony for scale words', () => {
      expect(getOrdinalSuffix(1000, { locale: az })).toBe('ci') // min
      expect(getOrdinalSuffix(1000000, { locale: az })).toBe('cu') // bir milyon
    })

    it('throws for negative or non-integer values', () => {
      expect(() => getOrdinalSuffix(-1, { locale: az })).toThrow(RangeError)
      expect(() => getOrdinalSuffix(1.5, { locale: az })).toThrow(RangeError)
    })
  })
})

describe('ordinalToWords', () => {
  it('defaults to English ordinal words', () => {
    expect(ordinalToWords(1)).toBe('first')
    expect(ordinalToWords(3)).toBe('third')
    expect(ordinalToWords(21)).toBe('twenty-first')
    expect(ordinalToWords(100)).toBe('one hundredth')
  })

  it('throws for negative or non-integer values', () => {
    expect(() => ordinalToWords(-1)).toThrow(RangeError)
    expect(() => ordinalToWords(1.5)).toThrow(RangeError)
  })

  describe('bigint input', () => {
    it('spells a bigint like the equal number', () => {
      expect(ordinalToWords(BigInt(0))).toBe('zeroth')
      expect(ordinalToWords(BigInt(1))).toBe('first')
      expect(ordinalToWords(BigInt(21))).toBe('twenty-first')
      expect(ordinalToWords(BigInt(100))).toBe('one hundredth')
      expect(ordinalToWords(BigInt(1234), { locale: az })).toBe('min iki yüz otuz dördüncü')
      expect(ordinalToWords(BigInt(2000), { locale: es })).toBe('dosmilésimo')
    })

    it('throws for a negative bigint', () => {
      expect(() => ordinalToWords(BigInt(-1))).toThrow(RangeError)
      expect(() => ordinalToWords(BigInt(-1))).toThrow('non-negative integer')
    })

    it('throws RangeError beyond Number.MAX_SAFE_INTEGER, since the locale hook takes a number', () => {
      expect(() => ordinalToWords(BigInt('9007199254740993'))).toThrow(RangeError)
      expect(() => ordinalToWords(BigInt('9007199254740993'))).toThrow(
        'ordinal hooks take a number',
      )
    })
  })

  describe('{ locale: az }', () => {
    it('applies the buffer "n" plus a connecting vowel after a consonant', () => {
      expect(ordinalToWords(1, { locale: az })).toBe('birinci')
      expect(ordinalToWords(3, { locale: az })).toBe('üçüncü')
      expect(ordinalToWords(4, { locale: az })).toBe('dördüncü')
      expect(ordinalToWords(5, { locale: az })).toBe('beşinci')
      expect(ordinalToWords(6, { locale: az })).toBe('altıncı')
      expect(ordinalToWords(9, { locale: az })).toBe('doqquzuncu')
      expect(ordinalToWords(10, { locale: az })).toBe('onuncu')
    })

    it('skips the connecting vowel when the word already ends in a vowel', () => {
      expect(ordinalToWords(2, { locale: az })).toBe('ikinci')
      expect(ordinalToWords(7, { locale: az })).toBe('yeddinci')
      expect(ordinalToWords(20, { locale: az })).toBe('iyirminci')
      expect(ordinalToWords(50, { locale: az })).toBe('əllinci')
    })

    it('handles round tens and hundred', () => {
      expect(ordinalToWords(30, { locale: az })).toBe('otuzuncu')
      expect(ordinalToWords(40, { locale: az })).toBe('qırxıncı')
      expect(ordinalToWords(60, { locale: az })).toBe('altmışıncı')
      expect(ordinalToWords(70, { locale: az })).toBe('yetmişinci')
      expect(ordinalToWords(80, { locale: az })).toBe('səksəninci')
      expect(ordinalToWords(90, { locale: az })).toBe('doxsanıncı')
      expect(ordinalToWords(100, { locale: az })).toBe('yüzüncü')
    })

    it('only ordinalizes the last word of a composite number', () => {
      expect(ordinalToWords(21, { locale: az })).toBe('iyirmi birinci')
      expect(ordinalToWords(1234, { locale: az })).toBe('min iki yüz otuz dördüncü')
    })

    it('handles scale words', () => {
      expect(ordinalToWords(1000, { locale: az })).toBe('mininci')
      expect(ordinalToWords(1000000, { locale: az })).toBe('bir milyonuncu')
    })

    it('spells zero', () => {
      expect(ordinalToWords(0, { locale: az })).toBe('sıfırıncı')
    })

    it('throws for negative or non-integer values', () => {
      expect(() => ordinalToWords(-1, { locale: az })).toThrow(RangeError)
      expect(() => ordinalToWords(1.5, { locale: az })).toThrow(RangeError)
    })
  })

  describe('{ locale: es }', () => {
    it('fuses a round multiple of a scale word end-to-end (todo.md §2)', () => {
      expect(ordinalToWords(2000, { locale: es })).toBe('dosmilésimo')
      expect(ordinalToWords(100000, { locale: es })).toBe('cienmilésimo')
      expect(ordinalToWords(1000000, { locale: es })).toBe('millonésimo')
    })

    it('ordinalizes every token when the number does not end in a scale word', () => {
      expect(ordinalToWords(2001, { locale: es })).toBe('segundo milésimo primero')
    })
  })
})

describe('cardinalToOrdinalWords', () => {
  it('defaults to English, transforming an already-computed cardinal reading', () => {
    expect(cardinalToOrdinalWords('twenty-one')).toBe('twenty-first')
    expect(cardinalToOrdinalWords('one hundred')).toBe('one hundredth')
  })

  it('matches ordinalToWords for the same value when given its cardinal reading', () => {
    expect(cardinalToOrdinalWords('iyirmi bir', { locale: az })).toBe(
      ordinalToWords(21, { locale: az }),
    )
  })

  it('supports a locale', () => {
    expect(cardinalToOrdinalWords('üç', { locale: az })).toBe('üçüncü')
  })
})

describe('toOrdinal', () => {
  it('formats the ordinal with a hyphen by default', () => {
    expect(toOrdinal(1)).toBe('1-st')
    expect(toOrdinal(3)).toBe('3-rd')
    expect(toOrdinal(21)).toBe('21-st')
    expect(toOrdinal(100)).toBe('100-th')
  })

  it('supports a custom separator', () => {
    expect(toOrdinal(5, { separator: ' ' })).toBe('5 th')
  })

  it('supports a locale', () => {
    expect(toOrdinal(5, { locale: az })).toBe('5-ci')
    expect(toOrdinal(5, { locale: az, separator: ' ' })).toBe('5 ci')
  })

  describe('bigint input', () => {
    it('renders the bigint digits exactly with the suffix of the equal number', () => {
      expect(toOrdinal(BigInt(0))).toBe('0-th')
      expect(toOrdinal(BigInt(1))).toBe('1-st')
      expect(toOrdinal(BigInt(22))).toBe('22-nd')
      expect(toOrdinal(BigInt(101), { separator: '' })).toBe('101st')
      expect(toOrdinal(BigInt(5), { locale: az })).toBe('5-ci')
      expect(toOrdinal(BigInt(Number.MAX_SAFE_INTEGER))).toBe('9007199254740991-st')
    })

    it('throws for a negative bigint', () => {
      expect(() => toOrdinal(BigInt(-1))).toThrow(RangeError)
    })

    it('throws RangeError beyond Number.MAX_SAFE_INTEGER, since the suffix hook takes a number', () => {
      expect(() => toOrdinal(BigInt('9007199254740993'))).toThrow(RangeError)
    })
  })
})

describe('withSuffix', () => {
  it('joins a value and suffix with a space by default', () => {
    expect(withSuffix(120, 'kg')).toBe('120 kg')
  })

  it('supports a custom separator', () => {
    expect(withSuffix(5, 'cı', { separator: '-' })).toBe('5-cı')
  })

  it('accepts a string or a bigint value, rendering a bigint exactly', () => {
    expect(withSuffix('5', 'kg')).toBe('5 kg')
    expect(withSuffix(BigInt(120), 'kg')).toBe('120 kg')
    expect(withSuffix(BigInt('123456789012345678901234567890'), 'B', { separator: '' })).toBe(
      '123456789012345678901234567890B',
    )
  })
})
