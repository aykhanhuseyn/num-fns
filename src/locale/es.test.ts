import { describe, expect, it } from 'bun:test'
import { es } from './es'
import type { WordChunk } from './types'

/**
 * Builds a `WordChunk` by hand for the `compose`-only tests below, so those
 * stay focused on chunk-joining behavior independent of `renderGroup`
 * (which has its own `describe` block, and is exercised end-to-end via
 * `numberToWords(value, { locale: es })` in `number/words.test.ts`).
 */
function chunk(value: number, words: string, scaleIndex: number, scaleWord: string): WordChunk {
  return { value, words, scaleIndex, scaleWord }
}

describe('es.formatDefaults', () => {
  it('uses period thousands / comma decimal separators', () => {
    expect(es.formatDefaults.thousandsSeparator).toBe('.')
    expect(es.formatDefaults.decimalSeparator).toBe(',')
  })
})

describe('es.words', () => {
  it('carries the zero, negative, and "y" connector words', () => {
    expect(es.words.zero).toBe('cero')
    expect(es.words.negative).toBe('menos')
    expect(es.words.and).toBe('y')
  })

  it('indexes ones, teens, and tens the way numberToWords-style builders expect', () => {
    expect(es.words.ones[1]).toBe('uno')
    expect(es.words.ones[9]).toBe('nueve')
    expect(es.words.teens?.[0]).toBe('once')
    expect(es.words.teens?.[8]).toBe('diecinueve')
    expect(es.words.tens[1]).toBe('diez')
    expect(es.words.tens[9]).toBe('noventa')
  })

  it('gives the full irregular hundreds word per digit 1-9, "ciento" at index 1', () => {
    expect(es.words.hundreds).toEqual([
      '',
      'ciento',
      'doscientos',
      'trescientos',
      'cuatrocientos',
      'quinientos',
      'seiscientos',
      'setecientos',
      'ochocientos',
      'novecientos',
    ])
  })

  it('leaves "mil" invariant but inflects millón/millardo/billón by count', () => {
    expect(es.words.scales[1]).toBe('mil')
    expect(es.words.scales[2]).toEqual({ one: 'millón', other: 'millones' })
    expect(es.words.scales[3]).toEqual({ one: 'millardo', other: 'millardos' })
    expect(es.words.scales[4]).toEqual({ one: 'billón', other: 'billones' })
  })

  it('uses "coma" as the decimalConnector, RAE\'s standard decimal reading (todo.md §2)', () => {
    expect(es.words.decimalConnector).toBe('coma')
  })

  it('declares masculine/feminine (Spanish has no neuter cardinals) with masculine as the default', () => {
    expect(es.words.genders).toEqual(['masculine', 'feminine'])
    expect(es.words.defaultGender).toBe('masculine')
  })

  describe('renderGroup', () => {
    it('joins a tens word (30+) and a nonzero ones digit with "y"', () => {
      expect(es.words.renderGroup(234)).toBe('doscientos treinta y cuatro')
      expect(es.words.renderGroup(35)).toBe('treinta y cinco')
    })

    it('inflects "uno"/"veintiuno" and the "-cientos" hundreds for feminine', () => {
      expect(es.words.renderGroup(1, 'feminine')).toBe('una')
      expect(es.words.renderGroup(21, 'feminine')).toBe('veintiuna')
      expect(es.words.renderGroup(31, 'feminine')).toBe('treinta y una')
      expect(es.words.renderGroup(200, 'feminine')).toBe('doscientas')
      expect(es.words.renderGroup(500, 'feminine')).toBe('quinientas')
      expect(es.words.renderGroup(231, 'feminine')).toBe('doscientas treinta y una')
    })

    it('keeps the invariable words identical under feminine agreement', () => {
      expect(es.words.renderGroup(100, 'feminine')).toBe('ciento')
      expect(es.words.renderGroup(102, 'feminine')).toBe('ciento dos')
      expect(es.words.renderGroup(22, 'feminine')).toBe('veintidós')
      expect(es.words.renderGroup(15, 'feminine')).toBe('quince')
    })

    it('treats explicit masculine as the citation form', () => {
      expect(es.words.renderGroup(1, 'masculine')).toBe('uno')
      expect(es.words.renderGroup(21, 'masculine')).toBe('veintiuno')
      expect(es.words.renderGroup(200, 'masculine')).toBe('doscientos')
    })

    it('contracts 21-29 into a single word instead of using "y"', () => {
      expect(es.words.renderGroup(21)).toBe('veintiuno')
      expect(es.words.renderGroup(22)).toBe('veintidós')
      expect(es.words.renderGroup(23)).toBe('veintitrés')
      expect(es.words.renderGroup(26)).toBe('veintiséis')
      expect(es.words.renderGroup(29)).toBe('veintinueve')
    })

    it('always renders the regular "ciento" hundreds form — "cien" is compose’s job', () => {
      expect(es.words.renderGroup(100)).toBe('ciento')
      expect(es.words.renderGroup(101)).toBe('ciento uno')
      expect(es.words.renderGroup(110)).toBe('ciento diez')
      expect(es.words.renderGroup(199)).toBe('ciento noventa y nueve')
    })

    it('uses the irregular teens, including the accented fused forms', () => {
      expect(es.words.renderGroup(11)).toBe('once')
      expect(es.words.renderGroup(16)).toBe('dieciséis')
      expect(es.words.renderGroup(19)).toBe('diecinueve')
    })

    it('gives the irregular hundreds forms for 500/700/900, not the regular "-cientos" pattern', () => {
      expect(es.words.renderGroup(500)).toBe('quinientos')
      expect(es.words.renderGroup(700)).toBe('setecientos')
      expect(es.words.renderGroup(900)).toBe('novecientos')
    })

    it('never inserts "y" between a hundreds word and the remainder ("quinientos veintiuno", no "y")', () => {
      expect(es.words.renderGroup(521)).toBe('quinientos veintiuno')
    })
  })

  describe('compose', () => {
    it('joins a single group as-is when it has no scale word', () => {
      expect(es.words.compose([chunk(234, 'doscientos treinta y cuatro', 0, '')])).toBe(
        'doscientos treinta y cuatro',
      )
    })

    it('special-cases standalone 100 to "cien", not "ciento"', () => {
      expect(es.words.compose([chunk(100, 'ciento', 0, '')])).toBe('cien')
      expect(es.words.compose([chunk(100, 'ciento', 1, 'mil')])).toBe('cien mil')
      expect(es.words.compose([chunk(100, 'ciento', 2, 'millones')])).toBe('cien millones')
    })

    it('drops "uno" entirely before "mil" ("mil", not "un mil")', () => {
      expect(es.words.compose([chunk(1, 'uno', 1, 'mil')])).toBe('mil')
      expect(es.words.compose([chunk(2, 'dos', 1, 'mil')])).toBe('dos mil')
    })

    it('apocopates a trailing "uno"/"veintiuno" before "mil" ("veintiún mil", not "veintiuno mil")', () => {
      expect(es.words.compose([chunk(21, 'veintiuno', 1, 'mil')])).toBe('veintiún mil')
      expect(es.words.compose([chunk(31, 'treinta y uno', 1, 'mil')])).toBe('treinta y un mil')
      expect(es.words.compose([chunk(101, 'ciento uno', 1, 'mil')])).toBe('ciento un mil')
    })

    it('re-renders the thousands chunk for feminine agreement — "mil" is gender-transparent', () => {
      expect(es.words.compose([chunk(200, 'doscientos', 1, 'mil')], 'feminine')).toBe(
        'doscientas mil',
      )
      // RAE keeps the apocope before "mil" even in feminine agreement.
      expect(es.words.compose([chunk(231, 'doscientos treinta y uno', 1, 'mil')], 'feminine')).toBe(
        'doscientas treinta y un mil',
      )
      expect(es.words.compose([chunk(1, 'uno', 1, 'mil')], 'feminine')).toBe('mil')
    })

    it('keeps chunks before the masculine nouns "millón" and above unaffected by feminine agreement', () => {
      expect(es.words.compose([chunk(200, 'doscientos', 2, 'millones')], 'feminine')).toBe(
        'doscientos millones',
      )
      expect(es.words.compose([chunk(21, 'veintiuno', 2, 'millones')], 'feminine')).toBe(
        'veintiún millones',
      )
      // Same for "millardo" and "billón" — only scaleIndex 1 ("mil") is
      // gender-transparent; every other scale noun is masculine and unaffected.
      expect(es.words.compose([chunk(200, 'doscientos', 3, 'millardos')], 'feminine')).toBe(
        'doscientos millardos',
      )
      expect(es.words.compose([chunk(21, 'veintiuno', 4, 'billones')], 'feminine')).toBe(
        'veintiún billones',
      )
    })

    it('apocopates "uno"/"veintiuno" to "un"/"veintiún" before millón and above', () => {
      expect(es.words.compose([chunk(1, 'uno', 2, 'millón')])).toBe('un millón')
      expect(es.words.compose([chunk(21, 'veintiuno', 2, 'millones')])).toBe('veintiún millones')
      expect(es.words.compose([chunk(31, 'treinta y uno', 2, 'millones')])).toBe(
        'treinta y un millones',
      )
    })

    it('joins multiple chunks largest-scale-first', () => {
      const chunks = [chunk(1, 'uno', 1, 'mil'), chunk(234, 'doscientos treinta y cuatro', 0, '')]
      expect(es.words.compose(chunks)).toBe('mil doscientos treinta y cuatro')
    })

    it('never inserts "y" between chunks, only a space ("mil uno", not "mil y uno")', () => {
      const chunks = [chunk(1, 'uno', 1, 'mil'), chunk(1, 'uno', 0, '')]
      expect(es.words.compose(chunks)).toBe('mil uno')
    })
  })
})

