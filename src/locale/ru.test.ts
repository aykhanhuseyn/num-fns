import { describe, expect, it } from 'bun:test'
import { ordinalToWords } from '../number/suffix'
import { numberToWords } from '../number/words'
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

  it('declares all three grammatical genders with masculine as the default', () => {
    expect(ru.words.genders).toEqual(['masculine', 'feminine', 'neuter'])
    expect(ru.words.defaultGender).toBe('masculine')
  })

  it('names the decimal comma with "запятая", the standard spoken reading (`todo.md` §2)', () => {
    expect(ru.words.decimalConnector).toBe('запятая')
    expect(numberToWords(12.34, { locale: ru })).toBe('двенадцать запятая тридцать четыре')
    expect(numberToWords(0.5, { locale: ru })).toBe('ноль запятая пятьдесят')
    expect(numberToWords(-3.7, { locale: ru })).toBe('минус три запятая семьдесят')
  })

  describe('renderGroup', () => {
    it('renders the regular masculine form, gender agreement is compose’s job', () => {
      expect(ru.words.renderGroup(234)).toBe('двести тридцать четыре')
      expect(ru.words.renderGroup(1)).toBe('один')
      expect(ru.words.renderGroup(21)).toBe('двадцать один')
    })

    it('inflects a trailing "один"/"два" by the requested gender', () => {
      expect(ru.words.renderGroup(1, 'feminine')).toBe('одна')
      expect(ru.words.renderGroup(1, 'neuter')).toBe('одно')
      expect(ru.words.renderGroup(2, 'feminine')).toBe('две')
      expect(ru.words.renderGroup(21, 'feminine')).toBe('двадцать одна')
      expect(ru.words.renderGroup(32, 'feminine')).toBe('тридцать две')
      expect(ru.words.renderGroup(21, 'neuter')).toBe('двадцать одно')
      expect(ru.words.renderGroup(231, 'feminine')).toBe('двести тридцать одна')
    })

    it('treats explicit masculine as the citation form, and keeps neuter "два"', () => {
      expect(ru.words.renderGroup(1, 'masculine')).toBe('один')
      expect(ru.words.renderGroup(2, 'masculine')).toBe('два')
      expect(ru.words.renderGroup(2, 'neuter')).toBe('два')
      expect(ru.words.renderGroup(5, 'feminine')).toBe('пять')
    })

    it('leaves the irregular teens untouched by gender ("одиннадцать", not "*однанадцать")', () => {
      expect(ru.words.renderGroup(11, 'feminine')).toBe('одиннадцать')
      expect(ru.words.renderGroup(12, 'neuter')).toBe('двенадцать')
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

    it('ignores the requested gender — scale-bound chunks agree with the scale noun itself', () => {
      expect(ru.words.compose([chunk(21, 'двадцать один', 1, 'тысяча')], 'neuter')).toBe(
        'двадцать одна тысяча',
      )
      expect(ru.words.compose([chunk(1, 'один', 2, 'миллион')], 'feminine')).toBe('один миллион')
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

  it('derives a best-effort -ый form for a trailing word outside the table', () => {
    // Unreachable through `numberToWords(value, { locale: ru })` — every word
    // it can produce is in the ordinal table — but `ordinal.words` takes an
    // arbitrary string, so the fallback is public behavior. The results below
    // are deliberately not idiomatic Russian: the fallback exists so an
    // unknown word degrades to something inflected rather than throwing.
    expect(ru.ordinal.words(0, 'нуль')).toBe('нулый')
    expect(ru.ordinal.words(0, 'нечто')).toBe('нечтый')
    expect(ru.ordinal.words(0, 'сто нечта')).toBe('сто нечтаый')
  })
})

describe('numberToWords(value, { locale: ru }) — full plural-category conformance', () => {
  // Each block below walks the ..1 / ..2-4 / ..5-0,11-14 boundary that
  // `ruPlural` implements, through the real numberToWords pipeline (not
  // hand-built chunks) so the plural-category selection, renderGroup, and
  // compose's "одна"/"две" agreement are all exercised together.
  it('agrees тысяча/тысячи/тысяч across the boundary, including a teen count', () => {
    expect(numberToWords(1000, { locale: ru })).toBe('одна тысяча')
    expect(numberToWords(2000, { locale: ru })).toBe('две тысячи')
    expect(numberToWords(5000, { locale: ru })).toBe('пять тысяч')
    expect(numberToWords(11000, { locale: ru })).toBe('одиннадцать тысяч')
    expect(numberToWords(21000, { locale: ru })).toBe('двадцать одна тысяча')
    expect(numberToWords(22000, { locale: ru })).toBe('двадцать две тысячи')
    expect(numberToWords(25000, { locale: ru })).toBe('двадцать пять тысяч')
    expect(numberToWords(111000, { locale: ru })).toBe('сто одиннадцать тысяч')
  })

  it('agrees миллион/миллиона/миллионов across the same boundary', () => {
    expect(numberToWords(1e6, { locale: ru })).toBe('один миллион')
    expect(numberToWords(2e6, { locale: ru })).toBe('два миллиона')
    expect(numberToWords(5e6, { locale: ru })).toBe('пять миллионов')
    expect(numberToWords(11e6, { locale: ru })).toBe('одиннадцать миллионов')
    expect(numberToWords(21e6, { locale: ru })).toBe('двадцать один миллион')
  })

  it('agrees миллиард/миллиарда/миллиардов across the same boundary', () => {
    expect(numberToWords(1e9, { locale: ru })).toBe('один миллиард')
    expect(numberToWords(2e9, { locale: ru })).toBe('два миллиарда')
    expect(numberToWords(5e9, { locale: ru })).toBe('пять миллиардов')
  })

  it('agrees триллион/триллиона/триллионов across the same boundary', () => {
    expect(numberToWords(1e12, { locale: ru })).toBe('один триллион')
    expect(numberToWords(2e12, { locale: ru })).toBe('два триллиона')
    expect(numberToWords(5e12, { locale: ru })).toBe('пять триллионов')
  })

  it('resolves each group’s plural category independently in a mixed-magnitude number', () => {
    expect(numberToWords(1234567, { locale: ru })).toBe(
      'один миллион двести тридцать четыре тысячи пятьсот шестьдесят семь',
    )
  })
})

describe('numberToWords(value, { locale: ru }) — irregular teens/tens/hundreds sanity', () => {
  it('spells 11-14 as the irregular teens, not a compound', () => {
    expect(numberToWords(11, { locale: ru })).toBe('одиннадцать')
    expect(numberToWords(12, { locale: ru })).toBe('двенадцать')
    expect(numberToWords(13, { locale: ru })).toBe('тринадцать')
    expect(numberToWords(14, { locale: ru })).toBe('четырнадцать')
  })

  it('spells 40 and 90 as the irregular tens words', () => {
    expect(numberToWords(40, { locale: ru })).toBe('сорок')
    expect(numberToWords(90, { locale: ru })).toBe('девяносто')
  })

  it('spells the round hundreds as single irregular words', () => {
    expect(numberToWords(100, { locale: ru })).toBe('сто')
    expect(numberToWords(200, { locale: ru })).toBe('двести')
    expect(numberToWords(300, { locale: ru })).toBe('триста')
    expect(numberToWords(500, { locale: ru })).toBe('пятьсот')
  })
})

describe('ordinalToWords(value, { locale: ru })', () => {
  it('pins the v1-scoped nominative masculine singular forms', () => {
    expect(ordinalToWords(1, { locale: ru })).toBe('первый')
    expect(ordinalToWords(2, { locale: ru })).toBe('второй')
    expect(ordinalToWords(3, { locale: ru })).toBe('третий')
    expect(ordinalToWords(8, { locale: ru })).toBe('восьмой')
    expect(ordinalToWords(21, { locale: ru })).toBe('двадцать первый')
    expect(ordinalToWords(40, { locale: ru })).toBe('сороковой')
    expect(ordinalToWords(100, { locale: ru })).toBe('сотый')
  })

  // Fixed 2026-08-22 (`todo.md` §2): a scale-bound cardinal reading now
  // fuses into the correct Russian compound ordinal ("тысячный",
  // "двухтысячный") instead of leaving the leading count as a separate
  // cardinal word before an ordinalized scale word ("одна тысячный", "две
  // тысячный" — the previously pinned, linguistically wrong output).
  it('fuses a round-scale cardinal reading into a single compound ordinal', () => {
    expect(ordinalToWords(1000, { locale: ru })).toBe('тысячный')
    expect(ordinalToWords(2000, { locale: ru })).toBe('двухтысячный')
    expect(ordinalToWords(3000, { locale: ru })).toBe('трёхтысячный')
    expect(ordinalToWords(5000, { locale: ru })).toBe('пятитысячный')
    expect(ordinalToWords(11000, { locale: ru })).toBe('одиннадцатитысячный')
    expect(ordinalToWords(12000, { locale: ru })).toBe('двенадцатитысячный')
    expect(ordinalToWords(21000, { locale: ru })).toBe('двадцатиоднотысячный')
    expect(ordinalToWords(25000, { locale: ru })).toBe('двадцатипятитысячный')
    expect(ordinalToWords(100000, { locale: ru })).toBe('стотысячный')
    expect(ordinalToWords(250000, { locale: ru })).toBe('двухсотпятидесятитысячный')
    expect(ordinalToWords(1e6, { locale: ru })).toBe('миллионный')
    expect(ordinalToWords(2e6, { locale: ru })).toBe('двухмиллионный')
    expect(ordinalToWords(1e9, { locale: ru })).toBe('миллиардный')
    expect(ordinalToWords(3e9, { locale: ru })).toBe('трёхмиллиардный')
    expect(ordinalToWords(1e12, { locale: ru })).toBe('триллионный')
    expect(ordinalToWords(2500000, { locale: ru })).toBe('два миллиона пятисоттысячный')
  })

  it('leaves a non-round-scale reading unfused — the fix only touches trailing scale words', () => {
    expect(ordinalToWords(2001, { locale: ru })).toBe('две тысячи первый')
    expect(ordinalToWords(21, { locale: ru })).toBe('двадцать первый')
  })

  it('does not fuse for a placeholder NaN value (cardinalToOrdinalWords convenience path)', () => {
    // `fuseRoundScaleOrdinal` requires a real integer `value`; `NaN` falls
    // straight through to the ORDINAL_WORDS lookup on the trailing word.
    expect(ru.ordinal.words(Number.NaN, 'тысяча')).toBe('тысячный')
    expect(ru.ordinal.words(Number.NaN, 'две тысячи')).toBe('две тысячный')
  })

  it('falls back to the plain last-word transform beyond this locale’s scale vocabulary', () => {
    // 10^15 sits one scale group past "триллион" — `fuseRoundScaleOrdinal`
    // recognizes the reading ends in a scale-bound chunk but has no ordinal
    // stem for it, so it defers to the ordinary trailing-word transform.
    expect(ru.ordinal.words(1e15, 'квадриллион')).toBe('квадриллионый')
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

  it('gives the major unit masculine gender and the minor unit feminine gender', () => {
    // "рубль" agrees masculine ("один рубль"); "копейка" agrees feminine
    // ("одна копейка", "две копейки") — the mismatch this field exists to fix.
    expect(ru.currency.major.gender).toBe('masculine')
    expect(ru.currency.minor.gender).toBe('feminine')
  })
})
