/**
 * Computes the median of an array of numbers — the middle value once
 * sorted, or the average of the two middle values for an even-length array.
 *
 * @example
 * median([1, 3, 2]); // 2
 * median([1, 2, 3, 4]); // 2.5
 */
export function median(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError('median: values must not be empty')
  }

  const sorted = [...values].sort((a, b) => a - b)
  for (const value of sorted) {
    if (!Number.isFinite(value)) {
      throw new RangeError(`median: all values must be finite, received ${value}`)
    }
  }

  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2
  }
  return sorted[middle] as number
}
