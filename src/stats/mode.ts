import { guardList } from '../shared/no-throw'
/**
 * Returns the mode(s) of an array of numbers — the value(s) that occur most
 * frequently. Returns every value tied for the highest frequency, sorted
 * ascending, so callers can detect multimodal input rather than silently
 * picking one.
 *
 * @param values - The numbers. Must not be empty; every value must be finite.
 * @returns Every value with the highest count, sorted ascending.
 * @throws {RangeError} When `values` is empty or a value is not finite.
 *
 * @example
 * mode([1, 2, 2, 3]); // [2]
 * mode([1, 1, 2, 2, 3]); // [1, 2]
 *
 * @since 0.2.0
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
