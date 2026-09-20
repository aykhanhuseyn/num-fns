import { afterEach, describe, expect, it } from 'bun:test'
import * as numFns from './index'
import { az } from './locale/az'
import type { Locale } from './locale/types'

/**
 * The `noThrow` mode, function by function (`src/config.ts`, 2026-09-20).
 *
 * `src/index.test.ts` pins *what* the package exports; this file pins what
 * every one of those exports does when its input is bad and throwing is
 * turned off. The tables below are checked against that export list at the
 * end, so a new public function has to declare its empty value here before
 * the suite goes green — the same trick that keeps the export list honest.
 *
 * The bad input is deliberately varied: a non-finite value, an unparseable
 * string, an out-of-domain value, an empty data set, an unknown currency
 * code, a malformed options object. `noThrow` suppresses all of them, which
 * is the decision, not an accident — see `NumFnsConfig.noThrow`.
 */

/** A locale argument that is not a locale, for the two functions that validate nothing themselves. */
const BROKEN_LOCALE = null as unknown as Locale

const EMPTY_TEXT: readonly [name: string, call: () => string][] = [
  ['cardinalToOrdinalWords', () => numFns.cardinalToOrdinalWords('one', { locale: BROKEN_LOCALE })],
  ['formatMoney', () => numFns.formatMoney(Number.NaN)],
  ['formatNumber', () => numFns.formatNumber(Number.NaN)],
  ['formatPercentage', () => numFns.formatPercentage(Number.NaN)],
  ['fractionToWords', () => numFns.fractionToWords(1, 1)],
  ['getOrdinalSuffix', () => numFns.getOrdinalSuffix(Number.NaN)],
  ['moneyToWords', () => numFns.moneyToWords(Number.NaN)],
  ['numberToDigitWords', () => numFns.numberToDigitWords(Number.NaN)],
  ['numberToWords', () => numFns.numberToWords(Number.NaN)],
  ['ordinalToWords', () => numFns.ordinalToWords(Number.NaN)],
  ['toBase', () => numFns.toBase(1.5, 2)],
  ['toByteSize', () => numFns.toByteSize(-1)],
  ['toLongNotation', () => numFns.toLongNotation(Number.NaN)],
  ['toOrdinal', () => numFns.toOrdinal(Number.NaN)],
  ['toRoman', () => numFns.toRoman(0)],
  ['toShortNotation', () => numFns.toShortNotation(Number.NaN)],
  // `withSuffix` validates nothing of its own — the suffix is caller text —
  // so the only way to fail it is a malformed options argument.
  ['withSuffix', () => numFns.withSuffix(1, 'st', null as never)],
]

const EMPTY_NUMBER: readonly [name: string, call: () => number | bigint][] = [
  ['add', () => numFns.add(Number.NaN, 1)],
  ['clamp', () => numFns.clamp(Number.NaN, 0, 1)],
  ['compoundInterest', () => numFns.compoundInterest(Number.NaN, 0.1, 1)],
  ['divide', () => numFns.divide(1, 0)],
  ['fromBase', () => numFns.fromBase('zz', 2)],
  ['fromRoman', () => numFns.fromRoman('XYZ')],
  ['futureValue', () => numFns.futureValue(Number.NaN, 0.1, 1)],
  ['loanPayment', () => numFns.loanPayment(1000, 0.1, 0)],
  ['max', () => numFns.max([])],
  ['mean', () => numFns.mean([])],
  ['median', () => numFns.median([])],
  ['min', () => numFns.min([])],
  ['multiply', () => numFns.multiply(Number.NaN, 1)],
  ['parseByteSize', () => numFns.parseByteSize('abc')],
  ['parseLongNotation', () => numFns.parseLongNotation('abc')],
  ['parseMoney', () => numFns.parseMoney('abc')],
  ['parseNumber', () => numFns.parseNumber('abc')],
  ['parsePercentage', () => numFns.parsePercentage('abc')],
  ['parseShortNotation', () => numFns.parseShortNotation('abc')],
  ['percentile', () => numFns.percentile([], 50)],
  ['presentValue', () => numFns.presentValue(Number.NaN, 0.1, 1)],
  ['quantile', () => numFns.quantile([], 0.5)],
  ['round', () => numFns.round(Number.NaN)],
  ['simpleInterest', () => numFns.simpleInterest(Number.NaN, 0.1, 1)],
  ['standardDeviation', () => numFns.standardDeviation([])],
  ['subtract', () => numFns.subtract(Number.NaN, 1)],
  ['sum', () => numFns.sum([Number.NaN])],
  ['variance', () => numFns.variance([])],
]

const EMPTY_BOOLEAN: readonly [name: string, call: () => boolean][] = [
  ['inRange', () => numFns.inRange(Number.NaN, 0, 1)],
  ['isEven', () => numFns.isEven(1.5)],
  ['isOdd', () => numFns.isOdd(1.5)],
]

