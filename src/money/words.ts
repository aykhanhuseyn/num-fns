import { NEGATIVE_WORD, numberToWords } from '../number/words'
import type { MoneyWordsOptions } from '../shared/types'

/**
 * Spells out a monetary amount as Azerbaijani words, pairing the integer
 * part with a major currency unit word and the (rounded) fractional part
 * with a minor unit word. Defaults to the manat / qəpik pair.
 *
 * @example
 * moneyToWords(1234.5); // "min iki yüz otuz dörd manat əlli qəpik"
 * moneyToWords(10); // "on manat"
 * moneyToWords(-2.5); // "mənfi iki manat əlli qəpik"
 */
export function moneyToWords(value: number, options: MoneyWordsOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`moneyToWords: value must be finite, received ${value}`)
  }

  const { majorUnit = 'manat', minorUnit = 'qəpik', includeZeroMinor = false } = options

  const isNegative = value < 0 && value !== 0
  const absolute = Math.abs(value)
  let major = Math.floor(absolute)
  let minor = Math.round((absolute - major) * 100)
  if (minor === 100) {
    minor = 0
    major += 1
  }

  const majorWords = `${numberToWords(major)} ${majorUnit}`
  const minorWords = minor > 0 || includeZeroMinor ? ` ${numberToWords(minor)} ${minorUnit}` : ''
  const words = `${majorWords}${minorWords}`

  return isNegative ? `${NEGATIVE_WORD} ${words}` : words
}
