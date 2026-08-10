import { numberToWords } from './words'

/**
 * Word for one half — the one Azerbaijani fraction with an idiomatic name
 * rather than a "<denominator + locative> <numerator>" construction.
 * {@link fractionToWords} returns this directly for `1/2` instead of the
 * grammatically valid but unidiomatic "ikidə bir".
 */
const HALF_WORD = 'yarım'

/**
 * Classifies a vowel by front/back harmony for the locative-case suffix
 * ("-da"/"-də") that reads a fraction's denominator, e.g. "üçdə" ("in
 * three") in "üçdə bir" (one third), or "yüzdə" ("in a hundred") in "yüzdə
 * bir" (one percent — "percent" and "one hundredth" are the same phrase in
 * Azerbaijani).
 *
 * This is a *two-way* harmony (back vs. front only), unlike the four-way
 * harmony `suffix.ts` uses for the ordinal suffix ("-cı"/"-ci"/"-cu"/"-cü").
 * Azerbaijani's low-vowel suffixes (locative, dative, plural) only track
 * backness, not rounding — "doqquz" (back, rounded "u") and "altı" (back,
 * unrounded "ı") both take "-da" even though they take different ordinal
 * suffixes ("doqquzuncu" vs. "altıncı"). Kept self-contained rather than
 * importing from `suffix.ts`'s table, matching `number/`'s existing pattern
 * of small, independent modules (see `roman.ts`).
 */
const VOWEL_TO_LOCATIVE_SUFFIX: Record<string, string> = {
  a: 'da',
  ı: 'da',
  o: 'da',
  u: 'da',
  e: 'də',
  ə: 'də',
  i: 'də',
  ö: 'də',
  ü: 'də',
}

function lastVowel(word: string): string {
  for (let i = word.length - 1; i >= 0; i--) {
    const char = word[i] as string
    if (char in VOWEL_TO_LOCATIVE_SUFFIX) return char
  }
  throw new SyntaxError(`fractionToWords: no Azerbaijani vowel found in "${word}"`)
}

/**
 * Spells out a proper fraction (`0 < numerator < denominator`) as Azerbaijani
 * words. The denominator takes the locative case ("üçdə" = "in three") and
 * the numerator follows as a cardinal number — e.g. `1/3` becomes `"üçdə
 * bir"` (one third), `2/3` becomes `"üçdə iki"` (two thirds). `1/2` is the
 * one exception: it returns the idiomatic `"yarım"` (half) rather than the
 * grammatically valid but unidiomatic `"ikidə bir"`.
 *
 * Scoped to proper fractions for now. Mixed numbers (e.g. "bir yarım" for
 * `3/2`) and fractions with a numerator `>=` the denominator aren't handled
 * and throw `RangeError` — there's no single idiomatic Azerbaijani reading
 * to fall back to without deciding a mixed-number format first.
 *
 * Like the rest of `number/`, this is hardcoded Azerbaijani for now — not
 * gated on the locale refactor (`todo.md` §1) since it only consumes the
 * already-shared cardinal-number logic in {@link numberToWords}.
 *
 * @example
 * fractionToWords(1, 2); // "yarım"
 * fractionToWords(1, 3); // "üçdə bir"
 * fractionToWords(2, 3); // "üçdə iki"
 * fractionToWords(1, 4); // "dörddə bir"
 * fractionToWords(1, 100); // "yüzdə bir"
 */
export function fractionToWords(numerator: number, denominator: number): string {
  if (!Number.isInteger(denominator) || denominator < 2) {
    throw new RangeError(
      `fractionToWords: denominator must be an integer >= 2, received ${denominator}`,
    )
  }
  if (!Number.isInteger(numerator) || numerator < 1 || numerator >= denominator) {
    throw new RangeError(
      `fractionToWords: numerator must be an integer in the range [1, denominator - 1], received ${numerator}`,
    )
  }

  if (denominator === 2 && numerator === 1) return HALF_WORD

  const denominatorWords = numberToWords(denominator)
  const denominatorLastWord = denominatorWords.split(' ').pop() as string
  const suffix = VOWEL_TO_LOCATIVE_SUFFIX[lastVowel(denominatorLastWord)] as string

  return `${denominatorWords}${suffix} ${numberToWords(numerator)}`
}
