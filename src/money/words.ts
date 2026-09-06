import { en } from '../locale/en'
import type {
  Locale,
  LocaleCurrencyUnit,
  LocaleCurrencyUnits,
  PluralCategory,
} from '../locale/types'
import { numberToWords } from '../number/words'
import { absBigInt, pluralOperand, ZERO } from '../shared/bigint'
import type { MoneyWordsOptions } from '../shared/types'
import { type CurrencyCode, getCurrency } from './currency'

/** Resolves a currency unit's word for `category`, falling back to `'other'`, then the invariant word. */
function resolveUnitWord(unit: LocaleCurrencyUnit, category: PluralCategory): string {
  return unit.plurals?.[category] ?? unit.plurals?.other ?? unit.word
}

/**
 * The locale's unit words for `code`, or a `RangeError` naming both — a
 * locale that has no words for a currency must not silently borrow another
 * language's (`todo.md` §1's module-private vocabulary decision).
 */
function resolveUnits(locale: Locale, code: CurrencyCode): LocaleCurrencyUnits {
  const units = locale.currency.units[code]
  if (units === undefined) {
    throw new RangeError(
      `moneyToWords: locale "${locale.code}" has no unit words for currency "${code}" — it knows ${Object.keys(locale.currency.units).join(', ')}`,
    )
  }
  return units
}

/**
 * Spells out a monetary amount as words, pairing the integer part with a
 * major currency unit word and the (rounded) fractional part with a minor
 * unit word, per `options.locale` (defaults to `en`: dollars/cents) and
 * `options.currency` (defaults to the locale's own — pass an ISO 4217 code
 * for any other currency the locale has words for: `{ locale: en, currency:
 * 'GBP' }` spells pounds and pence). Unit words are resolved for the
 * amount's plural category via `locale.plural` when the locale inflects
 * them (Russian "рубль"/"рубля"/"рублей"). When the unit declares a `gender`
 * (`LocaleCurrencyUnit.gender`), the amount itself is spelled agreeing with
 * it, so Russian minor units come out correct: `1.01` -> `"один рубль одна
 * копейка"`, not `"...один копейка"`, and Spanish `1` pound reads `"una
 * libra"`.
 *
 * A `bigint` is an exact whole amount of the major unit (the minor part is
 * zero, spelled only with `includeZeroMinor`), read at any magnitude the
 * locale can name — `numberToWords` throws `RangeError` beyond
 * `1000 ** locale.words.scales.length - 1` (999 trillion for every launch
 * locale). The unit word is still inflected for the amount's plural
 * category (`moneyToWords(2n, { locale: ru })` is `"два рубля"`), and a
 * negative `bigint` is prefixed with `locale.words.negative` like a
 * negative `number`.
 *
 * @example
 * moneyToWords(1234.5); // "one thousand two hundred thirty-four dollars fifty cents"
 * moneyToWords(1, { locale: en }); // "one dollar"
 * moneyToWords(1.5, { currency: 'GBP' }); // "one pound fifty pence"
 * moneyToWords(1234.5, { locale: az }); // "min iki yüz otuz dörd manat əlli qəpik"
 * moneyToWords(1.01, { locale: ru }); // "один рубль одна копейка"
 * moneyToWords(2.02, { locale: ru, currency: 'USD' }); // "два доллара два цента"
 * moneyToWords(1000000000000n); // "one trillion dollars"
 */
export function moneyToWords(value: number | bigint, options: MoneyWordsOptions = {}): string {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new RangeError(`moneyToWords: value must be finite, received ${value}`)
  }

  const { locale = en, currency: code = locale.currency.code } = options
  const { decimals } = getCurrency(code)
  const units = resolveUnits(locale, code)
  const { majorUnit, minorUnit, includeZeroMinor = false } = options

  const { isNegative, major, minor } =
    typeof value === 'bigint' ? splitBigIntAmount(value) : splitAmount(value, decimals)

  // `locale.plural` takes a `number`: a `bigint` major amount beyond the safe
  // range is folded by `pluralOperand` to a value with the same plural category.
  const majorCount = typeof major === 'bigint' ? pluralOperand(major) : major
  const majorUnitWord = majorUnit ?? resolveUnitWord(units.major, locale.plural(majorCount))
  const minorUnitWord = minorUnit ?? resolveUnitWord(units.minor, locale.plural(minor))

  const majorWords = `${numberToWords(major, { locale, gender: units.major.gender })} ${majorUnitWord}`
  const minorWords =
    minor > 0 || includeZeroMinor
      ? ` ${numberToWords(minor, { locale, gender: units.minor.gender })} ${minorUnitWord}`
      : ''
  const words = `${majorWords}${minorWords}`

  return isNegative ? `${locale.words.negative} ${words}` : words
}

/** The sign and the non-negative major/minor unit counts an amount spells out as. */
interface AmountParts {
  isNegative: boolean
  /** Whole major units — a `bigint` when the input was one, read exactly by `numberToWords`. */
  major: number | bigint
  /** Minor units, `0` to `10 ** decimals - 1`; always a plain `number` (a `bigint` amount has none). */
  minor: number
}

/**
 * Splits a `number` amount into major and minor units, rounding the fraction
 * to the currency's `decimals` and carrying a rounded-up minor part
 * (`1.999` at two decimals) into the major unit.
 */
function splitAmount(value: number, decimals: number): AmountParts {
  const isNegative = value < 0 && value !== 0
  const absolute = Math.abs(value)
  const minorPerMajor = 10 ** decimals
  let major = Math.floor(absolute)
  let minor = Math.round((absolute - major) * minorPerMajor)
  if (minor === minorPerMajor) {
    minor = 0
    major += 1
  }
  return { isNegative, major, minor }
}

/** A `bigint` amount is a whole number of major units: nothing to round, no minor part. */
function splitBigIntAmount(value: bigint): AmountParts {
  return { isNegative: value < ZERO, major: absBigInt(value), minor: 0 }
}
