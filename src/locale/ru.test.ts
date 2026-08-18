import { describe, expect, it } from 'bun:test'
import { ru } from './ru'
import type { WordChunk } from './types'

/**
 * Builds a `WordChunk` by hand for the `compose`-only tests below, so those
 * stay focused on chunk-joining behavior independent of `renderGroup`
 * (which has its own `describe` block, and is exercised end-to-end via
 * `numberToWords(value, { locale: ru })` in `number/words.test.ts`).
 */
function chunk(value: number, words: string, scaleIndex: number, scaleWord: string): WordChunk {
  return { value, words, scaleIndex, scaleWord }
}

describe('ru.formatDefaults', () => {
  it('uses space thousands / comma decimal separators', () => {
    expect(ru.formatDefaults.thousandsSeparator).toBe(' ')
    expect(ru.formatDefaults.decimalSeparator).toBe(',')
  })
})

describe('ru.words', () => {
  it('carries the zero and negative words', () => {
    expect(ru.words.zero).toBe('ноль')
    expect(ru.words.negative).toBe('минус')
  })

  it('indexes ones, teens, and tens the way numberToWords-style builders expect', () => {
    expect(ru.words.ones[1]).toBe('один')
    expect(ru.words.ones[9]).toBe('девять')
    expect(ru.words.teens?.[0]).toBe('одиннадцать')
    expect(ru.words.teens?.[8]).toBe('девятнадцать')
    expect(ru.words.tens[1]).toBe('десять')
    expect(ru.words.tens[9]).toBe('девяносто')
  })

  it('gives the full irregular hundreds word per digit 1-9', () => {
    expect(ru.words.hundreds).toEqual([
      '',
      'сто',
      'двести',
      'триста',
      'четыреста',
      'пятьсот',
      'шестьсот',
      'семьсот',
      'восемьсот',
      'девятьсот',
    ])
  })

  it('inflects scale words by plural category', () => {
    expect(ru.words.scales[1]).toEqual({ one: 'тысяча', few: 'тысячи', many: 'тысяч' })
    expect(ru.words.scales[2]).toEqual({ one: 'миллион', few: 'миллиона', many: 'миллионов' })
  })

  describe('renderGroup', () => {
    it('renders the regular masculine form, gender agreement is compose’s job', () => {
      expect(ru.words.renderGroup(234)).toBe('двести тридцать четыре')
      expect(ru.words.renderGroup(1)).toBe('один')
      expect(ru.words.renderGroup(21)).toBe('двадцать один')
    })

    it('uses the irregular teens without touching the trailing digit', () => {
      expect(ru.words.renderGroup(11)).toBe('одиннадцать')
      expect(ru.words.renderGroup(12)).toBe('двенадцать')
    })

    it('uses the full irregular hundreds word', () => {
      expect(ru.words.renderGroup(100)).toBe('сто')
      expect(ru.words.renderGroup(200)).toBe('двести')
    })
  })

  describe('compose', () => {
    it('joins a single group as-is when it has no scale word', () => {
      expect(ru.words.compose([chunk(234, 'двести тридцать четыре', 0, '')])).toBe(
        'двести тридцать четыре',
      )
    })

    it('flips "один"/"два" to feminine before the thousands scale word', () => {
      expect(ru.words.compose([chunk(1, 'один', 1, 'тысяча')])).toBe('одна тысяча')
      expect(ru.words.compose([chunk(2, 'два', 1, 'тысячи')])).toBe('две тысячи')
      expect(ru.words.compose([chunk(21, 'двадцать один', 1, 'тысяча')])).toBe(
        'двадцать одна тысяча',
      )
      expect(ru.words.compose([chunk(32, 'тридцать два', 1, 'тысячи')])).toBe('тридцать две тысячи')
    })

    it('keeps "один"/"два" masculine before million and above', () => {
      expect(ru.words.compose([chunk(1, 'один', 2, 'миллион')])).toBe('один миллион')
      expect(ru.words.compose([chunk(2, 'два', 2, 'миллиона')])).toBe('два миллиона')
      expect(ru.words.compose([chunk(21, 'двадцать один', 2, 'миллион')])).toBe(
        'двадцать один миллион',
      )
    })

    it('does not touch teens ending in "-надцать" even though they contain "два"/"один"-like sounds', () => {
      expect(ru.words.compose([chunk(11, 'одиннадцать', 1, 'тысяч')])).toBe('одиннадцать тысяч')
      expect(ru.words.compose([chunk(12, 'двенадцать', 1, 'тысяч')])).toBe('двенадцать тысяч')
    })

    it('joins multiple chunks largest-scale-first', () => {
      const chunks = [chunk(1, 'один', 1, 'тысяча'), chunk(234, 'двести тридцать четыре', 0, '')]
      expect(ru.words.compose(chunks)).toBe('одна тысяча двести тридцать четыре')
    })
  })
})

