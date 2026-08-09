import { SHORT_SCALES_AZ } from '../number/notation'
import { cardinalToOrdinalWords, getOrdinalSuffix } from '../number/suffix'
import {
  DECIMAL_WORD,
  HUNDRED_WORD,
  NEGATIVE_WORD,
  ONES,
  SCALE_WORDS,
  TENS,
  ZERO_WORD,
} from '../number/words'
import {
  AZN_SYMBOL,
  DEFAULT_DECIMAL_SEPARATOR,
  DEFAULT_THOUSANDS_SEPARATOR,
} from '../shared/constants'
import type { Locale, WordChunk } from './types'

/**
 * Azerbaijani locale — the reference implementation the locale refactor
 * (`todo.md` §1) is built against. Every field is ported unchanged from the
 * hardcoded constants in `number/words.ts`, `number/suffix.ts`,
 * `number/notation.ts` and `shared/constants.ts` rather than re-derived, so
 * this object cannot regress the existing (implicitly Azerbaijani) behavior
 * of `numberToWords`, `toOrdinal`/`ordinalToWords`, `toShortNotation`/
 * `toLongNotation`, or `formatMoney`/`moneyToWords` once those functions are
 * threaded to read from `Locale` objects instead of module-level defaults.
 */
export const az: Locale = {
  code: 'az',
  name: 'Azerbaijani',
  formatDefaults: {
    thousandsSeparator: DEFAULT_THOUSANDS_SEPARATOR,
    decimalSeparator: DEFAULT_DECIMAL_SEPARATOR,
  },
  words: {
    zero: ZERO_WORD,
    ones: ONES,
    tens: TENS,
    // Azerbaijani only needs one multiplier noun reused for every digit 1-9.
    hundreds: HUNDRED_WORD,
    scales: SCALE_WORDS,
    negative: NEGATIVE_WORD,
    and: DECIMAL_WORD,
    compose: (chunks: readonly WordChunk[]): string =>
      chunks
        .map((chunk) => {
          // "min" for exactly 1000 at the thousands scale, not "bir min" —
          // unlike "bir milyon" at every scale above thousands. Mirrors the
          // irregular case in `number/words.ts`'s `integerToWords`.
          if (chunk.scaleIndex === 1 && chunk.value === 1) return chunk.scaleWord
          return chunk.scaleWord ? `${chunk.words} ${chunk.scaleWord}` : chunk.words
        })
        .join(' '),
  },
  // Azerbaijani never inflects scale/currency words by count.
  plural: () => 'other',
  ordinal: {
    suffix: getOrdinalSuffix,
    words: (_value, cardinalWords) => cardinalToOrdinalWords(cardinalWords),
  },
  notation: {
    // Long-scale word for each SHORT_SCALES_AZ entry lives at the matching
    // magnitude in SCALE_WORDS, e.g. SHORT_SCALES_AZ[0] is 1e12/"trln" and
    // SCALE_WORDS[4] is "trilyon" — both the largest magnitude.
    scales: SHORT_SCALES_AZ.map(([threshold, short], index) => ({
      threshold,
      short,
      long: SCALE_WORDS[SCALE_WORDS.length - 1 - index] as string,
    })),
    spaceBeforeShort: true,
  },
  currency: {
    code: 'AZN',
    symbol: AZN_SYMBOL,
    symbolPosition: 'after',
    major: { word: 'manat' },
    minor: { word: 'qəpik' },
  },
}
