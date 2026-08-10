import { assertFinite, assertFiniteBounds } from '../shared/validation'

/**
 * Checks whether a number falls within the inclusive range [min, max].
 *
 * @example
 * inRange(5, 0, 10); // true
 * inRange(15, 0, 10); // false
 * inRange(0, 0, 10); // true
 */
export function inRange(value: number, min: number, max: number): boolean {
  assertFinite(value, 'value', 'inRange')
  assertFiniteBounds(min, max, 'inRange')

  return value >= min && value <= max
}
