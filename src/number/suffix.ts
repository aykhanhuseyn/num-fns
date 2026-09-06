import { en } from '../locale/en'
import { toSafeNumber } from '../shared/bigint'
import type { OrdinalOptions, SuffixOptions, ToOrdinalOptions } from '../shared/types'
import { numberToWords } from './words'

/**
 * Returns the ordinal suffix for a non-negative integer, per `options.locale`
 * (defaults to `en`: `'st'`/`'nd'`/`'rd'`/`'th'`). Delegates to
 * `locale.ordinal.suffix`, which each locale implements itself — Azerbaijani
 * vowel harmony (`locale/az.ts`), Spanish's invariant `'º'`, and so on.
 *
 * Before 2026-08-18 this was hardcoded Azerbaijani vowel-harmony logic; that
 * logic now lives in `locale/az.ts` as the `az.ordinal.suffix` implementation
 * (see its doc comment) rather than here, since it's Azerbaijani-specific
 * data, not a generic algorithm.
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
 */
export function getOrdinalSuffix(value: number | bigint, options: OrdinalOptions = {}): string {
  const { locale = en } = options
  return locale.ordinal.suffix(toSafeNumber(value, 'getOrdinalSuffix'))
}

/**
 * Spells out a non-negative integer as a full ordinal word, per
 * `options.locale` (defaults to `en`). Unlike {@link toOrdinal}, which only
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
 */
export function ordinalToWords(value: number | bigint, options: OrdinalOptions = {}): string {
  const isInteger = typeof value === 'bigint' || Number.isInteger(value)
  if (!isInteger || value < 0) {
    throw new RangeError(`ordinalToWords: value must be a non-negative integer, received ${value}`)
  }

  const { locale = en } = options
  const safe = toSafeNumber(value, 'ordinalToWords')
  return locale.ordinal.words(safe, numberToWords(safe, { locale }))
}

/**
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
 */
export function cardinalToOrdinalWords(
  cardinalWords: string,
  options: OrdinalOptions = {},
): string {
  const { locale = en } = options
  return locale.ordinal.words(Number.NaN, cardinalWords)
}

/**
 * Formats a non-negative integer as a short ordinal, e.g. `5` becomes
 * `"5th"` (or, with `{ locale: az }`, `"5-ci"`).
 *
 * Before 2026-08-18 the separator was a positional second parameter
 * (`toOrdinal(5, ' ')`); it's now part of the options object alongside
 * `locale`, matching the rest of the package's "consistent options object"
 * convention (`CLAUDE.md`'s Package Design Principles) now that this
 * function has more than one optional parameter.
 *
 * A `bigint` renders its own digits exactly (`toOrdinal(BigInt(101))` is
 * `"101-st"`); only the suffix lookup narrows it to a `number`, via
 * {@link getOrdinalSuffix}, so a `bigint` past `Number.MAX_SAFE_INTEGER`
 * throws `RangeError` there.
 *
 * @example
 * toOrdinal(3); // "3-rd"
 * toOrdinal(BigInt(3)); // "3-rd"
 * toOrdinal(3, { locale: az }); // "3-cü"
 * toOrdinal(5, { separator: ' ' }); // "5 th"
 */
export function toOrdinal(value: number | bigint, options: ToOrdinalOptions = {}): string {
  const { separator = '-', locale } = options
  return `${value}${separator}${getOrdinalSuffix(value, { locale })}`
}

/**
 * Attaches an arbitrary suffix to a value, e.g. a unit or label. Not
 * locale-dependent — the suffix is caller-supplied text, not derived
 * linguistic data. A `bigint` renders its digits exactly, as a `number` or
 * string does.
 *
 * @example
 * withSuffix(120, 'kg'); // "120 kg"
 * withSuffix(BigInt(120), 'kg'); // "120 kg"
 * withSuffix(5, '-cı', { separator: '' }); // "5-cı"
 */
export function withSuffix(
  value: number | string | bigint,
  suffix: string,
  options: SuffixOptions = {},
): string {
  const { separator = ' ' } = options
  return `${value}${separator}${suffix}`
}
