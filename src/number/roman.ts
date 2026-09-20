import { guardNumber } from '../shared/no-throw'
import { guardText } from '../shared/no-throw-text'

const ROMAN_NUMERALS: ReadonlyArray<readonly [string, number]> = [
  ['M', 1000],
  ['CM', 900],
  ['D', 500],
  ['CD', 400],
  ['C', 100],
  ['XC', 90],
  ['L', 50],
  ['XL', 40],
  ['X', 10],
  ['IX', 9],
  ['V', 5],
  ['IV', 4],
  ['I', 1],
]

const ROMAN_VALUES: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }

const VALID_ROMAN_PATTERN = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/

/**
 * Converts an integer between 1 and 3999 into a roman numeral.
 *
 * A `bigint` is accepted for symmetry with the rest of the integer-domain
 * functions and is held to the same 1–3999 range (`RangeError` outside it);
 * within it, the value is simply converted to a `number`, which is exact.
 *
 * @example
 * toRoman(1994); // "MCMXCIV"
 * toRoman(BigInt(1994)); // "MCMXCIV"
 */
export function toRoman(value: number | bigint): string {
  return guardText(() => {
    if (typeof value === 'number' && !Number.isInteger(value)) {
      throw new TypeError(`toRoman: value must be an integer, received ${value}`)
    }
    if (value < 1 || value > 3999) {
      throw new RangeError(`toRoman: value must be between 1 and 3999, received ${value}`)
    }

    let remaining = Number(value)
    let result = ''
    for (const [symbol, symbolValue] of ROMAN_NUMERALS) {
      while (remaining >= symbolValue) {
        result += symbol
        remaining -= symbolValue
      }
    }

    return result
  }, [value])
}

/**
 * Converts a roman numeral string into its integer value.
 *
 * Returns a `number` only — the result is always within 1–3999, so an
 * `output: 'bigint'` option would buy nothing and is deliberately not offered.
 *
 * @example
 * fromRoman("MCMXCIV"); // 1994
 */
export function fromRoman(roman: string): number {
  return guardNumber(() => {
    const normalized = roman.trim().toUpperCase()
    if (normalized === '' || !VALID_ROMAN_PATTERN.test(normalized)) {
      throw new SyntaxError(`fromRoman: "${roman}" is not a valid roman numeral`)
    }

    let total = 0
    for (let i = 0; i < normalized.length; i++) {
      const current = ROMAN_VALUES[normalized[i] as string] as number
      const next = normalized[i + 1] ? ROMAN_VALUES[normalized[i + 1] as string] : undefined
      total += next && current < next ? -current : current
    }

    return total
  })
}
