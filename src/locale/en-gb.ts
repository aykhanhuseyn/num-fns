import { ordinalToWords } from '../number/suffix'
import { numberToWords } from '../number/words'
import type { Locale, PluralCategory, WordChunk } from './types'

/**
 * Irregular English ordinal words — the same table `locale/en.ts` uses.
 * Duplicated rather than imported (see this module's top-level doc comment
 * for why) since `en.ts` doesn't export it.
 */
const ORDINAL_IRREGULARS: Readonly<Record<string, string>> = {
  one: 'first',
  two: 'second',
  three: 'third',
  five: 'fifth',
  eight: 'eighth',
  nine: 'ninth',
  twelve: 'twelfth',
}

/** Splits on whitespace/hyphen while keeping the separator, e.g. "twenty-one" -> ["twenty", "-", "one"]. */
const WORD_SPLIT_REGEX = /([\s-])/

/** Words for digits 1-9. Index `0` is unused so digits can index directly. */
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
/** Irregular words for 11-19, index `0` corresponding to 11. */
const TEENS = [
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
]
/** Words for the tens digit: 10, 20, ..., 90. Index `0` is unused. */
const TENS = [
  '',
  'ten',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
]

function ordinalizeWord(word: string): string {
  const irregular = ORDINAL_IRREGULARS[word]
  if (irregular) return irregular
  if (word.endsWith('y')) return `${word.slice(0, -1)}ieth`
  return `${word}th`
}

/**
 * Renders the 0-99 remainder of a group (irregular teens, and a hyphenated
 * tens+ones pair) — the same shape as `en.ts`'s `renderGroup`, minus the
 * hundreds digit, which {@link renderGroup} below handles separately so it
 * can insert "and" between the two. Returns `''` for `0`.
 */
function renderRemainder(remainder: number): string {
  if (remainder >= 11 && remainder <= 19) return TEENS[remainder - 11] as string

  const tens = Math.floor(remainder / 10)
  const ones = remainder % 10
  if (tens > 0 && ones > 0) return `${TENS[tens]}-${ONES[ones]}`
  if (tens > 0) return TENS[tens] as string
  if (ones > 0) return ONES[ones] as string
  return ''
}

/**
 * Renders a single 0-999 group as British English cardinal words. Identical
 * to `en.ts`'s `renderGroup` (same hyphenation, same irregular teens, never
 * dropping "one" before "hundred") except for the one convention that
 * defines en-GB: a hundreds digit and a nonzero remainder are joined with
 * "and" — `renderGroup(101)` is `"one hundred and one"`, not en-US's
 * `"one hundred one"`. `renderGroup(110)` is `"one hundred and ten"`;
 * `renderGroup(100)` (no remainder) stays plain `"one hundred"`, and a
 * remainder alone (`renderGroup(21)` -> `"twenty-one"`) never gets an "and" —
 * that connector only ever sits between a hundreds word and what follows it.
 */
function renderGroup(value: number): string {
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100
  const remainderWords = renderRemainder(remainder)

  const parts: string[] = []
  if (hundreds > 0) parts.push(`${ONES[hundreds]} hundred`)
  if (hundreds > 0 && remainderWords) parts.push('and')
  if (remainderWords) parts.push(remainderWords)

  return parts.join(' ')
}

/**
 * Joins ordered chunks (largest scale first), inserting "and" exactly once,
 * immediately before a final chunk whose own value is under 100 — the British
 * "one thousand **and** one" / "two million **and** five" convention. A final
 * chunk of 100 or more already carries its own internal "and" from
 * {@link renderGroup} (`"...two hundred and thirty-four"`), so no second one
 * is added here; a lone chunk (nothing higher to connect to) never gets one
 * either — `chunks.length > 1` is required.
 */
function compose(chunks: readonly WordChunk[]): string {
  return chunks
    .map((chunk, index) => {
      const words = chunk.scaleWord ? `${chunk.words} ${chunk.scaleWord}` : chunk.words
      const isFinalSmallChunk =
        index === chunks.length - 1 && chunks.length > 1 && chunk.value > 0 && chunk.value < 100
      return isFinalSmallChunk ? `and ${words}` : words
    })
    .join(' ')
}

/**
 * British English fraction words: `<numerator cardinal> <denominator
 * ordinal>`, pluralizing the ordinal with a trailing "s" when the numerator
 * is more than one — the same derivation `number/fraction.ts`'s
 * `enFractionWords` uses for `en`, e.g. `1/3` -> `"one third"`, `2/3` ->
 * `"two thirds"`. A compound denominator carries en-GB's own "and"
 * automatically, since it comes from `ordinalToWords(denominator, { locale:
 * enGB })` — e.g. `1/101` -> `"one one hundred and first"`.
 *
 * Implemented as `Locale.fractions.words` (the hook every locale but `en`
 * uses) rather than special-cased in `number/fraction.ts` the way `en`'s
 * composer is: `en` can't take that hook because `number/words.ts` imports
 * `en` as `numberToWords`'s structural default, so `en` importing back from
 * `number/` would be circular. `enGB` isn't anyone's structural default, so
 * it can import `numberToWords`/`ordinalToWords` here without creating a
 * cycle (verified with `bun run check:circular`).
 */
