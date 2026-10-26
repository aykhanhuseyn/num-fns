import { en } from '../locale/en'
import type { Locale } from '../locale/types'
import {
  absBigInt,
  maxSupportedBigInt,
  pow10,
  resolveOutput,
  scaledBigInt,
  scaleExponent,
  scaleToFixed,
  toOutput,
  toScaleGroups,
  ZERO,
} from '../shared/bigint'
import { guardNumber } from '../shared/no-throw'
import { guardText } from '../shared/no-throw-text'
import {
  delocalizeDigits,
  localizeDigits,
  resolveDigits,
  resolveGrouping,
} from '../shared/numbering'
import { isSigned } from '../shared/sign'
import type {
  LongNotationOptions,
  LongNotationParseOptions,
  ShortNotationOptions,
  ShortNotationParseOptions,
} from '../shared/types'
import { assertGroupSeparator, assertNumericValue } from '../shared/validation'
import { parseNumber } from './format'
import { resolveScaleWord } from './words'

// Maintainer note: `options.locale` was a bare `'az' | 'en'` string until
// the `todo.md` §1 locale refactor folded it into the `Locale` objects.
/**
 * Abbreviates a large number to a short scaled form, e.g. `"1.5K"`.
 *
 * Uses `options.locale`'s `notation.scales` (defaults to `en`:
 * `K`/`M`/`B`/`T`). In 0.2.0 `options.locale` became a `Locale` object
 * (it was a bare `'az' | 'en'` string before).
 *
 * The scaled value is rounded half up to `decimals` places exactly in
 * decimal (`shared/bigint.ts`'s `scaleToFixed`, on the same shortest-decimal
 * reading `arithmetic/round` uses), for a `number` and a `bigint` alike:
 * `toShortNotation(2675000, { decimals: 2 })` is `"2.68M"` as the value is
 * written, where `(2675000 / 1e6).toFixed(2)` gave `"2.67"` because the
 * double is stored just below the tie — and the equal `bigint` formats to
 * the same string, every digit. A value past the largest scale keeps every
 * digit (`"1500T"`, never `"1.5e15"`), and a negative value that rounds to
 * zero (`-0.4`) keeps its sign: `"-0"`, not `"0"`. `decimals` must be a
 * non-negative integer (`RangeError` otherwise).
 *
 * @example
 * toShortNotation(1500); // "1.5K"
 * toShortNotation(1500, { locale: az }); // "1,5 min"
 * toShortNotation(1500n); // "1.5K"
 * toShortNotation(2675000, { decimals: 2 }); // "2.68M"
 *
 * @param value - The number or `bigint` to abbreviate.
 * @param options - `locale`, `decimals` (default 1) and `decimalSeparator`.
 * @returns The scaled value with its short scale word, e.g. `"1.5K"`.
 * @throws {TypeError} When `value` is not a number or a `bigint`.
 * @throws {RangeError} When `value` is not finite, when `decimals` is not a
 * non-negative integer, or when the locale's `digits` are not valid.
 * @since 0.2.0
 */
export function toShortNotation(
  value: number | bigint,
  options: ShortNotationOptions = {},
): string {
  return guardText(() => toShortNotationImpl(value, options), [value], options)
}

/** The body of {@link toShortNotation}, extracted so the `noThrow` wrapper does not nest it. */
function toShortNotationImpl(value: number | bigint, options: ShortNotationOptions): string {
  assertNumericValue(value, 'value', 'toShortNotation')

  const {
    decimals = 1,
    locale = en,
    decimalSeparator = locale.formatDefaults.decimalSeparator,
  } = options
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new RangeError(
      `toShortNotation: decimals must be a non-negative integer, received ${decimals}`,
    )
  }
  const digits = resolveDigits(locale.digits, 'toShortNotation')
  const absolute = typeof value === 'bigint' ? absBigInt(value) : Math.abs(value)

  for (const { threshold, short } of locale.notation.scales) {
    if (absolute >= threshold) {
      const scaled = localizeDigits(
        trimTrailingZeros(scaleToFixed(absolute, threshold, decimals)),
        digits,
      )
      const spacer = locale.notation.spaceBeforeShort ? ' ' : ''
      return `${signFor(value)}${scaled.replace('.', decimalSeparator)}${spacer}${short}`
    }
  }

  const whole = localizeDigits(scaleToFixed(absolute, 1, 0), digits)
  return `${signFor(value)}${whole}`
}

/** `"-"` for any signed value, `-0` included — a magnitude that rounds away to zero still formats as `"-0"`. */
function signFor(value: number | bigint): string {
  return isSigned(value) ? '-' : ''
}

