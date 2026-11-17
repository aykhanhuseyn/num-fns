# API review for 1.0.0 (task 0.9-1)

This page is the last review of the public API before `1.0.0`. After
`1.0.0`, every name, parameter order, option and type on this page changes
only by addition until `2.0.0` (see [`versioning.md`](./versioning.md)).

- **Rule for this review:** no renames. A rename costs every user a change;
  consistency gains less than that. A name that does not fit a pattern stays,
  and the pattern is written down for new functions.
- **Result:** every row says **keep**. No row says "deprecate". So `1.0.0`
  has no `@deprecated` item to remove.
- **Status:** complete (2026-11-17). Nothing on this page blocks `1.0.0-rc.0`.

## Naming rules for new functions

```
 value ──formatX──► locale text ──parseX──► value     options, locale, lossy
 value ──toX──────► text        ──parseX──► value     options or rounding, lossy
 value ──toX──────► text        ──fromX───► value     lossless, no options
 value ──xToWords─► words                             spelling, locale
 getX · isX · inX · verb · noun                       the rest
```

| Pattern | Use it when | Examples |
| --- | --- | --- |
| `formatX` / `parseX` | The text depends on a locale and options (separators, decimals). | `formatNumber`, `formatMoney`, `formatPercentage` |
| `toX` / `parseX` | The text is a short form that can round or that takes options. | `toShortNotation`, `toLongNotation`, `toByteSize` |
| `toX` / `fromX` | The conversion is exact both ways and has no options. | `toRoman`/`fromRoman`, `toBase`/`fromBase` |
| `xToWords` | The function spells a value in words. | `numberToWords`, `moneyToWords`, `ordinalToWords` |
| `getX` | The function reads a fixed record or setting. | `getCurrency`, `getConfig`, `getOrdinalSuffix` |
| `isX` / `inX` | The function returns a `boolean`. | `isEven`, `isOdd`, `inRange` |
| verb | The function computes a value from numbers. | `add`, `round`, `clamp` |
| noun | The function names the statistic or financial value it returns. | `mean`, `variance`, `loanPayment` |

Every parser with an `output` option has the three overloads that
`src/parsers.types.test.ts` tests. A new parser copies that shape.

## Root exports (`num-fns`): 54 functions

