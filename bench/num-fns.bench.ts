/**
 * Benchmarks for the hot paths of `num-fns` (`docs/development-plan.md`,
 * task 0.7-0). Run with `bun run bench`; the committed reference numbers are
 * in `bench/BASELINE.md`.
 *
 * The cases are the ones the plan names: `formatNumber` across magnitudes
 * (it does `BigInt` work on every call since 0.6.0), `numberToWords` on a
 * large value in two locales, the exact `add` and `sum` on 100 000 decimals,
 * and `parseNumber` on a grouped string. Add a case when a change touches a
 * path that is not here; never remove one.
 */

import { bench, group, run } from 'mitata'
import { add, formatNumber, numberToWords, parseNumber, sum } from '../src'
import { en, ru } from '../src/locale'

/** 100 000 decimals with two fraction digits — a price list. */
const DECIMALS: number[] = Array.from({ length: 100_000 }, (_, i) => ((i * 7919) % 100_000) / 100)

group('formatNumber', () => {
  bench('formatNumber(1)', () => formatNumber(1))
  bench('formatNumber(1e6)', () => formatNumber(1e6))
  bench('formatNumber(1234567.891)', () => formatNumber(1234567.891))
  bench('formatNumber(1e21)', () => formatNumber(1e21))
  bench('formatNumber(Number.MAX_VALUE)', () => formatNumber(Number.MAX_VALUE))
})

group('numberToWords', () => {
  bench('numberToWords(999 999 999 999 999, en)', () =>
    numberToWords(999_999_999_999_999, { locale: en }),
  )
  bench('numberToWords(999 999 999 999 999, ru)', () =>
    numberToWords(999_999_999_999_999, { locale: ru }),
  )
})

group('arithmetic', () => {
  bench('add × 100 000', () => {
    let total = 0
    for (const value of DECIMALS) total = add(total, value)
    return total
  })
  bench('sum of 100 000 decimals', () => sum(DECIMALS))
})

group('parseNumber', () => {
  bench('parseNumber("1,234,567.89")', () => parseNumber('1,234,567.89'))
})

await run({ format: process.env.BENCH_FORMAT === 'markdown' ? 'markdown' : 'mitata' })
