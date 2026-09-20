/**
 * The string-returning half of the `noThrow` boundary (`no-throw.ts` holds
 * the rest and the rationale).
 *
 * A suppressed error renders as `''`, with one exception: `Infinity` and
 * `-Infinity` are values a reader can be told about, so they render as the
 * locale's `words.infinity`, prefixed with `words.negative` when negative.
 * That is the whole of the 2026-09-20 "Infinity: throw, or a text value"
 * decision — it throws by default and reads as a word under `noThrow`.
 */

import type { NoThrowOptions } from '../config'
import { en } from '../locale/en'
import type { Locale } from '../locale/types'
import { guardLazy } from './no-throw'

/** The options a string-returning public function may carry: the `noThrow` flag and the locale to word an infinity in. */
export interface TextGuardOptions extends NoThrowOptions {
  locale?: Locale
}

/**
 * Runs `run`, returning the empty text instead of throwing when `noThrow` is
 * on. `values` are the function's own value arguments, scanned for an
 * infinity so the result can name it rather than vanish.
 */
export function guardText(
  run: () => string,
  values: readonly unknown[],
  options?: TextGuardOptions,
): string {
  return guardLazy(run, () => infinityText(values, options?.locale ?? en), options)
}

/** The locale's word for the first infinite value in `values`, or `''` when none of them is infinite. */
function infinityText(values: readonly unknown[], locale: Locale): string {
  for (const value of values) {
    if (value === Number.POSITIVE_INFINITY) return locale.words.infinity
    if (value === Number.NEGATIVE_INFINITY) {
      return `${locale.words.negative} ${locale.words.infinity}`
    }
  }
  return ''
}
