import { describe, expect, it } from 'bun:test'
import * as numFns from './index'

/**
 * The `NaN` / `Infinity` / `-0` / min-max-bounds pass over the public surface
 * (`todo.md` §5).
 *
 * Each module's own test file covers its behaviour; this one covers the four
 * values every numeric function has to have an answer for, in one place, so
 * the answers stay the same answer. They are:
 *
 * - `NaN`, `null` and `undefined` throw — the package's oldest rule;
 * - `Infinity` and `-Infinity` throw too, and never come back out of a
 *   parser either (`Number("Infinity")` succeeds, so that one is a guard, not
 *   a coincidence);
 * - `-0` is a value and keeps its sign (2026-09-20);
 * - there is no magnitude limit: every finite number formats to its exact
 *   positional digits, `Number.MAX_VALUE` and `5e-324` included, and an
 *   accumulation that overflows throws instead of returning `Infinity`.
 *
 * `src/no-throw.test.ts` covers what each of these does with `noThrow` on.
 */

const NOT_A_NUMBER = [
  ['NaN', Number.NaN],
  ['null', null as unknown as number],
  ['undefined', undefined as unknown as number],
] as const

const NON_FINITE = [
  ['Infinity', Number.POSITIVE_INFINITY],
  ['-Infinity', Number.NEGATIVE_INFINITY],
] as const

/** Every public function that takes a bare numeric value as its first argument. */
const VALUE_TAKERS: readonly [name: string, call: (value: number) => unknown][] = [
  ['add', (v) => numFns.add(v, 1)],
  ['clamp', (v) => numFns.clamp(v, 0, 1)],
  ['divide', (v) => numFns.divide(v, 2)],
  ['formatMoney', (v) => numFns.formatMoney(v)],
  ['formatNumber', (v) => numFns.formatNumber(v)],
  ['formatPercentage', (v) => numFns.formatPercentage(v)],
  ['getOrdinalSuffix', (v) => numFns.getOrdinalSuffix(v)],
  ['inRange', (v) => numFns.inRange(v, 0, 1)],
  ['isEven', (v) => numFns.isEven(v)],
  ['isOdd', (v) => numFns.isOdd(v)],
  ['max', (v) => numFns.max([v])],
  ['mean', (v) => numFns.mean([v])],
  ['median', (v) => numFns.median([v])],
  ['min', (v) => numFns.min([v])],
  ['mode', (v) => numFns.mode([v])],
  ['moneyToWords', (v) => numFns.moneyToWords(v)],
  ['multiply', (v) => numFns.multiply(v, 2)],
  ['numberToDigitWords', (v) => numFns.numberToDigitWords(v)],
  ['numberToWords', (v) => numFns.numberToWords(v)],
  ['ordinalToWords', (v) => numFns.ordinalToWords(v)],
  ['round', (v) => numFns.round(v)],
  ['subtract', (v) => numFns.subtract(v, 1)],
  ['sum', (v) => numFns.sum([v])],
  ['toBase', (v) => numFns.toBase(v, 2)],
  ['toByteSize', (v) => numFns.toByteSize(v)],
  ['toLongNotation', (v) => numFns.toLongNotation(v)],
  ['toOrdinal', (v) => numFns.toOrdinal(v)],
  ['toRoman', (v) => numFns.toRoman(v)],
  ['toShortNotation', (v) => numFns.toShortNotation(v)],
  ['variance', (v) => numFns.variance([v, v + 1])],
]

/** Every parser, given a string `Number()` reads as a non-finite value. */
const PARSERS: readonly [name: string, call: (text: string) => unknown][] = [
  ['parseByteSize', (t) => numFns.parseByteSize(`${t} KB`)],
  ['parseLongNotation', (t) => numFns.parseLongNotation(`${t} thousand`)],
  ['parseMoney', (t) => numFns.parseMoney(`$ ${t}`)],
  ['parseNumber', (t) => numFns.parseNumber(t)],
  ['parsePercentage', (t) => numFns.parsePercentage(`${t}%`)],
  ['parseShortNotation', (t) => numFns.parseShortNotation(`${t}K`)],
]

describe('a value that is not a number', () => {
  for (const [label, value] of NOT_A_NUMBER) {
    it.each(VALUE_TAKERS)(`%s throws for ${label}`, (_name, call) => {
      expect(() => call(value)).toThrow()
    })
  }
})

