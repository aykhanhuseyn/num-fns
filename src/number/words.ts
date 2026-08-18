import { en } from '../locale/en'
import type { Locale, PluralCategory, WordChunk } from '../locale/types'
import type { NumberWordsOptions } from '../shared/types'

/**
 * Words for digits 1-9. Index `0` is unused so digits can index directly.
 * Kept here (rather than moved fully into `locale/az.ts`) because
 * `number/digits.ts` and `locale/az.ts` both still reuse it — see those
 * modules' doc comments.
 */
export const ONES = ['', 'bir', 'iki', 'üç', 'dörd', 'beş', 'altı', 'yeddi', 'səkkiz', 'doqquz']
/** Words for the tens digit: 10, 20, ..., 90. Index `0` is unused. Reused by `locale/az.ts`. */
export const TENS = [
  '',
  'on',
  'iyirmi',
  'otuz',
  'qırx',
  'əlli',
  'altmış',
  'yetmiş',
  'səksən',
  'doxsan',
]

/**
 * Scale words indexed by group-of-three-digits position, read from the
 * right: index 0 is the units group (no word), index 1 is thousands, etc.
 * Reused by `locale/az.ts` as `az.words.scales`.
 */
export const SCALE_WORDS = ['', 'min', 'milyon', 'milyard', 'trilyon']

/** Word for `0`. Reused by `locale/az.ts`. */
export const ZERO_WORD = 'sıfır'

/** Word prefixed to the spelled-out form of a negative number. Reused by `locale/az.ts`. */
export const NEGATIVE_WORD = 'mənfi'

/** Connector joining the integer and fractional part when spelling decimals. Reused by `locale/az.ts` as `decimalConnector`. */
export const DECIMAL_WORD = 'tam'

/** Hundreds-digit multiplier noun, reused for every digit 1-9. Reused by `locale/az.ts`. */
export const HUNDRED_WORD = 'yüz'

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
 * with `locale.words.negative`), and up to two decimal digits, read as a
 * whole number joined by `locale.words.decimalConnector` when the locale
 * defines one (only `az`, today — see `decimalConnector`'s doc comment in
 * `locale/types.ts` for the `en`/`ru`/`es` gap this leaves, tracked in
 * `todo.md` §2).
 *
 * @example
 * numberToWords(1234); // "one thousand two hundred thirty-four" (en, the default)
 * numberToWords(1234, { locale: az }); // "min iki yüz otuz dörd"
 * numberToWords(-5, { locale: ru }); // "минус пять"
 */
export function numberToWords(value: number, options: NumberWordsOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`numberToWords: value must be finite, received ${value}`)
  }

  const { locale = en } = options
  const maxSupportedInteger = 1000 ** locale.words.scales.length - 1

  const isNegative = value < 0 && value !== 0
  const absolute = Math.abs(value)
  let integerPart = Math.floor(absolute)

  if (integerPart > maxSupportedInteger) {
    throw new RangeError(
      `numberToWords: value exceeds the maximum supported magnitude of ${maxSupportedInteger}`,
    )
  }

  let fractionDigits = Math.round((absolute - integerPart) * 100)
  if (fractionDigits === 100) {
    fractionDigits = 0
    integerPart += 1
  }

  let words = integerToWords(integerPart, locale)
  if (fractionDigits > 0) {
    const fractionWords = locale.words.renderGroup(fractionDigits)
    words = locale.words.decimalConnector
      ? `${words} ${locale.words.decimalConnector} ${fractionWords}`
      : `${words} ${fractionWords}`
  }

  return isNegative ? `${locale.words.negative} ${words}` : words
}

function integerToWords(value: number, locale: Locale): string {
  if (value === 0) return locale.words.zero

  const groups: number[] = []
  let remaining = value
  while (remaining > 0) {
    groups.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }

  const chunks: WordChunk[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupValue = groups[i] as number
    if (!groupValue) continue

    const scaleEntry = locale.words.scales[i] ?? ''
    const scaleWord = resolveScaleWord(scaleEntry, locale.plural(groupValue))
    chunks.push({
      value: groupValue,
      words: locale.words.renderGroup(groupValue),
      scaleIndex: i,
      scaleWord,
    })
  }

  return locale.words.compose(chunks)
}
