/**
 * The package-wide reading of a value's sign, negative zero included.
 *
 * `-0` is a value here, not a rounding artefact to be scrubbed (the
 * 2026-09-20 decision, reversing the "never return `-0`" rule of
 * 2026-09-08). Every renderer and every arithmetic operation therefore has to
 * ask for the sign in a way `<` cannot answer, since `-0 < 0` is `false`:
 * `formatNumber(-0)` is `"-0"`, `numberToWords(-0.001)` is "negative zero",
 * and `multiply(-1, 0)` is `-0` exactly as IEEE 754 says it should be.
 *
 * Internal, like `validation.ts` and `bigint.ts` — a consumer sees only the
 * signed output, never these predicates.
 */

/** Whether `value` is the negative zero `number`. `Object.is` is the only reliable test: `-0 === 0`. */
export function isNegativeZero(value: number | bigint): boolean {
  return Object.is(value, -0)
}

/** Whether `value` is positive zero — the other half of the signed-zero pair, needed by `subtract`'s IEEE sign rule. */
export function isPositiveZero(value: number | bigint): boolean {
  return Object.is(value, 0)
}

/**
 * Whether `value` carries a minus sign, i.e. whether a renderer should
 * prefix it. True for every negative number and for `-0`; false for `-0n`,
 * which does not exist (`BigInt('-0')` is `0n`).
 */
export function isSigned(value: number | bigint): boolean {
  return value < 0 || isNegativeZero(value)
}
