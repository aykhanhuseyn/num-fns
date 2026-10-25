import { type Decimal, sumDecimals } from '../arithmetic/decimal'
import { isNegativeZero } from '../shared/sign'

/**
 * Internal plumbing shared by the exact statistics (task 0.7-2, fixed in the
 * 0.7 review): every function here keeps its intermediate values as exact
 * `Decimal`s and converts to a `number` once, with {@link toNumber}, so a
 * result is the correctly rounded value of the exact answer and no middle
 * step can round or overflow on its own (`median([MAX_VALUE, MAX_VALUE])`
 * is `MAX_VALUE`). Not exported from `src/index.ts`.
 */

/**
 * Throws `RangeError` for an empty list or a non-finite value, naming
 * `context`, and returns whether every value is `-0` — the IEEE 754 rule
 * for the sign of a zero total.
 */
export function validateValues(values: readonly number[], context: string): boolean {
  if (values.length === 0) {
    throw new RangeError(`${context}: values must not be empty`)
  }
  let negativeZero = true
  for (const value of values) {
    if (!Number.isFinite(value)) {
      throw new RangeError(`${context}: all values must be finite, received ${value}`)
    }
    negativeZero &&= isNegativeZero(value)
  }
  return negativeZero
}

/** The fast path's result: the total as an integer count of `10^-scale`. */
interface FastSum {
  total: number
  scale: number
}

/**
 * The exact sum of `values` as a `Decimal`. Short decimals take the
 * no-`BigInt` fast path ({@link sumFast}) and pay for one `BigInt` at the
 * end; anything else goes through `sumDecimals`. The caller validates.
 */
export function exactSum(values: readonly number[]): Decimal {
  const fast = sumFast(values)
  if (fast === undefined) return sumDecimals(values)
  return { digits: BigInt(fast.total), scale: fast.scale }
}

/**
 * The fast path: every value is read as an integer count of its finest
 * fraction digit (`19.99` is `1999` hundredths), and the counts are added
 * with plain `+` while they stay safe integers.
 *
 * A count is trusted only when `count / 10^k` gives the value back and
 * `|count| < 2^52`: then `count × 10^-k` reads back as the value, and no
 * other decimal with `k` fraction digits can (they are at least `10^-k`
 * apart, which is more than one ulp at that size), so it *is* the value's
 * shortest decimal — the same reading the exact path takes, without
 * `String()` or `BigInt` per element. Returns `undefined` the moment a
 * value cannot take this path (too many fraction digits, or a count past
 * the safe range) and the caller falls through to the exact path.
 */
export function sumFast(values: readonly number[]): FastSum | undefined {
  let total = 0
  let scale = 0
  for (const value of values) {
    const digits = Number.isInteger(value) ? 0 : fractionDigits(value, scale)
    if (digits === undefined) return undefined
    if (digits > scale) {
      total *= POW10[digits - scale] as number
      scale = digits
    }
    // Exact: an integer product that fits is computed exactly, and a
    // decimal's count below 2^52 is recovered by `round` (its binary error
    // is far below one half at that size).
    const count = Math.round(value * (POW10[scale] as number))
    if (Math.abs(count) >= COUNT_LIMIT) return undefined
    total += count
    if (!Number.isSafeInteger(total)) return undefined
  }
  return { total, scale }
}

/** `10 ** k` is exact for `k <= 22`; past 15 the counts would not fit under `2^52` anyway. */
const MAX_FAST_FRACTION_DIGITS = 15
const COUNT_LIMIT = 2 ** 52
const POW10 = Array.from({ length: MAX_FAST_FRACTION_DIGITS + 1 }, (_, k) => 10 ** k)

/**
 * The smallest `k >= from` such that `value` is exactly a count of
 * `10^-k`, or `undefined` when none up to {@link MAX_FAST_FRACTION_DIGITS}
 * is. Starting from the list's current scale keeps the loop at one
 * iteration for a list of same-shaped decimals.
 */
function fractionDigits(value: number, from: number): number | undefined {
  for (let k = from; k <= MAX_FAST_FRACTION_DIGITS; k++) {
    const factor = POW10[k] as number
    const count = Math.round(value * factor)
    if (Math.abs(count) >= COUNT_LIMIT) return undefined
    if (count / factor === value) return k
  }
  return undefined
}

/** A `bigint` count as a `Decimal` at scale 0. */
export function integerDecimal(value: number | bigint): Decimal {
  return { digits: BigInt(value), scale: 0 }
}

/**
 * The closest `number` to an exact decimal: one correctly rounded
 * conversion (`Number("<digits>e<-scale>")`). Throws `RangeError` naming
 * `context` when the exact result is too large for a `number`, with the
 * magnitude written short (`about 2e+308`) rather than as hundreds of
 * digits. A zero result is `-0` when `negativeZero` says so.
 */
export function toNumber(value: Decimal, context: string, negativeZero = false): number {
  const result = Number(`${value.digits}e${-value.scale}`)
  if (!Number.isFinite(result)) {
    throw new RangeError(
      `${context}: result (about ${approximate(value)}) is outside the range of a JavaScript number`,
    )
  }
  if (result !== 0) return result
  return value.digits < BigInt(0) || negativeZero ? -0 : 0
}

/** Three significant digits in scientific notation (`2e+308`, `-1.23e+400`), for an error message. */
function approximate(value: Decimal): string {
  const negative = value.digits < BigInt(0)
  const digits = (negative ? -value.digits : value.digits).toString()
  const exponent = digits.length - 1 - value.scale
  const fraction = digits.slice(1, 3).replace(TRAILING_ZEROS, '')
  const mantissa = fraction ? `${digits[0]}.${fraction}` : digits[0]
  return `${negative ? '-' : ''}${mantissa}e+${exponent}`
}

const TRAILING_ZEROS = /0+$/
