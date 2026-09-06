import type { GrammaticalGender, Locale } from '../locale/types'
import type { CurrencyCode } from '../money/currency'

/**
 * How a value is rounded to a number of fractional digits — the `mode`
 * argument of `round` and the `roundingMode` option of `formatNumber`,
 * `formatMoney` and `formatPercentage`:
 * - `'halfUp'` — round half away from zero (`2.5` -> `3`, `-2.5` -> `-3`).
 *   The default.
 * - `'halfDown'` — round half toward zero (`2.5` -> `2`, `-2.5` -> `-2`).
 * - `'halfEven'` — banker's rounding: a tie rounds to the nearest even digit
 *   (`2.5` -> `2`, `3.5` -> `4`).
 * - `'ceil'` — always toward positive infinity (`-1.5` -> `-1`).
 * - `'floor'` — always toward negative infinity (`-1.5` -> `-2`).
 *
 * The modes are implemented once, decimal-safely, by `round` in
 * `src/arithmetic/round.ts`, which the three formatters delegate to. A value
 * is rounded as written — its shortest decimal representation — not as the
 * binary float happens to be stored, so `1.005` rounds to `1.01` at two
 * decimals where `toFixed` and `Math.round(x * 100) / 100` both give `1`.
 * Ties are therefore exact decimal ties: `2.675` is a tie at two decimals,
 * and `'halfEven'` sends it to `2.68`.
 */
export type RoundingMode = 'halfUp' | 'halfDown' | 'halfEven' | 'ceil' | 'floor'

/**
 * Which numeric type a parser returns — the `output` option of `parseNumber`,
 * `parseMoney`, `parsePercentage`, `parseShortNotation`, `parseLongNotation`,
 * `parseByteSize` and `fromBase`:
 * - `'number'` — a plain JavaScript `number`. The default. When the parsed
 *   value is an integer beyond `Number.MAX_SAFE_INTEGER` — which only a
 *   parser that computes exactly can notice, e.g. `parseLongNotation` — the
 *   parser throws `RangeError` rather than handing back a rounded `number`.
 * - `'bigint'` — an exact `bigint` of any magnitude. The parsed value must be
 *   a whole number (`"1,234.00"` is fine, `"1.5"` throws `RangeError`), since
 *   a `bigint` cannot carry a fraction and truncating would silently be
 *   wrong. `parsePercentage`'s `asRatio` and `parseByteSize`'s fractional
 *   sizes go through the same rule: `"2.5 KB"` is `2560n`, `"2.5 KB"` at
 *   `base: 1000` is `2500n`, and `"1.1%"` as a ratio throws.
 *
 * Every parser's return type follows the option through overloads, so
 * `parseNumber("1", { output: 'bigint' })` is typed `bigint` and
 * `parseNumber("1")` stays `number` — no cast on the consumer's side. The
 * formatters accept `bigint` inputs symmetrically (`formatNumber(10n)` is
 * `"10"`), so a parse/format round trip can stay exact end to end.
 */
export type ParseOutput = 'number' | 'bigint'

/** The `output` option every parser accepts — see {@link ParseOutput}. */
export interface ParseOutputOptions {
  /** Return a `bigint` instead of a `number`. Defaults to `'number'`. Any other value throws `RangeError`. */
  output?: ParseOutput
}

export interface NumberFormatOptions {
  /** Number of fractional digits to keep (a non-negative integer, `RangeError` otherwise). Omit to keep the value's natural precision. */
  decimals?: number
  /** Separator inserted between groups of three integer digits. Defaults to `locale.formatDefaults.thousandsSeparator`. */
  thousandsSeparator?: string
  /** Separator between the integer and fractional part. Defaults to `locale.formatDefaults.decimalSeparator`. */
  decimalSeparator?: string
  /** How to round to `decimals` fractional digits — decimal-safely, via `round`. Defaults to `'halfUp'`. Has no effect when `decimals` is omitted. */
  roundingMode?: RoundingMode
  /** Locale supplying the default separators. Defaults to `en` — pass `{ locale: az }` for the pre-refactor default. */
  locale?: Locale
}

export interface NumberParseOptions
  extends Pick<NumberFormatOptions, 'thousandsSeparator' | 'decimalSeparator' | 'locale'>,
    ParseOutputOptions {}

export interface MoneyFormatOptions extends NumberFormatOptions {
  /**
   * ISO 4217 code of the currency to format, e.g. `'EUR'`. Defaults to
   * `locale.currency.code` (`en`: `'USD'`, `az`: `'AZN'`, `enGB`: `'GBP'`).
   * Selects the symbol and the default `decimals` (the currency's minor-unit
   * exponent) from `getCurrency(code)`; an explicit `symbol`/`decimals`
   * still wins. Throws `RangeError` for a code `num-fns` doesn't know.
   */
  currency?: CurrencyCode
  /** Currency symbol to render. Defaults to the symbol of `currency` (`getCurrency(currency).symbol`). */
  symbol?: string
  /** Whether the symbol is placed before or after the amount. Defaults to `locale.currency.symbolPosition`. */
  symbolPosition?: 'before' | 'after'
}

export interface MoneyParseOptions extends NumberParseOptions {
  /** ISO 4217 code whose symbol to strip before parsing. Defaults to `locale.currency.code`. Throws `RangeError` for an unknown code. */
  currency?: CurrencyCode
  /** Currency symbol to strip before parsing. Defaults to the symbol of `currency` (`getCurrency(currency).symbol`). */
  symbol?: string
}

