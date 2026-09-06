import { en } from '../locale/en'
import type { DigitWordsOptions } from '../shared/types'

/**
 * Characters that may appear in a formatted phone number or code but are not
 * themselves spoken: spaces, common phone-number punctuation, and a leading
 * `+` (country-code prefix). Ignored rather than rejected.
 */
const IGNORED_CHARS = new Set([' ', '-', '(', ')', '.', '+'])

/**
 * Reads a number or numeric string digit by digit, the way phone numbers,
 * PIN codes, and postal/tracking codes are normally read aloud rather than
 * as a single cardinal number — e.g. `"055"` becomes `"zero five five"`, not
 * `"fifty-five"` (which is what {@link numberToWords} would produce).
 *
 * Punctuation commonly found in formatted phone numbers (spaces, `-`, `(`,
 * `)`, `.`, a leading `+`) is ignored — it does not produce a spoken word,
 * so `"+994 55 123"` and `"994 55 123"` read identically.
 *
 * Passing a string preserves leading zeros, which a `number` input cannot
 * represent (`numberToDigitWords(55)` and `numberToDigitWords("055")` read
 * differently). A leading `-` (string input), a negative `number` or a
 * negative `bigint` is prefixed with `options.locale`'s negative word
 * (defaults to `en` `"negative"`), matching {@link numberToWords}.
 *
 * A `bigint` is read exactly as `String(value)` renders it — every digit,
 * at any magnitude — which is what a `number` past
 * `Number.MAX_SAFE_INTEGER` cannot promise (its `String()` form may already
 * be rounded, or be in exponent notation).
 *
 * @example
 * numberToDigitWords("+994 55 123 45 67");
 * // "nine nine four five five one two three four five six seven"
 * numberToDigitWords("055"); // "zero five five"
 * numberToDigitWords(90); // "nine zero"
 * numberToDigitWords(BigInt('12345678901234567890')); // "one two three ... nine zero"
 * numberToDigitWords("055", { locale: az }); // "sıfır beş beş"
 */
export function numberToDigitWords(
  value: number | string | bigint,
  options: DigitWordsOptions = {},
): string {
  const { separator = ' ', locale = en } = options
  const raw =
    typeof value === 'number'
      ? validateNumericInput(value)
      : typeof value === 'bigint'
        ? String(value)
        : value

  const isNegative = raw.startsWith('-')
  const body = isNegative ? raw.slice(1) : raw

  const words: string[] = []
  for (const char of body) {
    if (IGNORED_CHARS.has(char)) continue
    if (char < '0' || char > '9') {
      throw new SyntaxError(`numberToDigitWords: unexpected character "${char}" in "${value}"`)
    }
    words.push(char === '0' ? locale.words.zero : (locale.words.ones[Number(char)] as string))
  }

  if (words.length === 0) {
    throw new SyntaxError(`numberToDigitWords: no digits found in "${value}"`)
  }

  const result = words.join(separator)
  return isNegative ? `${locale.words.negative}${separator}${result}` : result
}

function validateNumericInput(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`numberToDigitWords: value must be finite, received ${value}`)
  }
  if (!Number.isInteger(value)) {
    throw new RangeError(`numberToDigitWords: value must be an integer, received ${value}`)
  }
  return String(value)
}
