import { describe, expect, it } from 'bun:test'
import { es } from './es'
import type { WordChunk } from './types'

/**
 * Builds a `WordChunk` by hand — `es` isn't wired into any public function
 * yet (`todo.md` §1), so there's no existing `numberToWords` to derive
 * `words` from. The per-group cardinal reading is supplied directly.
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
    })

    it('drops "uno" entirely before "mil" ("mil", not "un mil")', () => {
      expect(es.words.compose([chunk(1, 'uno', 1, 'mil')])).toBe('mil')
      expect(es.words.compose([chunk(2, 'dos', 1, 'mil')])).toBe('dos mil')
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
    expect(es.currency.symbol).toBe('€')
    expect(es.currency.symbolPosition).toBe('after')
    expect(es.currency.major.plurals).toEqual({ one: 'euro', other: 'euros' })
    expect(es.currency.minor.plurals).toEqual({ one: 'céntimo', other: 'céntimos' })
  })
})
