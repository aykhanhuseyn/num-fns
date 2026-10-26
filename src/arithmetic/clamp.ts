import { guardNumber } from '../shared/no-throw'
import { assertFinite, assertFiniteBounds } from '../shared/validation'

/**
 * Clamps a number so it falls within the inclusive range [min, max].
 *
 * @example
 * clamp(15, 0, 10); // 10
 * clamp(-5, 0, 10); // 0
 * clamp(5, 0, 10); // 5
 *
 * @param value - The number to clamp.
 * @param min - The lower bound, inclusive.
 * @param max - The upper bound, inclusive.
 * @returns `min` when `value` is below the range, `max` when it is above the
 * range, otherwise `value`.
 * @throws {RangeError} When `value`, `min` or `max` is not finite, or when
 * `min` is greater than `max`.
 * @since 0.2.0
 */
export function clamp(value: number, min: number, max: number): number {
  return guardNumber(() => {
    assertFinite(value, 'value', 'clamp')
    assertFiniteBounds(min, max, 'clamp')

    if (value < min) return min
    if (value > max) return max
    return value
  })
}
