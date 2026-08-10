import { formatNumber, parseNumber } from '../number/format'
import { DEFAULT_DECIMAL_SEPARATOR, DEFAULT_THOUSANDS_SEPARATOR } from '../shared/constants'
import type {
  PercentageFormatOptions,
  PercentageParseOptions,
  PercentageUnit,
} from '../shared/types'

/** Sign and ratio-to-unit scale factor for each supported `PercentageUnit`. */
const PERCENTAGE_UNITS: Record<PercentageUnit, { sign: string; scale: number }> = {
  percent: { sign: '%', scale: 100 },
  permille: { sign: '‰', scale: 1000 },
  basisPoint: { sign: '‱', scale: 10000 },
}

/**
 * Formats a number as a percentage (or permille/basis-point) string. By
 * default the input is treated as already being expressed in the target
 * unit (`45.5` -> `"45,5%"`); pass `multiplyBy100: true` to format a ratio
 * instead (`0.455` -> `"45,5%"`).
 *
 * @example
 * formatPercentage(45.5); // "45,5%"
 * formatPercentage(0.455, { multiplyBy100: true }); // "45,5%"
 * formatPercentage(45.5, { unit: 'permille' }); // "45,5‰"
 * formatPercentage(125, { unit: 'basisPoint' }); // "125‱"
 */
export function formatPercentage(value: number, options: PercentageFormatOptions = {}): string {
  const {
    decimals = 0,
    thousandsSeparator = DEFAULT_THOUSANDS_SEPARATOR,
    decimalSeparator = DEFAULT_DECIMAL_SEPARATOR,
    roundingMode,
    space = false,
    multiplyBy100 = false,
    unit = 'percent',
  } = options

  const { sign, scale } = PERCENTAGE_UNITS[unit]
  const scaledValue = multiplyBy100 ? value * scale : value
  const formattedNumber = formatNumber(scaledValue, {
    decimals,
    thousandsSeparator,
    decimalSeparator,
    roundingMode,
  })
  return `${formattedNumber}${space ? ' ' : ''}${sign}`
}

/**
 * Parses a percentage (or permille/basis-point) string back into a
 * JavaScript number, stripping the unit sign. Pass `asRatio: true` to
 * divide the result by the unit's scale factor.
 *
 * @example
 * parsePercentage("45,5%"); // 45.5
 * parsePercentage("45,5%", { asRatio: true }); // 0.455
 * parsePercentage("45,5‰", { unit: 'permille', asRatio: true }); // 0.0455
 */
export function parsePercentage(value: string, options: PercentageParseOptions = {}): number {
  const {
    thousandsSeparator = DEFAULT_THOUSANDS_SEPARATOR,
    decimalSeparator = DEFAULT_DECIMAL_SEPARATOR,
    asRatio = false,
    unit = 'percent',
  } = options

  const { sign, scale } = PERCENTAGE_UNITS[unit]
  const withoutSign = value.split(sign).join('').trim()
  const numeric = parseNumber(withoutSign, { thousandsSeparator, decimalSeparator })
  return asRatio ? numeric / scale : numeric
}
