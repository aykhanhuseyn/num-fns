import { describe, expect, it } from 'bun:test'
import { fractionToWords } from '../number/fraction'
import { numberToWords } from '../number/words'
import { en } from './en'
import { enGB } from './en-gb'
import type { WordChunk } from './types'

/** Builds a `WordChunk` by hand for the `compose`-only tests, mirroring `en.test.ts`'s helper. */
function chunk(value: number, words: string, scaleIndex: number, scaleWord: string): WordChunk {
  return { value, words, scaleIndex, scaleWord }
}

describe('enGB.formatDefaults', () => {
  it('matches en: comma thousands / period decimal separators', () => {
    expect(enGB.formatDefaults.thousandsSeparator).toBe(',')
    expect(enGB.formatDefaults.decimalSeparator).toBe('.')
  })
})

describe('enGB.words', () => {
  it('carries the same vocabulary as en', () => {
    expect(enGB.words.zero).toBe('zero')
    expect(enGB.words.negative).toBe('negative')
    expect(enGB.words.ones).toEqual(en.words.ones)
    expect(enGB.words.teens).toEqual(en.words.teens)
    expect(enGB.words.tens).toEqual(en.words.tens)
    expect(enGB.words.hundreds).toBe(en.words.hundreds)
    expect(enGB.words.scales).toEqual(en.words.scales)
  })

  describe('renderGroup', () => {
    it('hyphenates a tens+ones pair, same as en', () => {
      expect(enGB.words.renderGroup(21)).toBe('twenty-one')
      expect(enGB.words.renderGroup(99)).toBe('ninety-nine')
    })

    it('uses the irregular teens, same as en', () => {
      expect(enGB.words.renderGroup(11)).toBe('eleven')
      expect(enGB.words.renderGroup(19)).toBe('nineteen')
    })

    it('never drops "one" before "hundred", same as en', () => {
      expect(enGB.words.renderGroup(100)).toBe('one hundred')
    })

    it('inserts "and" between a hundreds word and a nonzero remainder', () => {
      expect(enGB.words.renderGroup(101)).toBe('one hundred and one')
      expect(enGB.words.renderGroup(110)).toBe('one hundred and ten')
      expect(enGB.words.renderGroup(345)).toBe('three hundred and forty-five')
      expect(enGB.words.renderGroup(234)).toBe('two hundred and thirty-four')
    })

    it('never inserts "and" when there is no hundreds digit', () => {
      expect(enGB.words.renderGroup(1)).toBe('one')
      expect(enGB.words.renderGroup(21)).toBe('twenty-one')
    })
  })

  describe('compose', () => {
    it('joins a single group as-is, no "and" (nothing higher to connect to)', () => {
      expect(enGB.words.compose([chunk(21, 'twenty-one', 0, '')])).toBe('twenty-one')
      expect(enGB.words.compose([chunk(234, 'two hundred and thirty-four', 0, '')])).toBe(
        'two hundred and thirty-four',
      )
    })

    it('inserts "and" before a final chunk under 100 when a higher chunk exists', () => {
      const chunks = [chunk(1, 'one', 1, 'thousand'), chunk(1, 'one', 0, '')]
      expect(enGB.words.compose(chunks)).toBe('one thousand and one')
    })

    it('does not insert "and" before a final chunk of 100 or more (it carries its own from renderGroup)', () => {
      const chunks = [
        chunk(1, 'one', 1, 'thousand'),
        chunk(234, 'two hundred and thirty-four', 0, ''),
      ]
      expect(enGB.words.compose(chunks)).toBe('one thousand two hundred and thirty-four')
    })

    it('does not insert "and" before a final chunk of exactly 100 (not "under 100")', () => {
      const chunks = [chunk(1, 'one', 1, 'thousand'), chunk(100, 'one hundred', 0, '')]
      expect(enGB.words.compose(chunks)).toBe('one thousand one hundred')
    })

    it('never drops "one" before a scale word, unlike Azerbaijani "min"', () => {
      expect(enGB.words.compose([chunk(1, 'one', 1, 'thousand')])).toBe('one thousand')
      expect(enGB.words.compose([chunk(1, 'one', 2, 'million')])).toBe('one million')
    })
  })
})

describe('enGB.plural', () => {
  it('is "one" only for exactly 1 (or -1), "other" otherwise, same as en', () => {
    expect(enGB.plural(1)).toBe('one')
    expect(enGB.plural(-1)).toBe('one')
    expect(enGB.plural(0)).toBe('other')
    expect(enGB.plural(2)).toBe('other')
  })
})

