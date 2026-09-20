import { isNegativeZero, isPositiveZero } from '../shared/sign'
import { assertFinite } from '../shared/validation'
import { alignScales, fromDecimal, toDecimal } from './decimal'

/**
 * Subtracts `b` from `a` exactly in decimal: `subtract(0.3, 0.1)` is `0.2`,
 * not `0.19999999999999998`. Each operand is taken at its shortest decimal
 * reading, the difference is computed exactly, and the result is the closest
 * JavaScript number to that difference.
 *
 * Throws `RangeError` on non-finite input or when the result is too large
 * for a JavaScript number. Signed zeros follow IEEE 754 — `a - b` is
 * `a + (-b)` — so a zero difference is `-0` only for `(-0) - 0`.
 *
 * @example
 * subtract(0.3, 0.1); // 0.2
 * subtract(1.5, 1.5); // 0
 * subtract(1, 0.9); // 0.1
 * subtract(-0, 0); // -0
 */
export function subtract(a: number, b: number): number {
  assertFinite(a, 'a', 'subtract')
  assertFinite(b, 'b', 'subtract')

  const aligned = alignScales(toDecimal(a), toDecimal(b))
  const negativeZero = isNegativeZero(a) && isPositiveZero(b)
  return fromDecimal(aligned.a - aligned.b, aligned.scale, 'subtract', negativeZero)
}
