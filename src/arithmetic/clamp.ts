import { guardNumber } from '../shared/no-throw'
import { assertFinite, assertFiniteBounds } from '../shared/validation'

/**
 * Clamps a number so it falls within the inclusive range [min, max].
 *
 * @example
 * clamp(15, 0, 10); // 10
 * clamp(-5, 0, 10); // 0
 * clamp(5, 0, 10); // 5
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
