import { formatNumber, parseNumber } from '../number/format'
import { DEFAULT_DECIMAL_SEPARATOR, DEFAULT_THOUSANDS_SEPARATOR } from '../shared/constants'
import type { PercentageFormatOptions, PercentageParseOptions } from '../shared/types'

/**
 * Formats a number as a percentage string. By default the input is treated
 * as already being a percentage value (`45.5` -> `"45,5%"`); pass
 * `multiplyBy100: true` to format a ratio instead (`0.455` -> `"45,5%"`).
 *
 * @example
 * formatPercentage(45.5); // "45,5%"
 * formatPercentage(0.455, { multiplyBy100: true }); // "45,5%"
 */
export function formatPercentage(value: number, options: PercentageFormatOptions = {}): string {
  const {
    decimals = 0,
    thousandsSeparator = DEFAULT_THOUSANDS_SEPARATOR,
    decimalSeparator = DEFAULT_DECIMAL_SEPARATOR,
    space = false,
    multiplyBy100 = false,
  } = options

  const percentValue = multiplyBy100 ? value * 100 : value
  const formattedNumber = formatNumber(percentValue, {
    decimals,
    thousandsSeparator,
    decimalSeparator,
  })
  return `${formattedNumber}${space ? ' ' : ''}%`
}

/**
 * Parses a percentage string back into a JavaScript number, stripping the
 * `%` sign. Pass `asRatio: true` to divide the result by 100.
 *
 * @example
 * parsePercentage("45,5%"); // 45.5
 * parsePercentage("45,5%", { asRatio: true }); // 0.455
 */
export function parsePercentage(value: string, options: PercentageParseOptions = {}): number {
  const {
    thousandsSeparator = DEFAULT_THOUSANDS_SEPARATOR,
    decimalSeparator = DEFAULT_DECIMAL_SEPARATOR,
    asRatio = false,
  } = options

  const withoutPercent = value.split('%').join('').trim()
  const numeric = parseNumber(withoutPercent, { thousandsSeparator, decimalSeparator })
  return asRatio ? numeric / 100 : numeric
}
