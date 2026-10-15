import { fromDecimal, sumDecimals } from '../arithmetic/decimal'
import { guardNumber } from '../shared/no-throw'
import { isNegativeZero } from '../shared/sign'

/**
 * Sums an array of numbers exactly in decimal, the same way {@link add}
 * does: `sum([0.1, 0.2])` is `0.3`, not `0.30000000000000004`. Every value
 * is read at its shortest decimal, the total is computed exactly, and the
 * result is the closest JavaScript number to that total — one rounding at
 * the end, so `sum(values)` agrees with `values.reduce(add, 0)` wherever
 * the running total fits a number's precision, and is at least as exact
 * where it does not.
 *
 * Values with a few fraction digits (prices, measurements) add exactly as
 * integer counts of their smallest digit, so the common case takes a fast
 * path that skips the `BigInt` machinery; `bench/BASELINE.md` has the cost
 * of the exact path, which only long or huge decimals reach.
 *
 * Throws `RangeError` when `values` is empty, when a value is not finite,
 * or when the total is too large for a JavaScript number. Signed zeros
 * follow IEEE 754: the total is `-0` only when every value is `-0`.
 *
 * @example
 * sum([1, 2, 3]); // 6
 * sum([0.1, 0.2]); // 0.3
 * sum([1.15, 2.3, 0.05]); // 3.5
 *
 * @since 0.2.0 (exact in decimal since 0.7.0)
 */
export function sum(values: readonly number[]): number {
  return guardNumber(() => {
    if (values.length === 0) {
      throw new RangeError('sum: values must not be empty')
    }

    let negativeZero = true
    for (const value of values) {
      if (!Number.isFinite(value)) {
        throw new RangeError(`sum: all values must be finite, received ${value}`)
      }
      negativeZero &&= isNegativeZero(value)
    }

    const fast = sumFast(values)
    if (fast !== undefined) return fast === 0 && negativeZero ? -0 : fast

    const total = sumDecimals(values)
    return fromDecimal(total.digits, total.scale, 'sum', negativeZero)
  })
}

/**
 * The fast path: every value is read as an integer count of its finest
 * fraction digit (`19.99` is `1999` hundredths), the counts are added with
 * plain `+` while they stay safe integers, and the total is converted once
 * at the end with the correctly rounded `Number("<count>e-<digits>")`.
 *
 * A count is trusted only when `count / 10^k` gives the value back and
 * `|count| < 2^52`: then `count × 10^-k` reads back as the value, and no
 * other decimal with `k` fraction digits can (they are at least `10^-k`
 * apart, which is more than one ulp at that size), so it *is* the value's
 * shortest decimal — the same reading the exact path takes, without
 * `String()` or `BigInt` per element. Returns `undefined` the moment a
 * value cannot take this path (too many fraction digits, or a count past
 * the safe range) and the caller falls through to the exact path. `-0` is
 * handled by the caller from the `negativeZero` flag.
 */
function sumFast(values: readonly number[]): number | undefined {
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
  return scale === 0 ? total : Number(`${total}e-${scale}`)
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
