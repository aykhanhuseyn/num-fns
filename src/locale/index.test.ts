import { describe, expect, it } from 'bun:test'
import { toLongNotation } from '../number/notation'
import { numberToWords, resolveScaleWord } from '../number/words'
import { az } from './az'
import { en } from './en'
import { es } from './es'
import * as locales from './index'
import { ru } from './ru'

/**
 * `num-fns/locale` is its own package subpath (and its own Vite entry), so the
 * set of locales it re-exports is public surface in the same way the package
 * root's function list is. Adding a locale means adding it here, plus a
 * `./locale/<code>` entry in both `package.json`'s `exports` and
 * `vite.config.ts`'s `build.lib.entry`.
 */
const LAUNCH_LOCALES = ['az', 'en', 'es', 'ru'] as const

describe('locale barrel', () => {
  it('exports exactly the launch locales', () => {
    expect(Object.keys(locales).sort()).toEqual([...LAUNCH_LOCALES])
  })

  it('gives every locale a code matching its export name and a display name', () => {
    for (const [name, locale] of Object.entries(locales)) {
      expect(locale.code).toBe(name)
      // `Locale.name` is optional in the interface; every launch locale sets it.
      expect(typeof locale.name).toBe('string')
      expect(locale.name).not.toBe('')
    }
  })
})

/**
 * Locks down the `todo.md` §1 "Scale naming" decision: short scale
 * (billion = 1e9) vs long scale (milliard) is a **per-locale** property of
 * `Locale.words.scales` / `Locale.notation.scales`, never a global switch.
 * `en` uses the short-scale "billion"/"trillion" pair; `az`/`ru` keep the
 * same short-scale group-of-three progression but name the 1e9 position
 * "milyard"/"миллиард" (the long-scale-derived word); `es` diverges furthest
 * and names *both* 1e9 ("millardo") and 1e12 ("billón" — the traditional
 * long-scale word for 10^12, not English's 1e9 "billion") differently from
 * `en`. Each locale owns its own vocabulary at each magnitude independently
 * rather than deriving it from one short/long toggle, which is what the
 * decision text in `todo.md` requires.
 */
describe('scale naming (todo.md §1 decision: per-locale, not global)', () => {
  it('en uses the short-scale billion/trillion pair at 1e9/1e12', () => {
    expect(en.words.scales[3]).toBe('billion')
    expect(en.words.scales[4]).toBe('trillion')
    expect(numberToWords(1e9, { locale: en })).toBe('one billion')
    expect(numberToWords(1e12, { locale: en })).toBe('one trillion')
  })

  it('az names 1e9 "milyard" (long-scale-derived) but keeps the short-scale progression at 1e12 ("trilyon")', () => {
    expect(az.words.scales[3]).toBe('milyard')
    expect(az.words.scales[4]).toBe('trilyon')
    expect(numberToWords(1e9, { locale: az })).toBe('bir milyard')
    expect(numberToWords(1e12, { locale: az })).toBe('bir trilyon')
  })

  it('ru names 1e9 "миллиард" (long-scale-derived) but keeps the short-scale progression at 1e12 ("триллион")', () => {
    expect(resolveScaleWord(ru.words.scales[3] as (typeof ru.words.scales)[number], 'one')).toBe(
      'миллиард',
    )
    expect(resolveScaleWord(ru.words.scales[4] as (typeof ru.words.scales)[number], 'one')).toBe(
      'триллион',
    )
    expect(numberToWords(1e9, { locale: ru })).toBe('один миллиард')
    expect(numberToWords(1e12, { locale: ru })).toBe('один триллион')
  })

  it('es diverges furthest: "millardo" at 1e9 and the true long-scale "billón" at 1e12 (not English\'s 1e9 "billion")', () => {
    expect(resolveScaleWord(es.words.scales[3] as (typeof es.words.scales)[number], 'one')).toBe(
      'millardo',
    )
    expect(resolveScaleWord(es.words.scales[4] as (typeof es.words.scales)[number], 'one')).toBe(
      'billón',
    )
    expect(numberToWords(1e9, { locale: es })).toBe('un millardo')
    expect(numberToWords(1e12, { locale: es })).toBe('un billón')
  })

  it('keeps `words.scales` and `notation.scales` vocabulary in sync at every magnitude, for every locale', () => {
    for (const locale of Object.values(locales)) {
      for (const { threshold, long } of locale.notation.scales) {
        const groupIndex = Math.round(Math.log10(threshold) / 3)
        const wordsEntry = locale.words.scales[groupIndex]
        expect(wordsEntry).toBeDefined()
        expect(resolveScaleWord(wordsEntry as NonNullable<typeof wordsEntry>, 'one')).toBe(long)
      }
    }
  })

  it("renders the 1e9/1e12 long-notation reading with each locale's own scale word, for every locale", () => {
    for (const locale of Object.values(locales)) {
      const billionEntry = locale.notation.scales.find((scale) => scale.threshold === 1e9)
      const trillionEntry = locale.notation.scales.find((scale) => scale.threshold === 1e12)
      expect(toLongNotation(1e9, { locale })).toBe(`1 ${billionEntry?.long}`)
      expect(toLongNotation(1e12, { locale })).toBe(`1 ${trillionEntry?.long}`)
    }
  })
})