/** Matches trailing zeros after a decimal point, e.g. the "00" in "2.500". */
const TRAILING_ZEROS_REGEX = /0+$/
/** Matches a decimal point left dangling after trailing zeros are stripped, e.g. "2." */
const TRAILING_DOT_REGEX = /\.$/

function trimTrailingZeros(fixed: string): string {
  if (!fixed.includes('.')) return fixed
  return fixed.replace(TRAILING_ZEROS_REGEX, '').replace(TRAILING_DOT_REGEX, '')
}

/**
 * Snaps a float to the nearest integer when it is within floating-point
 * rounding distance of one (e.g. `4.1 * 1e12` evaluates to
 * `4099999999999.9995` in JS), while leaving genuinely fractional values
 * untouched.
 */
function correctFloatingPointNoise(value: number): number {
  const rounded = Math.round(value)
  const tolerance = 1e-9 * Math.max(1, Math.abs(rounded))
  return Math.abs(value - rounded) < tolerance ? rounded : value
}

/**
 * Parses a short scaled form such as `"2.5M"` back into a number.
 *
 * Reads a string produced by {@link toShortNotation} (or an equivalent
 * format) back into a JavaScript number — or, with `{ output: 'bigint' }`,
 * into an exact `bigint`: the mantissa is multiplied by the scale's
 * threshold in decimal, so `"2.5M"` is `2500000n`, and a value that is not a
 * whole number after scaling (`"1.2345K"`) throws `RangeError`.
 *
 * @example
 * parseShortNotation("2.5M"); // 2500000
 * parseShortNotation("2,5 mln", { locale: az }); // 2500000
 * parseShortNotation("2.5M", { output: 'bigint' }); // 2500000n
 *
 * @param value - The text to parse, e.g. `"2.5M"`.
 * @param options - `locale`, `decimalSeparator` and `output: 'bigint'`.
 * @returns The exact value as a `bigint`.
 * @throws {SyntaxError} When `value` is empty or its number cannot be read.
 * @throws {RangeError} When `output` is not `'number'` or `'bigint'`, when
 * the value is not finite, when the locale's `digits` are not valid, or,
 * with `output: 'bigint'`, when the scaled value is not a whole number.
 * @since 0.2.0
 */
export function parseShortNotation(
  value: string,
  options: ShortNotationParseOptions & { output: 'bigint' },
): bigint
/**
 * Parses a short scaled form such as `"2.5M"` back into a number.
 *
 * @param value - The text to parse, e.g. `"2.5M"`.
 * @param options - `locale` and `decimalSeparator`; `output` omitted or `'number'`.
 * @returns The value as a number.
 */
export function parseShortNotation(
  value: string,
  options?: ShortNotationParseOptions & { output?: 'number' },
): number
/**
 * Parses a short scaled form when `output` is only known at run time.
 *
 * @param value - The text to parse, e.g. `"2.5M"`.
 * @param options - `locale`, `decimalSeparator` and an `output` of type `ParseOutput`.
 * @returns A `bigint` for `output: 'bigint'`, otherwise a number.
 */
export function parseShortNotation(
  value: string,
  options: ShortNotationParseOptions,
): number | bigint
export function parseShortNotation(
  value: string,
  options: ShortNotationParseOptions = {},
): number | bigint {
  return guardNumber(() => {
    const { locale = en, decimalSeparator = locale.formatDefaults.decimalSeparator } = options
    const output = resolveOutput(options.output, 'parseShortNotation')

    const trimmed = delocalizeDigits(
      value.trim(),
      resolveDigits(locale.digits, 'parseShortNotation'),
    )
    if (trimmed === '') {
      throw new SyntaxError('parseShortNotation: cannot parse an empty string')
    }

    const spacer = locale.notation.spaceBeforeShort ? ' ' : ''
    const lowerTrimmed = trimmed.toLowerCase()

    for (const { threshold, short } of locale.notation.scales) {
      const suffixToken = `${spacer}${short}`
      const lowerSuffixToken = suffixToken.toLowerCase()
      if (lowerTrimmed.endsWith(lowerSuffixToken)) {
        const numericPart = trimmed.slice(0, trimmed.length - suffixToken.length).trim()
        if (output === 'bigint') {
          return scaledBigInt(numericPart, threshold, decimalSeparator, 'parseShortNotation')
        }
        const numeric = parseNumber(numericPart, { thousandsSeparator: '', decimalSeparator })
        return correctFloatingPointNoise(numeric * threshold)
      }
    }

    return parseNumber(trimmed, { thousandsSeparator: '', decimalSeparator, output })
  }, options)
}

