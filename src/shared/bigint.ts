/**
 * Shared `bigint` plumbing behind the BigInt input/output support
 * (`todo.md` §4, "BigInt input path for `numberToWords` / `toLongNotation`",
 * broadened on 2026-09-06 to every integer-domain function and every parser).
 *
 * Two ideas live here:
 *
 * - **Input.** Integer-domain functions (`numberToWords`, `toLongNotation`,
 *   `formatNumber`, `toByteSize`, `toBase`, `isEven`, …) accept
 *   `number | bigint`. A `bigint` is an exact integer of any magnitude, so a
 *   `number`-only algorithm (`remaining % 1000`, `Math.floor`, `toFixed`)
 *   is replaced by the exact `bigint` equivalent on that path —
 *   {@link toScaleGroups} chunks either type into digit groups (0–999 by default), and
 *   {@link scaleToFixed} divides either type by a scale factor with exact
 *   half-up rounding, standing in for `(value / threshold).toFixed(decimals)`.
 *   Since 2026-09-08 the `number` path runs through the same integer
 *   arithmetic — the number is read at its shortest decimal (`toDecimal`,
 *   the reading `arithmetic/round` uses) and divided exactly — so a
 *   `number` and the equal `bigint` produce the same digits everywhere,
 *   ties included (`toShortNotation(2675000, { decimals: 2 })` and
 *   `toShortNotation(2675000n, { decimals: 2 })` are both `"2.68M"`; the
 *   `toFixed` path gave `"2.67M"` because `2675000 / 1e6` is stored just
 *   below 2.675). {@link splitFixed} is the same idea for the word functions'
 *   fraction digits, rounded by `arithmetic/round` itself.
 *
 * - **Output.** Parsers take an `output: 'bigint'` option
 *   (`ParseOutput` in `shared/types.ts`) and return a `bigint` instead of a
 *   `number`. {@link decimalToBigInt} is the one string-to-`bigint`
 *   conversion: it reads the decimal text exactly (`"2.5"` × `1000000` is
 *   `2500000n`) and throws `RangeError` rather than truncating when the value
 *   is not a whole number. A parser asked for a `number` that would not
 *   survive the trip (`> Number.MAX_SAFE_INTEGER`) throws via
 *   {@link assertSafeInteger} and points the caller at `output: 'bigint'`.
 *
 * `BigInt` is reached only through the `BigInt(...)` constructor, never
 * `10n` literals — the build targets ES2018 (`vite.config.ts`,
 * `tsconfig.json`), where the literal is a parse error but the global is a
 * plain runtime value on every supported Node. The same rule as
 * `arithmetic/decimal.ts`.
 *
 * Internal. Nothing here is exported from `src/index.ts`; consumers see only
 * the `number | bigint` parameter types and the `output` option.
 */

import { type Decimal, toDecimal } from '../arithmetic/decimal'
import { round } from '../arithmetic/round'
import { DEFAULT_GROUPING } from './numbering'
import type { ParseOutput } from './types'

export const ZERO = BigInt(0)
export const ONE = BigInt(1)
const TWO = BigInt(2)
const TEN = BigInt(10)
const THOUSAND = BigInt(1000)
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)

/** The shapes a decimal number string can take: `"15"`, `"-0.25"`, `"+7"`, `"1e+21"`, `"1.5E-7"`, `".5"`, `"5."`. */
const DECIMAL_STRING = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/

/** `10^exponent` as a `bigint`; `exponent` must be a non-negative integer. */
export function pow10(exponent: number): bigint {
  return TEN ** BigInt(exponent)
}

/** `|value|` for a `bigint` — there is no `Math.abs` for them. */
export function absBigInt(value: bigint): bigint {
  return value < ZERO ? -value : value
}

/**
 * The digit count of group `index` (`0` is the least significant) under a
 * CLDR-style `grouping`: the first entry is the units group, each later
 * entry the next group, and the last entry repeats for every group after
 * it. `[3]` is 3, 3, 3, …; Indian `[3, 2]` is 3, 2, 2, …; CJK `[4]` is
 * 4, 4, 4, ….
 */
export function groupSize(grouping: readonly number[], index: number): number {
  return grouping[Math.min(index, grouping.length - 1)] as number
}

