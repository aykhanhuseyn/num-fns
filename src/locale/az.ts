import { SHORT_SCALES_AZ } from '../number/notation'
import {
  DECIMAL_WORD,
  HUNDRED_WORD,
  NEGATIVE_WORD,
  numberToWords,
  ONES,
  SCALE_WORDS,
  TENS,
  ZERO_WORD,
} from '../number/words'
import {
  AZN_SYMBOL,
  DEFAULT_DECIMAL_SEPARATOR,
  DEFAULT_THOUSANDS_SEPARATOR,
} from '../shared/constants'
import type { Locale, WordChunk } from './types'

/**
 * Maps the last vowel of an Azerbaijani number word to the correct ordinal
 * suffix, following vowel harmony: back unrounded (a, ı) -> "cı", front
 * unrounded (e, ə, i) -> "ci", back rounded (o, u) -> "cu", front rounded
 * (ö, ü) -> "cü".
 *
 * Moved here from `number/suffix.ts` as part of the `todo.md` §1 locale
 * refactor: this table (and the two ordinal builders below) are genuinely
 * Azerbaijani-specific linguistic data, not generic algorithm, so they
 * belong with the rest of `az`'s vocabulary rather than in the
 * locale-generic `number/` modules. `number/suffix.ts`'s public
 * `getOrdinalSuffix`/`ordinalToWords` now delegate to `Locale.ordinal`
 * (this object, when `{ locale: az }` is passed) instead of owning the
 * algorithm themselves.
 */
const VOWEL_TO_ORDINAL_SUFFIX: Record<string, string> = {
  a: 'cı',
  ı: 'cı',
  e: 'ci',
  ə: 'ci',
  i: 'ci',
  o: 'cu',
  u: 'cu',
  ö: 'cü',
  ü: 'cü',
}

/**
 * The nine Azerbaijani vowels — the key set shared by
 * {@link VOWEL_TO_ORDINAL_SUFFIX} and {@link VOWEL_TO_LOCATIVE_SUFFIX}, which
 * differ in what they map each vowel *to* (four-way rounding harmony vs the
 * locative's two-way backness harmony), never in which vowels they cover.
 */
const VOWELS: ReadonlySet<string> = new Set(['a', 'ı', 'e', 'ə', 'i', 'o', 'u', 'ö', 'ü'])

/**
 * Finds the vowel that governs harmony for a suffix appended to `word`, i.e.
 * its last one. `context` names the caller in the thrown message, since both
 * the ordinal and the locative builder go through here.
 *
 * One shared scan rather than one per suffix table, deliberately: the throw is
 * only reachable through `az.ordinal.words`, which accepts an arbitrary string
 * (`az.test.ts` covers it with `'sfr'`). The fraction path builds its input
 * with `numberToWords`, and every Azerbaijani number word contains a vowel, so
 * a second copy of this loop would be permanently unexecutable — dead weight
 * under the package's 100%-per-file coverage gate, and one more place for the
 * two vowel inventories to drift apart.
 */
function lastVowel(word: string, context: string): string {
  for (let i = word.length - 1; i >= 0; i--) {
    const char = word[i] as string
    if (VOWELS.has(char)) return char
  }
  throw new SyntaxError(`${context}: no Azerbaijani vowel found in "${word}"`)
}

function isVowel(char: string): boolean {
  return VOWELS.has(char)
}

/**
 * Returns the Azerbaijani ordinal suffix ("cı" | "ci" | "cu" | "cü") for a
 * non-negative integer, chosen by vowel harmony on the last word of its
 * cardinal reading. Calls the generic `numberToWords` with `{ locale: az }`
 * rather than recomputing the cardinal reading itself — safe because this
 * function is only ever invoked after the `az` object below has finished
 * initializing (closures resolve `az` lazily, at call time, not at
 * definition time).
 */
function azOrdinalSuffix(value: number): string {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `az.ordinal.suffix: value must be a non-negative integer, received ${value}`,
    )
  }

  const words = numberToWords(value, { locale: az })
  const lastWord = words.split(' ').pop() as string
  return VOWEL_TO_ORDINAL_SUFFIX[lastVowel(lastWord, 'az.ordinal')] as string
}

/**
 * Transforms an already-computed cardinal reading into its full ordinal
 * form — the short suffix from {@link azOrdinalSuffix} preceded by a buffer
 * `"n"`, plus a connecting harmony vowel when the word ends in a consonant.
 *
 * @example
 * azOrdinalWords('üç'); // "üçüncü"
 * azOrdinalWords('iyirmi bir'); // "iyirmi birinci"
 * azOrdinalWords('yüz'); // "yüzüncü"
 */
function azOrdinalWords(cardinalWords: string): string {
  const words = cardinalWords.split(' ')
  const lastWord = words.pop() as string
  const lastChar = lastWord[lastWord.length - 1] as string
  const shortSuffix = VOWEL_TO_ORDINAL_SUFFIX[lastVowel(lastWord, 'az.ordinal')] as string
  const fullSuffix = isVowel(lastChar) ? `n${shortSuffix}` : `${shortSuffix[1]}n${shortSuffix}`

  return [...words, `${lastWord}${fullSuffix}`].join(' ')
}

