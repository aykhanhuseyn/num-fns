import { guardList } from '../shared/no-throw'
/**
 * Returns the mode(s) of an array of numbers — the value(s) that occur most
 * frequently. Returns every value tied for the highest frequency, sorted
 * ascending, so callers can detect multimodal input rather than silently
 * picking one.
 *
 * @example
 * mode([1, 2, 2, 3]); // [2]
 * mode([1, 1, 2, 2, 3]); // [1, 2]
 */
export function mode(values: readonly number[]): number[] {
  return guardList(() => {
    if (values.length === 0) {
      throw new RangeError('mode: values must not be empty')
    }

    const counts = new Map<number, number>()
    for (const value of values) {
      if (!Number.isFinite(value)) {
        throw new RangeError(`mode: all values must be finite, received ${value}`)
      }
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }

    const highestCount = Math.max(...counts.values())
    return [...counts.entries()]
      .filter(([, count]) => count === highestCount)
      .map(([value]) => value)
      .sort((a, b) => a - b)
  })
}