"Options" names the options type. "positional" means the function takes no
options object, so `noThrow` comes only from `setConfig` (README, "Errors,
or empty values").

### Format and parse

| Export | Pattern | Options | Since | Decision |
| --- | --- | --- | --- | --- |
| `formatNumber` | `formatX` | `NumberFormatOptions` | 0.2.0 | keep |
| `parseNumber` | `parseX` (3 overloads) | `NumberParseOptions` | 0.2.0 | keep |
| `formatMoney` | `formatX` | `MoneyFormatOptions` | 0.2.0 | keep |
| `parseMoney` | `parseX` (3 overloads) | `MoneyParseOptions` | 0.2.0 | keep |
| `formatPercentage` | `formatX` | `PercentageFormatOptions` | 0.2.0 | keep |
| `parsePercentage` | `parseX` (3 overloads) | `PercentageParseOptions` | 0.2.0 | keep |
| `toShortNotation` | `toX` | `ShortNotationOptions` | 0.2.0 | keep |
| `parseShortNotation` | `parseX` (3 overloads) | `ShortNotationParseOptions` | 0.2.0 | keep |
| `toLongNotation` | `toX` | `LongNotationOptions` | 0.2.0 | keep |
| `parseLongNotation` | `parseX` (3 overloads) | `LongNotationParseOptions` | 0.2.0 | keep |
| `toByteSize` | `toX` | `ByteSizeOptions` | 0.2.0 | keep |
| `parseByteSize` | `parseX` (3 overloads) | `ByteSizeParseOptions` | 0.2.0 | keep |
| `toRoman` | `toX` | positional | 0.2.0 | keep |
| `fromRoman` | `fromX` | positional | 0.2.0 | keep |
| `toBase` | `toX` | positional | 0.2.0 | keep |
| `fromBase` | `fromX` (3 overloads) | `BaseParseOptions` | 0.2.0 | keep |

### Words and ordinals

| Export | Pattern | Options | Since | Decision |
| --- | --- | --- | --- | --- |
| `numberToWords` | `xToWords` | `NumberWordsOptions` | 0.2.0 | keep |
| `moneyToWords` | `xToWords` | `MoneyWordsOptions` | 0.2.0 | keep |
| `fractionToWords` | `xToWords` | `FractionWordsOptions` | 0.2.0 | keep |
| `ordinalToWords` | `xToWords` | `OrdinalOptions` | 0.2.0 | keep |
| `numberToDigitWords` | `xToWords` | `DigitWordsOptions` | 0.2.0 | keep |
| `cardinalToOrdinalWords` | `xToWords` (words in, words out) | `OrdinalOptions` | 0.2.0 | keep |
| `toOrdinal` | `toX` | `ToOrdinalOptions` | 0.2.0 | keep |
| `getOrdinalSuffix` | `getX` | `OrdinalOptions` | 0.2.0 | keep (note 1) |
| `withSuffix` | `withX` | `SuffixOptions` | 0.2.0 | keep (note 1) |

### Money and configuration

| Export | Pattern | Options | Since | Decision |
| --- | --- | --- | --- | --- |
| `getCurrency` | `getX` | positional | 0.4.0 | keep (note 2) |
| `getConfig` | `getX` | none | 0.6.0 | keep |
| `setConfig` | verb | `Partial<NumFnsConfig>` | 0.6.0 | keep (note 3) |
| `resetConfig` | verb | none | 0.6.0 | keep |

### Arithmetic and predicates

| Export | Pattern | Options | Since | Decision |
| --- | --- | --- | --- | --- |
| `add` | verb | positional | 0.4.0 | keep |
| `subtract` | verb | positional | 0.4.0 | keep |
| `multiply` | verb | positional | 0.4.0 | keep |
| `divide` | verb | positional | 0.4.0 | keep |
| `round` | verb | positional (`precision`, `mode`) | 0.4.0 | keep (note 4) |
| `clamp` | verb | positional | 0.2.0 | keep |
| `inRange` | `inX` | positional | 0.2.0 | keep |
| `isEven` | `isX` | positional | 0.2.0 | keep (note 5) |
| `isOdd` | `isX` | positional | 0.2.0 | keep (note 5) |

### Statistics

| Export | Pattern | Options | Since | Decision |
| --- | --- | --- | --- | --- |
| `sum` | noun | positional | 0.2.0 | keep |
| `mean` | noun | positional | 0.2.0 | keep |
| `median` | noun | positional | 0.2.0 | keep |
| `mode` | noun (returns `number[]`) | positional | 0.2.0 | keep |
| `min` | noun | positional | 0.2.0 | keep |
| `max` | noun | positional | 0.2.0 | keep |
| `percentile` | noun (`p` in 0–100) | positional | 0.2.0 | keep |
| `quantile` | noun (`q` in 0–1) | positional | 0.2.0 | keep |
| `variance` | noun | `VarianceOptions` | 0.2.0 | keep |
| `standardDeviation` | noun | `VarianceOptions` | 0.2.0 | keep |

### Financial

| Export | Pattern | Options | Since | Decision |
| --- | --- | --- | --- | --- |
| `simpleInterest` | noun | positional | 0.2.0 | keep (note 6) |
| `compoundInterest` | noun | `CompoundInterestOptions` | 0.2.0 | keep (note 6) |
| `futureValue` | noun | positional | 0.2.0 | keep |
| `presentValue` | noun | positional | 0.2.0 | keep |
| `loanPayment` | noun | positional | 0.2.0 | keep |
| `amortizationSchedule` | noun (returns `AmortizationScheduleEntry[]`) | positional | 0.2.0 | keep |

## Root type exports: 31 types

All **keep**. Types are API too: removing one, or making an optional field
required, is a major change.

- Options: `NumberFormatOptions`, `NumberParseOptions`, `MoneyFormatOptions`,
  `MoneyParseOptions`, `MoneyWordsOptions`, `PercentageFormatOptions`,
  `PercentageParseOptions`, `ShortNotationOptions`,
  `ShortNotationParseOptions`, `LongNotationOptions`,
  `LongNotationParseOptions`, `SuffixOptions`, `OrdinalOptions`,
  `ToOrdinalOptions`, `NumberWordsOptions`, `FractionWordsOptions`,
  `ByteSizeOptions`, `ByteSizeParseOptions`, `BaseParseOptions`,
  `DigitWordsOptions`, `CompoundInterestOptions`, `VarianceOptions`,
  `ParseOutputOptions`, `NoThrowOptions`.
- Values: `RoundingMode`, `ParseOutput`, `PercentageUnit`, `CurrencyCode`,
  `Currency`, `NumFnsConfig`, `AmortizationScheduleEntry`.

## `num-fns/locale` exports

| Export | Kind | Decision |
| --- | --- | --- |
| `az`, `en`, `enGB`, `es`, `ru` | `Locale` objects | keep |
| `Locale`, `LocaleWords`, `LocaleOrdinal`, `LocaleNotation`, `LocaleNotationScale`, `LocaleCurrency`, `LocaleCurrencyUnit`, `LocaleCurrencyUnits`, `LocaleFractions`, `WordChunk` | interfaces | keep (note 7) |
| `PluralCategory`, `GrammaticalGender`, `CurrencyCode` | types | keep |
| `defineLocale`, `extendLocale` | functions | added in task 0.9-2 |

## Notes

1. **`getOrdinalSuffix` and `withSuffix`.** `getOrdinalSuffix` returns only
   the locale suffix (`"st"`), for a UI that styles the suffix apart from the
   digits. `withSuffix` is not an ordinal function: it joins a value, a
   separator and any caller text (`withSuffix(120, 'kg')` → `"120 kg"`). Both
   have a use that no other export covers. Keep both.
2. **`getCurrency` with `noThrow`.** It returns `undefined`, but the return
   type is `Currency`. The parsers have the same gap (`NaN` for
   `output: 'bigint'`). `NumFnsConfig.noThrow` documents both. Keep: a
   `Currency | undefined` return type would make every normal call check for
   `undefined`.
3. **`setConfig` is for applications, not for libraries.** A library that
   calls `setConfig` changes the behaviour of every other user of `num-fns`
   in the same application. A library uses the per-call `noThrow` option.
   This rule is now in the README.
4. **`round(value, precision, mode)`.** The parameter order is part of the
   contract. A later options object can only be added as a new overload.
5. **`isEven` / `isOdd`.** Keep. `isInteger` stays rejected:
   `Number.isInteger` does that job.
6. **`time` and `periods`.** `simpleInterest` and `compoundInterest` call the
   period count `time`; the others call it `periods`. Parameter names are not
   part of the JavaScript API, so this is not a change. JSDoc says "periods"
   in all five.
7. **`Locale` fields.** The interface is final after 0.7. A new **optional**
   field is a minor change; a new **required** field is a major change.

## Decision: a new `CurrencyCode` is a minor change

`CurrencyCode` is a union of the codes in the registry
(`'AZN' | 'USD' | 'EUR' | 'RUB' | 'GBP'`). A new code makes the union wider.

- **Input positions** (`getCurrency(code)`, the `currency` option): a wider
  union accepts every value it accepted before. Not breaking.
- **Custom locales:** `LocaleCurrency.units` is
  `Partial<Record<CurrencyCode, …>>`, so a custom locale still type-checks
  when a code is added. `moneyToWords` throws `RangeError` for a code that
  the locale has no words for, as it does today.
- **Exhaustive `switch`** in user code: a wider union can make a
  `never` check fail at compile time. Runtime output does not change.

Decision: a new code stays a **minor** change. The JSDoc of `CurrencyCode`
and `versioning.md` say: "Do not use an exhaustive `switch` over
`CurrencyCode`; new codes come in minor versions." This is the same rule
TypeScript libraries use for string unions that grow, and the 1.2 plan
(`SAR`, `AED`) and later locales depend on it. Removing a code is a major
change.

## Follow-ups (not part of 0.9-1)

- `src/index.test.ts` pins the 54 runtime exports, but no test pins the
  31 type exports. A type-level test of the export list can come with the
  rc (tooling only, no API change).
- The README "Full surface" import lists 26 of the 54 functions. The API
  reference at `/api/` lists all of them.
