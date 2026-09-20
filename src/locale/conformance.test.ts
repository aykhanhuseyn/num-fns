import { describe, expect, it } from 'bun:test'
import { type CurrencyCode, getCurrency } from '../money/currency'
import { formatMoney, parseMoney } from '../money/format'
import { moneyToWords } from '../money/words'
import { formatNumber, parseNumber } from '../number/format'
import { fractionToWords } from '../number/fraction'
import {
  parseLongNotation,
  parseShortNotation,
  toLongNotation,
  toShortNotation,
} from '../number/notation'
import { getOrdinalSuffix, ordinalToWords } from '../number/suffix'
import { numberToWords } from '../number/words'
import * as locales from './index'
import type { GrammaticalGender } from './types'

/**
 * Every launch locale, keyed by its barrel export name — table-driven, so a
 * sixth locale added to `locale/index.ts`'s barrel is picked up here with no
 * further edits.
 *
 * This suite deliberately does not re-check anything `locale/index.test.ts`
 * already pins (exact export names, `code`/`name` shape, the per-locale
 * scale-*vocabulary*). Instead it asserts the invariants any `Locale`
 * implementation must satisfy regardless of which words it actually uses —
 * the shape `locale/types.ts` promises, and the behavior every public
 * function that accepts `{ locale }` must produce for *some* value, not the
 * specific value. `CONTRIBUTING.md`'s locale-authoring guide points new-locale
 * authors here: this file passing unmodified is part of that guide's
 * checklist.
 */
const LOCALE_ENTRIES = Object.entries(locales)

/** Every value `GrammaticalGender` admits (mirrors `number/words.ts`'s own list). */
const ALL_GENDERS: readonly GrammaticalGender[] = ['masculine', 'feminine', 'neuter']

/**
 * Every value `CurrencyCode` admits — pinned here, not derived, so that
 * adding a code to `money/currency.ts` without teaching every launch locale
 * its unit words fails this suite instead of making `moneyToWords` throw at
 * the first caller (`Locale.currency.units`'s doc comment).
 */
const ALL_CURRENCIES: CurrencyCode[] = ['AZN', 'USD', 'EUR', 'RUB', 'GBP']

/**
 * A spread of `numberToWords` inputs covering: zero, a bare digit, a teen,
 * a round ten, a round hundred, a hundred-plus-remainder, a four-digit
 * value, a scale boundary (1e6), a negative, and a two-decimal fraction.
 */
const CARDINAL_VALUES = [0, 1, 7, 21, 100, 101, 1234, 1e6, -5, 12.34]

/**
 * The integer members of {@link CARDINAL_VALUES} plus every scale boundary
 * and the 999-trillion cap — the values whose `bigint` reading must be
 * byte-identical to the `number` one in every locale (`shared/bigint.ts`).
 */
const CARDINAL_INTEGERS = [
  0, 1, 7, 21, 100, 101, 1234, 1e6, -5, 1000, 21000, 1e9, 1e12, -1234567, 999_999_999_999_999,
]

/**
 * A spread of `ordinalToWords`/`getOrdinalSuffix` inputs covering: zero, a
 * bare digit, a teen, a round ten-plus-one, a round hundred, and two scale
 * boundaries.
 */
const ORDINAL_VALUES = [0, 1, 2, 3, 11, 21, 100, 1000, 1_000_000]

/** Matches a run of two or more consecutive spaces. */
const DOUBLE_SPACE_REGEX = / {2}/
/** A loose BCP-47 language-tag shape: a 2-3 letter primary subtag, optionally followed by a 2-letter region subtag. */
const BCP47_ISH_REGEX = /^[a-z]{2,3}(-[A-Z]{2})?$/

/** Asserts `words` is non-empty, has no leading/trailing whitespace, and contains no run of two or more spaces. */
function assertCleanWords(words: string, context: string): void {
  expect(words.length, context).toBeGreaterThan(0)
  expect(words, context).toBe(words.trim())
  expect(words, `${context}: contains a double space`).not.toMatch(DOUBLE_SPACE_REGEX)
}

