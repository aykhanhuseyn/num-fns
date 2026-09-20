/**
 * The `noThrow` boundary: one wrapper per return type, applied at the top of
 * every public function so a suppressed error becomes that type's empty
 * value (`src/config.ts`, the 2026-09-20 decision).
 *
 * Putting the boundary in a wrapper rather than threading a flag through
 * every guard is what makes "suppresses *everything*" true and cheap: the
 * body is unchanged and still throws, and the wrapper decides whether the
 * caller ever sees it. When `noThrow` is off — the default — the body runs
 * outside the `try` so a stack trace is not reshaped by this module.
 *
 * Internal, like `validation.ts`, `bigint.ts` and `sign.ts`. The
 * string-returning wrapper lives in `no-throw-text.ts` instead, because it
 * needs a `Locale` for the infinity word and `money/currency.ts` — which
 * `locale/types.ts` imports from — must keep importing nothing.
 */

import { getConfig, type NoThrowOptions } from '../config'

/** The per-call `noThrow` option if there is one, otherwise the package-wide setting. */
export function resolveNoThrow(options?: NoThrowOptions): boolean {
  const perCall = options?.noThrow
  return perCall === undefined ? getConfig().noThrow : perCall === true
}

/**
 * Whether a guard higher up the stack is already catching.
 *
 * Public functions call each other — `formatMoney` formats through
 * `formatNumber`, `moneyToWords` spells through `numberToWords`,
 * `parseShortNotation` reads its mantissa with `parseNumber` — and an inner
 * guard that swallowed the error would hand the outer function an empty
 * string to concatenate a currency symbol onto (`"$ "`). So only the
 * outermost guard catches; the inner ones run the body and let it throw.
 * Everything here is synchronous, so a plain flag is enough.
 */
let guarding = false

/** Runs `run`, returning `empty()` instead of throwing when `noThrow` is on and no outer guard is already catching. */
export function guardLazy<T>(run: () => T, empty: () => T, options?: NoThrowOptions): T {
  if (guarding || !resolveNoThrow(options)) return run()
  guarding = true
  try {
    return run()
  } catch {
    return empty()
  } finally {
    guarding = false
  }
}

/** {@link guardLazy} with a fixed empty value. */
export function guardValue<T>(run: () => T, empty: T, options?: NoThrowOptions): T {
  return guardLazy(run, () => empty, options)
}

/** {@link guardValue} for a numeric result: the empty value is `NaN`. */
export function guardNumber<T extends number | bigint>(run: () => T, options?: NoThrowOptions): T {
  // `NaN` is not a `bigint`, and there is no `bigint` that could stand in for
  // "no value" — `0n` is a real amount. A parser asked for `output: 'bigint'`
  // therefore returns `NaN` under `noThrow`, which its signature does not
  // admit; `NumFnsConfig.noThrow` documents that.
  return guardValue(run, Number.NaN as T, options)
}

/** {@link guardValue} for a boolean result: the empty value is `false`. */
export function guardBoolean(run: () => boolean, options?: NoThrowOptions): boolean {
  return guardValue(run, false, options)
}

/** {@link guardValue} for a list result: the empty value is the empty list. */
export function guardList<T>(run: () => T[], options?: NoThrowOptions): T[] {
  return guardValue(run, [], options)
}

/** {@link guardValue} for an object result: the empty value is `undefined`, which the signature does not admit. */
export function guardRecord<T>(run: () => T, options?: NoThrowOptions): T {
  return guardValue(run, undefined as unknown as T, options)
}