/**
 * The power of ten scale index `index` stands for: the digit count of every
 * group below it. Under `[3]` scale `2` is `10^6` (million); under
 * `[3, 2]` it is `10^5` (lakh) and scale `3` is `10^7` (crore); under `[4]`
 * scale `2` is `10^8` (亿).
 */
export function scaleExponent(index: number, grouping: readonly number[]): number {
  let exponent = 0
  for (let i = 0; i < index; i++) exponent += groupSize(grouping, i)
  return exponent
}

/**
 * Splits a non-negative integer into groups by `grouping` (see
 * {@link groupSize}), least significant first, as the plain numbers a
 * locale's `renderGroup`/`plural` hooks take: `1234567` is `[567, 234, 1]`
 * under the default `[3]`, `[567, 34, 12]` under Indian `[3, 2]` and
 * `[4567, 123]` under CJK `[4]`; `0` is `[]` under any grouping. The
 * `number` branch is the loop `numberToWords` and `toLongNotation` always
 * ran (with `10 ** 3`, which is exactly `1000`, for the default); the
 * `bigint` branch is the exact equivalent for values `Number` cannot hold.
 * `grouping` must already be valid (`shared/numbering.ts`'s
 * `resolveGrouping`).
 */
export function toScaleGroups(
  value: number | bigint,
  grouping: readonly number[] = DEFAULT_GROUPING,
): number[] {
  const groups: number[] = []
  // The group size changes at most `grouping.length` times, so the base is
  // recomputed only then — the `bigint` power especially is not free.
  let size = 0
  if (typeof value === 'bigint') {
    let remaining = value
    let base = ONE
    while (remaining > ZERO) {
      const next = groupSize(grouping, groups.length)
      if (next !== size) {
        size = next
        base = size === 3 ? THOUSAND : pow10(size)
      }
      groups.push(Number(remaining % base))
      remaining /= base
    }
    return groups
  }
  let remaining = value
  let base = 1
  while (remaining > 0) {
    const next = groupSize(grouping, groups.length)
    if (next !== size) {
      size = next
      base = 10 ** size
    }
    groups.push(remaining % base)
    remaining = Math.floor(remaining / base)
  }
  return groups
}

/**
 * The largest integer `scaleCount` scale words can express under
 * `grouping` (`10^scaleExponent(scaleCount) - 1`; `1000^scaleCount - 1`
 * under the default), as a `bigint` — the cap `numberToWords` and
 * `toLongNotation` apply, computed exactly so a custom locale with more
 * scales than `Number` can hold still gets a correct bound.
 */
export function maxSupportedBigInt(
  scaleCount: number,
  grouping: readonly number[] = DEFAULT_GROUPING,
): bigint {
  return pow10(scaleExponent(scaleCount, grouping)) - ONE
}

/**
 * `value / factor` rendered with exactly `decimals` fractional digits,
 * rounded half up on the exact quotient — the stand-in for
 * `(value / factor).toFixed(decimals)` in `toShortNotation` and `toByteSize`,
 * for a `number` and a `bigint` alike. Both operands are read as exact
 * decimals (a `bigint` is one already; a `number` is read at its shortest
 * decimal string by `toDecimal`, the same reading `arithmetic/round` gives
 * it) and the division and rounding happen on integers, so the two input
 * types agree on every digit: `scaleToFixed(2675000, 1e6, 2)` and
 * `scaleToFixed(BigInt(2675000), 1e6, 2)` are both `"2.68"`, where
 * `(2675000 / 1e6).toFixed(2)` is `"2.67"` because the double nearest 2.675
 * sits just below it. `value` must be finite and non-negative, `factor`
 * finite and positive, `decimals` a non-negative integer (the callers
 * validate).
 *
 * `scaleToFixed(1536, 1024, 2)` is `"1.50"`; `scaleToFixed(999, 1, 0)` is `"999"`.
 */
