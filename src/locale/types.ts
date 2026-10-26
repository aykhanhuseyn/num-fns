import type { CurrencyCode } from '../money/currency'

// Re-exported so a custom locale can type its `currency.units` keys from
// `num-fns/locale` alone, without also importing the package root.
export type { CurrencyCode } from '../money/currency'

/**
 * CLDR plural category for a cardinal value — all six of them. `az`/`en`/`es`
 * only ever return `'one'`/`'other'`, `ru` adds `'few'`/`'many'`
 * (`тысяча` / `тысячи` / `тысяч`); `'zero'` and `'two'` are what Arabic needs
 * (`ألف` / `ألفان` / `آلاف`) and Welsh, Breton or Slovenian too.
 *
 * Before 0.7.0 this held only the four categories the launch locales used.
 * The 0.7-1 spike (`docs/decisions/0007-locale-grouping.md`) wrote an
 * Arabic locale that could not type its `plural` hook without them, and
 * adding members to a union is a type-level break for code that handles
 * every member, so the set was completed while a break is still a minor
 * bump. It is CLDR's complete list and will not grow again.
 *
 * @since 0.2.0 (six CLDR categories since 0.7.0)
 */
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'

/**
 * Grammatical gender of the noun a cardinal number agrees with, for locales
 * whose number words inflect: Russian `один`/`одна`/`одно` and `два`/`две`, Spanish `uno`/`una` and
 * `doscientos`/`doscientas`. Kept to the three genders the launch locales
 * need; a later locale needing `'common'` (Scandinavian) extends this union.
 *
 * Which genders a locale actually distinguishes is declared per locale in
 * `LocaleWords.genders` — `az`/`en` have no grammatical gender and omit it,
 * `es` has no neuter cardinal forms, `ru` has all three. `numberToWords`
 * validates a requested gender against that declaration and throws a
 * `RangeError` rather than silently returning a form the language doesn't
 * have.
 *
 * @since 0.2.0
 */
// Maintainers: `todo.md` §1's "Grammatical gender" decision.
export type GrammaticalGender = 'masculine' | 'feminine' | 'neuter'

/**
 * One chunk of a number's cardinal reading — a base-1000 group under the
 * default {@link LocaleWords.grouping} — produced while `numberToWords`
 * groups the number right to left. `Locale.words.compose` receives an
 * ordered array of these (largest scale first) instead of raw digits, so a
 * locale only has to decide word order, spacing, hyphenation and elision —
 * never arithmetic.
 *
 * @since 0.2.0
 */
export interface WordChunk {
  /**
   * The value of this chunk, e.g. `234` in `234 000`: 0-999 under the
   * default grouping, 0-99 for an Indian lakh/crore group, 0-9999 for a
   * CJK 万 group (see {@link LocaleWords.grouping}).
   */
  value: number
  /** This chunk's hundreds/tens/ones already rendered as words, in this locale's internal order. */
  words: string
  /** Index into `words.scales`; `0` is the trailing units chunk, which has no scale word. */
  scaleIndex: number
  /** `words.scales[scaleIndex]` already resolved for `value`'s plural category, or `''` for the units chunk. */
  scaleWord: string
}

/**
 * Cardinal word data for `numberToWords`, plus the `compose` hook where
 * per-language word order and joining live. Field names intentionally
 * mirror the vocabulary every launch locale needs, from the irregular
 * teens Azerbaijani doesn't have (`eleven`, `once`) to the scale-word
 * inflection Russian does (`тысяча`/`тысячи`/`тысяч`).
 *
 * @since 0.2.0
 */
