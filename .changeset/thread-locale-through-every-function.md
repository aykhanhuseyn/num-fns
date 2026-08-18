---
"num-fns": minor
---

Thread a `locale` option through every public function with locale-dependent behavior (`numberToWords`, `toOrdinal`/`ordinalToWords`/`getOrdinalSuffix`, `formatNumber`/`parseNumber`, `formatMoney`/`parseMoney`/`moneyToWords`, `formatPercentage`/`parsePercentage`, `toShortNotation`/`parseShortNotation`/`toLongNotation`/`parseLongNotation`, `numberToDigitWords`, and `fractionToWords`), with real cardinal/ordinal/notation vocabulary for all four launch locales (`az`, `en`, `ru`, `es`).

**Breaking changes** (this package hasn't hit 1.0 yet — see `CONTRIBUTING.md`'s "Releasing" section for why this is `minor`, not `major`):

- **The default locale is now `en`, not the previous implicit Azerbaijani behavior.** Callers that want the old behavior must now pass `{ locale: az }` explicitly (`import { az } from 'num-fns/locale'`).
- `toOrdinal`'s separator moved from a positional second parameter to its options object: `toOrdinal(3, { separator: '-' })` instead of `toOrdinal(3, '-')`.
- `toShortNotation`'s `locale` option was a bare `'az' | 'en'` string; it's now a full `Locale` object (`{ locale: az }` instead of `{ locale: 'az' }`).

`fractionToWords` only has real fraction-noun vocabulary for `az` and `en` — `ru`/`es` throw a `RangeError` rather than guess at linguistically risky vocabulary (Russian fraction nouns need feminine forms distinct from their ordinal adjectives; Spanish's "tercio" diverges from its ordinal "tercero"). Tracked as follow-up in `todo.md` §2.
