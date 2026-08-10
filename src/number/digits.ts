import type { DigitWordsOptions } from '../shared/types'
import { NEGATIVE_WORD, ONES, ZERO_WORD } from './words'

/**
 * Characters that may appear in a formatted phone number or code but are not
 * themselves spoken: spaces, common phone-number punctuation, and a leading
 * `+` (country-code prefix). Ignored rather than rejected.
 */
const IGNORED_CHARS = new Set([' ', '-', '(', ')', '.', '+'])

/**
 * Reads a number or numeric string digit by digit, the way phone numbers,
 * PIN codes, and postal/tracking codes are normally read aloud rather than
 * as a single cardinal number — e.g. `"055"` becomes `"sıfır beş beş"`, not
 * `"əlli beş"` (which is what {@link numberToWords} would produce).
 *
 * Punctuation commonly found in formatted phone numbers (spaces, `-`, `(`,
 * `)`, `.`, a leading `+`) is ignored — it does not produce a spoken word,
 * so `"+994 55 123"` and `"994 55 123"` read identically.
 *
 * Passing a string preserves leading zeros, which a `number` input cannot
 * represent (`numberToDigitWords(55)` and `numberToDigitWords("055")` read
 * differently). A leading `-` (string input) or a negative `number` is
 * prefixed with `"mənfi"`, matching {@link numberToWords}.
 *
 * @example
 * numberToDigitWords("+994 55 123 45 67");
 * // "doqquz doqquz dörd beş beş bir iki üç dörd beş altı yeddi"
 * numberToDigitWords("055"); // "sıfır beş beş"
 * numberToDigitWords(90); // "doqquz sıfır"
 */
export function numberToDigitWords(
  value: number | string,
  options: DigitWordsOptions = {},
): string {
  const { separator = ' ' } = options
  const raw = typeof value === 'number' ? validateNumericInput(value) : value

  const isNegative = raw.startsWith('-')
  const body = isNegative ? raw.slice(1) : raw

  const words: string[] = []
  for (const char of body) {
    if (IGNORED_CHARS.has(char)) continue
    if (char < '0' || char > '9') {
      throw new SyntaxError(`numberToDigitWords: unexpected character "${char}" in "${value}"`)
    }
    words.push(char === '0' ? ZERO_WORD : (ONES[Number(char)] as string))
  }

  if (words.length === 0) {
    throw new SyntaxError(`numberToDigitWords: no digits found in "${value}"`)
  }

  const result = words.join(separator)
  return isNegative ? `${NEGATIVE_WORD}${separator}${result}` : result
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
