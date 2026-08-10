/**
 * Computes the p-th percentile (0-100) of an array of numbers using linear
 * interpolation between closest ranks — the same method as Excel's
 * PERCENTILE.INC and NumPy's default "linear" interpolation.
 *
 * @example
 * percentile([1, 2, 3, 4, 5], 50); // 3
 * percentile([1, 2, 3, 4], 25); // 1.75
 */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) {
    throw new RangeError('percentile: values must not be empty')
  }
  if (!Number.isFinite(p) || p < 0 || p > 100) {
    throw new RangeError(`percentile: p must be between 0 and 100, received ${p}`)
  }

  const sorted = [...values].sort((a, b) => a - b)
  for (const value of sorted) {
    if (!Number.isFinite(value)) {
      throw new RangeError(`percentile: all values must be finite, received ${value}`)
    }
  }

  if (sorted.length === 1) {
    return sorted[0] as number
  }

  const rank = (p / 100) * (sorted.length - 1)
  const lowerIndex = Math.floor(rank)
  const upperIndex = Math.ceil(rank)
  const weight = rank - lowerIndex
  const lowerValue = sorted[lowerIndex] as number
  const upperValue = sorted[upperIndex] as number

  return lowerValue + (upperValue - lowerValue) * weight
}