function fractionWords(numerator: number, denominator: number): string {
  const ordinal = ordinalToWords(denominator, { locale: enGB })
  const denominatorWord = numerator > 1 ? `${ordinal}s` : ordinal
  return `${numberToWords(numerator, { locale: enGB })} ${denominatorWord}`
}

/**
 * British English locale (`todo.md` §2's en-GB follow-up). Shares every word
 * and rule `en.ts` (en-US) defines — hyphenation, irregular teens, `st`/`nd`/
 * `rd`/`th` suffixes, short-scale `billion`/`trillion`, separators,
 * notation — except the things that actually distinguish the dialects:
 * "and" before the final low part of a number (`"one hundred and one"`,
 * `"one thousand and one"`), per the module-level doc comments on
 * {@link renderGroup} and {@link compose} above, and a default currency of
 * sterling (`GBP`) rather than `en`'s `USD` (2026-09-06, with the
 * multi-currency `Locale.currency.units` table).
 *
 * Deliberately self-contained rather than importing `ONES`/`TEENS`/`TENS`/the
 * ordinal-irregulars table from `en.ts`: `en.ts` doesn't export them (they're
 * file-local), and exporting them would leak through `export * from './en'`
 * in `locale/index.ts` into the public `./locale` barrel — which
 * `locale/index.test.ts` pins as "exactly the launch locale objects". Small,
 * self-contained duplication here (mirroring the fact that `dist/locale/en.js`
 * is itself already zero-import) avoids that surface-area growth and keeps
 * `dist/locale/en-gb.js` independently tree-shakeable, at the cost of the two
 * files' shared vocabulary tables having to be kept in sync by hand if either
 * ever changes — an acceptable tradeoff for a closed, small word list. The
 * `fractions` hook is the one place this file *does* reach into `number/`
 * (see {@link fractionWords}'s doc comment for why that's cycle-free where
 * `en.ts` importing the same thing would not be).
 */
export const enGB: Locale = {
  code: 'en-GB',
  name: 'English (UK)',
  formatDefaults: {
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  words: {
    zero: 'zero',
    ones: ONES,
    teens: TEENS,
    tens: TENS,
    hundreds: 'hundred',
    scales: ['', 'thousand', 'million', 'billion', 'trillion'],
    negative: 'negative',
    infinity: 'infinity',
    // Decimal connector joining integer and fractional parts (12.34 -> "twelve point thirty-four").
    decimalConnector: 'point',
    renderGroup,
    compose,
  },
  plural: (n: number): PluralCategory => (Math.abs(n) === 1 ? 'one' : 'other'),
  ordinal: {
    suffix: (value: number): string => {
      if (!Number.isInteger(value) || value < 0) {
        throw new RangeError(
          `enGB.ordinal.suffix: value must be a non-negative integer, received ${value}`,
        )
      }
      const mod100 = value % 100
      if (mod100 >= 11 && mod100 <= 13) return 'th'
      switch (value % 10) {
        case 1:
          return 'st'
        case 2:
          return 'nd'
        case 3:
          return 'rd'
        default:
          return 'th'
      }
    },
    // Only the last token of the cardinal reading becomes ordinal — the same
    // rule `en.ts` follows, and it still holds with "and" in the mix, since
    // "and" is never itself the last token: "one hundred and one" ->
    // "one hundred and first".
    words: (_value: number, cardinalWords: string): string => {
      const tokens = cardinalWords.split(WORD_SPLIT_REGEX)
      const lastIndex = tokens.length - 1
      tokens[lastIndex] = ordinalizeWord(tokens[lastIndex] as string)
      return tokens.join('')
    },
  },
  notation: {
    scales: [
      { threshold: 1e12, short: 'T', long: 'trillion' },
      { threshold: 1e9, short: 'B', long: 'billion' },
      { threshold: 1e6, short: 'M', long: 'million' },
      { threshold: 1e3, short: 'K', long: 'thousand' },
    ],
    spaceBeforeShort: false,
  },
  currency: {
    // Sterling by default (the one currency-shaped thing that separates this
    // locale from `en`, whose default is USD); the unit words are otherwise
    // `en`'s, bar the British "rouble" spelling.
    code: 'GBP',
    symbolPosition: 'before',
    units: {
      GBP: {
        major: { word: 'pound', plurals: { one: 'pound', other: 'pounds' } },
        minor: { word: 'penny', plurals: { one: 'penny', other: 'pence' } },
      },
      USD: {
        major: { word: 'dollar', plurals: { one: 'dollar', other: 'dollars' } },
        minor: { word: 'cent', plurals: { one: 'cent', other: 'cents' } },
      },
      EUR: {
        major: { word: 'euro', plurals: { one: 'euro', other: 'euros' } },
        minor: { word: 'cent', plurals: { one: 'cent', other: 'cents' } },
      },
      RUB: {
        major: { word: 'rouble', plurals: { one: 'rouble', other: 'roubles' } },
        minor: { word: 'kopek', plurals: { one: 'kopek', other: 'kopeks' } },
      },
      AZN: {
        major: { word: 'manat', plurals: { one: 'manat', other: 'manats' } },
        minor: { word: 'gapik', plurals: { one: 'gapik', other: 'gapiks' } },
      },
    },
  },
  fractions: {
    half: 'half',
    words: fractionWords,
  },
}
