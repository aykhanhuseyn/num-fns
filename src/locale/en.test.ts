import { describe, expect, it } from 'bun:test'
import { en } from './en'
import type { WordChunk } from './types'

/**
 * Builds a `WordChunk` by hand for the `compose`-only tests below, so those
 * stay focused on chunk-joining behavior independent of `renderGroup`
 * (which has its own `describe` block, and is exercised end-to-end via
 * `numberToWords(value, { locale: en })` in `number/words.test.ts`).
 */
function chunk(value: number, words: string, scaleIndex: number, scaleWord: string): WordChunk {
  return { value, words, scaleIndex, scaleWord }
}

describe('en.formatDefaults', () => {
  it('uses comma thousands / period decimal separators', () => {
    expect(en.formatDefaults.thousandsSeparator).toBe(',')
    expect(en.formatDefaults.decimalSeparator).toBe('.')
  })
})

describe('en.words', () => {
  it('carries the zero and negative words', () => {
    expect(en.words.zero).toBe('zero')
    expect(en.words.negative).toBe('negative')
  })

  it('indexes ones, teens, and tens the way numberToWords-style builders expect', () => {
    expect(en.words.ones[1]).toBe('one')
    expect(en.words.ones[9]).toBe('nine')
    expect(en.words.teens?.[0]).toBe('eleven')
    expect(en.words.teens?.[8]).toBe('nineteen')
    expect(en.words.tens[1]).toBe('ten')
    expect(en.words.tens[9]).toBe('ninety')
  })

  it('uses a single reusable hundreds word', () => {
    expect(en.words.hundreds).toBe('hundred')
  })

  it('lists short-scale words, largest last', () => {
    expect(en.words.scales).toEqual(['', 'thousand', 'million', 'billion', 'trillion'])
  })

  describe('renderGroup', () => {
    it('hyphenates a tens+ones pair', () => {
      expect(en.words.renderGroup(21)).toBe('twenty-one')
      expect(en.words.renderGroup(99)).toBe('ninety-nine')
    })

    it('never drops "one" before "hundred"', () => {
      expect(en.words.renderGroup(100)).toBe('one hundred')
      expect(en.words.renderGroup(101)).toBe('one hundred one')
    })

    it('uses the irregular teens', () => {
      expect(en.words.renderGroup(11)).toBe('eleven')
      expect(en.words.renderGroup(19)).toBe('nineteen')
    })

    it('matches the hand-built chunk used by the compose tests below', () => {
      expect(en.words.renderGroup(234)).toBe('two hundred thirty-four')
    })
  })

  describe('compose', () => {
    it('joins a single group as-is', () => {
      expect(en.words.compose([chunk(234, 'two hundred thirty-four', 0, '')])).toBe(
        'two hundred thirty-four',
      )
    })

    it('never drops "one" before a scale word, unlike Azerbaijani "min"', () => {
      expect(en.words.compose([chunk(1, 'one', 1, 'thousand')])).toBe('one thousand')
      expect(en.words.compose([chunk(2, 'two', 1, 'thousand')])).toBe('two thousand')
      expect(en.words.compose([chunk(1, 'one', 2, 'million')])).toBe('one million')
    })

    it('joins multiple chunks largest-scale-first', () => {
      const chunks = [chunk(1, 'one', 1, 'thousand'), chunk(234, 'two hundred thirty-four', 0, '')]
      expect(en.words.compose(chunks)).toBe('one thousand two hundred thirty-four')
    })
  })
})

describe('en.plural', () => {
  it('is "one" only for exactly 1 (or -1), "other" otherwise', () => {
    expect(en.plural(1)).toBe('one')
    expect(en.plural(-1)).toBe('one')
    expect(en.plural(0)).toBe('other')
    expect(en.plural(2)).toBe('other')
    expect(en.plural(1.5)).toBe('other')
  })
})

describe('en.ordinal', () => {
  it('suffix follows st/nd/rd/th with the 11-13 exception', () => {
    expect(en.ordinal.suffix(1)).toBe('st')
    expect(en.ordinal.suffix(2)).toBe('nd')
    expect(en.ordinal.suffix(3)).toBe('rd')
    expect(en.ordinal.suffix(4)).toBe('th')
    expect(en.ordinal.suffix(11)).toBe('th')
    expect(en.ordinal.suffix(12)).toBe('th')
    expect(en.ordinal.suffix(13)).toBe('th')
    expect(en.ordinal.suffix(21)).toBe('st')
    expect(en.ordinal.suffix(22)).toBe('nd')
    expect(en.ordinal.suffix(23)).toBe('rd')
    expect(en.ordinal.suffix(101)).toBe('st')
    expect(en.ordinal.suffix(111)).toBe('th')
  })

  it('throws for negative or non-integer values', () => {
    expect(() => en.ordinal.suffix(-1)).toThrow(RangeError)
    expect(() => en.ordinal.suffix(1.5)).toThrow(RangeError)
  })

  it('words transforms only the last token of the cardinal reading', () => {
    expect(en.ordinal.words(3, 'three')).toBe('third')
    expect(en.ordinal.words(12, 'twelve')).toBe('twelfth')
    expect(en.ordinal.words(20, 'twenty')).toBe('twentieth')
    expect(en.ordinal.words(90, 'ninety')).toBe('ninetieth')
    expect(en.ordinal.words(21, 'twenty-one')).toBe('twenty-first')
    expect(en.ordinal.words(100, 'one hundred')).toBe('one hundredth')
    expect(en.ordinal.words(101, 'one hundred one')).toBe('one hundred first')
    expect(en.ordinal.words(1000, 'one thousand')).toBe('one thousandth')
  })
})

describe('en.notation', () => {
  it('uses K/M/B/T abbreviations largest first', () => {
    const byThreshold = new Map(en.notation.scales.map((s) => [s.threshold, s.short]))
    expect(byThreshold.get(1e3)).toBe('K')
    expect(byThreshold.get(1e6)).toBe('M')
    expect(byThreshold.get(1e9)).toBe('B')
    expect(byThreshold.get(1e12)).toBe('T')
  })

  it('pairs each threshold with the matching long scale word', () => {
    const byThreshold = new Map(en.notation.scales.map((s) => [s.threshold, s.long]))
    expect(byThreshold.get(1e3)).toBe('thousand')
    expect(byThreshold.get(1e6)).toBe('million')
    expect(byThreshold.get(1e9)).toBe('billion')
    expect(byThreshold.get(1e12)).toBe('trillion')
  })

  it('does not insert a space before the short abbreviation', () => {
    expect(en.notation.spaceBeforeShort).toBe(false)
  })
})

describe('en.currency', () => {
  it('defaults to USD / dollar / cent, with singular/plural forms', () => {
    expect(en.currency.code).toBe('USD')
    expect(en.currency.symbol).toBe('$')
    expect(en.currency.symbolPosition).toBe('before')
    expect(en.currency.major.word).toBe('dollar')
    expect(en.currency.major.plurals?.one).toBe('dollar')
    expect(en.currency.major.plurals?.other).toBe('dollars')
    expect(en.currency.minor.word).toBe('cent')
    expect(en.currency.minor.plurals?.one).toBe('cent')
    expect(en.currency.minor.plurals?.other).toBe('cents')
  })
})
