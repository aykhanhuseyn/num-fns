import { toDecimal } from '../arithmetic/decimal'
import { round } from '../arithmetic/round'
import { en } from '../locale/en'
import { absBigInt, decimalToBigInt, ONE, resolveOutput, ZERO } from '../shared/bigint'
import { guardNumber } from '../shared/no-throw'
import { guardText } from '../shared/no-throw-text'
import { isSigned } from '../shared/sign'
import type { NumberFormatOptions, NumberParseOptions } from '../shared/types'
import { assertDistinctSeparators, assertNumericValue } from '../shared/validation'

/**
 * Formats a number using `options.locale`'s conventions by default (`en`:
 * comma thousands separator, period decimal separator — pass
 * `{ locale: az }` for the pre-refactor default of a space and a comma).
 * An explicit `thousandsSeparator`/`decimalSeparator` always overrides the
 * locale's default; the two must differ, since a string written with one
 * character for both cannot be parsed back (`RangeError`).
 *
 * `decimals`, when given, is a count of fraction digits to write and must
 * be a non-negative integer (`RangeError` otherwise).
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
  return guardText(
    () => {
      assertNumericValue(value, 'value', 'formatNumber')

      const {
        decimals,
        locale = en,
        thousandsSeparator = locale.formatDefaults.thousandsSeparator,
        decimalSeparator = locale.formatDefaults.decimalSeparator,
        roundingMode = 'halfUp',
      } = options

      assertDistinctSeparators(thousandsSeparator, decimalSeparator, 'formatNumber')
      // `round` would happily take a negative precision (`round(1234, -1)` is
      // `1230`), but a formatter's `decimals` is a count of fraction digits to
      // write, so it is validated here for both input types rather than being
      // left to whatever the split path happens to reject.
      if (decimals !== undefined && (!Number.isInteger(decimals) || decimals < 0)) {
        throw new RangeError(
          `formatNumber: decimals must be a non-negative integer, received ${decimals}`,
        )
      }

      const { isNegative, integerDigits, fractionDigits } =
        typeof value === 'bigint'
          ? splitBigInt(value, decimals)
          : splitNumber(value, decimals, roundingMode)

      const groupedInteger = groupDigits(integerDigits, thousandsSeparator)
      const result = fractionDigits
        ? `${groupedInteger}${decimalSeparator}${fractionDigits}`
        : groupedInteger

      return isNegative ? `-${result}` : result
    },
    [value],
    options,
  )
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
  const split = positionalDigits(Math.abs(rounded))
  const fractionDigits =
    decimals === undefined ? split.fractionDigits : split.fractionDigits.padEnd(decimals, '0')
  return { isNegative: isSigned(rounded), integerDigits: split.integerDigits, fractionDigits }
}

/**
 * The exact positional digits of a non-negative finite number.
 *
 * `String(value)` is not usable here: it switches to exponent notation
 * outside `1e-6 <= |value| < 1e21` (`String(1e21)` is `"1e+21"`), and
 * `toFixed` caps at 100 fraction digits and has the same cliff — either
 * would have `formatNumber(1e21)` emit `"1e+21"` instead of a grouped
 * twenty-two-digit number. There is no magnitude limit on the input
 * (`todo.md` §4's "min/max unlimited" decision), so the digits come from the
 * value's exact shortest decimal via `arithmetic/decimal` and are laid out
 * by scale — lossless at `Number.MAX_VALUE` and `5e-324` alike.
 */
function positionalDigits(absolute: number): { integerDigits: string; fractionDigits: string } {
  const { digits, scale } = toDecimal(absolute)
  const written = digits.toString()
  if (scale <= 0) return { integerDigits: written + '0'.repeat(-scale), fractionDigits: '' }
  const padded = written.padStart(scale + 1, '0')
  return {
    integerDigits: padded.slice(0, padded.length - scale),
    fractionDigits: padded.slice(padded.length - scale),
  }
}

/** A `bigint` has no fraction to round, so `decimals` — already validated by the caller — only pads. */
function splitBigInt(value: bigint, decimals: number | undefined): SplitDigits {
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
  return guardNumber(() => {
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
      decimalSeparator === '.'
        ? withoutThousands
        : withoutThousands.split(decimalSeparator).join('.')

    const numeric = Number(normalized)
    if (Number.isNaN(numeric)) {
      throw new SyntaxError(`parseNumber: unable to parse "${value}" as a number`)
    }
    // `Number("Infinity")` succeeds, and a parser that returned it would be
    // the one place the package hands back a non-finite number (`todo.md` §5).
    if (!Number.isFinite(numeric)) {
      throw new RangeError(`parseNumber: "${value}" is not a finite number`)
    }

    return output === 'bigint' ? parseBigInt(normalized, value) : numeric
  }, options)
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
