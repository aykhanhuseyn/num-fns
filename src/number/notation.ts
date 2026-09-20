import { en } from '../locale/en'
import type { Locale } from '../locale/types'
import {
  absBigInt,
  maxSupportedBigInt,
  resolveOutput,
  scaledBigInt,
  scaleToFixed,
  THOUSAND,
  toOutput,
  toThousandGroups,
  ZERO,
} from '../shared/bigint'
import { guardNumber } from '../shared/no-throw'
import { guardText } from '../shared/no-throw-text'
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

/**
 * Abbreviates a large number to a short scaled form, using `options.locale`'s
 * `notation.scales` (defaults to `en`: `K`/`M`/`B`/`T`).
 *
 * Before 2026-08-18 `options.locale` was a bare `'az' | 'en'` string,
 * unrelated to the `Locale` objects in `num-fns/locale` (see `CLAUDE.md`'s
 * note on this). It's now folded into the full `Locale` system per the
 * `todo.md` §1 plan.
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
  const absolute = typeof value === 'bigint' ? absBigInt(value) : Math.abs(value)

  for (const { threshold, short } of locale.notation.scales) {
    if (absolute >= threshold) {
      const scaled = trimTrailingZeros(scaleToFixed(absolute, threshold, decimals))
      const spacer = locale.notation.spaceBeforeShort ? ' ' : ''
      return `${signFor(value)}${scaled.replace('.', decimalSeparator)}${spacer}${short}`
    }
  }

  const whole = scaleToFixed(absolute, 1, 0)
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
 * Parses a string produced by {@link toShortNotation} (or an equivalent
 * format) back into a JavaScript number — or, with `{ output: 'bigint' }`,
 * into an exact `bigint`: the mantissa is multiplied by the scale's
 * threshold in decimal, so `"2.5M"` is `2500000n`, and a value that is not a
 * whole number after scaling (`"1.2345K"`) throws `RangeError`.
 *
 * @example
 * parseShortNotation("2.5M"); // 2500000
 * parseShortNotation("2,5 mln", { locale: az }); // 2500000
 * parseShortNotation("2.5M", { output: 'bigint' }); // 2500000n
 */
export function parseShortNotation(
  value: string,
  options: ShortNotationParseOptions & { output: 'bigint' },
): bigint
export function parseShortNotation(
  value: string,
  options?: ShortNotationParseOptions & { output?: 'number' },
): number
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

    const trimmed = value.trim()
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

/**
 * Expands an integer into digit groups paired with their scale word (per
 * `options.locale`, defaults to `en`), without spelling every number out —
 * e.g. `1234567` becomes `"1 million 234 thousand 567"`.
 *
 * A `bigint` is expanded exactly at any magnitude (`todo.md` §4's BigInt
 * input path) — the natural input for a custom locale whose scale words go
 * past `Number.MAX_SAFE_INTEGER`; the same `1000 ** scales.length - 1` cap
 * applies, computed exactly.
 *
 * @example
 * toLongNotation(1234567); // "1 million 234 thousand 567"
 * toLongNotation(1234567, { locale: az }); // "1 milyon 234 min 567"
 * toLongNotation(BigInt('1234567')); // "1 million 234 thousand 567"
 *
 * @throws {RangeError} when `groupSeparator` is empty or contains a digit —
 * either would run a scale word into the next group's digits, producing a
 * string {@link parseLongNotation} cannot read back.
 */
export function toLongNotation(value: number | bigint, options: LongNotationOptions = {}): string {
  return guardText(() => toLongNotationImpl(value, options), [value], options)
}

/** The body of {@link toLongNotation}, extracted so the `noThrow` wrapper does not nest it. */
function toLongNotationImpl(value: number | bigint, options: LongNotationOptions): string {
  assertLongNotationInput(value)

  const { groupSeparator = ' ', locale = en } = options

  assertGroupSeparator(groupSeparator, 'toLongNotation')

  const absolute = typeof value === 'bigint' ? absBigInt(value) : Math.abs(value)
  const groups = toThousandGroups(absolute)

  if (groups.length > locale.words.scales.length) {
    const maxSupportedInteger =
      typeof value === 'bigint'
        ? maxSupportedBigInt(locale.words.scales.length)
        : 1000 ** locale.words.scales.length - 1
    throw new RangeError(
      `toLongNotation: value exceeds the maximum supported magnitude of ${maxSupportedInteger}`,
    )
  }
  if (groups.length === 0) return `${signFor(value)}0`

  const parts: string[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupValue = groups[i] as number
    if (!groupValue) continue
    const scaleEntry = locale.words.scales[i]
    const scaleWord = scaleEntry ? resolveScaleWord(scaleEntry, locale.plural(groupValue)) : ''
    parts.push(scaleWord ? `${groupValue} ${scaleWord}` : `${groupValue}`)
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
 * Parses a string produced by {@link toLongNotation} (or an equivalent
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
 * @throws {RangeError} when `groupSeparator` is empty or contains a digit.
 */
export function parseLongNotation(
  value: string,
  options: LongNotationParseOptions & { output: 'bigint' },
): bigint
export function parseLongNotation(
  value: string,
  options?: LongNotationParseOptions & { output?: 'number' },
): number
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

  const trimmed = value.trim()
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
      total += count * THOUSAND ** BigInt(scaleIndex)
      i += 2
    } else {
      total += count
      i += 1
    }
  }

  // `-0n` does not exist and `toOutput` maps `0n` to `0`, so "-0" parses to plain `0`.
  return toOutput(isNegative ? -total : total, output, 'parseLongNotation')
}
