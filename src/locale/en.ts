import type { Locale, PluralCategory, WordChunk } from './types'

/**
 * Irregular English ordinal words. Every value not listed here is regular —
 * either a plain `+ 'th'` (four -> fourth, six -> sixth, ten -> tenth,
 * thirteen -> thirteenth, hundred -> hundredth, thousand -> thousandth) or a
 * `y` -> `ieth` swap for the tens (twenty -> twentieth, ninety -> ninetieth),
 * both handled by {@link ordinalizeWord}.
 */
const ORDINAL_IRREGULARS: Readonly<Record<string, string>> = {
  one: 'first',
  two: 'second',
  three: 'third',
  five: 'fifth',
  eight: 'eighth',
  nine: 'ninth',
  twelve: 'twelfth',
}

/** Splits on whitespace/hyphen while keeping the separator, e.g. "twenty-one" -> ["twenty", "-", "one"]. */
const WORD_SPLIT_REGEX = /([\s-])/

/** Words for digits 1-9. Index `0` is unused so digits can index directly. */
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
/** Irregular words for 11-19, index `0` corresponding to 11. */
const TEENS = [
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
]
/** Words for the tens digit: 10, 20, ..., 90. Index `0` is unused. */
const TENS = [
  '',
  'ten',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
]

function ordinalizeWord(word: string): string {
  const irregular = ORDINAL_IRREGULARS[word]
  if (irregular) return irregular
  if (word.endsWith('y')) return `${word.slice(0, -1)}ieth`
  return `${word}th`
}

/**
 * Renders a single 0-999 group as English cardinal words, hyphenating a
 * tens+ones pair ("twenty-one") but never dropping the leading "one" before
 * "hundred" (`renderGroup(100)` is `"one hundred"`, not `"hundred"` — unlike
 * Azerbaijani's "min"/"bir min" distinction, which is `compose`'s job, not
 * this one, and doesn't apply the same way to English).
 */
function renderGroup(value: number): string {
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100

  const parts: string[] = []
  if (hundreds > 0) parts.push(`${ONES[hundreds]} hundred`)

  if (remainder >= 11 && remainder <= 19) {
    parts.push(TEENS[remainder - 11] as string)
  } else {
    const tens = Math.floor(remainder / 10)
    const ones = remainder % 10
    if (tens > 0 && ones > 0) parts.push(`${TENS[tens]}-${ONES[ones]}`)
    else if (tens > 0) parts.push(TENS[tens] as string)
    else if (ones > 0) parts.push(ONES[ones] as string)
  }

  return parts.join(' ')
}

/**
 * English locale (`todo.md` §1/§2). Cardinal composition follows American
 * usage — no `and` before the final group (`"one hundred one"`, not
 * `"one hundred and one"`); the en-GB variant with `and` is listed as future
 * work in `todo.md` §2 and isn't implemented here. Uses short-scale
 * `billion` = `1e9`, matching modern US/UK usage.
 */
export const en: Locale = {
  code: 'en',
  name: 'English',
  formatDefaults: {
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
  words: {
    zero: 'zero',
    ones: ONES,
    teens: TEENS,
    tens: TENS,
    // Invariant multiplier noun reused for every digit 1-9 ("two hundred", not "two hundreds").
    hundreds: 'hundred',
    // Scale words never inflect by count either ("two thousand", not "two thousands").
    scales: ['', 'thousand', 'million', 'billion', 'trillion'],
    negative: 'negative',
    // Decimal connector joining integer and fractional parts (12.34 -> "twelve point thirty-four").
    decimalConnector: 'point',
    renderGroup,
    compose: (chunks: readonly WordChunk[]): string =>
      chunks
        .map((chunk) => (chunk.scaleWord ? `${chunk.words} ${chunk.scaleWord}` : chunk.words))
        .join(' '),
  },
  // Only currency words need the one/other split ("one dollar" / "two dollars").
  plural: (n: number): PluralCategory => (Math.abs(n) === 1 ? 'one' : 'other'),
  ordinal: {
    suffix: (value: number): string => {
      if (!Number.isInteger(value) || value < 0) {
        throw new RangeError(
          `en.ordinal.suffix: value must be a non-negative integer, received ${value}`,
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
    },
    // Only the last word of the cardinal reading becomes ordinal, whether
    // that word is hyphen-joined ("twenty-one" -> "twenty-first") or
    // space-joined ("one hundred one" -> "one hundred first").
    words: (_value: number, cardinalWords: string): string => {
      const tokens = cardinalWords.split(WORD_SPLIT_REGEX)
      const lastIndex = tokens.length - 1
      tokens[lastIndex] = ordinalizeWord(tokens[lastIndex] as string)
      return tokens.join('')
    },
  },
  notation: {
    scales: [
      { threshold: 1e12, short: 'T', long: 'trillion' },
      { threshold: 1e9, short: 'B', long: 'billion' },
      { threshold: 1e6, short: 'M', long: 'million' },
      { threshold: 1e3, short: 'K', long: 'thousand' },
    ],
    spaceBeforeShort: false,
  },
  currency: {
    code: 'USD',
    symbol: '$',
    symbolPosition: 'before',
    major: { word: 'dollar', plurals: { one: 'dollar', other: 'dollars' } },
    minor: { word: 'cent', plurals: { one: 'cent', other: 'cents' } },
  },
}
