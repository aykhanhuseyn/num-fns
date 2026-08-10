import { formatNumber, parseNumber } from '../number/format'
import {
  AZN_SYMBOL,
  DEFAULT_DECIMAL_SEPARATOR,
  DEFAULT_THOUSANDS_SEPARATOR,
} from '../shared/constants'
import type { MoneyFormatOptions, MoneyParseOptions } from '../shared/types'

/**
 * Formats a monetary amount. Defaults to the Azerbaijani manat (₼), two
 * decimals, and the symbol placed after the amount.
 *
 * @example
 * formatMoney(1234.5); // "1 234,50 ₼"
 * formatMoney(9.99, { symbol: '$', symbolPosition: 'before' }); // "$ 9,99"
 */
export function formatMoney(value: number, options: MoneyFormatOptions = {}): string {
  const {
    decimals = 2,
    thousandsSeparator = DEFAULT_THOUSANDS_SEPARATOR,
    decimalSeparator = DEFAULT_DECIMAL_SEPARATOR,
    roundingMode,
    symbol = AZN_SYMBOL,
    symbolPosition = 'after',
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
 * parseMoney("1 234,50 ₼"); // 1234.5
 */
export function parseMoney(value: string, options: MoneyParseOptions = {}): number {
  const {
    thousandsSeparator = DEFAULT_THOUSANDS_SEPARATOR,
    decimalSeparator = DEFAULT_DECIMAL_SEPARATOR,
    symbol = AZN_SYMBOL,
  } = options

  const withoutSymbol = value.split(symbol).join('').trim()
  return parseNumber(withoutSymbol, { thousandsSeparator, decimalSeparator })
}
