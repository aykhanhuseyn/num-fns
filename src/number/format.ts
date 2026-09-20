import { round } from '../arithmetic/round'
import { en } from '../locale/en'
import { absBigInt, decimalToBigInt, ONE, resolveOutput, ZERO } from '../shared/bigint'
import { isSigned } from '../shared/sign'
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
 * A `bigint` is formatted exactly at any magnitude — its digits are grouped
 * as written, never converted to a `number` — and `decimals` pads it with
 * zeros (`formatNumber(10n, { decimals: 2 })` is `"10.00"`); `roundingMode`
 * has nothing to round and is ignored.
 *
 * The sign of a zero is kept: `formatNumber(-0)` is `"-0"`, and so is a
 * negative value that rounds away to zero (`formatNumber(-0.4, { decimals: 0 })`).
 * `-0n` does not exist, so a `bigint` zero is always `"0"`.
 *
 * @example
 * formatNumber(1234567.891, { decimals: 2 }); // "1,234,567.89"
 * formatNumber(1234567.891, { decimals: 2, locale: az }); // "1 234 567,89"
 * formatNumber(1.005, { decimals: 2 }); // "1.01"
 * formatNumber(-1.5, { decimals: 0, roundingMode: 'ceil' }); // "-1"
 * formatNumber(1234567890123456789n); // "1,234,567,890,123,456,789"
 */
export function formatNumber(value: number | bigint, options: NumberFormatOptions = {}): string {
  if (typeof value === 'number' && !Number.isFinite(value)) {
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

  const { isNegative, integerDigits, fractionDigits } =
    typeof value === 'bigint'
      ? splitBigInt(value, decimals)
      : splitNumber(value, decimals, roundingMode)

  const groupedInteger = groupDigits(integerDigits, thousandsSeparator)
  const result = fractionDigits
    ? `${groupedInteger}${decimalSeparator}${fractionDigits}`
    : groupedInteger

  return isNegative ? `-${result}` : result
}

/** The sign and the plain integer/fraction digit strings a value formats to, before any separators are applied. */
interface SplitDigits {
  isNegative: boolean
  integerDigits: string
  fractionDigits: string
}

function splitNumber(
  value: number,
  decimals: number | undefined,
  roundingMode: NonNullable<NumberFormatOptions['roundingMode']>,
): SplitDigits {
  // `round` keeps the sign of a value that rounds away to zero, so `-0.4` at
  // `decimals: 0` stays negative and formats as "-0".
  const rounded = decimals === undefined ? value : round(value, decimals, roundingMode)
  const absolute = Math.abs(rounded)
  // `toFixed` is safe here only because the value has already been rounded:
  // once its shortest decimal form has at most `decimals` fraction digits,
  // `toFixed(decimals)` reproduces that form exactly (padding with zeros) —
  // the "1.005 -> 1.00" trap only bites when toFixed has to drop digits.
  const fixed = decimals === undefined ? String(absolute) : absolute.toFixed(decimals)
  const [integerDigits = '0', fractionDigits = ''] = fixed.split('.')
  return { isNegative: isSigned(rounded), integerDigits, fractionDigits }
}

/**
 * A `bigint` has no fraction to round, so `decimals` only pads — but it is
 * validated the same way `round` validates it for a `number`, so the two
 * paths reject the same option values.
 */
function splitBigInt(value: bigint, decimals: number | undefined): SplitDigits {
  if (decimals !== undefined && (!Number.isInteger(decimals) || decimals < 0)) {
    throw new RangeError(
      `formatNumber: decimals must be a non-negative integer, received ${decimals}`,
    )
  }
  return {
    isNegative: value < ZERO,
    integerDigits: absBigInt(value).toString(),
    fractionDigits: decimals ? '0'.repeat(decimals) : '',
  }
}

/**
 * Parses a string produced by {@link formatNumber} (or an equivalent format)
 * back into a JavaScript number — or, with `{ output: 'bigint' }`, into an
 * exact `bigint` (the string must then be a whole number: `"1,234.00"` is
 * `1234n`, `"1.5"` throws `RangeError`).
 *
 * @example
 * parseNumber("1,234,567.89"); // 1234567.89
 * parseNumber("1 234 567,89", { locale: az }); // 1234567.89
 * parseNumber("1,234,567,890,123,456,789", { output: 'bigint' }); // 1234567890123456789n
 *
 * @throws {RangeError} when `thousandsSeparator` equals `decimalSeparator`,
 * which would strip both and silently return the wrong number.
 */
export function parseNumber(
  value: string,
  options: NumberParseOptions & { output: 'bigint' },
): bigint
export function parseNumber(
  value: string,
  options?: NumberParseOptions & { output?: 'number' },
): number
export function parseNumber(value: string, options: NumberParseOptions): number | bigint
export function parseNumber(value: string, options: NumberParseOptions = {}): number | bigint {
  const {
    locale = en,
    thousandsSeparator = locale.formatDefaults.thousandsSeparator,
    decimalSeparator = locale.formatDefaults.decimalSeparator,
  } = options
  const output = resolveOutput(options.output, 'parseNumber')

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

  return output === 'bigint' ? parseBigInt(normalized, value) : numeric
}

/**
 * The `output: 'bigint'` tail of {@link parseNumber}: reads the normalized
 * (period-decimal, separator-free) text exactly. `Number()` has already
 * accepted it, so a `null` from `decimalToBigInt` means a non-decimal form
 * `Number()` tolerates and a `bigint` cannot hold (`"Infinity"`, `"0x1f"`).
 */
function parseBigInt(normalized: string, original: string): bigint {
  const parsed = decimalToBigInt(normalized, ONE, 'parseNumber')
  if (parsed === null) {
    throw new RangeError(
      `parseNumber: "${original}" is not a whole number and cannot be returned as a bigint`,
    )
  }
  return parsed
}

function groupDigits(digits: string, separator: string): string {
  if (separator === '') return digits
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
}

function removeAll(value: string, token: string): string {
  if (token === '') return value
  return value.split(token).join('')
}
