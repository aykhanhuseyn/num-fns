import { en } from '../locale/en'
import type { NumberFormatOptions, NumberParseOptions, RoundingMode } from '../shared/types'
import { assertDistinctSeparators } from '../shared/validation'

/**
 * Formats a number using `options.locale`'s conventions by default (`en`:
 * comma thousands separator, period decimal separator — pass
 * `{ locale: az }` for the pre-refactor default of a space and a comma).
 * An explicit `thousandsSeparator`/`decimalSeparator` always overrides the
 * locale's default; the two must differ, since a string written with one
 * character for both cannot be parsed back (`RangeError`).
 *
 * @example
 * formatNumber(1234567.891, { decimals: 2 }); // "1,234,567.89"
 * formatNumber(1234567.891, { decimals: 2, locale: az }); // "1 234 567,89"
 * formatNumber(-1.5, { decimals: 0, roundingMode: 'ceil' }); // "-1"
 */
export function formatNumber(value: number, options: NumberFormatOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`formatNumber: value must be finite, received ${value}`)
  }

  const {
    decimals,
    locale = en,
    thousandsSeparator = locale.formatDefaults.thousandsSeparator,
    decimalSeparator = locale.formatDefaults.decimalSeparator,
    roundingMode = 'halfUp',
  } = options

  assertDistinctSeparators(thousandsSeparator, decimalSeparator, 'formatNumber')

  const rounded = decimals === undefined ? value : roundToDecimals(value, decimals, roundingMode)
  const isNegative = rounded < 0 && rounded !== 0
  const absolute = Math.abs(rounded)
  const fixed = decimals === undefined ? String(absolute) : absolute.toFixed(decimals)
  const [integerDigits, fractionDigits] = fixed.split('.')

  const groupedInteger = groupDigits(integerDigits ?? '0', thousandsSeparator)
  const result = fractionDigits
    ? `${groupedInteger}${decimalSeparator}${fractionDigits}`
    : groupedInteger

  return isNegative ? `-${result}` : result
}

/**
 * Parses a string produced by {@link formatNumber} (or an equivalent format)
 * back into a JavaScript number.
 *
 * @example
 * parseNumber("1,234,567.89"); // 1234567.89
 * parseNumber("1 234 567,89", { locale: az }); // 1234567.89
 *
 * @throws {RangeError} when `thousandsSeparator` equals `decimalSeparator`,
 * which would strip both and silently return the wrong number.
 */
export function parseNumber(value: string, options: NumberParseOptions = {}): number {
  const {
    locale = en,
    thousandsSeparator = locale.formatDefaults.thousandsSeparator,
    decimalSeparator = locale.formatDefaults.decimalSeparator,
  } = options

  assertDistinctSeparators(thousandsSeparator, decimalSeparator, 'parseNumber')

  const trimmed = value.trim()
  if (trimmed === '') {
    throw new SyntaxError('parseNumber: cannot parse an empty string')
  }

  const withoutThousands = removeAll(trimmed, thousandsSeparator)
  const normalized =
    decimalSeparator === '.' ? withoutThousands : withoutThousands.split(decimalSeparator).join('.')

  const numeric = Number(normalized)
  if (Number.isNaN(numeric)) {
    throw new SyntaxError(`parseNumber: unable to parse "${value}" as a number`)
  }

  return numeric
}

/**
 * Rounds `value` to `decimals` fractional digits per `mode`. Operates on the
 * signed value (not its absolute value) so `'ceil'`/`'floor'` have their
 * standard directional meaning for negative inputs.
 */
function roundToDecimals(value: number, decimals: number, mode: RoundingMode): number {
  if (mode === 'halfUp') {
    // toFixed already implements round-half-away-from-zero for the vast
    // majority of inputs; reusing it keeps this the default, zero-risk path.
    return Number(value.toFixed(decimals))
  }

  const factor = 10 ** decimals
  const scaled = value * factor

  if (mode === 'ceil') return Math.ceil(scaled) / factor
  if (mode === 'floor') return Math.floor(scaled) / factor

  const sign = scaled < 0 ? -1 : 1
  const magnitude = Math.abs(scaled)
  const roundedMagnitude = roundTieMagnitude(magnitude, mode)

  return (sign * roundedMagnitude) / factor
}

/** Rounds a non-negative magnitude for the two tie-breaking modes: half-down (toward zero) and half-even (banker's rounding). */
function roundTieMagnitude(magnitude: number, mode: 'halfDown' | 'halfEven'): number {
  const flooredMagnitude = Math.floor(magnitude)
  const fraction = magnitude - flooredMagnitude

  if (fraction > 0.5) return flooredMagnitude + 1
  if (fraction < 0.5) return flooredMagnitude
  if (mode === 'halfDown') return flooredMagnitude

  // halfEven: an exact tie rounds to the nearest even digit.
  return flooredMagnitude % 2 === 0 ? flooredMagnitude : flooredMagnitude + 1
}

function groupDigits(digits: string, separator: string): string {
  if (separator === '') return digits
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
}

function removeAll(value: string, token: string): string {
  if (token === '') return value
  return value.split(token).join('')
}
