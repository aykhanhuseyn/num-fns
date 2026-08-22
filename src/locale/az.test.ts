import { describe, expect, it } from 'bun:test'
import { formatMoney } from '../money/format'
import { formatNumber } from '../number/format'
import { fractionToWords } from '../number/fraction'
import { toLongNotation, toShortNotation } from '../number/notation'
import { getOrdinalSuffix, ordinalToWords } from '../number/suffix'
import { numberToWords } from '../number/words'
import { az } from './az'
import type { WordChunk } from './types'

/** Builds a `WordChunk` the way the chunk builder in `number/words.ts` does: `words` is the
 * group's own 0-999 cardinal reading, which for a bare 1-999 value is exactly what
 * `numberToWords(value, { locale: az })` already produces. */
function chunk(value: number, scaleIndex: number, scaleWord: string): WordChunk {
  return { value, words: numberToWords(value, { locale: az }), scaleIndex, scaleWord }
}

describe('az.formatDefaults', () => {
  it('matches the space/comma defaults formatNumber falls back to with { locale: az }', () => {
    expect(az.formatDefaults.thousandsSeparator).toBe(' ')
    expect(az.formatDefaults.decimalSeparator).toBe(',')
    expect(formatNumber(1234567.89, { locale: az })).toBe(
      `1${az.formatDefaults.thousandsSeparator}234${az.formatDefaults.thousandsSeparator}567${az.formatDefaults.decimalSeparator}89`,
    )
  })
})

describe('az.words', () => {
  it('carries the zero, negative, and decimal-connector words unchanged', () => {
    expect(az.words.zero).toBe('sıfır')
    expect(az.words.negative).toBe('mənfi')
    expect(az.words.decimalConnector).toBe('tam')
  })

  it('indexes ones and tens the same way numberToWords does (index 0 unused)', () => {
    expect(az.words.ones[1]).toBe('bir')
    expect(az.words.ones[9]).toBe('doqquz')
    expect(az.words.tens[1]).toBe('on')
    expect(az.words.tens[9]).toBe('doxsan')
  })

  it('uses a single reusable hundreds word', () => {
    expect(az.words.hundreds).toBe('yüz')
  })

  it('mirrors SCALE_WORDS for the scale list', () => {
    expect(az.words.scales).toEqual(['', 'min', 'milyon', 'milyard', 'trilyon'])
  })

  describe('renderGroup', () => {
    it('matches numberToWords for a bare 0-999 value', () => {
      expect(az.words.renderGroup(234)).toBe(numberToWords(234, { locale: az }))
      expect(az.words.renderGroup(1)).toBe(numberToWords(1, { locale: az }))
      expect(az.words.renderGroup(100)).toBe(numberToWords(100, { locale: az }))
    })
  })

  describe('compose', () => {
    it('reproduces numberToWords for a single group', () => {
      const chunks = [chunk(234, 0, '')]
      expect(az.words.compose(chunks)).toBe(numberToWords(234, { locale: az }))
    })

    it('drops "bir" before "min" but keeps it before "milyon", matching numberToWords', () => {
      expect(az.words.compose([chunk(1, 1, 'min')])).toBe(numberToWords(1000, { locale: az }))
      expect(az.words.compose([chunk(2, 1, 'min')])).toBe(numberToWords(2000, { locale: az }))
      expect(az.words.compose([chunk(1, 2, 'milyon')])).toBe(numberToWords(1000000, { locale: az }))
    })

    it('joins multiple chunks largest-scale-first, matching numberToWords', () => {
      const chunks = [chunk(1, 1, 'min'), chunk(234, 0, '')]
      expect(az.words.compose(chunks)).toBe(numberToWords(1234, { locale: az }))

      const millionChunks = [chunk(1, 2, 'milyon'), chunk(234, 1, 'min'), chunk(567, 0, '')]
      expect(az.words.compose(millionChunks)).toBe(numberToWords(1234567, { locale: az }))
    })
  })
})