const EMPTY_LIST: readonly [name: string, call: () => unknown[]][] = [
  ['amortizationSchedule', () => numFns.amortizationSchedule(1000, 0.1, 0)],
  ['mode', () => numFns.mode([])],
]

const EMPTY_RECORD: readonly [name: string, call: () => unknown][] = [
  ['getCurrency', () => numFns.getCurrency('XYZ' as never)],
]

/** The three configuration functions are the mode's switch, not subject to it. */
const NOT_GUARDED = ['getConfig', 'resetConfig', 'setConfig']

afterEach(() => {
  numFns.resetConfig()
})

describe('every public function throws by default', () => {
  const everything = [
    ...EMPTY_TEXT,
    ...EMPTY_NUMBER,
    ...EMPTY_BOOLEAN,
    ...EMPTY_LIST,
    ...EMPTY_RECORD,
  ]
  it.each(everything)('%s', (_name, call) => {
    expect(call).toThrow()
  })
})

describe('with the global noThrow on, every public function returns its empty value', () => {
  it.each(EMPTY_TEXT)('%s returns ""', (_name, call) => {
    numFns.setConfig({ noThrow: true })
    expect(call()).toBe('')
  })

  it.each(EMPTY_NUMBER)('%s returns NaN', (_name, call) => {
    numFns.setConfig({ noThrow: true })
    expect(call()).toBeNaN()
  })

  it.each(EMPTY_BOOLEAN)('%s returns false', (_name, call) => {
    numFns.setConfig({ noThrow: true })
    expect(call()).toBe(false)
  })

  it.each(EMPTY_LIST)('%s returns []', (_name, call) => {
    numFns.setConfig({ noThrow: true })
    expect(call()).toEqual([])
  })

  it.each(EMPTY_RECORD)('%s returns undefined', (_name, call) => {
    numFns.setConfig({ noThrow: true })
    expect(call()).toBeUndefined()
  })
})

describe('the tables cover the whole public surface', () => {
  it('names every export exactly once', () => {
    const covered = [
      ...EMPTY_TEXT,
      ...EMPTY_NUMBER,
      ...EMPTY_BOOLEAN,
      ...EMPTY_LIST,
      ...EMPTY_RECORD,
    ].map(([name]) => name)
    expect(covered.length).toBe(new Set(covered).size)
    expect([...covered, ...NOT_GUARDED].sort()).toEqual(Object.keys(numFns).sort())
  })
})

describe('the per-call option', () => {
  it('turns the mode on for one call while the global setting is off', () => {
    expect(numFns.formatNumber(Number.NaN, { noThrow: true })).toBe('')
    expect(() => numFns.formatNumber(Number.NaN)).toThrow(RangeError)
  })

  it('turns the mode off for one call while the global setting is on', () => {
    numFns.setConfig({ noThrow: true })
    expect(numFns.formatNumber(Number.NaN)).toBe('')
    expect(() => numFns.formatNumber(Number.NaN, { noThrow: false })).toThrow(RangeError)
  })

  it('is not available on a positional-only function, which follows the global setting', () => {
    expect(() => numFns.round(Number.NaN)).toThrow(RangeError)
    numFns.setConfig({ noThrow: true })
    expect(numFns.round(Number.NaN)).toBeNaN()
  })
})

describe('an infinite value reads as a word rather than vanishing', () => {
  it('renders Infinity and -Infinity through the locale', () => {
    numFns.setConfig({ noThrow: true })
    expect(numFns.formatNumber(Number.POSITIVE_INFINITY)).toBe('infinity')
    expect(numFns.formatNumber(Number.NEGATIVE_INFINITY)).toBe('negative infinity')
    expect(numFns.numberToWords(Number.POSITIVE_INFINITY, { locale: az })).toBe('sonsuzluq')
    expect(numFns.toShortNotation(Number.NEGATIVE_INFINITY, { locale: az })).toBe('mənfi sonsuzluq')
  })

  it('has no word to give a numeric result, which stays NaN', () => {
    numFns.setConfig({ noThrow: true })
    expect(numFns.round(Number.POSITIVE_INFINITY)).toBeNaN()
    expect(numFns.add(Number.POSITIVE_INFINITY, 1)).toBeNaN()
  })
})

describe('a nested call cannot half-succeed', () => {
  it('lets the outer function fail whole, instead of formatting an empty inner result', () => {
    numFns.setConfig({ noThrow: true })
    // `formatMoney` formats through `formatNumber`: an inner guard would hand
    // it "" and it would return the bare currency symbol.
    expect(numFns.formatMoney(Number.NaN)).toBe('')
    expect(numFns.moneyToWords(Number.NaN)).toBe('')
    expect(numFns.formatPercentage(Number.NaN)).toBe('')
  })
})
