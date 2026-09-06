<p align="center">
  <a href="https://aykhanhuseyn.github.io/num-fns/">
    <img
      src="https://raw.githubusercontent.com/aykhanhuseyn/num-fns/main/site/public/banner.png"
      alt="num-fns"
      width="560"
    />
  </a>
</p>

[![npm version](https://img.shields.io/npm/v/num-fns.svg)](https://www.npmjs.com/package/num-fns)
[![CI](https://github.com/aykhanhuseyn/num-fns/actions/workflows/ci.yml/badge.svg)](https://github.com/aykhanhuseyn/num-fns/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/num-fns)](https://bundlephobia.com/package/num-fns)

Modern internationalized number utility library for JavaScript — like
`date-fns`, but for numbers.

Format and parse numbers, money and percentages; spell numbers out in words;
ordinals, short/long notation and roman numerals. Written in TypeScript, built
as dual ESM/CJS with type declarations, so it works in modern and older
projects alike.

**[Live docs & playground →](https://aykhanhuseyn.github.io/num-fns/)**

> **Status: 0.2.0**, the first stable release — the alpha line ends here
> (npm's `latest` previously pointed at `0.2.0-alpha.0`). Still `0.x`, so the
> API can change in a minor bump until 1.0; see [`todo.md`](./todo.md) for
> what's queued before then. The locale system is implemented: `az`, `en`, `en-GB`,
> `ru`, and `es` are all wired into `numberToWords`, ordinals, notation, and
> money/percentage formatting. **The default locale is `en`** if you don't
> pass one — `az` was the implicit default before 2026-08-18 and now requires
> `{ locale: az }` explicitly. `fractionToWords` currently only has real
> vocabulary for `az`, `en`, and `en-GB`; see its JSDoc for why `ru`/`es` throw
> instead of guessing.

## Install

```sh
bun add num-fns
# or
npm install num-fns
```

## Usage

Functions are imported individually from the package root; locales are imported
from `num-fns/locale` and passed in per call, so a bundler only ships the
locales you actually use.

```ts
import { formatNumber, numberToWords, formatMoney } from 'num-fns';
import { az, en, ru, es } from 'num-fns/locale';

formatNumber(1234567.89, { locale: az, decimals: 2 }); // "1 234 567,89"
formatNumber(1234567.89, { locale: en, decimals: 2 }); // "1,234,567.89"

numberToWords(1234, { locale: az }); // "min iki yüz otuz dörd"
numberToWords(1234, { locale: en }); // "one thousand two hundred thirty-four"
numberToWords(1234, { locale: ru }); // "одна тысяча двести тридцать четыре"
numberToWords(1234, { locale: es }); // "mil doscientos treinta y cuatro"

formatMoney(1234.5, { locale: az }); // "1 234,50 ₼" (az.currency defaults to AZN)
formatMoney(1234.5, { locale: en }); // "$ 1,234.50" (en.currency defaults to USD)
formatMoney(1234.5, { locale: az, currency: 'EUR' }); // "1 234,50 €" (any ISO 4217 code)
```

### Full surface

```ts
import {
  formatNumber,
  parseNumber,
  numberToWords,
  toRoman,
  fromRoman,
  toShortNotation,
  toLongNotation,
  parseShortNotation,
  parseLongNotation,
  toOrdinal,
  ordinalToWords,
  withSuffix,
  formatMoney,
  parseMoney,
  moneyToWords,
  getCurrency,
  formatPercentage,
  parsePercentage,
} from 'num-fns';
```

Examples below use the default locale (`en`) unless a `locale` is passed:

```ts
formatNumber(1234567.89, { decimals: 2 }); // "1,234,567.89"
formatNumber(1234567.89, { decimals: 2, locale: az }); // "1 234 567,89"
parseNumber('1,234,567.89'); // 1234567.89

numberToWords(1234); // "one thousand two hundred thirty-four"
numberToWords(1234, { locale: az }); // "min iki yüz otuz dörd"

toRoman(1994); // "MCMXCIV"
fromRoman('MCMXCIV'); // 1994

toShortNotation(2500000); // "2.5M"
toLongNotation(1234567); // "1 million 234 thousand 567"
parseShortNotation('2.5M'); // 2500000
parseLongNotation('1 million 234 thousand 567'); // 1234567

toOrdinal(3); // "3rd"
ordinalToWords(3); // "third"
withSuffix(120, 'kg'); // "120 kg"

formatMoney(1234.5); // "$ 1,234.50"
parseMoney('$ 1,234.50'); // 1234.5
moneyToWords(1234.5); // "one thousand two hundred thirty-four dollars fifty cents"
formatMoney(1234.5, { currency: 'GBP' }); // "£ 1,234.50"
moneyToWords(1.5, { currency: 'GBP' }); // "one pound fifty pence"
getCurrency('EUR'); // { code: 'EUR', symbol: '€', decimals: 2 }

formatPercentage(45.5, { decimals: 1 }); // "45.5%"
parsePercentage('45.5%', { asRatio: true }); // 0.455
```

Every formatter accepts an options object for overriding separators, decimals,
currency, or locale — see the JSDoc on each function for details. Separator
options have to stay unambiguous: `thousandsSeparator` and `decimalSeparator`
must differ, and `toLongNotation`'s `groupSeparator` must be non-empty and
digit-free, so that anything a formatter emits its matching parser can read
back. A pair that breaks that throws `RangeError` rather than producing a
string which parses to the wrong number.

Roman numerals and byte-size notation (`toByteSize`/`parseByteSize`) are
locale-independent and take no `locale` option, as are the financial,
statistics, arithmetic, and base-conversion utilities.

### Currencies

`formatMoney`, `parseMoney` and `moneyToWords` take an ISO 4217 `currency`
code — `AZN`, `USD`, `EUR`, `RUB` or `GBP` — and default to the locale's own
(`az` → AZN, `en` → USD, `en-GB` → GBP, `ru` → RUB, `es` → EUR). The split of
responsibilities follows the language/currency line: the *currency* owns its
symbol and minor-unit exponent (`getCurrency(code)`), the *locale* owns
which side of the amount the symbol goes and what the units are called, in
every plural form and grammatical gender the language needs.

```ts
import { formatMoney, moneyToWords } from 'num-fns';
import { az, en, ru, es } from 'num-fns/locale';

formatMoney(9.99, { currency: 'EUR' }); // "€ 9.99"      (en: symbol before)
formatMoney(9.99, { locale: az, currency: 'EUR' }); // "9,99 €"     (az: symbol after)

moneyToWords(2.02, { currency: 'EUR' }); // "two euros two cents"
moneyToWords(2.02, { locale: ru, currency: 'USD' }); // "два доллара два цента"
moneyToWords(1, { locale: es, currency: 'GBP' }); // "una libra" (libra is feminine)
```

A code the registry doesn't know, or one a locale has no unit words for,
throws `RangeError` — `moneyToWords` never borrows another language's words.
An explicit `symbol`, `symbolPosition`, `majorUnit` or `minorUnit` option still
overrides whatever the code and locale resolve to, so a custom currency remains
possible without registering it.

## Locale support

| Locale | Code | Default currency | `numberToWords`, ordinals, notation, money, percentage | `fractionToWords` |
| --- | --- | --- | --- | --- |
| Azerbaijani | `az` | AZN | Implemented | Implemented |
| English | `en` | USD | Implemented (default) | Implemented |
| English (UK) | `en-GB` (`import { enGB } from 'num-fns/locale/en-gb'`) | GBP | Implemented | Implemented |
| Russian | `ru` | RUB | Implemented | Throws — see below |
| Spanish | `es` | EUR | Implemented | Throws — see below |

Every locale carries unit words for all five currencies (AZN, USD, EUR, RUB,
GBP), so `moneyToWords` can spell any of them in any launch locale.

`en-GB` shares every word and rule `en` (US) defines, differing in reading
`and` before the final low part of a number — `"one hundred and one"`, `"one
thousand and one"` — where `en` says `"one hundred one"`, in defaulting to
sterling rather than dollars, and in spelling `"rouble"`.

`fractionToWords` only has real fraction-noun vocabulary for `az`, `en`, and
`en-GB`. Russian and Spanish fraction nouns aren't simple derivations of
their ordinal words (Russian needs feminine forms like "треть"/"четверть";
Spanish's "tercio" diverges from its ordinal "tercero"), so rather than guess
and risk being wrong in specific, embarrassing ways, `fractionToWords` throws
a `RangeError` for those two locales until real vocabulary is added — see the
function's JSDoc.

**Known limitations:**

- `ru` ordinals (`ordinalToWords`/`toOrdinal`) are nominative masculine
  singular only — no case or gender declension (`первая`, `первого`, etc.)
  in v1.
- `es` ordinalizes *every* token of a compound number (`"treinta y uno"` →
  `"trigésimo primero"`), unlike `en`/`ru`, which only transform the last
  token — a deliberate divergence, not a bug.

Adding a locale means implementing one object against the `Locale` interface
and the shared conformance suite (`src/locale/conformance.test.ts`) every
locale must pass unmodified — see [`CONTRIBUTING.md`](./CONTRIBUTING.md#how-to-add-a-new-locale)
for the full locale-authoring guide. Contributions welcome.

## Development

This project uses Bun, TypeScript, and Vite.

```sh
bun install         # install dependencies
bun test            # run the test suite
bun run typecheck   # type-check without emitting
bun run lint        # lint with Biome
bun run build       # build dist/ (ESM + CJS + .d.ts)

bun run site:dev    # docs/playground site, dev server
bun run site:build  # docs/playground site, build to site-dist/
```

The `site/` app (deployed to the [live docs & playground](https://aykhanhuseyn.github.io/num-fns/)
on GitHub Pages via `.github/workflows/pages.yml`) is a separate Vite root
that imports directly from `src/`, so every example runs the real, current
source.

## Migrating from `az-number-utils`

This project started as `az-number-utils` and was renamed to `num-fns` when
its scope widened from Azerbaijani-only to a general internationalized number
library. `az-number-utils` was never published to npm, so there's no old
package to uninstall or deprecate — if you had it cloned or vendored locally,
just update the directory/import name to `num-fns`. All exported function
names (`formatNumber`, `numberToWords`, `toRoman`, etc.) are unchanged.

## License

MIT