describe('es.plural', () => {
  it('is "one" only for exactly 1 (or -1), "other" otherwise', () => {
    expect(es.plural(1)).toBe('one')
    expect(es.plural(-1)).toBe('one')
    expect(es.plural(0)).toBe('other')
    expect(es.plural(2)).toBe('other')
  })
})

describe('es.ordinal', () => {
  it('suffix is always "º" (nominative masculine singular)', () => {
    for (const value of [1, 2, 3, 21, 100, 1000]) {
      expect(es.ordinal.suffix(value)).toBe('º')
    }
  })

  it('throws for negative or non-integer values', () => {
    expect(() => es.ordinal.suffix(-1)).toThrow(RangeError)
    expect(() => es.ordinal.suffix(1.5)).toThrow(RangeError)
  })

  it('words ordinalizes every token and drops "y", unlike English/Russian', () => {
    expect(es.ordinal.words(3, 'tres')).toBe('tercero')
    expect(es.ordinal.words(10, 'diez')).toBe('décimo')
    expect(es.ordinal.words(20, 'veinte')).toBe('vigésimo')
    expect(es.ordinal.words(21, 'veintiuno')).toBe('vigésimo primero')
    expect(es.ordinal.words(31, 'treinta y uno')).toBe('trigésimo primero')
    expect(es.ordinal.words(100, 'cien')).toBe('centésimo')
    expect(es.ordinal.words(135, 'ciento treinta y cinco')).toBe('centésimo trigésimo quinto')
  })

  it('uses the RAE citation forms "undécimo"/"duodécimo" for 11th/12th, not "decimoprimero"/"decimosegundo"', () => {
    expect(es.ordinal.words(11, 'once')).toBe('undécimo')
    expect(es.ordinal.words(12, 'doce')).toBe('duodécimo')
  })

  describe('words fuses a round multiple of a scale word into one word (todo.md §2)', () => {
    it('fuses "milésimo" for multiples of 1000, omitting a multiplier of exactly 1', () => {
      expect(es.ordinal.words(1000, 'mil')).toBe('milésimo')
      expect(es.ordinal.words(2000, 'dos mil')).toBe('dosmilésimo')
      expect(es.ordinal.words(3000, 'tres mil')).toBe('tresmilésimo')
      expect(es.ordinal.words(10000, 'diez mil')).toBe('diezmilésimo')
      expect(es.ordinal.words(100000, 'cien mil')).toBe('cienmilésimo')
      expect(es.ordinal.words(200000, 'doscientos mil')).toBe('doscientosmilésimo')
      expect(es.ordinal.words(500000, 'quinientos mil')).toBe('quinientosmilésimo')
    })

    it('fuses "millonésimo"/"millardésimo"/"billonésimo" the same way for their scales', () => {
      expect(es.ordinal.words(2e6, 'dos millones')).toBe('dosmillonésimo')
      expect(es.ordinal.words(1e9, 'un millardo')).toBe('millardésimo')
      expect(es.ordinal.words(2e12, 'dos billones')).toBe('dosbillonésimo')
    })

    it('fuses a multi-word multiplier (single apocopated word, or hundreds+tens concatenated)', () => {
      expect(es.ordinal.words(21000, 'veintiún mil')).toBe('veintiunmilésimo')
      expect(es.ordinal.words(250000, 'doscientos cincuenta mil')).toBe(
        'doscientoscincuentamilésimo',
      )
    })

    it('keeps a larger preceding chunk in cardinal form, fusing only the final scale chunk', () => {
      expect(es.ordinal.words(2003000, 'dos millones tres mil')).toBe('dos millones tresmilésimo')
    })

    it('falls back to per-token ordinalization when the multiplier needs the "y" connector (unattested single-word fusion)', () => {
      expect(es.ordinal.words(31000, 'treinta y un mil')).toBe('trigésimo un milésimo')
    })

    it('leaves a number that does not end in a scale word to the existing every-token behavior', () => {
      expect(es.ordinal.words(2001, 'dos mil uno')).toBe('segundo milésimo primero')
    })
  })
})

