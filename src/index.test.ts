import { describe, expect, it } from 'bun:test'
import * as numFns from './index'

/**
 * The complete public surface of the package root, sorted. This list is a
 * guard, not documentation: every entry here becomes semver-locked at 1.0, so
 * adding or removing one should be a deliberate diff in this file rather than
 * a side effect of adding an `export *` to `index.ts`.
 *
 * The eleven SCREAMING_CASE constants and `resolveScaleWord` are Azerbaijani
 * word-list internals that leak out of `number/words.ts` (`todo.md` §3) — they
 * are listed because they *are* currently exported, not because they should
 * stay. Removing them before 1.0 is a planned breaking change.
 */
const PUBLIC_EXPORTS = [
  'AZN_SYMBOL',
  'DECIMAL_WORD',
  'DEFAULT_DECIMAL_SEPARATOR',
  'DEFAULT_THOUSANDS_SEPARATOR',
  'HUNDRED_WORD',
  'NEGATIVE_WORD',
  'ONES',
  'SCALE_WORDS',
  'SHORT_SCALES_AZ',
  'TENS',
  'ZERO_WORD',
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
  'resolveScaleWord',
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

/** The subset of {@link PUBLIC_EXPORTS} that is data rather than a function. */
const NON_FUNCTION_EXPORTS = new Set([
  'AZN_SYMBOL',
  'DECIMAL_WORD',
  'DEFAULT_DECIMAL_SEPARATOR',
  'DEFAULT_THOUSANDS_SEPARATOR',
  'HUNDRED_WORD',
  'NEGATIVE_WORD',
  'ONES',
  'SCALE_WORDS',
  'SHORT_SCALES_AZ',
  'TENS',
  'ZERO_WORD',
])

describe('package root', () => {
  it('exports exactly the pinned public surface', () => {
    expect(Object.keys(numFns).sort()).toEqual([...PUBLIC_EXPORTS])
  })

  it('exports every named function as a callable, and nothing as undefined', () => {
    for (const name of PUBLIC_EXPORTS) {
      const value = (numFns as Record<string, unknown>)[name]
      expect(value).toBeDefined()
      if (!NON_FUNCTION_EXPORTS.has(name)) {
        expect(typeof value).toBe('function')
      }
    }
  })

  it('has no default export — every entry point is a named import', () => {
    expect((numFns as Record<string, unknown>).default).toBeUndefined()
  })
})
