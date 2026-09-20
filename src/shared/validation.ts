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
 * Throws unless `value` is a finite `number` or a `bigint` — the guard every
 * function taking a `number | bigint` runs first.
 *
 * `typeof value === 'number' && !Number.isFinite(value)` was not enough: it
 * waves `null` and `undefined` straight through, and `Math.abs(null)` is `0`,
 * so `formatNumber(null)` used to return `"0"` and `toOrdinal(null)` used to
 * return `"null-th"`. A JavaScript caller with a missing field should be told,
 * not quietly given a zero (the 2026-09-20 decision: `NaN`, `null`,
 * `undefined` and the like throw).
 */
export function assertNumericValue(value: unknown, label: string, context: string): void {
  if (typeof value === 'bigint') return
  if (typeof value !== 'number') {
    const received = value === null ? 'null' : typeof value
    throw new TypeError(`${context}: ${label} must be a number or bigint, received ${received}`)
  }
  if (!Number.isFinite(value)) {
    throw new RangeError(`${context}: ${label} must be finite, received ${value}`)
  }
}

/**
 * Throws `RangeError` when a computed result overflowed to `±Infinity`.
 *
 * The counterpart of {@link assertFinite} on the way out: `src/arithmetic/`
 * refuses to hand back a non-finite number (`fromDecimal`), and the `stats`
 * helpers that accumulate — `sum`, `variance` — have to refuse the same way,
 * or `sum([1e308, 1e308])` would be the one `Infinity` the package returns
 * (`todo.md` §5's edge-case pass).
 */
export function assertFiniteResult(value: number, context: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${context}: result ${value} is outside the range of a JavaScript number`)
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

/** Matches any decimal digit, i.e. a character that cannot separate digit groups. */
const DIGIT_REGEX = /\d/

/**
 * Throws `RangeError` unless the thousands and decimal separators differ.
 *
 * Equal separators make the formatted string ambiguous and the parse silently
 * wrong rather than merely lossy: `formatNumber` writes both, then
 * `parseNumber` strips the thousands separator first and turns `'0.001'` into
 * `1` when both are `'.'`. Two empty separators are rejected for the same
 * reason — an empty decimal separator drops the point and glues the
 * fractional digits onto the integer part (`1.5` -> `'15'`).
 */
export function assertDistinctSeparators(
  thousandsSeparator: string,
  decimalSeparator: string,
  context: string,
): void {
  if (thousandsSeparator === decimalSeparator) {
    throw new RangeError(
      `${context}: thousandsSeparator and decimalSeparator must differ, received ${JSON.stringify(thousandsSeparator)} for both`,
    )
  }
}

/**
 * Throws `RangeError` unless `groupSeparator` can separate the digit-group /
 * scale-word pairs of a long-notation string.
 *
 * An empty separator glues a scale word onto the next group's digits
 * (`'1 million234 thousand'`), and a separator containing a digit merges into
 * those digits — both produce output `parseLongNotation` cannot read back.
 * Characters occurring inside the locale's own scale words break the round
 * trip too, but that depends on the locale and stays the caller's
 * responsibility.
 */
export function assertGroupSeparator(groupSeparator: string, context: string): void {
  if (groupSeparator === '' || DIGIT_REGEX.test(groupSeparator)) {
    throw new RangeError(
      `${context}: groupSeparator must be a non-empty string containing no digits, received ${JSON.stringify(groupSeparator)}`,
    )
  }
}
