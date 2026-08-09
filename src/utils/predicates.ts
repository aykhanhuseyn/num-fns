/**
 * Checks whether an integer is even. Throws for non-integers, since
 * evenness is undefined for fractional values.
 *
 * @example
 * isEven(4); // true
 * isEven(3); // false
 * isEven(-4); // true
 */
export function isEven(value: number): boolean {
  if (!Number.isInteger(value)) {
    throw new TypeError(`isEven: value must be an integer, received ${value}`)
  }

  return value % 2 === 0
}

/**
 * Checks whether an integer is odd. Throws for non-integers, since oddness
 * is undefined for fractional values.
 *
 * @example
 * isOdd(3); // true
 * isOdd(4); // false
 * isOdd(-3); // true
 */
export function isOdd(value: number): boolean {
  if (!Number.isInteger(value)) {
    throw new TypeError(`isOdd: value must be an integer, received ${value}`)
  }

  return value % 2 !== 0
}