describe('az.plural', () => {
  it('always returns "other" — Azerbaijani never inflects by count', () => {
    expect(az.plural(0)).toBe('other')
    expect(az.plural(1)).toBe('other')
    expect(az.plural(11)).toBe('other')
    expect(az.plural(1000000)).toBe('other')
  })
})

describe('az.ordinal', () => {
  it('suffix matches getOrdinalSuffix', () => {
    for (const value of [1, 3, 5, 9, 20, 100, 1000, 1000000]) {
      expect(az.ordinal.suffix(value)).toBe(getOrdinalSuffix(value, { locale: az }))
    }
  })

  it('words matches ordinalToWords when given the matching cardinal reading', () => {
    for (const value of [0, 1, 3, 21, 30, 100, 1000, 1000000]) {
      expect(az.ordinal.words(value, numberToWords(value, { locale: az }))).toBe(
        ordinalToWords(value, { locale: az }),
      )
    }
  })

  it('throws when the cardinal reading has no vowel to harmonize against', () => {
    // Vowel harmony has nothing to key off. Unreachable via `ordinalToWords`
    // (every Azerbaijani number word contains a vowel), but `ordinal.words`
    // accepts any string, so it fails loudly rather than guessing a suffix.
    expect(() => az.ordinal.words(1, 'sfr')).toThrow(SyntaxError)
  })
})

describe('az.notation', () => {
  it('mirrors the short-scale thresholds/abbreviations toShortNotation uses', () => {
    const byThreshold = new Map(az.notation.scales.map((s) => [s.threshold, s.short]))
    expect(byThreshold.get(1e3)).toBe('min')
    expect(byThreshold.get(1e6)).toBe('mln')
    expect(byThreshold.get(1e9)).toBe('mlrd')
    expect(byThreshold.get(1e12)).toBe('trln')

    for (const { threshold, short } of az.notation.scales) {
      expect(toShortNotation(threshold, { locale: az })).toBe(`1 ${short}`)
    }
  })

  it('pairs each threshold with the SCALE_WORDS long form toLongNotation uses', () => {
    for (const { threshold, long } of az.notation.scales) {
      expect(toLongNotation(threshold, { locale: az })).toBe(`1 ${long}`)
    }
  })

  it('inserts a space before the short abbreviation, like toShortNotation', () => {
    expect(az.notation.spaceBeforeShort).toBe(true)
  })
})

describe('az.currency', () => {
  it('defaults to AZN / manat / qəpik, matching formatMoney', () => {
    expect(az.currency.code).toBe('AZN')
    expect(az.currency.symbol).toBe('₼')
    expect(az.currency.symbolPosition).toBe('after')
    expect(az.currency.major.word).toBe('manat')
    expect(az.currency.minor.word).toBe('qəpik')
    // az has no grammatical gender (`az.words.genders` is unset), so its
    // currency units must not declare one either.
    expect(az.currency.major.gender).toBeUndefined()
    expect(az.currency.minor.gender).toBeUndefined()
    expect(formatMoney(10, { locale: az })).toBe(`10,00 ${az.currency.symbol}`)
  })
})

describe('az.fractions', () => {
  it('exposes "yarım" as the idiomatic half, matching fractionToWords', () => {
    expect(az.fractions?.half).toBe('yarım')
    expect(fractionToWords(1, 2, { locale: az })).toBe('yarım')
  })

  it("derives two-way back/front locative harmony from the denominator's own cardinal reading (via numberToWords), matching fractionToWords", () => {
    // number/fraction.test.ts already pins üçdə/dörddə/onda/yüzdə/yarım; these
    // two denominators aren't covered there: "altı" (back vowel ı -> "-da")
    // and the bare scale word "min" (front vowel i -> "-də"), confirming the
    // harmony reads off whatever numberToWords(denominator, { locale: az })
    // actually produces rather than a separate, potentially stale, word list.
    for (const [numerator, denominator, expected] of [
      [1, 6, 'altıda bir'],
      [1, 1000, 'mində bir'],
    ] as const) {
      expect(az.fractions?.words(numerator, denominator)).toBe(expected)
      expect(fractionToWords(numerator, denominator, { locale: az })).toBe(expected)
    }
  })
})
