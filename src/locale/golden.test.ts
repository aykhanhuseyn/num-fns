import { describe, expect, it } from 'bun:test'
import { type CurrencyCode, getCurrency } from '../money/currency'
import { formatMoney, parseMoney } from '../money/format'
import { moneyToWords } from '../money/words'
import { numberToDigitWords } from '../number/digits'
import { formatNumber, parseNumber } from '../number/format'
import { fractionToWords } from '../number/fraction'
import {
  parseLongNotation,
  parseShortNotation,
  toLongNotation,
  toShortNotation,
} from '../number/notation'
import { getOrdinalSuffix, ordinalToWords, toOrdinal } from '../number/suffix'
import { numberToWords } from '../number/words'
import { formatPercentage, parsePercentage } from '../percentage/format'
import { az } from './az'
import { en } from './en'
import { enGB } from './en-gb'
import { es } from './es'
import { ru } from './ru'
import type { GrammaticalGender, Locale } from './types'

/**
 * Golden output for the five shipped locales (task 0.7-1).
 *
 * The conformance suite checks invariants any locale must hold; this file
 * pins the exact bytes the shipped locales produce, so a change to the
 * shared engine (grouping, scale chunking, digit mapping) that alters a
 * single character of `az`/`en`/`enGB`/`ru`/`es` output fails here. The
 * snapshot was written before the `Locale` extensibility work and must not
 * change unless a locale's output is meant to change — then the diff is the
 * before/after a changeset needs.
 *
 * The locales are listed by hand, not read from the barrel, so a new locale
 * does not silently add an unreviewed snapshot.
 */
const SHIPPED: ReadonlyArray<readonly [string, Locale]> = [
  ['az', az],
  ['en', en],
  ['enGB', enGB],
  ['ru', ru],
  ['es', es],
]

const CURRENCIES: CurrencyCode[] = ['AZN', 'USD', 'EUR', 'RUB', 'GBP']
const GENDERS: GrammaticalGender[] = ['masculine', 'feminine', 'neuter']

const NUMBERS = [
  0, -0, 1, -1, 7, 12, 21, 99, 100, 101, 110, 999, 1000, 1001, 1234, 12345, 123456, 1234567,
  12345678, 123456789, 1e9, 1234567890, 1e12, 999_999_999_999_999, 0.5, 1.01, 1.005, 2.675, 12.34,
  -1234.5, 1234567.891, 1e21, 0.000001,
]
const BIGINTS = ['0', '-42', '1000', '1234567', '1234567890123456789', '-9007199254740993'].map(
  (text) => BigInt(text),
)
const INTEGERS = NUMBERS.filter((n) => Number.isInteger(n) && Math.abs(n) < 1e18)
const ORDINALS = [0, 1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 100, 101, 1000, 1_000_000]

/** The function's result, or the thrown error's class and message — a changed error is a changed output too. */
function attempt(run: () => unknown): string {
  try {
    const result = run()
    return typeof result === 'bigint' ? `${result}n` : String(result)
  } catch (error) {
    const { name, message } = error as Error
    return `${name}: ${message}`
  }
}

function show(value: number | bigint): string {
  if (typeof value === 'bigint') return `${value}n`
  return Object.is(value, -0) ? '-0' : String(value)
}

function render(locale: Locale): string {
  const lines: string[] = []
  const line = (label: string, run: () => unknown): void => {
    lines.push(`${label} => ${attempt(run)}`)
  }

  for (const value of [...NUMBERS, ...BIGINTS]) {
    const v = show(value)
    line(`formatNumber(${v})`, () => formatNumber(value, { locale }))
    line(`formatNumber(${v}, 2)`, () => formatNumber(value, { locale, decimals: 2 }))
    line(`parseNumber(formatNumber(${v}))`, () =>
      parseNumber(formatNumber(value, { locale }), { locale }),
    )
    line(`numberToWords(${v})`, () => numberToWords(value, { locale }))
    for (const gender of GENDERS) {
      line(`numberToWords(${v}, ${gender})`, () => numberToWords(value, { locale, gender }))
    }
    line(`toShortNotation(${v})`, () => toShortNotation(value, { locale }))
    line(`toShortNotation(${v}, 2)`, () => toShortNotation(value, { locale, decimals: 2 }))
    line(`toLongNotation(${v})`, () => toLongNotation(value, { locale }))
    line(`formatPercentage(${v})`, () => formatPercentage(value, { locale }))
    line(`formatMoney(${v})`, () => formatMoney(value, { locale }))
    line(`moneyToWords(${v})`, () => moneyToWords(value, { locale }))
    line(`numberToDigitWords(${v})`, () => numberToDigitWords(value, { locale }))
  }

  for (const value of INTEGERS) {
    const long = attempt(() => toLongNotation(value, { locale }))
    line(`parseLongNotation(${long})`, () => parseLongNotation(long, { locale }))
    line(`parseLongNotation(${long}, bigint)`, () =>
      parseLongNotation(long, { locale, output: 'bigint' }),
    )
    const short = attempt(() => toShortNotation(value, { locale }))
    line(`parseShortNotation(${short})`, () => parseShortNotation(short, { locale }))
  }

  const cap = BigInt(1000) ** BigInt(locale.words.scales.length)
  line('numberToWords(cap)', () => numberToWords(cap, { locale }))
  line('numberToWords(cap - 1)', () => numberToWords(cap - BigInt(1), { locale }))
  line('toLongNotation(cap)', () => toLongNotation(cap, { locale }))
  line('toLongNotation(Number(cap))', () => toLongNotation(Number(cap), { locale }))

  for (const currency of CURRENCIES) {
    for (const value of [0, 1, 2, 5, 21, 1234.56, -3.5, 21.21, 1000000]) {
      const formatted = formatMoney(value, { locale, currency })
      line(`formatMoney(${value}, ${currency})`, () => formatted)
      line(`parseMoney(${formatted}, ${currency})`, () =>
        parseMoney(formatted, { locale, currency }),
      )
      line(`moneyToWords(${value}, ${currency})`, () => moneyToWords(value, { locale, currency }))
    }
    line(`symbol(${currency})`, () => getCurrency(currency).symbol)
  }

  for (const value of [0.5, 12.345, -0.25]) {
    const formatted = formatPercentage(value, { locale, multiplyBy100: true, decimals: 1 })
    line(`formatPercentage(${value}, x100)`, () => formatted)
    line(`parsePercentage(${formatted})`, () => parsePercentage(formatted, { locale }))
  }

  for (const value of ORDINALS) {
    line(`toOrdinal(${value})`, () => toOrdinal(value, { locale }))
    line(`getOrdinalSuffix(${value})`, () => getOrdinalSuffix(value, { locale }))
    line(`ordinalToWords(${value})`, () => ordinalToWords(value, { locale }))
  }

  for (const [numerator, denominator] of [
    [1, 2],
    [1, 3],
    [3, 4],
    [5, 8],
    [2, 100],
  ] as const) {
    line(`fractionToWords(${numerator}/${denominator})`, () =>
      fractionToWords(numerator, denominator, { locale }),
    )
  }

  line('numberToDigitWords("994050123")', () => numberToDigitWords('994050123', { locale }))

  return lines.join('\n')
}

describe('golden output of the shipped locales', () => {
  it.each(SHIPPED)('%s is byte-identical to the committed snapshot', (_name, locale) => {
    expect(render(locale)).toMatchSnapshot()
  })
})