export interface LocaleWords {
  /** Word for `0`, e.g. az `'sıfır'`, en `'zero'`, ru `'ноль'`, es `'cero'`. */
  zero: string
  /** Words for digits 1-9. Index `0` is unused so digits can index directly (`ones[3] === 'three'`). */
  ones: readonly string[]
  /**
   * Irregular words for 11-19, index `0` corresponding to 11 (`teens[0]`
   * is the word for 11). Omit for locales like Azerbaijani where the teens
   * are a regular `tens[1] + ones[n]` compound (`on bir`, `on iki`, ...) —
   * `compose` (or the shared chunk builder it delegates to) falls back to
   * tens+ones composition when this is absent.
   */
  teens?: readonly string[]
  /** Words for the tens digit: 10, 20, ..., 90. Index `0` is unused. */
  tens: readonly string[]
  /**
   * The hundreds-digit vocabulary. Most locales only need a single
   * multiplier noun (Azerbaijani `'yüz'`, English `'hundred'`) reused for
   * every digit 1-9. Locales with irregular hundred words (Spanish
   * `quinientos`, `setecientos`, `novecientos` — not the regular
   * `*cientos` pattern) provide the full word per digit 1-9 instead.
   */
  hundreds: string | readonly string[]
  /**
   * Scale words for each digit-group position, read from the right: index
   * `0` is the units group (always `''`), index `1` is thousands, index `2`
   * millions, and so on — under the default {@link grouping}. A locale with
   * another grouping names its own ladder: Indian `[3, 2]` is `''`,
   * thousand, lakh, crore, …; CJK `[4]` is `''`, 万, 亿, …. Plain strings are used as-is;
   * locales that inflect
   * the scale word by plural category (Russian) provide a category map
   * instead and `plural(n)` picks the form.
   */
  scales: ReadonlyArray<string | Partial<Record<PluralCategory, string>>>
  /** Word prefixed to the spelled-out form of a negative number, e.g. az `'mənfi'`, en `'negative'`. */
  negative: string
  /**
   * Word for an infinite value, e.g. az `'sonsuzluq'`, en `'infinity'`, ru
   * `'бесконечность'`, es `'infinito'`. Only ever reached under
   * `noThrow` — every function throws `RangeError` on a non-finite value by
   * default — where it is what a renderer emits for `Infinity`, prefixed
   * with {@link LocaleWords.negative} for `-Infinity`. Required, so a locale
   * can never render a placeholder in another language.
   */
  infinity: string
  /**
   * Connector word inserted between a hundreds/tens group and the trailing
   * ones digit within a single 0-999 group, e.g. Spanish `'y'` in `"treinta
   * y cinco"` (35), or British English `'and'` in `"one hundred and one"`.
   * Consumed by {@link renderGroup}, not `compose` — `compose` only ever
   * sees already-built chunk words. Omit for locales that never need a
   * connector here (az, en, ru).
   *
   * This is not the integer/fraction joiner: that is
   * {@link decimalConnector}.
   */
  // Maintainers: until 2026-08-18 this field also served as the decimal
  // connector; it was split when `numberToWords` took a `locale` option
  // (`todo.md` §1).
  and?: string
  /**
   * Word or phrase joining the spelled-out integer and fractional parts of
   * a decimal number, e.g. Azerbaijani `'tam'` (`12.34` -> `"on iki tam
   * otuz dörd"`), English `'point'`, Russian `'запятая'`, Spanish `'coma'`.
   * Every shipped locale sets it. When it is omitted, `numberToWords` joins
   * the two parts with a plain space, which is a placeholder, not a claim
   * of linguistic correctness.
   */
  decimalConnector?: string
  /**
   * Grammatical genders this locale's cardinal words actually distinguish
   * (`ru` all three, `es` masculine/feminine). Omit for locales with no
   * grammatical gender (`az`, `en`) — `numberToWords` then rejects any
   * `gender` option with a `RangeError` instead of silently ignoring it.
   */
  genders?: readonly GrammaticalGender[]
  /**
   * Gender used when `numberToWords` is called without a `gender` option
   * (`'masculine'` for `ru`/`es`, matching the citation form dictionaries
   * and pre-gender-option output used). Only meaningful alongside
   * {@link genders}; omit for genderless locales.
   */
  defaultGender?: GrammaticalGender
  /**
   * How `numberToWords` and `toLongNotation` split an integer into the
   * groups each scale word counts, CLDR-style: the first entry is the digit
   * count of the units group, each later entry the next group's, and the
   * last entry repeats. Optional; defaults to `[3]` (thousand, million,
   * billion — every shipped locale). Indian English or Hindi set `[3, 2]`
   * (`12,34,567` is twelve lakh thirty-four thousand five hundred
   * sixty-seven); Chinese and Japanese set `[4]` (一百二十三万四千五百六十七).
   *
   * {@link renderGroup} then receives values up to `10^size - 1` for each
   * group (0-9999 under `[4]`), and the magnitude cap is
   * `10^(sum of the first scales.length sizes) - 1`. Each size is an integer
   * from 1 to 15 (`RangeError` otherwise), so a group is always a safe
   * integer.
   *
   * Independent of `formatDefaults.grouping`: Chinese writes digits in
   * threes (`1,234,567`) but counts words in fours.
   *
   * @since 0.7.0
   */
  grouping?: readonly number[]
  /**
   * Renders a single group (0-999 under the default {@link grouping}) as cardinal words using this locale's own
   * `ones`/`teens`/`tens`/`hundreds` vocabulary and composition rules
   * (hyphenation, the `and` connector, irregular contractions like Spanish
   * `veinte` + `uno` -> `"veintiuno"`). Always produces the *regular* form —
   * chunk-level irregularities that depend on context (Azerbaijani dropping
   * "bir" before "min", Spanish "cien" vs "ciento") are `compose`'s job, not
   * this one, since only `compose` knows a chunk's scale position.
   *
   * `gender` is the agreement gender for this group's inflecting words
   * (Russian `одна`/`одно`, `две`; Spanish `una`, `-cientas`). It is only
   * ever passed for the trailing units group and the decimal-fraction group
   * — groups bound to a scale word agree with that scale noun instead,
   * which is `compose`'s job (Russian `одна тысяча` vs `один миллион`).
   * Locales without gender ignore the parameter entirely.
   */
  renderGroup: (value: number, gender?: GrammaticalGender) => string
  /**
   * Joins ordered chunks (largest scale first) into the final string. This
   * is the seam where chunk-level irregularities live — dropping a leading
   * "one" (Azerbaijani "min", not "bir min"), inflecting for gender
   * (Russian "одна тысяча"), or contracting before a scale word (Spanish
   * "un millón"). A locale with no such irregularities can implement this
   * as `chunks.map(c => \`${c.words} ${c.scaleWord}\`.trim()).join(' ')`.
   *
   * `gender` is the same resolved agreement gender `renderGroup` received
   * for the units chunk, passed so a locale whose thousands scale is
   * gender-transparent can re-inflect that chunk (Spanish "mil" passes
   * agreement through: `doscientas mil`, unlike the masculine noun
   * "millón"). Locales that don't need it (az, en, ru — Russian's "тысяча"
   * forces its own feminine agreement regardless of the requested gender)
   * simply ignore the parameter.
   */
  compose: (chunks: readonly WordChunk[], gender?: GrammaticalGender) => string
}