describe('ru.plural', () => {
  it('picks "one" for ..1 except ..11', () => {
    expect(ru.plural(1)).toBe('one')
    expect(ru.plural(21)).toBe('one')
    expect(ru.plural(101)).toBe('one')
    expect(ru.plural(11)).toBe('many')
  })

  it('picks "few" for ..2-4 except ..12-14', () => {
    expect(ru.plural(2)).toBe('few')
    expect(ru.plural(3)).toBe('few')
    expect(ru.plural(4)).toBe('few')
    expect(ru.plural(22)).toBe('few')
    expect(ru.plural(12)).toBe('many')
    expect(ru.plural(13)).toBe('many')
    expect(ru.plural(14)).toBe('many')
  })

  it('picks "many" otherwise, and "other" for non-integers', () => {
    expect(ru.plural(0)).toBe('many')
    expect(ru.plural(5)).toBe('many')
    expect(ru.plural(100)).toBe('many')
    expect(ru.plural(1.5)).toBe('other')
  })
})

describe('ru.ordinal', () => {
  it('suffix is always "й" (nominative masculine singular)', () => {
    for (const value of [1, 2, 3, 21, 100, 1000]) {
      expect(ru.ordinal.suffix(value)).toBe('й')
    }
  })

  it('throws for negative or non-integer values', () => {
    expect(() => ru.ordinal.suffix(-1)).toThrow(RangeError)
    expect(() => ru.ordinal.suffix(1.5)).toThrow(RangeError)
  })

  it('words replaces only the trailing word of the cardinal reading', () => {
    expect(ru.ordinal.words(3, 'три')).toBe('третий')
    expect(ru.ordinal.words(5, 'пять')).toBe('пятый')
    expect(ru.ordinal.words(20, 'двадцать')).toBe('двадцатый')
    expect(ru.ordinal.words(21, 'двадцать один')).toBe('двадцать первый')
    expect(ru.ordinal.words(50, 'пятьдесят')).toBe('пятидесятый')
    expect(ru.ordinal.words(100, 'сто')).toBe('сотый')
    expect(ru.ordinal.words(1000, 'тысяча')).toBe('тысячный')
    expect(ru.ordinal.words(0, 'ноль')).toBe('нулевой')
  })
})

describe('ru.notation', () => {
  it('uses тыс/млн/млрд/трлн abbreviations largest first', () => {
    const byThreshold = new Map(ru.notation.scales.map((s) => [s.threshold, s.short]))
    expect(byThreshold.get(1e3)).toBe('тыс')
    expect(byThreshold.get(1e6)).toBe('млн')
    expect(byThreshold.get(1e9)).toBe('млрд')
    expect(byThreshold.get(1e12)).toBe('трлн')
  })

  it('pairs each threshold with the singular long scale word', () => {
    const byThreshold = new Map(ru.notation.scales.map((s) => [s.threshold, s.long]))
    expect(byThreshold.get(1e3)).toBe('тысяча')
    expect(byThreshold.get(1e9)).toBe('миллиард')
  })

  it('inserts a space before the short abbreviation', () => {
    expect(ru.notation.spaceBeforeShort).toBe(true)
  })
})

describe('ru.currency', () => {
  it('defaults to RUB / рубль / копейка, with one/few/many forms', () => {
    expect(ru.currency.code).toBe('RUB')
    expect(ru.currency.symbol).toBe('₽')
    expect(ru.currency.symbolPosition).toBe('after')
    expect(ru.currency.major.plurals).toEqual({ one: 'рубль', few: 'рубля', many: 'рублей' })
    expect(ru.currency.minor.plurals).toEqual({ one: 'копейка', few: 'копейки', many: 'копеек' })
  })
})
