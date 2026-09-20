import { divide } from '../arithmetic/divide'
import { multiply } from '../arithmetic/multiply'
import { en } from '../locale/en'
import { formatNumber, parseNumber } from '../number/format'
import { resolveOutput } from '../shared/bigint'
import { guardNumber } from '../shared/no-throw'
import { guardText } from '../shared/no-throw-text'
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
 * A `bigint` is formatted exactly at any magnitude: with `multiplyBy100` it
 * is scaled in `bigint` arithmetic (`3n` -> `"300%"`), its digits are then
 * grouped as written by `formatNumber`, and `decimals` pads zeros
 * (`formatPercentage(45n, { decimals: 1 })` is `"45.0%"`); `roundingMode`
 * has nothing to round and is ignored.
 *
 * @example
 * formatPercentage(45.5, { decimals: 1 }); // "45.5%"
 * formatPercentage(0.455, { decimals: 1, multiplyBy100: true }); // "45.5%"
 * formatPercentage(45.5, { decimals: 1, unit: 'permille' }); // "45.5‰"
 * formatPercentage(125, { unit: 'basisPoint' }); // "125‱"
 * formatPercentage(45.5, { decimals: 1, locale: az }); // "45,5%"
 * formatPercentage(3n, { multiplyBy100: true }); // "300%"
 */
export function formatPercentage(
  value: number | bigint,
  options: PercentageFormatOptions = {},
): string {
  return guardText(
    () => {
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
      const scaledValue = multiplyBy100 ? scaleUp(value, scale) : value
      const formattedNumber = formatNumber(scaledValue, {
        decimals,
        thousandsSeparator,
        decimalSeparator,
        roundingMode,
      })
      return `${formattedNumber}${space ? ' ' : ''}${sign}`
    },
    [value],
    options,
  )
}

/**
 * Multiplies a ratio by the unit's scale factor. A `number` goes through
 * `multiply` (`arithmetic/multiply`) so the scaling is exact in decimal —
 * `value * scale` would turn `1.005` into `100.49999999999999` — and a
 * `bigint` is multiplied exactly in `bigint` arithmetic.
 */
function scaleUp(value: number | bigint, scale: number): number | bigint {
  return typeof value === 'bigint' ? value * BigInt(scale) : multiply(value, scale)
}

/**
 * Parses a percentage (or permille/basis-point) string back into a
 * JavaScript number, stripping the unit sign. Pass `asRatio: true` to
 * divide the result by the unit's scale factor — exactly in decimal, via
 * `divide` (`arithmetic/divide`), so `"1.1%"` gives `0.011` where
 * `1.1 / 100` is `0.011000000000000001`.
 *
 * With `{ output: 'bigint' }` the value comes back as an exact `bigint`, so
 * the string must be a whole number once the sign is stripped (`"45%"` is
 * `45n`, `"45.5%"` throws `RangeError`). `asRatio` cannot be combined with
 * it: a ratio is a fraction of one, and a `bigint` cannot carry a fraction,
 * so the pair throws `RangeError` up front rather than truncating `"50%"`
 * to `0n`. Any other `output` value is a `RangeError` too.
 *
 * @example
 * parsePercentage("45.5%"); // 45.5
 * parsePercentage("45.5%", { asRatio: true }); // 0.455
 * parsePercentage("45.5‰", { unit: 'permille', asRatio: true }); // 0.0455
 * parsePercentage("45,5%", { locale: az }); // 45.5
 * parsePercentage("1,234,567,890,123,456,789%", { output: 'bigint' }); // 1234567890123456789n
 */
export function parsePercentage(
  value: string,
  options: PercentageParseOptions & { output: 'bigint' },
): bigint
export function parsePercentage(
  value: string,
  options?: PercentageParseOptions & { output?: 'number' },
): number
export function parsePercentage(value: string, options: PercentageParseOptions): number | bigint
export function parsePercentage(
  value: string,
  options: PercentageParseOptions = {},
): number | bigint {
  return guardNumber(() => {
    const output = resolveOutput(options.output, 'parsePercentage')
    const {
      locale = en,
      thousandsSeparator = locale.formatDefaults.thousandsSeparator,
      decimalSeparator = locale.formatDefaults.decimalSeparator,
      asRatio = false,
      unit = 'percent',
    } = options

    if (asRatio && output === 'bigint') {
      throw new RangeError(
        'parsePercentage: asRatio produces a fraction and cannot be combined with output "bigint"',
      )
    }

    const { sign, scale } = PERCENTAGE_UNITS[unit]
    const withoutSign = value.split(sign).join('').trim()
    if (output === 'bigint') {
      return parseNumber(withoutSign, { thousandsSeparator, decimalSeparator, output })
    }
    const numeric = parseNumber(withoutSign, { thousandsSeparator, decimalSeparator })
    return asRatio ? divide(numeric, scale) : numeric
  }, options)
}