/**
 * Suffix and full-word derivation for `toOrdinal` / `ordinalToWords`.
 *
 * @since 0.2.0
 */
export interface LocaleOrdinal {
  /**
   * What `toOrdinal` puts between the digits and the {@link suffix} when the
   * caller passes no `separator`: en/enGB `''` (`"3rd"`), az `'-'`
   * (`"3-cü"`), ru `'-'` (`"3-й"`), es `''` (`"3º"`). Required: before 0.7.0
   * `toOrdinal` always used `'-'`, which is an Azerbaijani habit, not
   * English (`"3-rd"`). A locale written against 0.6 that lacks it makes
   * `toOrdinal` throw `TypeError` instead of writing `"3undefinedrd"`.
   *
   * @since 0.7.0
   */
  separator: string
  /**
   * Text `toOrdinal` writes before the digits, for a language that marks an
   * ordinal in front: Chinese `'第'` (`"第3"`, with an empty `suffix`).
   * Optional; omitted, nothing is written before the digits (every shipped
   * locale). See `docs/decisions/0007-locale-grouping.md`.
   *
   * @since 0.7.0
   */
  prefix?: string
  /**
   * Short numeral suffix for a value, e.g. az `getOrdinalSuffix` returning
   * `'ci'`/`'cı'`/`'cu'`/`'cü'` by vowel harmony, en `'st'`/`'nd'`/`'rd'`/`'th'`.
   * Used by `toOrdinal` (`5` -> `'5-ci'` / `'5th'`).
   *
   * Like {@link words} below, always receives a `number`: the ordinal
   * functions accept a `bigint` but narrow it first, throwing `RangeError`
   * beyond
   * `Number.MAX_SAFE_INTEGER` — no launch locale can spell a cardinal that
   * large anyway (they stop at 999 trillion), so a locale never sees a
   * `bigint` here.
   */
  suffix: (value: number) => string
  /**
   * Builds the full ordinal word from a value and its cardinal reading
   * (`Locale.words` composed via `numberToWords`), e.g. `3` + `'üç'` ->
   * `'üçüncü'`, or `3` + `'three'` -> `'third'`. Takes the cardinal words
   * rather than recomputing them so irregular ordinals (English `'one'` ->
   * `'first'`, not a suffixed `'oneth'`) can special-case by value while
   * everything else transforms the last word of the cardinal reading.
   */
  words: (value: number, cardinalWords: string) => string
}