export function scaleToFixed(value: number | bigint, factor: number, decimals: number): string {
  const dividend: Decimal =
    typeof value === 'bigint' ? { digits: value, scale: 0 } : toDecimal(value)
  const divisor = toDecimal(factor)
  // value / factor = (d₁·10^-s₁) / (d₂·10^-s₂) = d₁·10^(s₂-s₁) / d₂; the power
  // of ten goes to whichever side keeps its exponent non-negative.
  const shift = divisor.scale - dividend.scale
  const numerator = shift > 0 ? dividend.digits * pow10(shift) : dividend.digits
  const denominator = shift < 0 ? divisor.digits * pow10(-shift) : divisor.digits
  return divideToFixed(numerator, denominator, decimals)
}

/** `numerator / denominator` (both non-negative integers, `denominator > 0`) with exactly `decimals` fraction digits, rounded half up. */
function divideToFixed(numerator: bigint, denominator: bigint, decimals: number): string {
  const shifted = numerator * pow10(decimals)
  // (2·shifted + denominator) / (2·denominator) is ⌊shifted / denominator + ½⌋ in integers.
  const rounded = (shifted * TWO + denominator) / (denominator * TWO)
  if (decimals === 0) return rounded.toString()
  const text = rounded.toString().padStart(decimals + 1, '0')
  return `${text.slice(0, -decimals)}.${text.slice(-decimals)}`
}

/** A non-negative `number` split at the decimal point after rounding to a fixed number of fraction digits. */
export interface FixedParts {
  /** The whole part, exact at any magnitude (a `bigint` so `toScaleGroups` never floors a float). */
  whole: bigint
  /** The fraction read as a whole number of its last place: `0` to `10 ** decimals - 1`. */
  fraction: number
}

/**
 * Splits a non-negative finite `number` into its whole part and its first
 * `decimals` fraction digits, rounding the fraction half up with
 * `arithmetic/round` — the digits `numberToWords` reads after the decimal
 * connector and `moneyToWords` spells as minor units. Rounding first means
 * the carry needs no special case (`1.999` at two decimals is
 * `{ whole: 2n, fraction: 0 }`) and the tie is decided on the value as
 * written: `2.675` is `{ whole: 2n, fraction: 68 }`, where
 * `Math.round((2.675 - 2) * 100)` gives `67`. Once rounded, the number's
 * shortest decimal has at most `decimals` fraction digits, so the split is
 * pure digit extraction — nothing is rounded twice.
 */
export function splitFixed(value: number, decimals: number): FixedParts {
  const { digits, scale } = toDecimal(round(value, decimals))
  if (scale <= 0) return { whole: digits * pow10(-scale), fraction: 0 }
  const point = pow10(scale)
  return { whole: digits / point, fraction: Number((digits % point) * pow10(decimals - scale)) }
}

/**
 * Reads a decimal number string exactly and returns `value × factor` as a
 * `bigint`. The string may carry a sign, a fractional part and an exponent
 * (everything `Number(text)` accepts for a finite decimal, e.g. `"1.5e3"`),
 * and the fractional digits may be anything as long as the *product* is a
 * whole number: `decimalToBigInt("2.5", BigInt(1000000))` is `2500000n`.
 *
 * Returns `null` when `text` is not a decimal number at all, so the caller
 * can raise its own `SyntaxError` with its own message. Throws `RangeError`
 * when the product is not a whole number — `"1.5"` with no factor, `"0.001"`
 * against a factor of `100` — because a `bigint` cannot carry a fraction
 * and truncating silently would be exactly the wrong-answer failure mode
 * the package throws to avoid.
 */
export function decimalToBigInt(text: string, factor: bigint, context: string): bigint | null {
  const match = DECIMAL_STRING.exec(text)
  if (match === null) return null
  const [, sign, integer = '', fraction = '', exponent = '0'] = match
  if (integer === '' && fraction === '') return null

  const magnitude = BigInt(`${integer}${fraction}`) * factor
  const scale = fraction.length - Number(exponent)
  const scaled =
    scale <= 0 ? magnitude * pow10(-scale) : divideExactly(magnitude, scale, text, context)

  return sign === '-' ? -scaled : scaled
}

/** `magnitude / 10^scale`, or a `RangeError` when the division leaves a remainder. */
function divideExactly(magnitude: bigint, scale: number, text: string, context: string): bigint {
  const divisor = pow10(scale)
  if (magnitude % divisor !== ZERO) {
    throw new RangeError(
      `${context}: "${text}" is not a whole number and cannot be returned as a bigint`,
    )
  }
  return magnitude / divisor
}

