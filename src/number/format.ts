import { round } from '../arithmetic/round'
import { en } from '../locale/en'
import type { NumberFormatOptions, NumberParseOptions } from '../shared/types'
import { assertDistinctSeparators } from '../shared/validation'

/**
 * Formats a number using `options.locale`'s conventions by default (`en`:
 * comma thousands separator, period decimal separator — pass
 * `{ locale: az }` for the pre-refactor default of a space and a comma).
 * An explicit `thousandsSeparator`/`decimalSeparator` always overrides the
 * locale's default; the two must differ, since a string written with one
 * character for both cannot be parsed back (`RangeError`).
 *
 * Rounding to `decimals` is decimal-safe: it delegates to
 * {@link round} (`arithmetic/round`), which rounds the value as written
 * rather than as the binary float happens to be stored, so
 * `formatNumber(1.005, { decimals: 2 })` is `"1.01"` where `toFixed` gives
 * `"1.00"`. Every `roundingMode` goes through the same implementation.
 * `decimals` must therefore be an integer (`RangeError` otherwise).
 *
 * @example
 * formatNumber(1234567.891, { decimals: 2 }); // "1,234,567.89"
 * formatNumber(1234567.891, { decimals: 2, locale: az }); // "1 234 567,89"
 * formatNumber(1.005, { decimals: 2 }); // "1.01"
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

  // `round` never returns -0, so a value that rounds to zero formats as "0".
  const rounded = decimals === undefined ? value : round(value, decimals, roundingMode)
  const isNegative = rounded < 0
  const absolute = Math.abs(rounded)
  // `toFixed` is safe here only because the value has already been rounded:
  // once its shortest decimal form has at most `decimals` fraction digits,
  // `toFixed(decimals)` reproduces that form exactly (padding with zeros) —
  // the "1.005 -> 1.00" trap only bites when toFixed has to drop digits.
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

function groupDigits(digits: string, separator: string): string {
  if (separator === '') return digits
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
}

function removeAll(value: string, token: string): string {
  if (token === '') return value
  return value.split(token).join('')
}
