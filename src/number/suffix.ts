import { en } from '../locale/en'
import type { Locale } from '../locale/types'
import { toSafeNumber } from '../shared/bigint'
import { guardText } from '../shared/no-throw-text'
import type { OrdinalOptions, SuffixOptions, ToOrdinalOptions } from '../shared/types'
import { assertNumericValue } from '../shared/validation'
import { numberToWords } from './words'

/**
 * Returns the ordinal suffix for a non-negative integer.
 *
 * Uses `options.locale` (defaults to `en`: `'st'`/`'nd'`/`'rd'`/`'th'`).
 * Delegates to
 * `locale.ordinal.suffix`, which each locale implements itself — Azerbaijani
 * vowel harmony (`locale/az.ts`), Spanish's invariant `'º'`, and so on.
 *
 * A `bigint` behaves exactly like the equal `number` as long as it is a
 * safe integer: `locale.ordinal.suffix` takes a `number` (see
 * `LocaleOrdinal` in `locale/types.ts`), so the value is narrowed with
 * `toSafeNumber` first and a `bigint` beyond `Number.MAX_SAFE_INTEGER`
 * throws `RangeError` rather than reaching the hook rounded.
 *
 * @example
 * getOrdinalSuffix(1); // "st"
 * getOrdinalSuffix(BigInt(22)); // "nd"
 * getOrdinalSuffix(1, { locale: az }); // "ci" (bir -> birinci)
 *
 * @param value - A non-negative integer, a number or a `bigint`.
 * @param options - The `locale`.
 * @returns The suffix alone, without the digits.
 * @throws {TypeError} When `value` is not a number or a `bigint`.
 * @throws {RangeError} When `value` is negative, not an integer, not finite,
 * or a `bigint` above `Number.MAX_SAFE_INTEGER`.
 * @since 0.2.0
 */
export function getOrdinalSuffix(value: number | bigint, options: OrdinalOptions = {}): string {
  return guardText(
    () => {
      assertNumericValue(value, 'value', 'getOrdinalSuffix')
      const { locale = en } = options
      return locale.ordinal.suffix(toSafeNumber(value, 'getOrdinalSuffix'))
    },
    [value],
    options,
  )
}

/**
 * Spells out a non-negative integer as a full ordinal word.
 *
 * Uses `options.locale` (defaults to `en`). Unlike {@link toOrdinal}, which only
 * appends the short digit suffix (`"5th"`), this replaces (or transforms)
 * the cardinal reading's relevant word(s) via `locale.ordinal.words`.
 *
 * A `bigint` is accepted like a `number` (a `bigint` is always an integer,
 * so only the sign is checked) and narrowed with `toSafeNumber` for the
 * `number`-only `locale.ordinal.words` hook — see {@link getOrdinalSuffix}.
 * Beyond `Number.MAX_SAFE_INTEGER` it throws `RangeError`; no launch locale
 * can spell a cardinal that large anyway.
 *
 * @example
 * ordinalToWords(3); // "third"
 * ordinalToWords(BigInt(21)); // "twenty-first"
 * ordinalToWords(3, { locale: az }); // "üçüncü"
 *
 * @param value - A non-negative integer, a number or a `bigint`.
 * @param options - The `locale`.
 * @returns The ordinal in words, e.g. `"third"`.
 * @throws {RangeError} When `value` is negative, not an integer, a `bigint`
 * above `Number.MAX_SAFE_INTEGER`, or too large for the locale's words.
 * @since 0.2.0
 */
export function ordinalToWords(value: number | bigint, options: OrdinalOptions = {}): string {
  return guardText(
    () => {
      const isInteger = typeof value === 'bigint' || Number.isInteger(value)
      if (!isInteger || value < 0) {
        throw new RangeError(
          `ordinalToWords: value must be a non-negative integer, received ${value}`,
        )
      }

      const { locale = en } = options
      const safe = toSafeNumber(value, 'ordinalToWords')
      return locale.ordinal.words(safe, numberToWords(safe, { locale }))
    },
    [value],
    options,
  )
}

/**
 * Turns cardinal words into ordinal words.
 *
 * Transforms an already-computed cardinal reading directly into its ordinal
 * form, per `options.locale` (defaults to `en`) — without recomputing the
 * cardinal words via `numberToWords` first. Useful when a caller already has
 * a cardinal string in hand and only needs the ordinal transformation
 * applied to it. Delegates to `locale.ordinal.words`, the same hook
 * {@link ordinalToWords} uses.
 *
 * `locale.ordinal.words` accepts a numeric `value` alongside the cardinal
 * words, in case a locale's ordinal grammar ever needs to know the number
 * itself rather than just its spelled-out form — none of the four launch
 * locales' implementations currently do (see each `locale/*.ts`'s
 * `ordinal.words`, all of which name that parameter `_value`). Since this
 * convenience wrapper only receives the cardinal string, it passes `NaN`
 * through as a placeholder; if a future locale's `ordinal.words` genuinely
 * needs the number, call `locale.ordinal.words(value, cardinalWords)`
 * directly instead of this helper.
 *
 * @example
 * cardinalToOrdinalWords('twenty-one'); // "twenty-first"
 * cardinalToOrdinalWords('iyirmi bir', { locale: az }); // "iyirmi birinci"
 *
 * @param cardinalWords - A cardinal reading, e.g. `"twenty-one"`.
 * @param options - The `locale`.
 * @returns The ordinal reading, e.g. `"twenty-first"`.
 * @throws {SyntaxError} When the locale cannot read the words (`az`: a word
 * with no Azerbaijani vowel).
 * @since 0.2.0
 */
