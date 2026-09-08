import { en } from '../locale/en'
import type { GrammaticalGender, Locale, PluralCategory, WordChunk } from '../locale/types'
import {
  absBigInt,
  type FixedParts,
  maxSupportedBigInt,
  splitFixed,
  toThousandGroups,
  ZERO,
} from '../shared/bigint'
import type { NumberWordsOptions } from '../shared/types'

/**
 * Every value `GrammaticalGender` admits, for validating the `gender`
 * option before consulting the locale — an unknown string fails with the
 * full list of valid genders, not just the locale's subset.
 */
const GRAMMATICAL_GENDERS: readonly GrammaticalGender[] = ['masculine', 'feminine', 'neuter']

/**
 * Validates `options.gender` against `GrammaticalGender` and against the
 * genders `locale` actually distinguishes, then resolves the gender to
 * render with: the requested one, or `locale.words.defaultGender` when the
 * option is omitted (`undefined` for genderless locales — their
 * `renderGroup` ignores it anyway).
 */
function resolveGender(
  gender: GrammaticalGender | undefined,
  locale: Locale,
): GrammaticalGender | undefined {
  if (gender === undefined) return locale.words.defaultGender

  if (!GRAMMATICAL_GENDERS.includes(gender)) {
    throw new RangeError(
      `numberToWords: gender must be one of ${GRAMMATICAL_GENDERS.map((g) => `"${g}"`).join(', ')}, received ${String(gender)}`,
    )
  }

  const supported = locale.words.genders ?? []
  if (supported.length === 0) {
    throw new RangeError(
      `numberToWords: locale "${locale.code}" has no grammatical gender; omit the gender option`,
    )
  }
  if (!supported.includes(gender)) {
    const supportedList = supported.map((g) => `"${g}"`).join(', ')
    throw new RangeError(
      `numberToWords: locale "${locale.code}" does not distinguish the "${gender}" gender (supported: ${supportedList})`,
    )
  }

  return gender
}

/**
 * Resolves a `Locale.words.scales` entry (a plain string, or a
 * plural-category map for locales like Russian that inflect scale words by
 * count) to the concrete word for `category`. Falls back to `'other'`, then
 * to the first available form, so a locale that only defines a subset of
 * `PluralCategory` (e.g. Spanish's `{ one, other }`) still resolves for a
 * category it didn't explicitly list (there is none beyond `one`/`other`
 * for Spanish, but this keeps the fallback total rather than partial).
 * Exported for reuse by `number/notation.ts`'s `toLongNotation`.
 */
export function resolveScaleWord(
  entry: string | Partial<Record<PluralCategory, string>>,
  category: PluralCategory,
): string {
  if (typeof entry === 'string') return entry
  return entry[category] ?? entry.other ?? Object.values(entry)[0] ?? ''
}

