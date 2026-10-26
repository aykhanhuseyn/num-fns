import { guardBoolean } from '../shared/no-throw'
import { assertFinite, assertFiniteBounds } from '../shared/validation'

/**
 * Checks whether a number falls within the inclusive range [min, max].
 *
 * @example
 * inRange(5, 0, 10); // true
 * inRange(15, 0, 10); // false
 * inRange(0, 0, 10); // true
 *
 * @param value - The number to check.
 * @param min - The lower bound, inclusive.
 * @param max - The upper bound, inclusive.
 * @returns `true` when `min <= value <= max`, otherwise `false`.
 * @throws {RangeError} When `value`, `min` or `max` is not finite, or when
 * `min` is greater than `max`.
 * @since 0.2.0
 */
export function inRange(value: number, min: number, max: number): boolean {
  return guardBoolean(() => {
    assertFinite(value, 'value', 'inRange')
    assertFiniteBounds(min, max, 'inRange')

    return value >= min && value <= max
  })
}
