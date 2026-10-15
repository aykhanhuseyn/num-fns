import { guardNumber } from '../shared/no-throw'
import { isSigned } from '../shared/sign'
import { assertFinite } from '../shared/validation'
import { divideDecimals, fromDecimal, toDecimal } from './decimal'

/**
 * Divides `dividend` by `divisor` exactly in decimal: `divide(0.3, 0.1)` is
 * `3`, not `2.9999999999999996`. Both operands are taken at their shortest
 * decimal reading and the quotient is computed on integers, carried to 25
 * significant digits, then converted to the closest JavaScript number. A
 * quotient that terminates within those digits (`1 / 8`, `0.3 / 0.1`) is
 * exact; a non-terminating one (`1 / 3`) is truncated far beyond the
 * precision a number can hold, so the result is the same one you would get
 * by rounding the true quotient.
 *
 * Throws `RangeError` on non-finite input, when `divisor` is `0`, or when
 * the result is too large for a JavaScript number. A zero quotient carries
 * the IEEE 754 sign of the operands, so `divide(0, -5)` is `-0` — and so is
 * a negative value that underflows (`divide(-1e-308, 1e308)`).
 *
 * @example
 * divide(0.3, 0.1); // 3
 * divide(1, 3); // 0.3333333333333333
 * divide(1999, 100); // 19.99
 * divide(0, -5); // -0
 */
export function divide(dividend: number, divisor: number): number {
  return guardNumber(() => {
    assertFinite(dividend, 'dividend', 'divide')
    assertFinite(divisor, 'divisor', 'divide')
    if (divisor === 0) {
      throw new RangeError('divide: divisor must not be zero')
    }

    const quotient = divideDecimals(toDecimal(dividend), toDecimal(divisor))
    const negativeZero = isSigned(dividend) !== isSigned(divisor)
    return fromDecimal(quotient.digits, quotient.scale, 'divide', negativeZero)
  })
}