/**
 * One magnitude's short/long notation for `toShortNotation` /
 * `toLongNotation`.
 *
 * @since 0.2.0
 */
export interface LocaleNotationScale {
  /** Magnitude this entry applies from, e.g. `1e3`, `1e6`, `1e9`, `1e12`. */
  threshold: number
  /** Short-scale abbreviation, e.g. az `'min'`, en `'K'`, ru `'тыс'`. */
  short: string
  /** Long-scale word, matching `words.scales` at the same magnitude. */
  long: string
}

/**
 * Short/long scale notation for `toShortNotation` / `toLongNotation`.
 *
 * @since 0.2.0
 */
export interface LocaleNotation {
  /** Notation scales, largest magnitude first. Each locale declares its own table (see `locale/en.ts`, `locale/az.ts`). */
  scales: readonly LocaleNotationScale[]
  /** Whether a space separates the scaled number from the short abbreviation (az `'2,5 mln'` vs en `'2.5M'`). */
  spaceBeforeShort: boolean
}

/**
 * One currency unit's word and, where the locale inflects it, its plural
 * forms.
 *
 * @since 0.2.0
 */
export interface LocaleCurrencyUnit {
  /** Unit word, e.g. az major `'manat'` / minor `'qəpik'`, en major `'dollar'` / minor `'cent'`. */
  word: string
  /**
   * Plural forms keyed by plural category, for locales that inflect the
   * unit word (Russian `рубль`/`рубля`/`рублей`). Omit for invariant words.
   */
  plurals?: Partial<Record<PluralCategory, string>>
  /**
   * Grammatical gender the amount word spelled by `moneyToWords` must agree
   * with when naming this unit, e.g. Russian minor unit `копейка` is
   * feminine, so `1.01` reads `"один рубль одна копейка"`, not `"...один
   * копейка"`. Major and minor units can (and for `ru` do) differ — `рубль`
   * is masculine while `копейка` is feminine. Passed to `numberToWords` only
   * when set, so a locale that declares no `words.genders` (`az`, `en`) must
   * leave this omitted — `numberToWords` throws a `RangeError` for a gender
   * it doesn't distinguish. Omit for a locale/unit that hasn't set one; the
   * amount is then spelled with `locale.words.defaultGender` as before.
   */
  gender?: GrammaticalGender
}

/**
 * The major (whole) and minor (subunit) words a locale uses for one
 * currency.
 *
 * @since 0.4.0
 */