/**
 * Spells out a number as cardinal words, in the locale given by
 * `options.locale` (defaults to `en` — see `todo.md` §1's "default locale"
 * decision; pass `{ locale: az }` for the pre-refactor default).
 *
 * Groups the integer into base-1000 chunks, renders each chunk's own
 * 0-999 reading via `locale.words.renderGroup`, resolves each chunk's scale
 * word via `locale.plural`, and joins the chunks with `locale.words.compose`
 * — the same three-step algorithm for every locale, since all
 * locale-specific irregularity lives in `renderGroup`/`compose` themselves
 * (see `locale/types.ts`'s `LocaleWords` doc comments).
 *
 * Supports integers from 0 up to `1000 ** locale.words.scales.length - 1`
 * (999 trillion range for every launch locale), negative numbers (prefixed
 * with `locale.words.negative`), and a fraction rounded to two decimal
 * digits, read as a whole number joined by `locale.words.decimalConnector`
 * when the locale defines one (see `decimalConnector`'s doc comment in
 * `locale/types.ts`). The rounding is `arithmetic/round`'s, exact in
 * decimal: `numberToWords(2.675)` ends in "sixty-eight" as the value is
 * written, where `Math.round((2.675 - 2) * 100)` gives `67` because the
 * double is stored just below the tie; `1.999` carries into "two".
 *
 * A `bigint` is read exactly at any magnitude (`todo.md` §4's BigInt input
 * path), and so is a `number`'s whole part: both are chunked with integer
 * arithmetic rather than `Math.floor`, so a custom locale that names scales
 * beyond `Number.MAX_SAFE_INTEGER` (quadrillion and up) gets every digit
 * right, and the `1000 ** scales.length - 1` cap is checked exactly, after
 * rounding (`999999999999.999` does not slip past a 999-billion cap on a
 * carry).
 *
 * For locales whose number words inflect by grammatical gender (`ru`, `es`),
 * `options.gender` selects the agreement forms for the noun being counted
 * (see `NumberWordsOptions.gender` in `shared/types.ts` for exactly which
 * groups it applies to); it defaults to `locale.words.defaultGender` so
 * omitting it keeps the masculine citation form, and it throws a
 * `RangeError` for a gender the locale doesn't distinguish (`az`/`en` have
 * none, `es` has no neuter).
 *
 * @example
 * numberToWords(1234); // "one thousand two hundred thirty-four" (en, the default)
 * numberToWords(1234, { locale: az }); // "min iki yüz otuz dörd"
 * numberToWords(-5, { locale: ru }); // "минус пять"
 * numberToWords(21, { locale: ru, gender: 'feminine' }); // "двадцать одна"
 * numberToWords(200, { locale: es, gender: 'feminine' }); // "doscientas"
 * numberToWords(BigInt('123456789012345')); // "one hundred twenty-three trillion ..."
 */
export function numberToWords(value: number | bigint, options: NumberWordsOptions = {}): string {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new RangeError(`numberToWords: value must be finite, received ${value}`)
  }

  const { locale = en } = options
  const gender = resolveGender(options.gender, locale)

  const { whole, fraction } =
    typeof value === 'bigint'
      ? { whole: absBigInt(value), fraction: 0 }
      : splitFixed(Math.abs(value), 2)
  const groups = toThousandGroups(whole)
  if (groups.length > locale.words.scales.length) {
    throw new RangeError(
      `numberToWords: value exceeds the maximum supported magnitude of ${maxSupportedBigInt(locale.words.scales.length)}`,
    )
  }

  let words = integerToWords(groups, locale, gender)
  if (fraction > 0) {
    const fractionWords = locale.words.renderGroup(fraction, gender)
    words = locale.words.decimalConnector
      ? `${words} ${locale.words.decimalConnector} ${fractionWords}`
      : `${words} ${fractionWords}`
  }

  // A value that rounds to zero (`-0.001`) reads as plain "zero", like `round` never returning `-0`.
  return isNegative(value, { whole, fraction }) ? `${locale.words.negative} ${words}` : words
}

/** Whether the spelled value carries the negative word: the input is negative and did not round away to zero. */
function isNegative(value: number | bigint, { whole, fraction }: FixedParts): boolean {
  return value < 0 && (whole !== ZERO || fraction !== 0)
}

/** Renders base-1000 `groups` (least significant first, as `toThousandGroups` returns them; `[]` is zero). */
function integerToWords(
  groups: readonly number[],
  locale: Locale,
  gender: GrammaticalGender | undefined,
): string {
  if (groups.length === 0) return locale.words.zero

  const chunks: WordChunk[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupValue = groups[i] as number
    if (!groupValue) continue

    const scaleEntry = locale.words.scales[i] ?? ''
    const scaleWord = resolveScaleWord(scaleEntry, locale.plural(groupValue))
    chunks.push({
      value: groupValue,
      // The requested gender agrees with the noun being *counted*, so it
      // only applies to the trailing units group — a group bound to a scale
      // word agrees with that scale noun instead, which is `compose`'s job
      // (Russian's feminine "тысяча", Spanish's gender-transparent "mil").
      words: locale.words.renderGroup(groupValue, i === 0 ? gender : undefined),
      scaleIndex: i,
      scaleWord,
    })
  }

  return locale.words.compose(chunks, gender)
}
