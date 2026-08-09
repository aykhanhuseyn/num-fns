/**
 * Clamps a number so it falls within the inclusive range [min, max].
 *
 * @example
 * clamp(15, 0, 10); // 10
 * clamp(-5, 0, 10); // 0
 * clamp(5, 0, 10); // 5
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`clamp: value must be finite, received ${value}`)
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new RangeError(`clamp: min and max must be finite, received min=${min}, max=${max}`)
  }
  if (min > max) {
    throw new RangeError(`clamp: min (${min}) must not be greater than max (${max})`)
  }

  if (value < min) return min
  if (value > max) return max
  return value
}