/**
 * `mantissa × factor` as an exact `bigint`, for the `output: 'bigint'` path
 * of the scaled parsers (`parseShortNotation`, `parseByteSize`): the
 * mantissa text — with `decimalSeparator` normalised to `.` — is read
 * exactly by {@link decimalToBigInt}, which throws `RangeError` when the
 * product is not a whole number (`"1.2345K"`). Text that is not a decimal
 * number at all is a `SyntaxError`, as it is on the `number` path.
 */
export function scaledBigInt(
  mantissa: string,
  factor: number,
  decimalSeparator: string,
  context: string,
): bigint {
  const trimmed = mantissa.trim()
  const normalized = decimalSeparator === '.' ? trimmed : trimmed.split(decimalSeparator).join('.')
  const scaled = decimalToBigInt(normalized, BigInt(factor), context)
  if (scaled === null) {
    throw new SyntaxError(`${context}: unable to parse "${mantissa}" as a number`)
  }
  return scaled
}

/**
 * Converts a parser's exact `bigint` result to the requested `output` type.
 * For `'number'` (the default) the value must be a safe integer — a parser
 * that would silently hand back a rounded `number` for `"9007199254740993
 * thousand"` throws `RangeError` instead and names the option that keeps the
 * value exact.
 */
export function toOutput(value: bigint, output: ParseOutput, context: string): number | bigint {
  if (output === 'bigint') return value
  assertSafeInteger(value, context)
  return Number(value)
}

/**
 * Throws `RangeError` unless `value` fits a JavaScript `number` exactly
 * (`|value| <= Number.MAX_SAFE_INTEGER`), pointing the caller at
 * `output: 'bigint'`.
 */
export function assertSafeInteger(value: bigint, context: string): void {
  if (absBigInt(value) > MAX_SAFE) {
    throw new RangeError(
      `${context}: ${value} exceeds Number.MAX_SAFE_INTEGER and cannot be returned exactly as a number; pass { output: 'bigint' }`,
    )
  }
}

/**
 * Validates a parser's `output` option: `'number'`, `'bigint'` or omitted.
 * Anything else is a `RangeError` naming the two valid values, per the
 * package rule that a bad option throws rather than being ignored.
 */
export function resolveOutput(output: ParseOutput | undefined, context: string): ParseOutput {
  if (output === undefined) return 'number'
  if (output !== 'number' && output !== 'bigint') {
    throw new RangeError(
      `${context}: output must be "number" or "bigint", received ${String(output)}`,
    )
  }
  return output
}

/**
 * The `number` a locale's `plural` hook should see for a `bigint` count.
 * `Locale.plural` takes a `number` — the hook is locale-authored and every
 * launch locale's rule reads `n % 10` / `n % 100` — so a `bigint` within the
 * safe range is simply converted. Beyond it, the value is folded to its
 * last six digits plus one million: every CLDR plural rule for an integer
 * depends only on the operands `n`, `i % 10`, `i % 100` and `i % 1000`
 * (Breton also `n % 1000000`) and on comparisons against small constants,
 * all of which the fold preserves, and the `+ 10^6` keeps the folded value
 * out of the small-constant range the original was never in either.
 */
export function pluralOperand(value: bigint): number {
  const magnitude = absBigInt(value)
  if (magnitude <= MAX_SAFE) return Number(value)
  const million = pow10(6)
  const folded = Number(magnitude % million) + 1e6
  return value < ZERO ? -folded : folded
}

/**
 * Narrows a `number | bigint` to a `number` for a `number`-only hook (the
 * locale `ordinal` hooks), or throws `RangeError` when the `bigint` is
 * outside the safe range and would be rounded by the conversion.
 */
export function toSafeNumber(value: number | bigint, context: string): number {
  if (typeof value === 'number') return value
  if (absBigInt(value) > MAX_SAFE) {
    throw new RangeError(
      `${context}: ${value} exceeds Number.MAX_SAFE_INTEGER; a locale's ordinal hooks take a number, so a bigint must be a safe integer`,
    )
  }
  return Number(value)
}
