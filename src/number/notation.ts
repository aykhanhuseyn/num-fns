import { en } from '../locale/en'
import type { Locale } from '../locale/types'
import type {
  LongNotationOptions,
  ShortNotationOptions,
  ShortNotationParseOptions,
} from '../shared/types'
import { parseNumber } from './format'
import { resolveScaleWord } from './words'

/** Short-scale magnitude/abbreviation pairs, largest first. Reused by `locale/az.ts`. */
export const SHORT_SCALES_AZ: ReadonlyArray<readonly [number, string]> = [
  [1e12, 'trln'],
  [1e9, 'mlrd'],
  [1e6, 'mln'],
  [1e3, 'min'],
]

/**
 * Abbreviates a large number to a short scaled form, using `options.locale`'s
 * `notation.scales` (defaults to `en`: `K`/`M`/`B`/`T`).
 *
 * Before 2026-08-18 `options.locale` was a bare `'az' | 'en'` string,
 * unrelated to the `Locale` objects in `num-fns/locale` (see `CLAUDE.md`'s
 * note on this). It's now folded into the full `Locale` system per the
 * `todo.md` §1 plan.
 *
 * @example
 * toShortNotation(1500); // "1.5K"
 * toShortNotation(1500, { locale: az }); // "1,5 min"
 */
export function toShortNotation(value: number, options: ShortNotationOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`toShortNotation: value must be finite, received ${value}`)
  }

  const {
    decimals = 1,
    locale = en,
    decimalSeparator = locale.formatDefaults.decimalSeparator,
  } = options
  const isNegative = value < 0 && value !== 0
  const absolute = Math.abs(value)
  const sign = isNegative ? '-' : ''

  for (const { threshold, short } of locale.notation.scales) {
    if (absolute >= threshold) {
      const scaled = trimTrailingZeros((absolute / threshold).toFixed(decimals)).replace(
        '.',
        decimalSeparator,
      )
      const spacer = locale.notation.spaceBeforeShort ? ' ' : ''
      return `${sign}${scaled}${spacer}${short}`
    }
  }

  return `${sign}${absolute.toFixed(0)}`
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
 * format) back into a JavaScript number.
 *
 * @example
 * parseShortNotation("2.5M"); // 2500000
 * parseShortNotation("2,5 mln", { locale: az }); // 2500000
 */
export function parseShortNotation(value: string, options: ShortNotationParseOptions = {}): number {
  const { locale = en, decimalSeparator = locale.formatDefaults.decimalSeparator } = options

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
      const numeric = parseNumber(numericPart, { thousandsSeparator: '', decimalSeparator })
      return correctFloatingPointNoise(numeric * threshold)
    }
  }

  return parseNumber(trimmed, { thousandsSeparator: '', decimalSeparator })
}

/**
 * Expands an integer into digit groups paired with their scale word (per
 * `options.locale`, defaults to `en`), without spelling every number out —
 * e.g. `1234567` becomes `"1 million 234 thousand 567"`.
 *
 * @example
 * toLongNotation(1234567); // "1 million 234 thousand 567"
 * toLongNotation(1234567, { locale: az }); // "1 milyon 234 min 567"
 */
export function toLongNotation(value: number, options: LongNotationOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`toLongNotation: value must be finite, received ${value}`)
  }
  if (!Number.isInteger(value)) {
    throw new TypeError(`toLongNotation: value must be an integer, received ${value}`)
  }

  const { groupSeparator = ' ', locale = en } = options
  const isNegative = value < 0 && value !== 0
  const absolute = Math.abs(value)
  const maxSupportedInteger = 1000 ** locale.words.scales.length - 1

  if (absolute > maxSupportedInteger) {
    throw new RangeError(
      `toLongNotation: value exceeds the maximum supported magnitude of ${maxSupportedInteger}`,
    )
  }
  if (absolute === 0) return '0'

  const groups: number[] = []
  let remaining = absolute
  while (remaining > 0) {
    groups.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }

  const parts: string[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupValue = groups[i] as number
    if (!groupValue) continue
    const scaleEntry = locale.words.scales[i]
    const scaleWord = scaleEntry ? resolveScaleWord(scaleEntry, locale.plural(groupValue)) : ''
    parts.push(scaleWord ? `${groupValue} ${scaleWord}` : `${groupValue}`)
  }

  return `${isNegative ? '-' : ''}${parts.join(groupSeparator)}`
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
 * format) back into a JavaScript number.
 *
 * @example
 * parseLongNotation("1 million 234 thousand 567"); // 1234567
 * parseLongNotation("1 milyon 234 min 567", { locale: az }); // 1234567
 */
export function parseLongNotation(value: string, options: LongNotationOptions = {}): number {
  const { groupSeparator = ' ', locale = en } = options

  const trimmed = value.trim()
  if (trimmed === '') {
    throw new SyntaxError('parseLongNotation: cannot parse an empty string')
  }

  const isNegative = trimmed.startsWith('-')
  const body = isNegative ? trimmed.slice(1) : trimmed

  if (body === '0') return 0

  const normalized = groupSeparator === '' ? body : body.split(groupSeparator).join(' ')
  const tokens = normalized.split(WHITESPACE_REGEX).filter(Boolean)
  const scaleWordIndex = buildScaleWordIndex(locale)

  let total = 0
  let i = 0
  while (i < tokens.length) {
    const countToken = tokens[i] as string
    if (!DIGITS_ONLY_REGEX.test(countToken)) {
      throw new SyntaxError(`parseLongNotation: unable to parse "${value}" as a number`)
    }
    const count = Number(countToken)

    const nextToken = tokens[i + 1]
    const scaleIndex = nextToken === undefined ? -1 : (scaleWordIndex.get(nextToken) ?? -1)

    if (scaleIndex > 0) {
      total += count * 1000 ** scaleIndex
      i += 2
    } else {
      total += count
      i += 1
    }
  }

  return isNegative ? -total : total
}