describe.each(LOCALE_ENTRIES)('locale conformance: %s', (_exportName, locale) => {
  describe('structural shape (locale/types.ts)', () => {
    it('has a BCP-47-ish `code`', () => {
      expect(locale.code).toMatch(BCP47_ISH_REGEX)
    })

    it('declares single-character, distinct thousands/decimal separators', () => {
      const { thousandsSeparator, decimalSeparator } = locale.formatDefaults
      expect(thousandsSeparator.length).toBe(1)
      expect(decimalSeparator.length).toBe(1)
      expect(thousandsSeparator).not.toBe(decimalSeparator)
    })

    it('names zero, the negative prefix and infinity, all distinct and untrimmed-free', () => {
      const { zero, negative, infinity } = locale.words
      for (const word of [zero, negative, infinity]) {
        expect(word.length).toBeGreaterThan(0)
        expect(word).toBe(word.trim())
      }
      expect(new Set([zero, negative, infinity]).size).toBe(3)
    })

    it('aligns `words.scales` and `notation.scales`: one units slot plus one entry per notation threshold', () => {
      expect(locale.notation.scales.length).toBe(locale.words.scales.length - 1)
    })

    it('declares `words.defaultGender` iff `words.genders` is non-empty, and it is a member of it', () => {
      const { genders, defaultGender } = locale.words
      if (!genders || genders.length === 0) {
        expect(defaultGender).toBeUndefined()
      } else {
        expect(defaultGender).toBeDefined()
        expect(genders).toContain(defaultGender as GrammaticalGender)
      }
    })

    it('defaults to a registered currency it has unit words for', () => {
      expect(() => getCurrency(locale.currency.code)).not.toThrow()
      expect(locale.currency.units[locale.currency.code]).toBeDefined()
    })

    it('carries unit words for every registered currency, and only registered ones', () => {
      expect(Object.keys(locale.currency.units).sort()).toEqual([...ALL_CURRENCIES].sort())
    })

    it.each(ALL_CURRENCIES)(
      'gives %s major/minor units a non-empty word, with any `gender` a member of `words.genders`',
      (code) => {
        const units = locale.currency.units[code]
        expect(units).toBeDefined()
        for (const unit of [units?.major, units?.minor]) {
          expect(unit?.word.length).toBeGreaterThan(0)
          if (unit?.gender !== undefined) {
            expect(locale.words.genders ?? []).toContain(unit.gender)
          }
        }
      },
    )
  })

  describe('numberToWords', () => {
    it.each(CARDINAL_VALUES)('produces clean, non-empty words for %p', (value) => {
      assertCleanWords(numberToWords(value, { locale }), `numberToWords(${value})`)
    })

    it.each(CARDINAL_INTEGERS)('spells the bigint %p exactly like the number', (value) => {
      expect(numberToWords(BigInt(value), { locale })).toBe(numberToWords(value, { locale }))
    })

    it('throws RangeError for a bigint one past the cap its scale words allow', () => {
      const max = BigInt(1000) ** BigInt(locale.words.scales.length) - BigInt(1)
      assertCleanWords(numberToWords(max, { locale }), `numberToWords(${max})`)
      expect(() => numberToWords(max + BigInt(1), { locale })).toThrow(RangeError)
    })

    it('keeps a hundredths fraction distinct from a tenths one (leading zero spoken)', () => {
      // The fraction arrives as a plain integer, so `.01` and `.1` are `1`
      // and `10`; dropping the leading zero made 1.01 read as a speaker reads
      // 1.1. Locale-generic, so every locale gets it without its own hook.
      for (const [hundredths, tenths] of [
        [1.01, 1.1],
        [0.09, 0.9],
      ] as const) {
        const spokenHundredths = numberToWords(hundredths, { locale })
        assertCleanWords(spokenHundredths, `numberToWords(${hundredths})`)
        expect(spokenHundredths).not.toBe(numberToWords(tenths, { locale }))
        expect(spokenHundredths).toContain(locale.words.zero)
      }
    })
  })

  describe('ordinals', () => {
    it.each(ORDINAL_VALUES)('ordinalToWords produces clean, non-empty words for %p', (value) => {
      assertCleanWords(ordinalToWords(value, { locale }), `ordinalToWords(${value})`)
    })

    it.each(ORDINAL_VALUES)('getOrdinalSuffix produces a non-empty suffix for %p', (value) => {
      expect(getOrdinalSuffix(value, { locale }).length).toBeGreaterThan(0)
    })
  })

  describe('formatNumber / parseNumber', () => {
    it.each([0, 1, -42, 1234.5, 1_000_000.25])(
      "round-trips %p through the locale's own default separators",
      (value) => {
        expect(parseNumber(formatNumber(value, { locale }), { locale })).toBe(value)
      },
    )
  })

  describe('toShortNotation / parseShortNotation', () => {
    it('round-trips a multi-scale value within the default decimals=1 rounding tolerance', () => {
      const value = 1234567
      const parsed = parseShortNotation(toShortNotation(value, { locale }), { locale })
      // decimals defaults to 1, so up to half a percent of the scaled value
      // is expected rounding error, not a bug — this is the same "bounded,
      // not exact" round trip `number/notation.property.test.ts` asserts.
      expect(Math.abs(parsed - value)).toBeLessThanOrEqual(value * 0.05 + 1)
    })

    it('round-trips a value under the smallest scale threshold exactly', () => {
      const value = 42
      expect(parseShortNotation(toShortNotation(value, { locale }), { locale })).toBe(value)
    })
  })

  describe('toLongNotation / parseLongNotation', () => {
    it('round-trips a multi-scale value exactly (digits are kept verbatim, only the scale word is localized)', () => {
      const value = 1234567
      expect(parseLongNotation(toLongNotation(value, { locale }), { locale })).toBe(value)
    })

    it.each(CARDINAL_INTEGERS)('expands the bigint %p exactly like the number', (value) => {
      expect(toLongNotation(BigInt(value), { locale })).toBe(toLongNotation(value, { locale }))
    })

    it("round-trips a bigint exactly through { output: 'bigint' }", () => {
      for (const value of CARDINAL_INTEGERS) {
        const formatted = toLongNotation(BigInt(value), { locale })
        expect(parseLongNotation(formatted, { locale, output: 'bigint' })).toBe(BigInt(value))
      }
    })
  })

  describe('formatNumber / parseNumber (bigint)', () => {
    it("round-trips a bigint past Number.MAX_SAFE_INTEGER through the locale's own separators", () => {
      for (const text of ['0', '-42', '1234567890123456789', '-9007199254740993']) {
        const value = BigInt(text)
        expect(parseNumber(formatNumber(value, { locale }), { locale, output: 'bigint' })).toBe(
          value,
        )
      }
    })
  })

  describe('moneyToWords', () => {
    it.each([0, 1, 1234.56, -3.5])('produces clean, non-empty words for %p', (value) => {
      assertCleanWords(moneyToWords(value, { locale }), `moneyToWords(${value})`)
    })

    it.each(ALL_CURRENCIES)(
      'produces clean, non-empty words in %s for 1, 2, 5 and 21.21',
      (currency) => {
        for (const value of [1, 2, 5, 21.21]) {
          assertCleanWords(
            moneyToWords(value, { locale, currency }),
            `moneyToWords(${value}, { currency: '${currency}' })`,
          )
        }
      },
    )
  })

  describe('formatMoney / parseMoney', () => {
    it.each([0, 1234.5, -9.99])(
      "round-trips %p through the locale's own currency defaults",
      (value) => {
        expect(parseMoney(formatMoney(value, { locale }), { locale })).toBeCloseTo(value, 5)
      },
    )

    it.each(ALL_CURRENCIES)(
      'round-trips 1234.5 in %s, placing its symbol per the locale',
      (currency) => {
        const formatted = formatMoney(1234.5, { locale, currency })
        const { symbol } = getCurrency(currency)
        expect(formatted.split(symbol).length - 1).toBe(1)
        if (locale.currency.symbolPosition === 'before')
          expect(formatted.startsWith(`${symbol} `)).toBe(true)
        else expect(formatted.endsWith(` ${symbol}`)).toBe(true)
        expect(parseMoney(formatted, { locale, currency })).toBeCloseTo(1234.5, 5)
      },
    )
  })

  describe('gender validation (numberToWords)', () => {
    const declaredGenders = locale.words.genders ?? []

    it('accepts every gender the locale declares', () => {
      for (const gender of declaredGenders) {
        expect(() => numberToWords(21, { locale, gender })).not.toThrow()
      }
    })

    it('throws RangeError for a gender the locale does not distinguish', () => {
      const undeclared = ALL_GENDERS.filter((gender) => !declaredGenders.includes(gender))
      for (const gender of undeclared) {
        expect(() => numberToWords(21, { locale, gender })).toThrow(RangeError)
      }
    })
  })

  describe('fractionToWords', () => {
    it('either returns clean, non-empty words or throws RangeError — never garbage', () => {
      try {
        assertCleanWords(fractionToWords(1, 3, { locale }), 'fractionToWords(1, 3)')
      } catch (error) {
        expect(error).toBeInstanceOf(RangeError)
      }
    })
  })
})
