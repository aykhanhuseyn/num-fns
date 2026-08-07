export interface NumberFormatOptions {
  /** Number of fractional digits to keep. Omit to keep the value's natural precision. */
  decimals?: number
  /** Separator inserted between groups of three integer digits. Defaults to `' '`. */
  thousandsSeparator?: string
  /** Separator between the integer and fractional part. Defaults to `','`. */
  decimalSeparator?: string
}

export type NumberParseOptions = Pick<
  NumberFormatOptions,
  'thousandsSeparator' | 'decimalSeparator'
>

export interface MoneyFormatOptions extends NumberFormatOptions {
  /** Currency symbol to render. Defaults to the manat sign `'₼'`. */
  symbol?: string
  /** Whether the symbol is placed before or after the amount. Defaults to `'after'`. */
  symbolPosition?: 'before' | 'after'
}

export interface MoneyParseOptions extends NumberParseOptions {
  /** Currency symbol to strip before parsing. Defaults to the manat sign `'₼'`. */
  symbol?: string
}

export interface MoneyWordsOptions {
  /** Word for the major currency unit. Defaults to `'manat'`. */
  majorUnit?: string
  /** Word for the minor currency unit (subunit). Defaults to `'qəpik'`. */
  minorUnit?: string
  /** Include the minor unit part even when its value is zero. Defaults to `false`. */
  includeZeroMinor?: boolean
}

export interface PercentageFormatOptions extends NumberFormatOptions {
  /** Insert a space between the number and the `%` sign. Defaults to `false`. */
  space?: boolean
  /** Multiply the input by 100 before formatting, so `0.5` renders as `50%`. Defaults to `false`. */
  multiplyBy100?: boolean
}

export interface PercentageParseOptions extends NumberParseOptions {
  /** Divide the parsed value by 100, so `"50%"` returns `0.5` instead of `50`. Defaults to `false`. */
  asRatio?: boolean
}

export interface ShortNotationOptions {
  /** Number of fractional digits to keep. Defaults to `1`. */
  decimals?: number
  /** `'az'` uses `min/mln/mlrd/trln`, `'en'` uses `K/M/B/T`. Defaults to `'az'`. */
  locale?: 'az' | 'en'
  /** Separator between the integer and fractional part. Defaults to `','` for `'az'`, `'.'` for `'en'`. */
  decimalSeparator?: string
}

export type ShortNotationParseOptions = Pick<ShortNotationOptions, 'locale' | 'decimalSeparator'>

export interface LongNotationOptions {
  /** Separator inserted between each scale group. Defaults to `' '`. */
  groupSeparator?: string
}

export interface SuffixOptions {
  /** String inserted between the value and the suffix. Defaults to `' '`. */
  separator?: string
}
