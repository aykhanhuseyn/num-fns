import { isSigned } from '../shared/sign'
import type { RoundingMode } from '../shared/types'
import { assertFinite } from '../shared/validation'
import { digitCount, fromDecimal, pow10, toDecimal } from './decimal'

const ZERO = BigInt(0)
const ONE = BigInt(1)
const TWO = BigInt(2)
const FIVE = BigInt(5)

/**
 * Rounds `value` to `precision` decimal places, exactly in decimal, using
 * `mode` to break ties (`'halfUp'` — half away from zero — by default). This
 * is the one rounding implementation in the package: `formatNumber`,
 * `formatMoney` and `formatPercentage` all delegate to it.
 *
 * Being decimal-safe means the value is rounded as written, not as the
 * binary float happens to be stored: `round(1.005, 2)` is `1.01`, where
 * `Math.round(1.005 * 100) / 100` and `(1.005).toFixed(2)` both give `1`
 * because `1.005 * 100` is `100.49999999999999`. A negative `precision`
 * rounds to tens, hundreds, …: `round(1234, -2)` is `1200`.
 *
 * Throws `RangeError` on non-finite input, when `precision` is not an
 * integer, or when the result is too large for a JavaScript number (only
 * reachable with an enormous negative `precision` under `'ceil'`/`'floor'`).
 * The sign of the input survives: a negative value that rounds away to zero
 * is `-0`, not `0` (the 2026-09-20 "`-0` is a value" decision).
 *
 * @example
 * round(1.005, 2); // 1.01
 * round(2.5); // 3
 * round(2.5, 0, 'halfEven'); // 2
 * round(-2.5, 0, 'halfDown'); // -2
 * round(1234, -2); // 1200
 * round(-1.21, 1, 'floor'); // -1.3
 * round(-0.4); // -0
 */
export function round(value: number, precision = 0, mode: RoundingMode = 'halfUp'): number {
  assertFinite(value, 'value', 'round')
  if (!Number.isInteger(precision)) {
    throw new RangeError(`round: precision must be an integer, received ${precision}`)
  }

  const { digits, scale } = toDecimal(value)
  const dropped = scale - precision
  if (dropped <= 0) return value

  const negative = isSigned(value)
  const magnitude = digits < ZERO ? -digits : digits
  const { kept, remainder, half } = split(magnitude, dropped)
  const rounded = shouldRoundAway(mode, negative, kept, remainder, half) ? kept + ONE : kept

  return fromDecimal(negative ? -rounded : rounded, precision, 'round', negative)
}

/**
 * Splits a non-negative `magnitude` into the digits that survive dropping
 * the last `dropped` of them, the digits dropped, and the tie point those
 * dropped digits are compared against. When more digits are dropped than the
 * number has, nothing survives and the whole value is the remainder — spelled
 * out here so an absurd `precision` never asks `BigInt` for `10^1e15`.
 */
function split(
  magnitude: bigint,
  dropped: number,
): { kept: bigint; remainder: bigint; half: bigint } {
  if (dropped > digitCount(magnitude)) {
    return { kept: ZERO, remainder: magnitude, half: magnitude + ONE }
  }
  const factor = pow10(dropped)
  return {
    kept: magnitude / factor,
    remainder: magnitude % factor,
    half: FIVE * pow10(dropped - 1),
  }
}

/** Whether the kept digits move one step away from zero, per `mode`, given the dropped digits and the tie point. */
function shouldRoundAway(
  mode: RoundingMode,
  negative: boolean,
  kept: bigint,
  remainder: bigint,
  half: bigint,
): boolean {
  if (remainder === ZERO) return false
  if (mode === 'ceil') return !negative
  if (mode === 'floor') return negative
  if (remainder !== half) return remainder > half
  if (mode === 'halfUp') return true
  if (mode === 'halfDown') return false
  // halfEven: an exact tie rounds to the nearest even digit.
  return kept % TWO === ONE
}
