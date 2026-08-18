import { en } from '../locale/en'
import type { LocaleCurrencyUnit, PluralCategory } from '../locale/types'
import { numberToWords } from '../number/words'
import type { MoneyWordsOptions } from '../shared/types'

/** Resolves a currency unit's word for `category`, falling back to `'other'`, then the invariant word. */
function resolveUnitWord(unit: LocaleCurrencyUnit, category: PluralCategory): string {
  return unit.plurals?.[category] ?? unit.plurals?.other ?? unit.word
}

/**
 * Spells out a monetary amount as words, pairing the integer part with a
 * major currency unit word and the (rounded) fractional part with a minor
 * unit word, per `options.locale` (defaults to `en`: dollars/cents). Unit
 * words are resolved for the amount's plural category via `locale.plural`
 * when the locale inflects them (Russian "рубль"/"рубля"/"рублей").
 *
 * @example
 * moneyToWords(1234.5); // "one thousand two hundred thirty-four dollars fifty cents"
 * moneyToWords(1, { locale: en }); // "one dollar"
 * moneyToWords(1234.5, { locale: az }); // "min iki yüz otuz dörd manat əlli qəpik"
 */
export function moneyToWords(value: number, options: MoneyWordsOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`moneyToWords: value must be finite, received ${value}`)
  }

  const { locale = en, majorUnit, minorUnit, includeZeroMinor = false } = options

  const isNegative = value < 0 && value !== 0
  const absolute = Math.abs(value)
  let major = Math.floor(absolute)
  let minor = Math.round((absolute - major) * 100)
  if (minor === 100) {
    minor = 0
    major += 1
  }

  const majorUnitWord = majorUnit ?? resolveUnitWord(locale.currency.major, locale.plural(major))
  const minorUnitWord = minorUnit ?? resolveUnitWord(locale.currency.minor, locale.plural(minor))

  const majorWords = `${numberToWords(major, { locale })} ${majorUnitWord}`
  const minorWords =
    minor > 0 || includeZeroMinor ? ` ${numberToWords(minor, { locale })} ${minorUnitWord}` : ''
  const words = `${majorWords}${minorWords}`

  return isNegative ? `${locale.words.negative} ${words}` : words
}
