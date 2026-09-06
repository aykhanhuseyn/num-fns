import { en } from '../locale/en'
import { formatNumber, parseNumber } from '../number/format'
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
 * @example
 * formatMoney(1234.5); // "$ 1,234.50"
 * formatMoney(1.005); // "$ 1.01"
 * formatMoney(1234.5, { locale: az }); // "1 234,50 ₼"
 * formatMoney(1234.5, { currency: 'EUR' }); // "€ 1,234.50"
 * formatMoney(1234.5, { locale: az, currency: 'EUR' }); // "1 234,50 €"
 * formatMoney(9.99, { symbol: 'US$', symbolPosition: 'after' }); // "9.99 US$"
 */
export function formatMoney(value: number, options: MoneyFormatOptions = {}): string {
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
}

/**
 * Parses a string produced by {@link formatMoney} (or an equivalent format)
 * back into a JavaScript number, stripping the currency symbol — the
 * locale's default currency's unless a `currency` code or an explicit
 * `symbol` says otherwise.
 *
 * @example
 * parseMoney("$ 1,234.50"); // 1234.5
 * parseMoney("1 234,50 ₼", { locale: az }); // 1234.5
 * parseMoney("€ 1,234.50", { currency: 'EUR' }); // 1234.5
 */
export function parseMoney(value: string, options: MoneyParseOptions = {}): number {
  const { locale = en, currency: code = locale.currency.code } = options
  const {
    thousandsSeparator = locale.formatDefaults.thousandsSeparator,
    decimalSeparator = locale.formatDefaults.decimalSeparator,
    symbol = getCurrency(code).symbol,
  } = options

  const withoutSymbol = value.split(symbol).join('').trim()
  return parseNumber(withoutSymbol, { thousandsSeparator, decimalSeparator })
}
