import { guardNumber } from '../shared/no-throw'
import { isSigned } from '../shared/sign'
import { assertFinite } from '../shared/validation'
import { fromDecimal, toDecimal } from './decimal'

/**
 * Multiplies two numbers exactly in decimal: `multiply(0.1, 3)` is `0.3`,
 * not `0.30000000000000004`, and `multiply(1.1, 1.1)` is `1.21`. Each
 * operand is taken at its shortest decimal reading, the product is computed
 * exactly, and the result is the closest JavaScript number to that product.
 *
 * Throws `RangeError` on non-finite input or when the result is too large
 * for a JavaScript number. A zero product carries the IEEE 754 sign of the
 * factors, so `multiply(-1, 0)` is `-0`.
 *
 * @example
 * multiply(0.1, 3); // 0.3
 * multiply(1.1, 1.1); // 1.21
 * multiply(19.99, 100); // 1999
 * multiply(-1, 0); // -0
 */
export function multiply(a: number, b: number): number {
  return guardNumber(() => {
    assertFinite(a, 'a', 'multiply')
    assertFinite(b, 'b', 'multiply')

    const x = toDecimal(a)
    const y = toDecimal(b)
    const negativeZero = isSigned(a) !== isSigned(b)
    return fromDecimal(x.digits * y.digits, x.scale + y.scale, 'multiply', negativeZero)
  })
}
