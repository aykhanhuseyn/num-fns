import { ZERO } from '../shared/bigint'
import { guardBoolean } from '../shared/no-throw'

const TWO = BigInt(2)

/**
 * Checks whether an integer is even. Throws for non-integer numbers, since
 * evenness is undefined for fractional values. A `bigint` is always an
 * integer and is tested exactly at any magnitude.
 *
 * @example
 * isEven(4); // true
 * isEven(3); // false
 * isEven(-4); // true
 * isEven(BigInt('123456789012345678901234567890')); // true
 */
export function isEven(value: number | bigint): boolean {
  return guardBoolean(() => {
    if (typeof value === 'bigint') return value % TWO === ZERO

    if (!Number.isInteger(value)) {
      throw new TypeError(`isEven: value must be an integer, received ${value}`)
    }

    return value % 2 === 0
  })
}

/**
 * Checks whether an integer is odd. Throws for non-integer numbers, since
 * oddness is undefined for fractional values. A `bigint` is always an
 * integer and is tested exactly at any magnitude.
 *
 * @example
 * isOdd(3); // true
 * isOdd(4); // false
 * isOdd(-3); // true
 * isOdd(BigInt('123456789012345678901234567891')); // true
 */
export function isOdd(value: number | bigint): boolean {
  return guardBoolean(() => {
    if (typeof value === 'bigint') return value % TWO !== ZERO

    if (!Number.isInteger(value)) {
      throw new TypeError(`isOdd: value must be an integer, received ${value}`)
    }

    return value % 2 !== 0
  })
}