/**
 * Renders a single 0-999 group as Azerbaijani words. Ported unchanged from
 * the pre-refactor `threeDigitGroupToWords` in `number/words.ts` — this is
 * the reference `renderGroup` implementation every other locale's is
 * checked against for the shared chunk-building algorithm in
 * `number/words.ts`'s `numberToWords`.
 */
function azRenderGroup(value: number): string {
  const hundreds = Math.floor(value / 100)
  const tens = Math.floor((value % 100) / 10)
  const ones = value % 10

  const parts: string[] = []
  if (hundreds > 0) {
    if (hundreds > 1) parts.push(ONES[hundreds] as string)
    parts.push(HUNDRED_WORD)
  }
  if (tens > 0) parts.push(TENS[tens] as string)
  if (ones > 0) parts.push(ONES[ones] as string)

  return parts.join(' ')
}

/**
 * Classifies a vowel by front/back harmony for the locative-case suffix
 * ("-da"/"-də") that reads a fraction's denominator, e.g. "üçdə" ("in
 * three") in "üçdə bir" (one third). A *two-way* harmony (back vs. front
 * only), unlike {@link VOWEL_TO_ORDINAL_SUFFIX}'s four-way ordinal harmony —
 * Azerbaijani's low-vowel suffixes (locative, dative, plural) only track
 * backness, not rounding.
 */
const VOWEL_TO_LOCATIVE_SUFFIX: Record<string, string> = {
  a: 'da',
  ı: 'da',
  o: 'da',
  u: 'da',
  e: 'də',
  ə: 'də',
  i: 'də',
  ö: 'də',
  ü: 'də',
}

/**
 * Azerbaijani fraction words: the denominator takes the locative case
 * ("üçdə" = "in three") and the numerator follows as a cardinal number —
 * e.g. `1/3` becomes `"üçdə bir"`.
 */
function azFractionWords(numerator: number, denominator: number): string {
  const denominatorWords = numberToWords(denominator, { locale: az })
  const denominatorLastWord = denominatorWords.split(' ').pop() as string
  const suffix = VOWEL_TO_LOCATIVE_SUFFIX[lastVowel(denominatorLastWord, 'az.fractions')] as string
  return `${denominatorWords}${suffix} ${numberToWords(numerator, { locale: az })}`
}

/**
 * Azerbaijani locale — the reference implementation the locale refactor
 * (`todo.md` §1) is built against. Every field is ported unchanged from the
 * hardcoded constants in `number/words.ts`, `number/notation.ts` and
 * `shared/constants.ts` rather than re-derived, and `numberToWords`,
 * `toOrdinal`/`ordinalToWords`, `toShortNotation`/`toLongNotation`, and
 * `formatMoney`/`moneyToWords` are all verified (`az.test.ts`) to produce
 * byte-identical output to the pre-refactor hardcoded functions when called
 * with `{ locale: az }`.
 */
export const az: Locale = {
  code: 'az',
  name: 'Azerbaijani',
  formatDefaults: {
    thousandsSeparator: DEFAULT_THOUSANDS_SEPARATOR,
    decimalSeparator: DEFAULT_DECIMAL_SEPARATOR,
  },
  words: {
    zero: ZERO_WORD,
    ones: ONES,
    tens: TENS,
    // Azerbaijani only needs one multiplier noun reused for every digit 1-9.
    hundreds: HUNDRED_WORD,
    scales: SCALE_WORDS,
    negative: NEGATIVE_WORD,
    // Azerbaijani never uses a connector between a group's tens and ones
    // digit ("otuz dörd", not "otuz tam dörd") — `and` stays unset here;
    // `decimalConnector` (below) is the unrelated integer/fraction joiner.
    decimalConnector: DECIMAL_WORD,
    renderGroup: azRenderGroup,
    compose: (chunks: readonly WordChunk[]): string =>
      chunks
        .map((chunk) => {
          // "min" for exactly 1000 at the thousands scale, not "bir min" —
          // unlike "bir milyon" at every scale above thousands. Mirrors the
          // irregular case in the pre-refactor `number/words.ts`.
          if (chunk.scaleIndex === 1 && chunk.value === 1) return chunk.scaleWord
          return chunk.scaleWord ? `${chunk.words} ${chunk.scaleWord}` : chunk.words
        })
        .join(' '),
  },
  // Azerbaijani never inflects scale/currency words by count.
  plural: () => 'other',
  ordinal: {
    suffix: azOrdinalSuffix,
    words: (_value, cardinalWords) => azOrdinalWords(cardinalWords),
  },
  notation: {
    // Long-scale word for each SHORT_SCALES_AZ entry lives at the matching
    // magnitude in SCALE_WORDS, e.g. SHORT_SCALES_AZ[0] is 1e12/"trln" and
    // SCALE_WORDS[4] is "trilyon" — both the largest magnitude.
    scales: SHORT_SCALES_AZ.map(([threshold, short], index) => ({
      threshold,
      short,
      long: SCALE_WORDS[SCALE_WORDS.length - 1 - index] as string,
    })),
    spaceBeforeShort: true,
  },
  currency: {
    code: 'AZN',
    symbol: AZN_SYMBOL,
    symbolPosition: 'after',
    major: { word: 'manat' },
    minor: { word: 'qəpik' },
  },
  fractions: {
    half: 'yarım',
    words: azFractionWords,
  },
}
