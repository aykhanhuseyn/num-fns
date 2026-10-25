import { en } from '../locale/en'
import type { Locale } from '../locale/types'
import { formatNumber, parseNumber } from '../number/format'
import { guardNumber } from '../shared/no-throw'
import { guardText } from '../shared/no-throw-text'
import type { MoneyFormatOptions, MoneyParseOptions } from '../shared/types'
import { getCurrency } from './currency'

/**
 * Formats a monetary amount using `options.locale`'s currency conventions by
 * default (`en`: `$` before the amount, two decimals — pass `{ locale: az }`
 * for the pre-refactor default of the manat sign `₼` after the amount).
 * Pass an ISO 4217 `currency` code to format a different currency in the
 * same locale: the symbol comes from `getCurrency(code)`, its placement from
 * the locale, so `{ locale: az, currency: 'USD' }` gives `"9,99 $"`.
 *
 * A negative amount keeps its minus sign in front: `"-$1.50"` when the
 * symbol goes before the amount (before 0.7.0 it was `"$ -1.50"`),
 * `"-1,50 ₼"` when it goes after.
 *
 * Whether a space separates the symbol from the amount comes from the
 * locale's `currency.symbolSpacing` unless `symbolSpacing` is passed: `en`
 * and `enGB` write `"$1,234.50"`, `az`, `ru` and `es` `"1 234,50 ₼"`. Before
 * 0.7.0 every locale put a space there.
 *
 * Rounding to `decimals` is decimal-safe (it goes through `formatNumber`,
 * hence `round`): `formatMoney(1.005)` is `"$1.01"`, not the `"$1.00"`
 * that `toFixed(2)` would produce.
 *
 * A `bigint` is an exact whole amount of the major unit, formatted at any
 * magnitude — its digits are grouped as written, never converted to a
 * `number` — with the currency's `decimals` padded as zeros
 * (`formatMoney(10n)` is `"$10.00"`); `roundingMode` has nothing to round
 * and is ignored.
 *
 * @example
 * formatMoney(1234.5); // "$1,234.50"
 * formatMoney(1234.5, { symbolSpacing: true }); // "$ 1,234.50"
 * formatMoney(1.005); // "$1.01"
 * formatMoney(-1.5); // "-$1.50"
 * formatMoney(1234.5, { locale: az }); // "1 234,50 ₼"
 * formatMoney(1234.5, { currency: 'EUR' }); // "€1,234.50"
 * formatMoney(1234.5, { locale: az, currency: 'EUR' }); // "1 234,50 €"
 * formatMoney(9.99, { symbol: 'US$', symbolPosition: 'after', symbolSpacing: true }); // "9.99 US$"
 * formatMoney(1234567890123456789n); // "$1,234,567,890,123,456,789.00"
 *
 * @throws {TypeError} when `symbolSpacing` is not a boolean, or when the
 * locale has no `currency.symbolSpacing` (a locale written against 0.6) and
 * the caller passes none.
 */
export function formatMoney(value: number | bigint, options: MoneyFormatOptions = {}): string {
  return guardText(
    () => {
      const { locale = en, currency: code = locale.currency.code } = options
      const currency = getCurrency(code)
      const {
        decimals = currency.decimals,
        thousandsSeparator = locale.formatDefaults.thousandsSeparator,
        decimalSeparator = locale.formatDefaults.decimalSeparator,
        roundingMode,
        symbol = currency.symbol,
        symbolPosition = locale.currency.symbolPosition,
      } = options
      const symbolSpacing = resolveSymbolSpacing(options.symbolSpacing, locale)

      const formattedNumber = formatNumber(value, {
        decimals,
        locale,
        thousandsSeparator,
        decimalSeparator,
        roundingMode,
      })
      const space = symbolSpacing ? ' ' : ''
      if (symbolPosition === 'after') return `${formattedNumber}${space}${symbol}`
      // A symbol in front goes after the minus sign: "-$1.50", not "$-1.50".
      return formattedNumber.startsWith('-')
        ? `-${symbol}${space}${formattedNumber.slice(1)}`
        : `${symbol}${space}${formattedNumber}`
    },
    [value],
    options,
  )
}

/**
 * The `symbolSpacing` to format with: the option when given (it must be a
 * boolean), else the locale's required `currency.symbolSpacing`. Each
 * mistake gets its own `TypeError`, so a bad option is never blamed on the
 * locale.
 */
function resolveSymbolSpacing(option: unknown, locale: Locale): boolean {
  if (option !== undefined) {
    if (typeof option !== 'boolean') {
      throw new TypeError(
        `formatMoney: symbolSpacing must be a boolean, received ${JSON.stringify(option)}`,
      )
    }
    return option
  }
  const fromLocale: unknown = locale.currency.symbolSpacing
  if (typeof fromLocale !== 'boolean') {
    throw new TypeError(
      `formatMoney: locale "${locale.code}" has no currency.symbolSpacing (required since 0.7.0); add one, or pass symbolSpacing`,
    )
  }
  return fromLocale
}

/** A leading sign followed by whitespace, left behind when a symbol between them is stripped. */
const SIGN_GAP = /^([+-])\s+/

/**
 * Parses a string produced by {@link formatMoney} (or an equivalent format)
 * back into a JavaScript number, stripping the currency symbol — the
 * locale's default currency's unless a `currency` code or an explicit
 * `symbol` says otherwise.
 *
 * With `{ output: 'bigint' }` the amount comes back as an exact `bigint` of
 * whole major units, so the string must be a whole number once the symbol is
 * stripped: `"$1,234.00"` is `1234n`, `"$1.50"` throws `RangeError` (a
 * `bigint` cannot carry the fifty cents, and truncating them silently would
 * be the wrong answer). Any other `output` value is a `RangeError` too.
 *
 * The symbol is stripped with or without a space next to it, and a minus
 * sign may stand before or after it, so every locale reads `"$1,234.50"`,
 * `"$ 1,234.50"`, `"-$1.50"`, `"-$ 1.50"` and `"$-1.50"`.
 *
 * @example
 * parseMoney("$1,234.50"); // 1234.5
 * parseMoney("$ 1,234.50"); // 1234.5
 * parseMoney("1 234,50 ₼", { locale: az }); // 1234.5
 * parseMoney("€1,234.50", { currency: 'EUR' }); // 1234.5
 * parseMoney("$1,234,567,890,123,456,789.00", { output: 'bigint' }); // 1234567890123456789n
 */
export function parseMoney(value: string, options: MoneyParseOptions & { output: 'bigint' }): bigint
export function parseMoney(
  value: string,
  options?: MoneyParseOptions & { output?: 'number' },
): number
export function parseMoney(value: string, options: MoneyParseOptions): number | bigint
export function parseMoney(value: string, options: MoneyParseOptions = {}): number | bigint {
  return guardNumber(() => {
    const { locale = en, currency: code = locale.currency.code } = options
    const {
      thousandsSeparator = locale.formatDefaults.thousandsSeparator,
      decimalSeparator = locale.formatDefaults.decimalSeparator,
      symbol = getCurrency(code).symbol,
      output,
    } = options

    // "-$ 1.50" loses its symbol as "- 1.50"; the sign is joined back on.
    const withoutSymbol = value.split(symbol).join('').trim().replace(SIGN_GAP, '$1')
    return parseNumber(withoutSymbol, { locale, thousandsSeparator, decimalSeparator, output })
  }, options)
}
