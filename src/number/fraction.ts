import { en } from '../locale/en'
import { guardText } from '../shared/no-throw-text'
import type { FractionWordsOptions } from '../shared/types'
import { ordinalToWords } from './suffix'
import { numberToWords } from './words'

/**
 * English fraction words: `<numerator cardinal> <denominator ordinal>`,
 * pluralizing the ordinal with a trailing "s" when the numerator is more
 * than one — e.g. `1/3` becomes `"one third"`, `2/3` becomes `"two thirds"`.
 * English's ordinal words happen to double as fraction-noun words for every
 * denominator this covers, so no separate vocabulary is needed (contrast
 * Spanish, where "tercero" (third, ordinal) and "tercio" (a third, fraction
 * noun) diverge — one reason `es` isn't implemented, see this module's
 * top-level doc comment).
 *
 * Lives here rather than as `en.fractions` (the hook every other
 * locale implements — see `Locale.fractions` in `locale/types.ts`) because
 * it needs `numberToWords`/`ordinalToWords`, and those depend on `en` for
 * their own default locale — `en` can never import back from `number/`
 * without creating a circular dependency, so its composer is special-cased
 * here instead of being locale-owned.
 */
function enFractionWords(numerator: number, denominator: number): string {
  const ordinal = ordinalToWords(denominator, { locale: en })
  const denominatorWord = numerator > 1 ? `${ordinal}s` : ordinal
  return `${numberToWords(numerator, { locale: en })} ${denominatorWord}`
}

/**
 * Spells out a proper fraction (`0 < numerator < denominator`) as words, per
 * `options.locale` (defaults to `en`). Every locale but `en` composes its
 * fraction words via its own `Locale.fractions` hook (`az.fractions`, e.g.)
 * — `en`'s composer lives in this module instead, see {@link enFractionWords}.
 *
 * Scoped to proper fractions (`0 < numerator < denominator`) — mixed numbers
 * and improper fractions throw `RangeError`, since there's no single
 * idiomatic reading to fall back to without deciding a mixed-number format
 * first.
 *
 * Only `az` and `en` are implemented. `ru` and `es` fraction nouns are not
 * simple derivations of their `Locale.ordinal.words` output — Russian
 * fractions need feminine noun forms ("треть", "четверть") distinct from
 * the masculine ordinal adjectives `ru.ordinal.words` produces ("третий"),
 * and Spanish's fraction noun for 1/3 ("tercio") differs from its ordinal
 * ("tercero") even though every other denominator's forms coincide.
 * Guessing at these risks exactly the "wrong in embarrassing, specific ways"
 * failure mode `todo.md` §5 calls out for machine-generated `ru`/`es` word
 * lists, so `fractionToWords` throws for these locales (no `Locale.fractions`
 * defined) instead of guessing; building real `ru`/`es` fraction-noun
 * vocabulary is tracked in `todo.md` §2 as follow-up linguistic work, not
 * part of this locale-threading pass.
 *
 * @example
 * fractionToWords(1, 3); // "one third"
 * fractionToWords(2, 3); // "two thirds"
 * fractionToWords(1, 2, { locale: az }); // "yarım"
 * fractionToWords(1, 3, { locale: az }); // "üçdə bir"
 */
export function fractionToWords(
  numerator: number,
  denominator: number,
  options: FractionWordsOptions = {},
): string {
  return guardText(
    () => fractionToWordsImpl(numerator, denominator, options),
    [numerator, denominator],
    options,
  )
}

/** The body of {@link fractionToWords}, extracted so the `noThrow` wrapper does not nest it. */
function fractionToWordsImpl(
  numerator: number,
  denominator: number,
  options: FractionWordsOptions,
): string {
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

  const { locale = en } = options
  const isEnglish = locale.code === en.code

  if (denominator === 2 && numerator === 1) {
    if (isEnglish) return 'half'
    if (locale.fractions?.half) return locale.fractions.half
  }

  if (isEnglish) return enFractionWords(numerator, denominator)

  if (!locale.fractions) {
    throw new RangeError(
      `fractionToWords: locale "${locale.code}" does not define fraction words yet — see todo.md §2`,
    )
  }

  return locale.fractions.words(numerator, denominator)
}
