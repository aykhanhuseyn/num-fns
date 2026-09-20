import { en } from '../locale/en'
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
 * Rounding to `decimals` is decimal-safe (it goes through `formatNumber`,
 * hence `round`): `formatMoney(1.005)` is `"$ 1.01"`, not the `"$ 1.00"`
 * that `toFixed(2)` would produce.
 *
 * A `bigint` is an exact whole amount of the major unit, formatted at any
 * magnitude — its digits are grouped as written, never converted to a
 * `number` — with the currency's `decimals` padded as zeros
 * (`formatMoney(10n)` is `"$ 10.00"`); `roundingMode` has nothing to round
 * and is ignored.
 *
 * @example
 * formatMoney(1234.5); // "$ 1,234.50"
 * formatMoney(1.005); // "$ 1.01"
 * formatMoney(1234.5, { locale: az }); // "1 234,50 ₼"
 * formatMoney(1234.5, { currency: 'EUR' }); // "€ 1,234.50"
 * formatMoney(1234.5, { locale: az, currency: 'EUR' }); // "1 234,50 €"
 * formatMoney(9.99, { symbol: 'US$', symbolPosition: 'after' }); // "9.99 US$"
 * formatMoney(1234567890123456789n); // "$ 1,234,567,890,123,456,789.00"
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

      const formattedNumber = formatNumber(value, {
        decimals,
        thousandsSeparator,
        decimalSeparator,
        roundingMode,
      })
      return symbolPosition === 'before'
        ? `${symbol} ${formattedNumber}`
        : `${formattedNumber} ${symbol}`
    },
    [value],
    options,
  )
}

/**
 * Parses a string produced by {@link formatMoney} (or an equivalent format)
 * back into a JavaScript number, stripping the currency symbol — the
 * locale's default currency's unless a `currency` code or an explicit
 * `symbol` says otherwise.
 *
 * With `{ output: 'bigint' }` the amount comes back as an exact `bigint` of
 * whole major units, so the string must be a whole number once the symbol is
 * stripped: `"$ 1,234.00"` is `1234n`, `"$ 1.50"` throws `RangeError` (a
 * `bigint` cannot carry the fifty cents, and truncating them silently would
 * be the wrong answer). Any other `output` value is a `RangeError` too.
 *
 * @example
 * parseMoney("$ 1,234.50"); // 1234.5
 * parseMoney("1 234,50 ₼", { locale: az }); // 1234.5
 * parseMoney("€ 1,234.50", { currency: 'EUR' }); // 1234.5
 * parseMoney("$ 1,234,567,890,123,456,789.00", { output: 'bigint' }); // 1234567890123456789n
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

    const withoutSymbol = value.split(symbol).join('').trim()
    return parseNumber(withoutSymbol, { thousandsSeparator, decimalSeparator, output })
  }, options)
}
