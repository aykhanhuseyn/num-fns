// Internal helpers shared by the scaled formatters and parsers
// (`toShortNotation`/`parseShortNotation` and `toByteSize`/`parseByteSize`).
// Not part of the public API: `src/index.ts` does not export this module.

/** Matches trailing zeros after a decimal point, e.g. the "00" in "2.500". */
const TRAILING_ZEROS_REGEX = /0+$/
/** Matches a decimal point left dangling after trailing zeros are stripped, e.g. "2." */
const TRAILING_DOT_REGEX = /\.$/

/**
 * Removes trailing fraction zeros and a dangling point from a fixed-point
 * string: `"2.500"` gives `"2.5"`, `"2.000"` gives `"2"`. A string with no
 * point is returned unchanged.
 */
export function trimTrailingZeros(fixed: string): string {
  if (!fixed.includes('.')) return fixed
  return fixed.replace(TRAILING_ZEROS_REGEX, '').replace(TRAILING_DOT_REGEX, '')
}

/**
 * Snaps a float to the nearest integer when it is within floating-point
 * rounding distance of one (e.g. `4.1 * 1e12` evaluates to
 * `4099999999999.9995` in JS). A value that is really fractional is
 * returned unchanged.
 */
export function correctFloatingPointNoise(value: number): number {
  const rounded = Math.round(value)
  const tolerance = 1e-9 * Math.max(1, Math.abs(rounded))
  return Math.abs(value - rounded) < tolerance ? rounded : value
}
