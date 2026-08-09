/**
 * Checks whether a number falls within the inclusive range [min, max].
 *
 * @example
 * inRange(5, 0, 10); // true
 * inRange(15, 0, 10); // false
 * inRange(0, 0, 10); // true
 */
export function inRange(value: number, min: number, max: number): boolean {
  if (!Number.isFinite(value)) {
    throw new RangeError(`inRange: value must be finite, received ${value}`)
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new RangeError(`inRange: min and max must be finite, received min=${min}, max=${max}`)
  }
  if (min > max) {
    throw new RangeError(`inRange: min (${min}) must not be greater than max (${max})`)
  }

  return value >= min && value <= max
}
