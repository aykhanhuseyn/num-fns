import { add } from '../arithmetic/add'
import { divide } from '../arithmetic/divide'
import { guardNumber } from '../shared/no-throw'

/**
 * Computes the median of an array of numbers — the middle value once
 * sorted, or the average of the two middle values for an even-length array.
 * That average is exact in decimal ({@link add}, then {@link divide}), so
 * `median([0.1, 0.2])` is `0.15`.
 *
 * Throws `RangeError` when `values` is empty or a value is not finite.
 *
 * @example
 * median([1, 3, 2]); // 2
 * median([1, 2, 3, 4]); // 2.5
 * median([0.1, 0.2]); // 0.15
 *
 * @since 0.2.0 (exact in decimal since 0.7.0)
 */
export function median(values: readonly number[]): number {
  return guardNumber(() => {
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
      return divide(add(sorted[middle - 1] as number, sorted[middle] as number), 2)
    }
    return sorted[middle] as number
  })
}
