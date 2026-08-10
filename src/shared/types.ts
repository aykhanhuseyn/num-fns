/**
 * How `formatNumber` (and anything that delegates to it) rounds a value to
 * `decimals` fractional digits:
 * - `'halfUp'` — round half away from zero (`2.5` -> `3`, `-2.5` -> `-3`).
 *   The default; matches the platform's `toFixed` for the vast majority of
 *   inputs.
 * - `'halfDown'` — round half toward zero (`2.5` -> `2`, `-2.5` -> `-2`).
 * - `'halfEven'` — banker's rounding: a tie rounds to the nearest even digit
 *   (`2.5` -> `2`, `3.5` -> `4`).
 * - `'ceil'` — always toward positive infinity (`-1.5` -> `-1`).
 * - `'floor'` — always toward negative infinity (`-1.5` -> `-2`).
 *
 * All modes multiply by `10 ** decimals` and operate on the result as a
 * plain JS number, so they share `toFixed`'s well-known floating-point
 * representation quirks (e.g. `1.005` isn't exactly representable) for
 * every mode except `'halfUp'`'s `toFixed` fast path. A decimal-safe
 * implementation is tracked separately for `arithmetic/round`.
 */
export type RoundingMode = 'halfUp' | 'halfDown' | 'halfEven' | 'ceil' | 'floor'

export interface NumberFormatOptions {
  /** Number of fractional digits to keep. Omit to keep the value's natural precision. */
  decimals?: number
  /** Separator inserted between groups of three integer digits. Defaults to `' '`. */
  thousandsSeparator?: string
  /** Separator between the integer and fractional part. Defaults to `','`. */
  decimalSeparator?: string
  /** How to round to `decimals` fractional digits. Defaults to `'halfUp'`. Has no effect when `decimals` is omitted. */
  roundingMode?: RoundingMode
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

/**
 * Which fractional unit `formatPercentage`/`parsePercentage` render or parse:
 * `'percent'` (`%`, scale ×100), `'permille'` (`‰`, scale ×1000), or
 * `'basisPoint'` (`‱`, scale ×10000).
 */
export type PercentageUnit = 'percent' | 'permille' | 'basisPoint'

export interface PercentageFormatOptions extends NumberFormatOptions {
  /** Insert a space between the number and the unit sign. Defaults to `false`. */
  space?: boolean
  /**
   * Multiply the input by the unit's scale factor before formatting (`100`
   * for `'percent'`, `1000` for `'permille'`, `10000` for `'basisPoint'`),
   * so a ratio like `0.5` renders as `50%` / `500‰` / `5000‱`. Defaults to
   * `false`.
   */
  multiplyBy100?: boolean
  /** Which unit to render. Defaults to `'percent'`. */
  unit?: PercentageUnit
}

export interface PercentageParseOptions extends NumberParseOptions {
  /**
   * Divide the parsed value by the unit's scale factor, so `"50%"` returns
   * `0.5` instead of `50`. Defaults to `false`.
   */
  asRatio?: boolean
  /** Which unit to strip and parse. Defaults to `'percent'`. */
  unit?: PercentageUnit
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

export interface ByteSizeOptions {
  /** Number of fractional digits to keep. Defaults to `2`. */
  decimals?: number
  /**
   * Multiple used per scale step — `1024` (binary; the conventional meaning
   * of "KB"/"MB" in most operating systems and file managers) or `1000`
   * (decimal SI). Defaults to `1024`.
   */
  base?: 1000 | 1024
  /** Separator between the integer and fractional part. Defaults to `'.'`. */
  decimalSeparator?: string
}

export type ByteSizeParseOptions = Pick<ByteSizeOptions, 'base' | 'decimalSeparator'>

export interface DigitWordsOptions {
  /** String inserted between each spoken digit. Defaults to `' '`. */
  separator?: string
}

export interface CompoundInterestOptions {
  /**
   * Number of times interest compounds within each unit of `time` (e.g. `12`
   * for monthly compounding when `time` is in years). Defaults to `1`
   * (compounds once per period, i.e. annually if `time` is in years).
   */
  compoundsPerPeriod?: number
}