describe('enGB.ordinal', () => {
  it('suffix follows st/nd/rd/th with the 11-13 exception, same as en', () => {
    expect(enGB.ordinal.suffix(1)).toBe('st')
    expect(enGB.ordinal.suffix(2)).toBe('nd')
    expect(enGB.ordinal.suffix(3)).toBe('rd')
    expect(enGB.ordinal.suffix(4)).toBe('th')
    expect(enGB.ordinal.suffix(11)).toBe('th')
    expect(enGB.ordinal.suffix(12)).toBe('th')
    expect(enGB.ordinal.suffix(13)).toBe('th')
    expect(enGB.ordinal.suffix(21)).toBe('st')
    expect(enGB.ordinal.suffix(22)).toBe('nd')
    expect(enGB.ordinal.suffix(23)).toBe('rd')
    expect(enGB.ordinal.suffix(101)).toBe('st')
    expect(enGB.ordinal.suffix(111)).toBe('th')
    expect(enGB.ordinal.suffix(112)).toBe('th')
    expect(enGB.ordinal.suffix(113)).toBe('th')
  })

  it('throws for negative or non-integer values', () => {
    expect(() => enGB.ordinal.suffix(-1)).toThrow(RangeError)
    expect(() => enGB.ordinal.suffix(1.5)).toThrow(RangeError)
  })

  it('words transforms only the last token, with "and" flowing through unchanged', () => {
    expect(enGB.ordinal.words(3, 'three')).toBe('third')
    expect(enGB.ordinal.words(4, 'four')).toBe('fourth')
    expect(enGB.ordinal.words(12, 'twelve')).toBe('twelfth')
    expect(enGB.ordinal.words(20, 'twenty')).toBe('twentieth')
    expect(enGB.ordinal.words(21, 'twenty-one')).toBe('twenty-first')
    expect(enGB.ordinal.words(101, 'one hundred and one')).toBe('one hundred and first')
    expect(enGB.ordinal.words(1001, 'one thousand and one')).toBe('one thousand and first')
  })
})

describe('enGB.notation', () => {
  it('matches en: K/M/B/T abbreviations and thousand/million/billion/trillion words', () => {
    expect(enGB.notation.scales).toEqual(en.notation.scales)
    expect(enGB.notation.spaceBeforeShort).toBe(false)
  })
})

describe('enGB.currency', () => {
  it('matches en: USD / dollar / cent, with singular/plural forms', () => {
    expect(enGB.currency).toEqual(en.currency)
  })
})

describe('enGB.fractions', () => {
  it('has an idiomatic word for one half', () => {
    expect(enGB.fractions?.half).toBe('half')
  })

  it('builds <numerator cardinal> <denominator ordinal>, pluralizing with a trailing "s"', () => {
    expect(enGB.fractions?.words(1, 3)).toBe('one third')
    expect(enGB.fractions?.words(2, 3)).toBe('two thirds')
  })

  it('carries "and" through a compound denominator ordinal', () => {
    expect(enGB.fractions?.words(1, 101)).toBe('one one hundred and first')
  })
})

/**
 * The values called out in the enGB design brief: every case where British
 * "and" either does or (just as importantly) does not appear, exercised
 * end-to-end through `numberToWords` rather than `renderGroup`/`compose`
 * directly.
 */
describe('numberToWords({ locale: enGB }) — the "and" cases', () => {
  it.each([
    [21, 'twenty-one'],
    [100, 'one hundred'],
    [101, 'one hundred and one'],
    [110, 'one hundred and ten'],
    [345, 'three hundred and forty-five'],
    [1000, 'one thousand'],
    [1001, 'one thousand and one'],
    [1100, 'one thousand one hundred'],
    [1234, 'one thousand two hundred and thirty-four'],
    [1000000, 'one million'],
    [2000005, 'two million and five'],
  ])('%d -> %s', (value, expected) => {
    expect(numberToWords(value, { locale: enGB })).toBe(expected)
  })
})

/**
 * Byte-difference checks against `en`: the same input should produce
 * identical output when "and" never applies (no hundreds digit anywhere in
 * the reading), and should differ by exactly the "and" convention otherwise.
 */
describe('enGB vs en — byte differences', () => {
  it('is identical to en when no group has both a hundreds digit and a remainder', () => {
    for (const value of [0, 1, 21, 99, 1000, 1000000, 2000000]) {
      expect(numberToWords(value, { locale: enGB })).toBe(numberToWords(value, { locale: en }))
    }
  })

  it('differs from en exactly by the "and" convention otherwise', () => {
    expect(numberToWords(101, { locale: en })).toBe('one hundred one')
    expect(numberToWords(101, { locale: enGB })).toBe('one hundred and one')

    expect(numberToWords(1001, { locale: en })).toBe('one thousand one')
    expect(numberToWords(1001, { locale: enGB })).toBe('one thousand and one')

    expect(numberToWords(1234, { locale: en })).toBe('one thousand two hundred thirty-four')
    expect(numberToWords(1234, { locale: enGB })).toBe('one thousand two hundred and thirty-four')

    expect(numberToWords(2000005, { locale: en })).toBe('two million five')
    expect(numberToWords(2000005, { locale: enGB })).toBe('two million and five')
  })
})

describe('fractionToWords({ locale: enGB })', () => {
  it('resolves the idiomatic half via the fractions hook', () => {
    expect(fractionToWords(1, 2, { locale: enGB })).toBe('half')
  })

  it('composes other fractions the same way en does', () => {
    expect(fractionToWords(1, 3, { locale: enGB })).toBe('one third')
    expect(fractionToWords(2, 3, { locale: enGB })).toBe('two thirds')
  })

  it('throws for improper fractions and mixed numbers, same as every other locale', () => {
    expect(() => fractionToWords(3, 2, { locale: enGB })).toThrow(RangeError)
    expect(() => fractionToWords(0, 2, { locale: enGB })).toThrow(RangeError)
  })
})
