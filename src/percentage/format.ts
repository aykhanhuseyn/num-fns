import { divide } from '../arithmetic/divide'
import { multiply } from '../arithmetic/multiply'
import { en } from '../locale/en'
import { formatNumber, parseNumber } from '../number/format'
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
 * unit (`45.5` -> `"45.5%"`); pass `multiplyBy100: true` to format a ratio
 * instead (`0.455` -> `"45.5%"`).
 *
 * Both the scaling and the rounding are decimal-safe: the ratio is scaled
 * with `multiply` (`arithmetic/multiply`), so `1.005` becomes exactly
 * `100.5` rather than `100.49999999999999`, and `formatNumber` then rounds
 * via `round` — `formatPercentage(1.005, { multiplyBy100: true })` is
 * `"101%"`.
 *
 * @example
 * formatPercentage(45.5, { decimals: 1 }); // "45.5%"
 * formatPercentage(0.455, { decimals: 1, multiplyBy100: true }); // "45.5%"
 * formatPercentage(45.5, { decimals: 1, unit: 'permille' }); // "45.5‰"
 * formatPercentage(125, { unit: 'basisPoint' }); // "125‱"
 * formatPercentage(45.5, { decimals: 1, locale: az }); // "45,5%"
 */
export function formatPercentage(value: number, options: PercentageFormatOptions = {}): string {
  const {
    locale = en,
    decimals = 0,
    thousandsSeparator = locale.formatDefaults.thousandsSeparator,
    decimalSeparator = locale.formatDefaults.decimalSeparator,
    roundingMode,
    space = false,
    multiplyBy100 = false,
    unit = 'percent',
  } = options

  const { sign, scale } = PERCENTAGE_UNITS[unit]
  // Exact decimal scaling: `value * scale` would turn 1.005 into 100.49999999999999.
  const scaledValue = multiplyBy100 ? multiply(value, scale) : value
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
 * divide the result by the unit's scale factor — exactly in decimal, via
 * `divide` (`arithmetic/divide`), so `"1.1%"` gives `0.011` where
 * `1.1 / 100` is `0.011000000000000001`.
 *
 * @example
 * parsePercentage("45.5%"); // 45.5
 * parsePercentage("45.5%", { asRatio: true }); // 0.455
 * parsePercentage("45.5‰", { unit: 'permille', asRatio: true }); // 0.0455
 * parsePercentage("45,5%", { locale: az }); // 45.5
 */
export function parsePercentage(value: string, options: PercentageParseOptions = {}): number {
  const {
    locale = en,
    thousandsSeparator = locale.formatDefaults.thousandsSeparator,
    decimalSeparator = locale.formatDefaults.decimalSeparator,
    asRatio = false,
    unit = 'percent',
  } = options

  const { sign, scale } = PERCENTAGE_UNITS[unit]
  const withoutSign = value.split(sign).join('').trim()
  const numeric = parseNumber(withoutSign, { thousandsSeparator, decimalSeparator })
  return asRatio ? divide(numeric, scale) : numeric
}
