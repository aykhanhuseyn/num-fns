import type {
  LongNotationOptions,
  ShortNotationOptions,
  ShortNotationParseOptions,
} from '../shared/types'
import { parseNumber } from './format'
import { SCALE_WORDS } from './words'

/** Short-scale magnitude/abbreviation pairs, largest first. Reused by `locale/az.ts`. */
export const SHORT_SCALES_AZ: ReadonlyArray<readonly [number, string]> = [
  [1e12, 'trln'],
  [1e9, 'mlrd'],
  [1e6, 'mln'],
  [1e3, 'min'],
]

const SHORT_SCALES_EN: ReadonlyArray<readonly [number, string]> = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
]

/**
 * Abbreviates a large number to a short scaled form.
 *
 * @example
 * toShortNotation(1500); // "1,5 min"
 * toShortNotation(2500000, { locale: 'en' }); // "2.5M"
 */
export function toShortNotation(value: number, options: ShortNotationOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`toShortNotation: value must be finite, received ${value}`)
  }

  const { decimals = 1, locale = 'az', decimalSeparator = locale === 'az' ? ',' : '.' } = options
  const isNegative = value < 0 && value !== 0
  const absolute = Math.abs(value)
  const scales = locale === 'az' ? SHORT_SCALES_AZ : SHORT_SCALES_EN
  const sign = isNegative ? '-' : ''

  for (const [threshold, suffix] of scales) {
    if (absolute >= threshold) {
      const scaled = trimTrailingZeros((absolute / threshold).toFixed(decimals)).replace(
        '.',
        decimalSeparator,
      )
      const spacer = locale === 'az' ? ' ' : ''
      return `${sign}${scaled}${spacer}${suffix}`
    }
  }

  return `${sign}${absolute.toFixed(0)}`
}

function trimTrailingZeros(fixed: string): string {
  if (!fixed.includes('.')) return fixed
  return fixed.replace(/0+$/, '').replace(/\.$/, '')
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
 * parseShortNotation("2,5 mln"); // 2500000
 * parseShortNotation("2.5M", { locale: 'en' }); // 2500000
 */
export function parseShortNotation(value: string, options: ShortNotationParseOptions = {}): number {
  const { locale = 'az', decimalSeparator = locale === 'az' ? ',' : '.' } = options

  const trimmed = value.trim()
  if (trimmed === '') {
    throw new SyntaxError('parseShortNotation: cannot parse an empty string')
  }

  const scales = locale === 'az' ? SHORT_SCALES_AZ : SHORT_SCALES_EN
  const lowerTrimmed = trimmed.toLowerCase()

  for (const [threshold, suffix] of scales) {
    const suffixToken = locale === 'az' ? ` ${suffix}` : suffix
    const lowerSuffixToken = suffixToken.toLowerCase()
    if (lowerTrimmed.endsWith(lowerSuffixToken)) {
      const numericPart = trimmed.slice(0, trimmed.length - suffixToken.length).trim()
      const numeric = parseNumber(numericPart, { thousandsSeparator: '', decimalSeparator })
      return correctFloatingPointNoise(numeric * threshold)
    }
  }

  return parseNumber(trimmed, { thousandsSeparator: '', decimalSeparator })
}

const MAX_SUPPORTED_INTEGER = 1000 ** SCALE_WORDS.length - 1

/**
 * Expands an integer into digit groups paired with their Azerbaijani scale
 * word, without spelling every number out — e.g. `1234567` becomes
 * `"1 milyon 234 min 567"`.
 *
 * @example
 * toLongNotation(1234567); // "1 milyon 234 min 567"
 */
export function toLongNotation(value: number, options: LongNotationOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`toLongNotation: value must be finite, received ${value}`)
  }
  if (!Number.isInteger(value)) {
    throw new TypeError(`toLongNotation: value must be an integer, received ${value}`)
  }

  const { groupSeparator = ' ' } = options
  const isNegative = value < 0 && value !== 0
  const absolute = Math.abs(value)

  if (absolute > MAX_SUPPORTED_INTEGER) {
    throw new RangeError(
      `toLongNotation: value exceeds the maximum supported magnitude of ${MAX_SUPPORTED_INTEGER}`,
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
    const groupValue = groups[i]
    if (!groupValue) continue
    const scaleWord = SCALE_WORDS[i]
    parts.push(scaleWord ? `${groupValue} ${scaleWord}` : `${groupValue}`)
  }

  return `${isNegative ? '-' : ''}${parts.join(groupSeparator)}`
}

/**
 * Parses a string produced by {@link toLongNotation} (or an equivalent
 * format) back into a JavaScript number.
 *
 * @example
 * parseLongNotation("1 milyon 234 min 567"); // 1234567
 */
export function parseLongNotation(value: string, options: LongNotationOptions = {}): number {
  const { groupSeparator = ' ' } = options

  const trimmed = value.trim()
  if (trimmed === '') {
    throw new SyntaxError('parseLongNotation: cannot parse an empty string')
  }

  const isNegative = trimmed.startsWith('-')
  const body = isNegative ? trimmed.slice(1) : trimmed

  if (body === '0') return 0

  const normalized = groupSeparator === '' ? body : body.split(groupSeparator).join(' ')
  const tokens = normalized.split(/\s+/).filter(Boolean)

  let total = 0
  let i = 0
  while (i < tokens.length) {
    const countToken = tokens[i] as string
    if (!/^\d+$/.test(countToken)) {
      throw new SyntaxError(`parseLongNotation: unable to parse "${value}" as a number`)
    }
    const count = Number(countToken)

    const nextToken = tokens[i + 1]
    const scaleIndex = nextToken === undefined ? -1 : SCALE_WORDS.indexOf(nextToken)

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
