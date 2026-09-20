import { resolveOutput, scaledBigInt, scaleToFixed } from '../shared/bigint'
import { guardNumber } from '../shared/no-throw'
import { guardText } from '../shared/no-throw-text'
import type { ByteSizeOptions, ByteSizeParseOptions } from '../shared/types'
import { assertNumericValue } from '../shared/validation'
import { parseNumber } from './format'

/**
 * Byte-scale exponent/label pairs, largest first — mirrors the descending
 * threshold-scan pattern `toShortNotation` uses for min/mln/mlrd/trln, but
 * keyed by exponent (of `base`) rather than a fixed magnitude, since the
 * magnitude itself depends on the `base` option (1024 vs 1000).
 */
const BYTE_SCALES: ReadonlyArray<readonly [exponent: number, label: string]> = [
  [5, 'PB'],
  [4, 'TB'],
  [3, 'GB'],
  [2, 'MB'],
  [1, 'KB'],
]

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
 * rounding distance of one, while leaving genuinely fractional values
 * untouched. See `toShortNotation`'s parser for the same tolerance-based
 * approach applied to a different scale table.
 */
function correctFloatingPointNoise(value: number): number {
  const rounded = Math.round(value)
  const tolerance = 1e-9 * Math.max(1, Math.abs(rounded))
  return Math.abs(value - rounded) < tolerance ? rounded : value
}

/**
 * Formats a byte count into a human-readable size string, e.g. `1536` becomes
 * `"1.5 KB"`.
 *
 * `base: 1024` (the default) is the conventional binary interpretation of
 * "KB"/"MB" used by most operating systems and file managers; pass
 * `base: 1000` for decimal SI units instead. Either way the labels themselves
 * (`KB`, `MB`, ...) stay the same — only the magnitude they represent changes.
 *
 * A `bigint` is accepted directly — `fs.statSync(path, { bigint: true }).size`
 * is one, and so is any byte count summed past `Number.MAX_SAFE_INTEGER`.
 * Either type is scaled exactly (`shared/bigint.ts`'s `scaleToFixed`):
 * divided by the threshold in integer arithmetic and rounded half up on the
 * true remainder, on the same shortest-decimal reading `arithmetic/round`
 * gives a `number`. So the two paths agree on every digit, ties included —
 * `toByteSize(1005, { base: 1000 })` and `toByteSize(BigInt(1005), { base:
 * 1000 })` are both `"1.01 KB"`, where `(1005 / 1000).toFixed(2)` gave
 * `"1.00"` — and a value past the largest scale keeps every digit
 * (`"1500 PB"`, never `"1.5e3 PB"`). A negative `bigint` is refused like a
 * negative `number`, and `decimals` must be a non-negative integer
 * (`RangeError` otherwise).
 *
 * @example
 * toByteSize(1536); // "1.5 KB"
 * toByteSize(1500, { base: 1000 }); // "1.5 KB"
 * toByteSize(500); // "500 B"
 * toByteSize(BigInt(1536)); // "1.5 KB"
 */
export function toByteSize(bytes: number | bigint, options: ByteSizeOptions = {}): string {
  return guardText(
    () => {
      assertNumericValue(bytes, 'bytes', 'toByteSize')
      if (bytes < 0) {
        throw new RangeError(`toByteSize: bytes must not be negative, received ${bytes}`)
      }

      const { decimals = 2, base = 1024, decimalSeparator = '.' } = options
      if (!Number.isInteger(decimals) || decimals < 0) {
        throw new RangeError(
          `toByteSize: decimals must be a non-negative integer, received ${decimals}`,
        )
      }

      for (const [exponent, label] of BYTE_SCALES) {
        const threshold = base ** exponent
        if (bytes >= threshold) {
          const scaled = trimTrailingZeros(scaleToFixed(bytes, threshold, decimals))
          return `${scaled.replace('.', decimalSeparator)} ${label}`
        }
      }

      return `${scaleToFixed(bytes, 1, 0)} B`
    },
    [bytes],
    options,
  )
}

/**
 * Parses a string produced by {@link toByteSize} (or an equivalent format,
 * with or without a space before the unit) back into a byte count — or, with
 * `{ output: 'bigint' }`, into an exact `bigint`: the size is multiplied by
 * the unit's threshold in decimal, so `"1.5 KB"` is `1536n` and `"2.5 KB"`
 * at `base: 1000` is `2500n`, while a size that is not a whole number of
 * bytes (`"1.7 KB"`, 1740.8 bytes) throws `RangeError` rather than being
 * truncated. The plain-byte forms (`"500 B"`, `"500"`) go through
 * {@link parseNumber} with the same `output`.
 *
 * `options.base` must match the base the string was formatted with —
 * `toByteSize`'s output doesn't disambiguate binary from decimal units, so
 * the caller has to know which convention produced the string.
 *
 * @example
 * parseByteSize("1.5 KB"); // 1536
 * parseByteSize("1.5KB", { base: 1000 }); // 1500
 * parseByteSize("500 B"); // 500
 * parseByteSize("1.5 KB", { output: 'bigint' }); // 1536n
 */
export function parseByteSize(
  value: string,
  options: ByteSizeParseOptions & { output: 'bigint' },
): bigint
export function parseByteSize(
  value: string,
  options?: ByteSizeParseOptions & { output?: 'number' },
): number
export function parseByteSize(value: string, options: ByteSizeParseOptions): number | bigint
export function parseByteSize(value: string, options: ByteSizeParseOptions = {}): number | bigint {
  return guardNumber(() => {
    const { base = 1024, decimalSeparator = '.' } = options
    const output = resolveOutput(options.output, 'parseByteSize')

    const trimmed = value.trim()
    if (trimmed === '') {
      throw new SyntaxError('parseByteSize: cannot parse an empty string')
    }

    const lowerTrimmed = trimmed.toLowerCase()

    for (const [exponent, label] of BYTE_SCALES) {
      const lowerLabel = label.toLowerCase()
      if (lowerTrimmed.endsWith(lowerLabel)) {
        const numericPart = trimmed.slice(0, trimmed.length - label.length).trim()
        if (output === 'bigint') {
          return scaledBigInt(numericPart, base ** exponent, decimalSeparator, 'parseByteSize')
        }
        const numeric = parseNumber(numericPart, { thousandsSeparator: '', decimalSeparator })
        return correctFloatingPointNoise(numeric * base ** exponent)
      }
    }

    if (lowerTrimmed.endsWith('b')) {
      const numericPart = trimmed.slice(0, trimmed.length - 1).trim()
      return parseNumber(numericPart, { thousandsSeparator: '', decimalSeparator, output })
    }

    return parseNumber(trimmed, { thousandsSeparator: '', decimalSeparator, output })
  }, options)
}