export interface LocaleCurrencyUnits {
  /** Major unit (whole currency), e.g. az `'manat'`, en `'dollar'`. */
  major: LocaleCurrencyUnit
  /** Minor unit (subunit), e.g. az `'qəpik'`, en `'cent'`. */
  minor: LocaleCurrencyUnit
}

/**
 * Currency conventions for `formatMoney` / `parseMoney` / `moneyToWords`:
 * which ISO 4217 currency this locale assumes when the caller doesn't say,
 * where the symbol goes, and how the locale *names* each currency it can
 * spell. The symbol itself and the minor-unit exponent are not here — they
 * are facts about the currency, not the language, and live in
 * the currency registry (`getCurrency(code)`), keyed by the same codes.
 *
 * Callers pass `{ currency: 'EUR' }` and both the symbol and the words
 * resolve from this table.
 *
 * @since 0.2.0 (per-currency `units` since 0.4.0)
 */
// Maintainers: until 2026-09-06 this held one `symbol`/`major`/`minor`
// triple for the default currency (`todo.md` §4's multi-currency item).
export interface LocaleCurrency {
  /** ISO 4217 code assumed when no `currency` option is passed, e.g. `'AZN'`, `'USD'`, `'GBP'`. Must have an entry in {@link units}. */
  code: CurrencyCode
  /**
   * Symbol placement relative to the formatted amount, for every currency
   * in this locale (a language puts `$` and `€` on the same side; `en`
   * `'before'`, `az`/`ru`/`es` `'after'`).
   */
  symbolPosition: 'before' | 'after'
  /**
   * Whether `formatMoney` puts a space between the symbol and the amount:
   * `en`/`enGB` `false` (`"$1,234.50"`, `"£1,234.50"`), `az`/`ru`/`es`
   * `true` (`"1 234,50 ₼"`). Required: before 0.7.0 the space was always
   * there, which is not how English writes money. A locale written against
   * 0.6 without it makes `formatMoney` throw `TypeError` unless the caller
   * passes `symbolSpacing`. `parseMoney` reads both forms in every locale.
   *
   * @since 0.7.0
   */
  symbolSpacing: boolean
  /**
   * Unit words per ISO 4217 code this locale can spell an amount in. Every
   * shipped locale covers every {@link CurrencyCode}; `moneyToWords` throws `RangeError` for a
   * code a locale leaves out rather than borrowing another language's words.
   */
  units: Readonly<Partial<Record<CurrencyCode, LocaleCurrencyUnits>>>
}

/**
 * A complete set of linguistic and formatting data for one locale, in the
 * spirit of `date-fns`'s `Locale` object. These functions accept a
 * `{ locale?: Locale }` option that **defaults to `en`**:
 * `numberToWords`, `formatNumber`/`parseNumber`, `formatMoney`/`parseMoney`/
 * `moneyToWords`, `formatPercentage`/`parsePercentage`,
 * `toShortNotation`/`parseShortNotation`/`toLongNotation`/`parseLongNotation`,
 * `toOrdinal`/`ordinalToWords`/`getOrdinalSuffix`, `numberToDigitWords`, and
 * `fractionToWords` (only for locales with fraction words). `az` is fully
 * supported as an explicit `{ locale: az }`.
 *
 * `toRoman`/`fromRoman` and `toByteSize`/`parseByteSize` are deliberately
 * excluded: both are locale-independent. Financial, stats, arithmetic and
 * utils functions are excluded too: they take and return raw numbers.
 *
 * @since 0.2.0
 */