export interface MoneyWordsOptions {
  /**
   * ISO 4217 code of the currency to spell, e.g. `'EUR'`. Defaults to
   * `locale.currency.code`. Selects the unit words (and their plural forms
   * and gender) from `locale.currency.units[currency]`, and the major/minor
   * split from the currency's minor-unit exponent. Throws `RangeError` for a
   * code `num-fns` doesn't know, or one this locale has no unit words for.
   */
  currency?: CurrencyCode
  /** Word for the major currency unit. Defaults to `locale.currency.units[currency].major`'s word, resolved for the amount's plural category. */
  majorUnit?: string
  /** Word for the minor currency unit (subunit). Defaults to `locale.currency.units[currency].minor`'s word, resolved for the amount's plural category. */
  minorUnit?: string
  /** Include the minor unit part even when its value is zero. Defaults to `false`. */
  includeZeroMinor?: boolean
  /** Locale supplying the default currency words and cardinal number reading. Defaults to `en`. */
  locale?: Locale
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
  /**
   * Locale supplying the scale abbreviations (`locale.notation.scales`) and
   * default decimal separator. Defaults to `en` (`K`/`M`/`B`/`T`); pass
   * `{ locale: az }` for the pre-refactor default (`min`/`mln`/`mlrd`/`trln`).
   *
   * Before 2026-08-18 this was a bare `'az' | 'en'` string, unrelated to the
   * `Locale` objects in `num-fns/locale` (see `CLAUDE.md`'s note on this).
   * That string option is now folded into the full `Locale` system, per the
   * `todo.md` §1 plan — pass a `Locale` object (`az`, `en`, `ru`, `es`, or a
   * custom one), not the old string.
   */
  locale?: Locale
  /** Separator between the integer and fractional part. Defaults to `locale.formatDefaults.decimalSeparator`. */
  decimalSeparator?: string
}

export interface ShortNotationParseOptions
  extends Pick<ShortNotationOptions, 'locale' | 'decimalSeparator'>,
    ParseOutputOptions {}

export interface LongNotationOptions {
  /**
   * Separator inserted between each scale group. Defaults to `' '`. Must be a
   * non-empty string containing no digits, so that the scale words stay
   * separable from the digit groups on the way back through
   * `parseLongNotation`.
   */
  groupSeparator?: string
  /** Locale supplying the scale words (`locale.words.scales`). Defaults to `en`. */
  locale?: Locale
}

/** `parseLongNotation`'s options: {@link LongNotationOptions} plus the `output` type. */
export interface LongNotationParseOptions extends LongNotationOptions, ParseOutputOptions {}

export interface SuffixOptions {
  /** String inserted between the value and the suffix. Defaults to `' '`. */
  separator?: string
}

/** Shared shape for the ordinal-family options (`getOrdinalSuffix`, `ordinalToWords`). */
export interface OrdinalOptions {
  /** Locale supplying the ordinal suffix/word rules (`locale.ordinal`). Defaults to `en`. */
  locale?: Locale
}

export interface ToOrdinalOptions extends OrdinalOptions {
  /** String inserted between the value and the suffix. Defaults to `'-'`. */
  separator?: string
}

export interface NumberWordsOptions {
  /** Locale supplying the cardinal word data (`locale.words`). Defaults to `en`. */
  locale?: Locale
  /**
   * Grammatical gender of the noun being counted, for locales whose number
   * words inflect (Russian `один`/`одна`/`одно`, Spanish `uno`/`una`,
   * `doscientos`/`doscientas`). Defaults to `locale.words.defaultGender`
   * (`'masculine'` for `ru`/`es`), so omitting it keeps the citation form.
   * Applies to the trailing units group and the decimal-fraction group —
   * groups bound to a scale word agree with that scale noun instead
   * (Russian `одна тысяча` regardless of the requested gender), except
   * where the scale word is gender-transparent (Spanish `doscientas mil`).
   * Throws a `RangeError` for a gender the locale's words don't distinguish
   * (`az`/`en` have none, `es` has no neuter) rather than silently ignoring
   * it — see `locale/types.ts`'s `GrammaticalGender`.
   */
  gender?: GrammaticalGender
}

export interface FractionWordsOptions {
  /**
   * Locale supplying the fraction-word composition. Defaults to `en`.
   * Currently only `az` and `en` are implemented — see `number/fraction.ts`'s
   * doc comment for why `ru`/`es` throw instead of guessing.
   */
  locale?: Locale
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

export interface ByteSizeParseOptions
  extends Pick<ByteSizeOptions, 'base' | 'decimalSeparator'>,
    ParseOutputOptions {}

/** `fromBase`'s trailing options: only the `output` type — see {@link ParseOutput}. */
export type BaseParseOptions = ParseOutputOptions

export interface DigitWordsOptions {
  /** String inserted between each spoken digit. Defaults to `' '`. */
  separator?: string
  /** Locale supplying the spoken digit words (`locale.words.zero`/`ones`/`negative`). Defaults to `en`. */
  locale?: Locale
}

export interface CompoundInterestOptions {
  /**
   * Number of times interest compounds within each unit of `time` (e.g. `12`
   * for monthly compounding when `time` is in years). Defaults to `1`
   * (compounds once per period, i.e. annually if `time` is in years).
   */
  compoundsPerPeriod?: number
}
