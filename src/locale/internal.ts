// Internal helpers shared by more than one locale. Not part of the public
// API: `locale/index.ts` does not export this module. Each locale keeps its
// own `Locale` word tables in its own file; only shared rules live here.

import type { PluralCategory } from './types'

/**
 * Splits a non-negative integer into base-1000 groups, least significant
 * first: `2003000` gives `[0, 3, 2]`, and `0` gives `[]`.
 */
export function thousandGroups(value: number): number[] {
  const groups: number[] = []
  let remaining = value
  while (remaining > 0) {
    groups.push(remaining % 1000)
    remaining = Math.floor(remaining / 1000)
  }
  return groups
}

/** The two-way plural rule of `en`, `enGB` and `es`: `one` for ±1, else `other`. */
export function oneOtherPlural(n: number): PluralCategory {
  return Math.abs(n) === 1 ? 'one' : 'other'
}

/**
 * Irregular English ordinal words. Every other word is regular: it takes
 * `'th'` (four -> fourth, hundred -> hundredth), or a final `y` becomes
 * `ieth` (twenty -> twentieth).
 */
const ENGLISH_ORDINAL_IRREGULARS: Readonly<Record<string, string>> = {
  one: 'first',
  two: 'second',
  three: 'third',
  five: 'fifth',
  eight: 'eighth',
  nine: 'ninth',
  twelve: 'twelfth',
}

/** Splits on a space or a hyphen and keeps it: "twenty-one" -> ["twenty", "-", "one"]. */
const ENGLISH_WORD_SPLIT_REGEX = /([\s-])/

function ordinalizeEnglishWord(word: string): string {
  const irregular = ENGLISH_ORDINAL_IRREGULARS[word]
  if (irregular) return irregular
  if (word.endsWith('y')) return `${word.slice(0, -1)}ieth`
  return `${word}th`
}

/**
 * Makes an English cardinal reading ordinal. Only the last word changes,
 * after a hyphen ("twenty-one" -> "twenty-first") or a space
 * ("one hundred and one" -> "one hundred and first").
 */
export function englishOrdinalWords(cardinalWords: string): string {
  const tokens = cardinalWords.split(ENGLISH_WORD_SPLIT_REGEX)
  const lastIndex = tokens.length - 1
  tokens[lastIndex] = ordinalizeEnglishWord(tokens[lastIndex] as string)
  return tokens.join('')
}

/**
 * Makes the English `ordinal.suffix` hook (`st`/`nd`/`rd`/`th`). `name` is
 * the locale's name in the error message, e.g. `'en'` or `'enGB'`.
 */
export function englishOrdinalSuffix(name: string): (value: number) => string {
  return (value: number): string => {
    if (!Number.isInteger(value) || value < 0) {
      throw new RangeError(
        `${name}.ordinal.suffix: value must be a non-negative integer, received ${value}`,
      )
    }
    const mod100 = value % 100
    if (mod100 >= 11 && mod100 <= 13) return 'th'
    switch (value % 10) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }
}