export function cardinalToOrdinalWords(
  cardinalWords: string,
  options: OrdinalOptions = {},
): string {
  return guardText(
    () => {
      const { locale = en } = options
      return locale.ordinal.words(Number.NaN, cardinalWords)
    },
    [],
    options,
  )
}

/**
 * Formats a non-negative integer as a short ordinal.
 *
 * For example, `5` becomes `"5th"` (or, with `{ locale: az }`, `"5-ci"`).
 *
 * The text between the digits and the suffix is the locale's
 * `ordinal.separator` unless `options.separator` says otherwise: `''` for
 * `en`/`enGB`/`es`, `'-'` for `az`/`ru`. Before 0.7.0 it was always `'-'`,
 * which gave the un-English `"3-rd"`. A locale with an `ordinal.prefix`
 * writes it before the digits (Chinese `第`).
 *
 * The separator was a positional second parameter before 0.2.0
 * (`toOrdinal(5, ' ')`); it is now part of the options object alongside
 * `locale`, like every other option in the package.
 *
 * A `bigint` renders its own digits exactly (`toOrdinal(BigInt(101))` is
 * `"101st"`); only the suffix lookup narrows it to a `number`, via
 * {@link getOrdinalSuffix}, so a `bigint` past `Number.MAX_SAFE_INTEGER`
 * throws `RangeError` there.
 *
 * @example
 * toOrdinal(3); // "3rd"
 * toOrdinal(BigInt(3)); // "3rd"
 * toOrdinal(3, { locale: az }); // "3-cü"
 * toOrdinal(3, { locale: ru }); // "3-й"
 * toOrdinal(5, { separator: ' ' }); // "5 th"
 *
 * @param value - A non-negative integer, a number or a `bigint`.
 * @param options - `locale` and the `separator` between digits and suffix.
 * @returns The digits with their suffix, e.g. `"3rd"`.
 * @throws {TypeError} When `value` is not a number or a `bigint`, when
 * `separator` is not a string, or when the locale has no `ordinal.separator`
 * (a locale written against 0.6) and the caller passes none.
 * @throws {RangeError} When `value` is negative, not an integer, not finite,
 * or a `bigint` above `Number.MAX_SAFE_INTEGER`.
 * @since 0.2.0
 */
export function toOrdinal(value: number | bigint, options: ToOrdinalOptions = {}): string {
  return guardText(
    () => {
      assertNumericValue(value, 'value', 'toOrdinal')
      const { locale = en } = options
      const separator = resolveOrdinalSeparator(options.separator, locale)
      const prefix = locale.ordinal.prefix ?? ''
      return `${prefix}${value}${separator}${getOrdinalSuffix(value, { locale })}`
    },
    [value],
    options,
  )
}

/**
 * The separator {@link toOrdinal} writes: the option when given (it must be
 * a string), else the locale's required `ordinal.separator`. Each mistake
 * gets its own `TypeError`, so a bad option is never blamed on the locale.
 */
function resolveOrdinalSeparator(option: unknown, locale: Locale): string {
  if (option !== undefined) {
    if (typeof option !== 'string') {
      throw new TypeError(
        `toOrdinal: separator must be a string, received ${JSON.stringify(option)}`,
      )
    }
    return option
  }
  const fromLocale: unknown = locale.ordinal.separator
  if (typeof fromLocale !== 'string') {
    throw new TypeError(
      `toOrdinal: locale "${locale.code}" has no ordinal.separator (required since 0.7.0); add one, or pass a separator`,
    )
  }
  return fromLocale
}

/**
 * Attaches an arbitrary suffix to a value, e.g. a unit or label.
 *
 * Not
 * locale-dependent — the suffix is caller-supplied text, not derived
 * linguistic data. A `bigint` renders its digits exactly, as a `number` or
 * string does.
 *
 * @example
 * withSuffix(120, 'kg'); // "120 kg"
 * withSuffix(BigInt(120), 'kg'); // "120 kg"
 * withSuffix(5, '-cı', { separator: '' }); // "5-cı"
 *
 * @param value - A number, a `bigint` or a string.
 * @param suffix - The text to write after the value.
 * @param options - The `separator` between value and suffix (default `" "`).
 * @returns The value, the separator and the suffix joined.
 * @throws Nothing: the parts are joined as given.
 * @since 0.2.0
 */
export function withSuffix(
  value: number | string | bigint,
  suffix: string,
  options: SuffixOptions = {},
): string {
  return guardText(
    () => {
      const { separator = ' ' } = options
      return `${value}${separator}${suffix}`
    },
    [value],
    options,
  )
}
