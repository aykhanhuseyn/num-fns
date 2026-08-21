/**
 * CLDR-style plural/case category for a cardinal value. Kept to the four
 * categories the launch locales actually need (`az`/`en`/`es` only ever
 * return `'other'`; `ru` is the one that needs the full split for scale and
 * currency words, e.g. `тысяча` / `тысячи` / `тысяч`). Extend this union if
 * a later locale needs `'zero'`/`'two'`.
 */
export type PluralCategory = 'one' | 'few' | 'many' | 'other'

/**
 * Grammatical gender of the noun a cardinal number agrees with, for locales
 * whose number words inflect (`todo.md` §1's "Grammatical gender" decision):
 * Russian `один`/`одна`/`одно` and `два`/`две`, Spanish `uno`/`una` and
 * `doscientos`/`doscientas`. Kept to the three genders the launch locales
 * need; a later locale needing `'common'` (Scandinavian) extends this union.
 *
 * Which genders a locale actually distinguishes is declared per locale in
 * `LocaleWords.genders` — `az`/`en` have no grammatical gender and omit it,
 * `es` has no neuter cardinal forms, `ru` has all three. `numberToWords`
 * validates a requested gender against that declaration and throws a
 * `RangeError` rather than silently returning a form the language doesn't
 * have.
 */
export type GrammaticalGender = 'masculine' | 'feminine' | 'neuter'

/**
 * One base-1000 chunk of a number's cardinal reading, produced while
 * grouping right-to-left the same way `integerToWords` in `number/words.ts`
 * does today. `Locale.words.compose` receives an ordered array of these
 * (largest scale first) instead of raw digits, so a locale only has to
 * decide word order, spacing, hyphenation and elision — never arithmetic.
 */