// Maintainers: the default-locale decision is `todo.md` §1, the exclusions
// are `todo.md` §3 and §4. `az` is the reference implementation the other
// locales are checked against (`locale/az.test.ts`).
export interface Locale {
  /** BCP 47 language tag, e.g. `'az'`, `'en'`, `'ru'`, `'es'`. */
  code: string
  /** Human-readable name for docs and error messages, e.g. `'Azerbaijani'`. */
  name?: string
  /** Number formatting separators this locale defaults to, e.g. `en`'s `','`/`'.'` against `az`'s `' '`/`','`. */
  formatDefaults: {
    /** Separator inserted between integer digit groups (groups of three unless `grouping` says otherwise). */
    thousandsSeparator: string
    /** Separator between the integer and fractional part. */
    decimalSeparator: string
    /**
     * Digit-group sizes for the integer part, CLDR-style: the first entry
     * is the rightmost group, each later entry the next group to its left,
     * and the last entry repeats. Optional; defaults to `[3]`
     * (`1,234,567` — every shipped locale). Indian `[3, 2]` writes
     * `12,34,567`. Each size is an integer from 1 to 15 (`RangeError`
     * otherwise). Parsing ignores it: the parsers strip every
     * `thousandsSeparator` wherever it stands.
     *
     * @example
     * formatNumber(1234567, { locale: { ...en, formatDefaults: { ...en.formatDefaults, grouping: [3, 2] } } }); // "12,34,567"
     *
     * @since 0.7.0
     */
    grouping?: readonly number[]
  }
  /**
   * The ten characters this locale writes for the digits 0-9, e.g.
   * Arabic-Indic `['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']`.
   * Optional; omitted, every function writes ASCII `0`-`9` (every shipped
   * locale). When set, `formatNumber` — and so `formatMoney` and
   * `formatPercentage` — `toShortNotation` and `toLongNotation` write these
   * digits, and their parsers read them back (ASCII digits are accepted
   * too). Each entry must be a single character, the ten must be
   * distinct, and none may be whitespace or number syntax (`+ - . , e E`)
   * (`RangeError` otherwise).
   *
   * @since 0.7.0
   */
  digits?: readonly string[]
  /** Cardinal word data and composition rules for `numberToWords`. */
  words: LocaleWords
  /**
   * Selects the plural/case category for a cardinal value, per CLDR plural
   * rules. `az` returns `'other'` for every value, `en`/`enGB`/`es` split
   * `'one'`/`'other'`, and `ru` needs the real `one`/`few`/`many` split to
   * pick the right scale and currency word forms.
   *
   * Always receives a `number`, even when the public function was given a
   * `bigint`: the groups `numberToWords` classifies are plain numbers
   * anyway (0–999 by default, at most `10^15 - 1` under a custom
   * `words.grouping`), and `moneyToWords` converts a `bigint` amount first.
   * It passes a safe integer as it is and folds a larger one to its last
   * six digits plus a million — a reduction every CLDR integer rule (`n % 10`, `n % 100`,
   * `n % 1000`, Breton's `n % 1000000`, comparisons against small
   * constants) is invariant under. A locale never has to handle `bigint`.
   */
  plural: (n: number) => PluralCategory
  /** Ordinal suffix and full-word derivation for `toOrdinal`/`ordinalToWords`. */
  ordinal: LocaleOrdinal
  /** Short/long scale notation for `toShortNotation`/`toLongNotation`. */
  notation: LocaleNotation
  /** Default currency, symbol placement and per-currency unit words for `formatMoney`/`parseMoney`/`moneyToWords`. */
  currency: LocaleCurrency
  /**
   * Fraction-word composition for `fractionToWords`. Optional: `az` and
   * `enGB` set it; `ru`/`es` don't yet have verified fraction-noun
   * vocabulary, so `fractionToWords` throws `RangeError` for them rather
   * than guess. `en` has fraction words but does not use this field.
   */
  // Maintainers: `en` is the structural default of `number/words.ts`, so it
  // cannot import back from `number/` without a cycle; `number/fraction.ts`
  // special-cases it instead.
  fractions?: LocaleFractions
}

/**
 * Fraction-word composition for a locale that implements it (see
 * `Locale.fractions`).
 *
 * @since 0.2.0
 */
export interface LocaleFractions {
  /** Idiomatic word for exactly 1/2, e.g. az `'yarım'`, if this locale has one. */
  half?: string
  /** Builds the fraction reading for any other proper fraction. */
  words: (numerator: number, denominator: number) => string
}