describe('es.notation', () => {
  it('uses mil/M/MM/B abbreviations largest first', () => {
    const byThreshold = new Map(es.notation.scales.map((s) => [s.threshold, s.short]))
    expect(byThreshold.get(1e3)).toBe('mil')
    expect(byThreshold.get(1e6)).toBe('M')
    expect(byThreshold.get(1e9)).toBe('MM')
    expect(byThreshold.get(1e12)).toBe('B')
  })

  it('pairs each threshold with the matching long scale word', () => {
    const byThreshold = new Map(es.notation.scales.map((s) => [s.threshold, s.long]))
    expect(byThreshold.get(1e6)).toBe('millón')
    expect(byThreshold.get(1e9)).toBe('millardo')
    expect(byThreshold.get(1e12)).toBe('billón')
  })

  it('inserts a space before the short abbreviation', () => {
    expect(es.notation.spaceBeforeShort).toBe(true)
  })
})

describe('es.currency', () => {
  it('defaults to EUR / euro / céntimo, with singular/plural forms', () => {
    expect(es.currency.code).toBe('EUR')
    expect(es.currency.symbolPosition).toBe('after')
    expect(es.currency.units.EUR?.major.plurals).toEqual({ one: 'euro', other: 'euros' })
    expect(es.currency.units.EUR?.minor.plurals).toEqual({ one: 'céntimo', other: 'céntimos' })
  })

  it('gives both euro units masculine gender', () => {
    expect(es.currency.units.EUR?.major.gender).toBe('masculine')
    expect(es.currency.units.EUR?.minor.gender).toBe('masculine')
  })

  it('names the other launch currencies, with "libra" the one feminine unit', () => {
    expect(es.currency.units.USD?.major.plurals).toEqual({ one: 'dólar', other: 'dólares' })
    expect(es.currency.units.USD?.minor.plurals).toEqual({ one: 'centavo', other: 'centavos' })
    expect(es.currency.units.GBP?.major).toEqual({
      word: 'libra',
      plurals: { one: 'libra', other: 'libras' },
      gender: 'feminine',
    })
    expect(es.currency.units.GBP?.minor.plurals).toEqual({ one: 'penique', other: 'peniques' })
    expect(es.currency.units.RUB?.major.plurals).toEqual({ one: 'rublo', other: 'rublos' })
    expect(es.currency.units.AZN?.major.plurals).toEqual({ one: 'manat', other: 'manats' })
    for (const [code, units] of Object.entries(es.currency.units)) {
      if (code !== 'GBP') expect(units.major.gender).toBe('masculine')
      expect(units.minor.gender).toBe('masculine')
    }
  })
})