// Maintainer note: the exact `bigint` path is `todo.md` §4's BigInt input path.
/**
 * Expands an integer into digit groups with scale words, e.g. `"1 million 234 thousand 567"`.
 *
 * Pairs each digit group with its scale word (per
 * `options.locale`, defaults to `en`), without spelling every number out —
 * e.g. `1234567` becomes `"1 million 234 thousand 567"`. The groups follow
 * the locale's `words.grouping` (base-1000 unless it says otherwise; Indian
 * `[3, 2]` gives `"12 lakh 34 thousand 567"`), and the digits its `digits`.
 *
 * A `bigint` is expanded exactly at any magnitude — the natural input for a custom locale whose scale words go
 * past `Number.MAX_SAFE_INTEGER`; the same cap as `numberToWords` applies
 * (`1000 ** scales.length - 1` under the default grouping, the matching
 * power of ten under a custom `words.grouping`), computed exactly.
 *
 * @example
 * toLongNotation(1234567); // "1 million 234 thousand 567"
 * toLongNotation(1234567, { locale: az }); // "1 milyon 234 min 567"
 * toLongNotation(BigInt('1234567')); // "1 million 234 thousand 567"
 *
 * @param value - An integer, a number or a `bigint`.
 * @param options - `locale` and the `groupSeparator` (default `" "`).
 * @returns The digit groups with their scale words.
 * @throws {TypeError} When `value` is not a number or a `bigint`, or is a
 * number that is not an integer.
 * @throws {RangeError} When `value` is not finite or is larger than the
 * locale's largest scale supports, when the locale's `words.grouping` or
 * `digits` are not valid, or when `groupSeparator` is empty or contains a
 * digit — either would run a scale word into the next group's digits,
 * producing a string {@link parseLongNotation} cannot read back.
 * @since 0.2.0
 */
export function toLongNotation(value: number | bigint, options: LongNotationOptions = {}): string {
  return guardText(() => toLongNotationImpl(value, options), [value], options)
}

/** The body of {@link toLongNotation}, extracted so the `noThrow` wrapper does not nest it. */
function toLongNotationImpl(value: number | bigint, options: LongNotationOptions): string {
  assertLongNotationInput(value)

  const { groupSeparator = ' ', locale = en } = options

  assertGroupSeparator(groupSeparator, 'toLongNotation')

  const grouping = resolveGrouping(locale.words.grouping, 'locale words.grouping', 'toLongNotation')
  const digits = resolveDigits(locale.digits, 'toLongNotation')
  const absolute = typeof value === 'bigint' ? absBigInt(value) : Math.abs(value)
  const groups = toScaleGroups(absolute, grouping)

  if (groups.length > locale.words.scales.length) {
    const maxSupportedInteger =
      typeof value === 'bigint'
        ? maxSupportedBigInt(locale.words.scales.length, grouping)
        : 10 ** scaleExponent(locale.words.scales.length, grouping) - 1
    throw new RangeError(
      `toLongNotation: value exceeds the maximum supported magnitude of ${maxSupportedInteger}`,
    )
  }
  if (groups.length === 0) return `${signFor(value)}${localizeDigits('0', digits)}`

  const parts: string[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupValue = groups[i] as number
    if (!groupValue) continue
    const scaleEntry = locale.words.scales[i]
    const scaleWord = scaleEntry ? resolveScaleWord(scaleEntry, locale.plural(groupValue)) : ''
    const count = localizeDigits(String(groupValue), digits)
    parts.push(scaleWord ? `${count} ${scaleWord}` : count)
  }

  return `${signFor(value)}${parts.join(groupSeparator)}`
}

/** A `number` must be a finite integer; a `bigint` is one by construction. */
function assertLongNotationInput(value: number | bigint): void {
  assertNumericValue(value, 'value', 'toLongNotation')
  if (typeof value === 'bigint') return
  if (!Number.isInteger(value)) {
    throw new TypeError(`toLongNotation: value must be an integer, received ${value}`)
  }
}

/** Splits a long-notation string into its digit-group and scale-word tokens. */
const WHITESPACE_REGEX = /\s+/
/** Matches a token that is purely digits, i.e. a digit-group count. */
const DIGITS_ONLY_REGEX = /^\d+$/

/**
 * Builds a reverse lookup from every surface form a locale's scale words can
 * take (a plain string, or every value of a plural-category map, e.g.
 * Russian's `тысяча`/`тысячи`/`тысяч` all mapping to scale index `1`) back to
 * its scale index, for {@link parseLongNotation}.
 */
function buildScaleWordIndex(locale: Locale): Map<string, number> {
  const map = new Map<string, number>()
  locale.words.scales.forEach((entry, index) => {
    if (index === 0) return
    if (typeof entry === 'string') {
      if (entry) map.set(entry, index)
    } else {
      for (const form of Object.values(entry)) {
        if (form) map.set(form, index)
      }
    }
  })
  return map
}

