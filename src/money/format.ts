import { en } from '../locale/en'
import { formatNumber, parseNumber } from '../number/format'
import type { MoneyFormatOptions, MoneyParseOptions } from '../shared/types'

/**
 * Formats a monetary amount using `options.locale`'s currency conventions by
 * default (`en`: `$` before the amount, two decimals — pass `{ locale: az }`
 * for the pre-refactor default of the manat sign `₼` after the amount).
 *
 * @example
 * formatMoney(1234.5); // "$ 1,234.50"
 * formatMoney(1234.5, { locale: az }); // "1 234,50 ₼"
 * formatMoney(9.99, { symbol: '€', symbolPosition: 'after' }); // "9.99 €"
 */
export function formatMoney(value: number, options: MoneyFormatOptions = {}): string {
  const {
    locale = en,
    decimals = 2,
    thousandsSeparator = locale.formatDefaults.thousandsSeparator,
    decimalSeparator = locale.formatDefaults.decimalSeparator,
    roundingMode,
    symbol = locale.currency.symbol,
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
 * back into a JavaScript number, stripping the currency symbol.
 *
 * @example
 * parseMoney("$ 1,234.50"); // 1234.5
 * parseMoney("1 234,50 ₼", { locale: az }); // 1234.5
 */
export function parseMoney(value: string, options: MoneyParseOptions = {}): number {
  const {
    locale = en,
    thousandsSeparator = locale.formatDefaults.thousandsSeparator,
    decimalSeparator = locale.formatDefaults.decimalSeparator,
    symbol = locale.currency.symbol,
  } = options

  const withoutSymbol = value.split(symbol).join('').trim()
  return parseNumber(withoutSymbol, { thousandsSeparator, decimalSeparator })
}