export interface WordChunk {
  /** The 0-999 value of this chunk, e.g. `234` in `234 000`. */
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
   * Scale words for each group-of-three-digits position, read from the
   * right: index `0` is the units group (always `''`), index `1` is
   * thousands, index `2` millions, and so on — mirroring `SCALE_WORDS` in
   * `number/words.ts`. Plain strings are used as-is; locales that inflect
   * the scale word by plural category (Russian) provide a category map
   * instead and `plural(n)` picks the form.
   */
  scales: ReadonlyArray<string | Partial<Record<PluralCategory, string>>>
  /** Word prefixed to the spelled-out form of a negative number, e.g. az `'mənfi'`, en `'negative'`. */
  negative: string
  /**
   * Connector word inserted between a hundreds/tens group and the trailing
   * ones digit within a single 0-999 group, e.g. Spanish `'y'` in `"treinta
   * y cinco"` (35), or (unimplemented here) British English `'and'` in
   * `"one hundred and one"`. Consumed by {@link renderGroup}, not `compose` —
   * `compose` only ever sees already-built chunk words. Omit for locales
   * that never need a connector here (az, en-US, ru).
   *
   * Before 2026-08-18 this field also doubled as the integer/fraction
   * decimal connector; that meaning was split out into
   * {@link decimalConnector} once `numberToWords` actually threaded a
   * `locale` option (`todo.md` §1) and the double duty became ambiguous —
   * a locale that sets one now doesn't accidentally get it misused for the
   * other purpose.
   */
  and?: string
  /**
   * Word or phrase joining the spelled-out integer and fractional parts of
   * a decimal number, e.g. Azerbaijani `'tam'` (`12.34` -> `"on iki tam
   * otuz dörd"`). Omit for locales that haven't defined a decimal-reading
   * convention yet (`en`/`ru`/`es` — see `todo.md` §2); `numberToWords`
   * then joins the two parts with a plain space, which is a placeholder,
   * not a claim of linguistic correctness.
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
   * Renders a single 0-999 group as cardinal words using this locale's own
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

/** Suffix and full-word derivation for `toOrdinal` / `ordinalToWords`. */
export interface LocaleOrdinal {
  /**
   * Short numeral suffix for a value, e.g. az `getOrdinalSuffix` returning
   * `'ci'`/`'cı'`/`'cu'`/`'cü'` by vowel harmony, en `'st'`/`'nd'`/`'rd'`/`'th'`.
   * Used by `toOrdinal` (`5` -> `'5-ci'` / `'5th'`).
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

/** One magnitude's short/long notation for `toShortNotation` / `toLongNotation`. */
export interface LocaleNotationScale {
  /** Magnitude this entry applies from, e.g. `1e3`, `1e6`, `1e9`, `1e12`. */
  threshold: number
  /** Short-scale abbreviation, e.g. az `'min'`, en `'K'`, ru `'тыс'`. */
  short: string
  /** Long-scale word, matching `words.scales` at the same magnitude. */
  long: string
}

/** Short/long scale notation for `toShortNotation` / `toLongNotation`. */
export interface LocaleNotation {
  /** Notation scales, largest magnitude first — mirrors `SHORT_SCALES_AZ`/`SHORT_SCALES_EN` in `number/notation.ts`. */
  scales: readonly LocaleNotationScale[]
  /** Whether a space separates the scaled number from the short abbreviation (az `'2,5 mln'` vs en `'2.5M'`). */
  spaceBeforeShort: boolean
}

/** One currency unit's word and, where the locale inflects it, its plural forms. */
export interface LocaleCurrencyUnit {
  /** Unit word, e.g. az major `'manat'` / minor `'qəpik'`, en major `'dollar'` / minor `'cent'`. */
  word: string
  /**
   * Plural forms keyed by plural category, for locales that inflect the
   * unit word (Russian `рубль`/`рубля`/`рублей`). Omit for invariant words.
   */
  plurals?: Partial<Record<PluralCategory, string>>
}

/** Default currency for `formatMoney` / `parseMoney` / `moneyToWords`. */
export interface LocaleCurrency {
  /** ISO 4217 code this locale defaults to, e.g. `'AZN'`, `'USD'`, `'RUB'`, `'EUR'`. */
  code: string
  /** Currency symbol, e.g. `'₼'`, `'$'`, `'€'`. */
  symbol: string
  /** Symbol placement relative to the formatted amount. */
  symbolPosition: 'before' | 'after'
  /** Major unit (whole currency), e.g. az `'manat'`. */
  major: LocaleCurrencyUnit
  /** Minor unit (subunit), e.g. az `'qəpik'`. */
  minor: LocaleCurrencyUnit
}

/**
 * A complete set of linguistic and formatting data for one locale, in the
 * spirit of `date-fns`'s `Locale` object (see `CLAUDE.md` and `todo.md` §1).
 * Every public function that used to hardcode Azerbaijani —
 * `numberToWords`, `formatNumber`/`parseNumber`, `formatMoney`/`parseMoney`/
 * `moneyToWords`, `formatPercentage`/`parsePercentage`,
 * `toShortNotation`/`parseShortNotation`/`toLongNotation`/`parseLongNotation`,
 * `toOrdinal`/`ordinalToWords`/`getOrdinalSuffix`, `numberToDigitWords`, and
 * (partially — see `number/fraction.ts`'s doc comment) `fractionToWords` —
 * accepts a `{ locale?: Locale }` option that **defaults to `en`**, not
 * `az`, per the explicit direction recorded in `todo.md` §1's "default
 * locale" decision. `az` remains fully supported as an explicit
 * `{ locale: az }` — it is the reference implementation these functions are
 * verified against (`locale/az.test.ts`), not a fallback.
 *
 * `toRoman`/`fromRoman` and `toByteSize`/`parseByteSize` are deliberately
 * excluded: both are locale-independent and stay outside this system (see
 * `todo.md` §3 and `number/byte-size.ts`'s doc comment). Financial, stats,
 * arithmetic, and utils functions are excluded too, per `todo.md` §4's
 * "raw numbers, no locale" decision.
 */
export interface Locale {
  /** BCP 47 language tag, e.g. `'az'`, `'en'`, `'ru'`, `'es'`. */
  code: string
  /** Human-readable name for docs and error messages, e.g. `'Azerbaijani'`. */
  name?: string
  /** Number formatting separators this locale defaults to (see `shared/constants.ts`). */
  formatDefaults: {
    /** Separator inserted between groups of three integer digits. */
    thousandsSeparator: string
    /** Separator between the integer and fractional part. */
    decimalSeparator: string
  }
  /** Cardinal word data and composition rules for `numberToWords`. */
  words: LocaleWords
  /**
   * Selects the plural/case category for a cardinal value, per CLDR plural
   * rules. `az`, `en`, and `es` can return `'other'` unconditionally; `ru`
   * needs the real `one`/`few`/`many` split to pick the right scale and
   * currency word forms.
   */
  plural: (n: number) => PluralCategory
  /** Ordinal suffix and full-word derivation for `toOrdinal`/`ordinalToWords`. */
  ordinal: LocaleOrdinal
  /** Short/long scale notation for `toShortNotation`/`toLongNotation`. */
  notation: LocaleNotation
  /** Default currency for `formatMoney`/`parseMoney`/`moneyToWords`. */
  currency: LocaleCurrency
  /**
   * Fraction-word composition for `fractionToWords`. Optional — only `az`
   * implements this today; `ru`/`es` don't yet have verified fraction-noun
   * vocabulary (see `number/fraction.ts`'s doc comment for why guessing is
   * riskier than throwing). `en`, the structural default `number/words.ts`
   * itself falls back to, is deliberately excluded from this field too: its
   * composer needs `numberToWords`, and `number/words.ts` depends on `en`
   * for its default, so `en` can never import back from `number/` without a
   * cycle — `number/fraction.ts` special-cases `en` directly instead.
   */
  fractions?: LocaleFractions
}

/** Fraction-word composition for a locale that implements it (see `Locale.fractions`). */
export interface LocaleFractions {
  /** Idiomatic word for exactly 1/2, e.g. az `'yarım'`, if this locale has one. */
  half?: string
  /** Builds the fraction reading for any other proper fraction. */
  words: (numerator: number, denominator: number) => string
}
