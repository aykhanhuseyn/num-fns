import type { ByteSizeOptions, ByteSizeParseOptions } from '../shared/types'
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
 * @example
 * toByteSize(1536); // "1.5 KB"
 * toByteSize(1500, { base: 1000 }); // "1.5 KB"
 * toByteSize(500); // "500 B"
 */
export function toByteSize(bytes: number, options: ByteSizeOptions = {}): string {
  if (!Number.isFinite(bytes)) {
    throw new RangeError(`toByteSize: bytes must be finite, received ${bytes}`)
  }
  if (bytes < 0) {
    throw new RangeError(`toByteSize: bytes must not be negative, received ${bytes}`)
  }

  const { decimals = 2, base = 1024, decimalSeparator = '.' } = options

  for (const [exponent, label] of BYTE_SCALES) {
    const threshold = base ** exponent
    if (bytes >= threshold) {
      const scaled = trimTrailingZeros((bytes / threshold).toFixed(decimals)).replace(
        '.',
        decimalSeparator,
      )
      return `${scaled} ${label}`
    }
  }

  return `${bytes.toFixed(0)} B`
}

/**
 * Parses a string produced by {@link toByteSize} (or an equivalent format,
 * with or without a space before the unit) back into a byte count.
 *
 * `options.base` must match the base the string was formatted with —
 * `toByteSize`'s output doesn't disambiguate binary from decimal units, so
 * the caller has to know which convention produced the string.
 *
 * @example
 * parseByteSize("1.5 KB"); // 1536
 * parseByteSize("1.5KB", { base: 1000 }); // 1500
 * parseByteSize("500 B"); // 500
 */
export function parseByteSize(value: string, options: ByteSizeParseOptions = {}): number {
  const { base = 1024, decimalSeparator = '.' } = options

  const trimmed = value.trim()
  if (trimmed === '') {
    throw new SyntaxError('parseByteSize: cannot parse an empty string')
  }

  const lowerTrimmed = trimmed.toLowerCase()

  for (const [exponent, label] of BYTE_SCALES) {
    const lowerLabel = label.toLowerCase()
    if (lowerTrimmed.endsWith(lowerLabel)) {
      const numericPart = trimmed.slice(0, trimmed.length - label.length).trim()
      const numeric = parseNumber(numericPart, { thousandsSeparator: '', decimalSeparator })
      return correctFloatingPointNoise(numeric * base ** exponent)
    }
  }

  if (lowerTrimmed.endsWith('b')) {
    const numericPart = trimmed.slice(0, trimmed.length - 1).trim()
    return parseNumber(numericPart, { thousandsSeparator: '', decimalSeparator })
  }

  return parseNumber(trimmed, { thousandsSeparator: '', decimalSeparator })
}