/**
 * Parses digit groups with scale words back into a number.
 *
 * Reads a string produced by {@link toLongNotation} (or an equivalent
 * format) back into a JavaScript number — or, with `{ output: 'bigint' }`,
 * into an exact `bigint`.
 *
 * The total is accumulated exactly in `bigint` arithmetic whatever the
 * output, so a `number` result is either exact or a `RangeError`: a string
 * whose value exceeds `Number.MAX_SAFE_INTEGER` (only reachable through a
 * custom locale with scales past a trillion, or an oversized digit group) is
 * refused with a pointer to `output: 'bigint'` rather than rounded.
 *
 * @example
 * parseLongNotation("1 million 234 thousand 567"); // 1234567
 * parseLongNotation("1 milyon 234 min 567", { locale: az }); // 1234567
 * parseLongNotation("1 million 234 thousand 567", { output: 'bigint' }); // 1234567n
 *
 * @param value - The text to parse, e.g. `"1 million 234 thousand 567"`.
 * @param options - `locale`, `groupSeparator` and `output: 'bigint'`.
 * @returns The exact value as a `bigint`.
 * @throws {SyntaxError} When `value` is empty or holds a token that is not a
 * number or a scale word of the locale.
 * @throws {RangeError} When `groupSeparator` is empty or contains a digit,
 * when `output` is not `'number'` or `'bigint'`, when the locale's
 * `words.grouping` or `digits` are not valid, or, for a number result, when
 * the value is above `Number.MAX_SAFE_INTEGER`.
 * @since 0.2.0
 */
export function parseLongNotation(
  value: string,
  options: LongNotationParseOptions & { output: 'bigint' },
): bigint
/**
 * Parses digit groups with scale words back into a number.
 *
 * @param value - The text to parse, e.g. `"1 million 234 thousand 567"`.
 * @param options - `locale` and `groupSeparator`; `output` omitted or `'number'`.
 * @returns The value as a number.
 */
export function parseLongNotation(
  value: string,
  options?: LongNotationParseOptions & { output?: 'number' },
): number
/**
 * Parses digit groups with scale words when `output` is only known at run time.
 *
 * @param value - The text to parse, e.g. `"1 million 234 thousand 567"`.
 * @param options - `locale`, `groupSeparator` and an `output` of type `ParseOutput`.
 * @returns A `bigint` for `output: 'bigint'`, otherwise a number.
 */
export function parseLongNotation(value: string, options: LongNotationParseOptions): number | bigint
export function parseLongNotation(
  value: string,
  options: LongNotationParseOptions = {},
): number | bigint {
  return guardNumber(() => parseLongNotationImpl(value, options), options)
}

/** The body of {@link parseLongNotation}, extracted so the `noThrow` wrapper does not nest it. */
function parseLongNotationImpl(value: string, options: LongNotationParseOptions): number | bigint {
  const { groupSeparator = ' ', locale = en } = options
  const output = resolveOutput(options.output, 'parseLongNotation')

  assertGroupSeparator(groupSeparator, 'parseLongNotation')

  const grouping = resolveGrouping(
    locale.words.grouping,
    'locale words.grouping',
    'parseLongNotation',
  )
  const trimmed = delocalizeDigits(value.trim(), resolveDigits(locale.digits, 'parseLongNotation'))
  if (trimmed === '') {
    throw new SyntaxError('parseLongNotation: cannot parse an empty string')
  }

  const isNegative = trimmed.startsWith('-')
  const body = isNegative ? trimmed.slice(1) : trimmed

  const normalized = body.split(groupSeparator).join(' ')
  const tokens = normalized.split(WHITESPACE_REGEX).filter(Boolean)
  const scaleWordIndex = buildScaleWordIndex(locale)

  let total = ZERO
  let i = 0
  while (i < tokens.length) {
    const countToken = tokens[i] as string
    if (!DIGITS_ONLY_REGEX.test(countToken)) {
      throw new SyntaxError(`parseLongNotation: unable to parse "${value}" as a number`)
    }
    const count = BigInt(countToken)

    const nextToken = tokens[i + 1]
    const scaleIndex = nextToken === undefined ? -1 : (scaleWordIndex.get(nextToken) ?? -1)

    if (scaleIndex > 0) {
      total += count * pow10(scaleExponent(scaleIndex, grouping))
      i += 2
    } else {
      total += count
      i += 1
    }
  }

  // `-0n` does not exist and `toOutput` maps `0n` to `0`, so "-0" parses to plain `0`.
  return toOutput(isNegative ? -total : total, output, 'parseLongNotation')
}
