import { assertFinite } from '../shared/validation'
import { alignScales, fromDecimal, toDecimal } from './decimal'

/**
 * Adds two numbers exactly in decimal, so the classic floating-point traps
 * don't apply: `add(0.1, 0.2)` is `0.3`, not `0.30000000000000004`. Each
 * operand is taken at its shortest decimal reading, the sum is computed
 * exactly, and the result is the closest JavaScript number to that sum.
 *
 * Throws `RangeError` on non-finite input or when the result is too large
 * for a JavaScript number. Never returns `-0`.
 *
 * @example
 * add(0.1, 0.2); // 0.3
 * add(1.15, 2.3); // 3.45
 * add(-1.5, 1.5); // 0
 */
export function add(a: number, b: number): number {
  assertFinite(a, 'a', 'add')
  assertFinite(b, 'b', 'add')

  const aligned = alignScales(toDecimal(a), toDecimal(b))
  return fromDecimal(aligned.a + aligned.b, aligned.scale, 'add')
}