describe('a non-finite value', () => {
  for (const [label, value] of NON_FINITE) {
    it.each(VALUE_TAKERS)(`%s throws for ${label}`, (_name, call) => {
      expect(() => call(value)).toThrow()
    })
  }

  it.each(PARSERS)('%s refuses to read one back out of a string', (_name, call) => {
    // `parseLongNotation` never gets as far as a number — "Infinity" is not a
    // digit group — so it raises its own SyntaxError; the rest raise RangeError.
    expect(() => call('Infinity')).toThrow()
    expect(() => call('-Infinity')).toThrow()
  })
})

describe('negative zero', () => {
  it('keeps its sign through every renderer', () => {
    expect(numFns.formatNumber(-0)).toBe('-0')
    expect(numFns.formatMoney(-0)).toBe('$ -0.00')
    expect(numFns.formatPercentage(-0)).toBe('-0%')
    expect(numFns.numberToWords(-0)).toBe('negative zero')
    expect(numFns.moneyToWords(-0)).toBe('negative zero dollars')
    expect(numFns.toShortNotation(-0)).toBe('-0')
    expect(numFns.toLongNotation(-0)).toBe('-0')
    expect(numFns.toBase(-0, 2)).toBe('-0')
  })

  it('survives a round trip through the parsers', () => {
    expect(Object.is(numFns.parseNumber('-0'), -0)).toBe(true)
    expect(Object.is(numFns.parseNumber('0'), -0)).toBe(false)
    expect(Object.is(numFns.fromBase('-0', 16), -0)).toBe(true)
  })

  it('comes out of arithmetic where IEEE 754 says it should', () => {
    expect(Object.is(numFns.round(-0.4), -0)).toBe(true)
    expect(Object.is(numFns.multiply(-1, 0), -0)).toBe(true)
    expect(Object.is(numFns.divide(0, -5), -0)).toBe(true)
    expect(Object.is(numFns.add(-1.5, 1.5), -0)).toBe(false)
  })

  it('is plain zero in the bigint domain, which has no signed zero', () => {
    expect(numFns.formatNumber(BigInt('-0'))).toBe('0')
    expect(numFns.numberToWords(BigInt('-0'))).toBe('zero')
    expect(numFns.fromBase('-0', 16, { output: 'bigint' })).toBe(BigInt(0))
  })
})

describe('the magnitude bounds', () => {
  it('formats every finite number positionally, with no exponent form', () => {
    expect(numFns.formatNumber(1e21)).toBe('1,000,000,000,000,000,000,000')
    expect(numFns.formatNumber(1e-7)).toBe('0.0000001')
    expect(numFns.formatNumber(1e21, { decimals: 2 })).toBe('1,000,000,000,000,000,000,000.00')
    const max = numFns.formatNumber(Number.MAX_VALUE)
    expect(max.startsWith('179,769,313,486,231,570,000')).toBe(true)
    expect(max).not.toContain('e')
    const min = numFns.formatNumber(5e-324)
    expect(min.startsWith('0.0000')).toBe(true)
    expect(min.endsWith('5')).toBe(true)
    expect(min).not.toContain('e')
  })

  it('round-trips a formatted extreme back to the same number', () => {
    for (const value of [1e21, 1e-7, Number.MAX_VALUE, 5e-324, Number.MAX_SAFE_INTEGER]) {
      expect(numFns.parseNumber(numFns.formatNumber(value))).toBe(value)
    }
  })

  it('reads a value past Number.MAX_SAFE_INTEGER exactly only as a bigint', () => {
    const past = '9007199254740993'
    expect(numFns.parseNumber(past, { output: 'bigint' })).toBe(BigInt(past))
    expect(() => numFns.parseLongNotation('9007199254740993 thousand')).toThrow(RangeError)
    expect(() => numFns.fromBase('20000000000000001', 16)).toThrow(RangeError)
  })

  it('throws rather than returning Infinity when a result overflows', () => {
    expect(() => numFns.add(Number.MAX_VALUE, Number.MAX_VALUE)).toThrow(RangeError)
    expect(() => numFns.multiply(1e308, 10)).toThrow(RangeError)
    expect(() => numFns.sum([1e308, 1e308])).toThrow(RangeError)
    expect(() => numFns.mean([1e308, 1e308])).toThrow(RangeError)
  })

  it('keeps the sign of a negative value that underflows to zero', () => {
    expect(Object.is(numFns.divide(-1e-308, 1e308), -0)).toBe(true)
    expect(Object.is(numFns.multiply(-5e-324, 0.1), -0)).toBe(true)
  })
})
