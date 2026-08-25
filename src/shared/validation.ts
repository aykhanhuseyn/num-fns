/**
 * Shared `throw`-on-bad-input guards for the common numeric-parameter checks
 * repeated across `src/arithmetic/` and `src/financial/` (see `todo.md` §4,
 * "Shared range-validation helper instead of repeating checks per module").
 *
 * These are internal implementation helpers, not public API — unlike
 * `shared/types.ts`, they aren't re-exported from
 * `src/index.ts`. A consumer has no use for "assert this is finite"; they
 * only see the `RangeError` a public function throws, which is exactly what
 * these produce. Each `context` argument is the name of the calling public
 * function, matching the `"fnName: ..."` prefix every hand-written error
 * message in the codebase already uses.
 *
 * Not every existing `Number.isFinite` check in the codebase has been
 * migrated to these yet — `src/number/`, `src/stats/`, and `src/utils/` still
 * validate inline. This currently covers `src/arithmetic/` and
 * `src/financial/`, where the duplication was most exact (`clamp`/`inRange`
 * had a byte-for-byte identical min/max block; every `financial/` function
 * repeats the same finite/rate/non-negative shapes). Migrate other modules
 * opportunistically rather than in one large sweep, to keep each change
 * reviewable.
 */

/** Throws `RangeError` unless `value` is a finite number. */
export function assertFinite(value: number, label: string, context: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${context}: ${label} must be finite, received ${value}`)
  }
}

/**
 * Throws `RangeError` unless `value` is a finite number greater than `-1`.
 * The constraint shared by every per-period interest/discount `rate`
 * parameter in `src/financial/` — a rate of exactly `-100%` or lower makes
 * the compounding factor `(1 + rate)` zero or negative, which has no
 * financial meaning for compounding formulas. (`simpleInterest`'s `rate`
 * doesn't use this — simple interest doesn't compound, so a rate `<= -1` is
 * still well-defined there.)
 */
export function assertFiniteRate(value: number, context: string): void {
  if (!Number.isFinite(value) || value <= -1) {
    throw new RangeError(`${context}: rate must be finite and greater than -1, received ${value}`)
  }
}

/** Throws `RangeError` unless `value` is a finite number `>= 0`. */
export function assertNonNegative(value: number, label: string, context: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${context}: ${label} must be a finite number >= 0, received ${value}`)
  }
}

/** Throws `RangeError` unless `value` is a finite number `> 0`. */
export function assertPositive(value: number, label: string, context: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${context}: ${label} must be a finite number > 0, received ${value}`)
  }
}

/** Throws `RangeError` unless `value` is an integer `>= 1`. */
export function assertPositiveInteger(value: number, label: string, context: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${context}: ${label} must be a positive integer, received ${value}`)
  }
}

/**
 * Throws `RangeError` unless `min` and `max` are both finite and `min <= max`
 * — the inclusive-range precondition shared by `clamp` and `inRange`.
 */
export function assertFiniteBounds(min: number, max: number, context: string): void {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new RangeError(`${context}: min and max must be finite, received min=${min}, max=${max}`)
  }
  if (min > max) {
    throw new RangeError(`${context}: min (${min}) must not be greater than max (${max})`)
  }
}
