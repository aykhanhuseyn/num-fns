/**
 * The optional numbering-system fields of a `Locale` (task 0.7-1,
 * `docs/decisions/0007-locale-grouping.md`): digit grouping
 * (`formatDefaults.grouping`, `words.grouping`) and native digits
 * (`Locale.digits`). Every shipped locale leaves all three out, so each
 * resolver here returns the `en` default for them, and these fields leave
 * the shipped locales' output unchanged (`locale/golden.test.ts`).
 *
 * A locale is data a third party can write, so a malformed field throws
 * `RangeError` at the first call that reads it — a grouping of `[0]` would
 * otherwise loop forever, and a ten-digit table with a duplicate would
 * parse two digits as one.
 *
 * Internal; imports nothing, so `shared/bigint.ts` can depend on it.
 */

/**
 * The grouping every shipped locale uses: one size, `3`, repeated — the
 * thousand/million/billion ladder.
 */
export const DEFAULT_GROUPING: readonly number[] = [3]

/**
 * The largest group size accepted. A group is handed to `renderGroup` and
 * `plural` as a `number`, and the `number` branch of `toScaleGroups` takes
 * `value % 10 ** size`, so a group must stay a safe integer: `10^15 - 1`
 * is, `10^16 - 1` is not.
 */
const MAX_GROUP_SIZE = 15

/**
 * Validates a grouping field and returns it, or {@link DEFAULT_GROUPING}
 * when it is omitted. A grouping is a non-empty list of integers from 1 to
 * 15: the first is the units group, each later one the next group, and the
 * last repeats (`[3, 2]` is Indian lakh/crore, `[4]` is CJK 万/亿).
 */
export function resolveGrouping(
  grouping: readonly number[] | undefined,
  label: string,
  context: string,
): readonly number[] {
  if (grouping === undefined) return DEFAULT_GROUPING
  const valid =
    Array.isArray(grouping) &&
    grouping.length > 0 &&
    grouping.every((size) => Number.isInteger(size) && size >= 1 && size <= MAX_GROUP_SIZE)
  if (!valid) {
    throw new RangeError(
      `${context}: ${label} must be a non-empty list of integers from 1 to ${MAX_GROUP_SIZE}, received ${JSON.stringify(grouping)}`,
    )
  }
  return grouping
}

/** ASCII digits `0`–`9`, the form every numeric string is built and parsed in. */
const ASCII_ZERO = 48

/** Characters a digit may not be: whitespace and the number syntax `parseNumber` reads (`+ - . , e E`). */
const NUMBER_SYNTAX = /^[\s+\-.,eE]$/u

/**
 * Validates `Locale.digits` and returns it, or `undefined` when the locale
 * writes ASCII digits (every shipped locale). The table must hold exactly
 * ten single-character digits for 0–9, all distinct, none of them an ASCII
 * digit in the wrong place (`'٠'` … `'٩'` for Arabic-Indic), whitespace, or
 * a character of number syntax (`+ - . , e E`) the parsers would misread.
 */
export function resolveDigits(
  digits: readonly string[] | undefined,
  context: string,
): readonly string[] | undefined {
  if (digits === undefined) return undefined
  const valid =
    Array.isArray(digits) &&
    digits.length === 10 &&
    new Set(digits).size === 10 &&
    digits.every(
      (digit, index) =>
        typeof digit === 'string' &&
        Array.from(digit).length === 1 &&
        !NUMBER_SYNTAX.test(digit) &&
        !(isAsciiDigit(digit) && digit.charCodeAt(0) - ASCII_ZERO !== index),
    )
  if (!valid) {
    throw new RangeError(
      `${context}: locale digits must be ten distinct single characters for 0-9, none of them whitespace or + - . , e E, received ${JSON.stringify(digits)}`,
    )
  }
  return digits
}

function isAsciiDigit(character: string): boolean {
  const code = character.charCodeAt(0)
  return code >= ASCII_ZERO && code <= ASCII_ZERO + 9
}

/** Rewrites every ASCII digit in `text` as the locale's digit; `text` is returned as-is when `digits` is `undefined`. */
export function localizeDigits(text: string, digits: readonly string[] | undefined): string {
  if (digits === undefined) return text
  let result = ''
  for (const character of text) {
    result += isAsciiDigit(character)
      ? (digits[character.charCodeAt(0) - ASCII_ZERO] as string)
      : character
  }
  return result
}

/**
 * Rewrites every locale digit in `text` as its ASCII digit, so the parsers
 * can read it. ASCII digits pass through unchanged — a reader of an
 * Arabic-Indic locale accepts `"١٢٣"` and `"123"` alike.
 */
export function delocalizeDigits(text: string, digits: readonly string[] | undefined): string {
  if (digits === undefined) return text
  let result = ''
  for (const character of text) {
    const index = digits.indexOf(character)
    result += index === -1 ? character : String.fromCharCode(ASCII_ZERO + index)
  }
  return result
}
