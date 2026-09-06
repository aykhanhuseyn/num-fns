import { describe, expect, it } from 'bun:test'
import * as numFns from './index'

/**
 * The complete public surface of the package root, sorted. This list is a
 * guard, not documentation: every entry here becomes semver-locked at 1.0, so
 * adding or removing one should be a deliberate diff in this file rather than
 * a side effect of adding an `export *` to `index.ts`.
 *
 * Every entry is a function as of 2026-08-25. The eleven SCREAMING_CASE
 * constants that used to sit here were Azerbaijani vocabulary leaking out of
 * `number/words.ts`, `number/notation.ts` and `shared/constants.ts`; they are
 * module-private in `locale/az.ts` now and reachable as `az.words.*` /
 * `az.notation.*` / `az.formatDefaults.*` / `az.currency.symbol`
 * (`todo.md` §3).
 *
 * `resolveScaleWord` used to sit here for the same kind of reason, though it
 * is locale-generic rather than Azerbaijani: `number/notation.ts` imports it
 * from `number/words.ts` and the flat `export *` barrel carried it out to the
 * root. `index.ts` re-exports `./number/words` by name now (2026-09-01), so
 * the root surface is exactly the 46 functions below (`getCurrency` joined
 * on 2026-09-06 with the ISO 4217 currency registry, `todo.md` §4).
 */
const PUBLIC_EXPORTS = [
  'amortizationSchedule',
  'cardinalToOrdinalWords',
  'clamp',
  'compoundInterest',
  'formatMoney',
  'formatNumber',
  'formatPercentage',
  'fractionToWords',
  'fromBase',
  'fromRoman',
  'futureValue',
  'getCurrency',
  'getOrdinalSuffix',
  'inRange',
  'isEven',
  'isOdd',
  'loanPayment',
  'max',
  'mean',
  'median',
  'min',
  'mode',
  'moneyToWords',
  'numberToDigitWords',
  'numberToWords',
  'ordinalToWords',
  'parseByteSize',
  'parseLongNotation',
  'parseMoney',
  'parseNumber',
  'parsePercentage',
  'parseShortNotation',
  'percentile',
  'presentValue',
  'quantile',
  'simpleInterest',
  'standardDeviation',
  'sum',
  'toBase',
  'toByteSize',
  'toLongNotation',
  'toOrdinal',
  'toRoman',
  'toShortNotation',
  'variance',
  'withSuffix',
] as const

describe('package root', () => {
  it('exports exactly the pinned public surface', () => {
    expect(Object.keys(numFns).sort()).toEqual([...PUBLIC_EXPORTS])
  })

  it('exports every named entry as a callable, and nothing as undefined', () => {
    for (const name of PUBLIC_EXPORTS) {
      const value = (numFns as Record<string, unknown>)[name]
      expect(value).toBeDefined()
      expect(typeof value).toBe('function')
    }
  })

  it('has no default export — every entry point is a named import', () => {
    expect((numFns as Record<string, unknown>).default).toBeUndefined()
  })
})
