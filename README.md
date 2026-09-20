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
ordinals, short/long notation and roman numerals; decimal-safe arithmetic and
rounding; `bigint` in and out for values a `number` can't hold exactly. Written
in TypeScript, built as dual ESM/CJS with type declarations, so it works in
modern and older projects alike.

**[Live docs & playground →](https://aykhanhuseyn.github.io/num-fns/)**

> **Status: 0.5.0** — the alpha line ended with `0.2.0`, the first stable
> release (npm's `latest` previously pointed at `0.2.0-alpha.0`). Still `0.x`,
> so the API can change in a minor bump until 1.0; see [`todo.md`](./todo.md)
> for what's queued before then. The locale system is implemented: `az`, `en`, `en-GB`,
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
  add,
  subtract,
  multiply,
  divide,
  round,
  getConfig,
  setConfig,
  resetConfig,
} from 'num-fns';
```

Examples below use the default locale (`en`) unless a `locale` is passed:

```ts
formatNumber(1234567.89, { decimals: 2 }); // "1,234,567.89"
formatNumber(1234567.89, { decimals: 2, locale: az }); // "1 234 567,89"
parseNumber('1,234,567.89'); // 1234567.89
formatNumber(BigInt('1234567890123456789')); // "1,234,567,890,123,456,789"
parseNumber('1,234,567,890,123,456,789', { output: 'bigint' }); // 1234567890123456789n

numberToWords(1234); // "one thousand two hundred thirty-four"
numberToWords(1234, { locale: az }); // "min iki yüz otuz dörd"

toRoman(1994); // "MCMXCIV"
fromRoman('MCMXCIV'); // 1994

toShortNotation(2500000); // "2.5M"
toLongNotation(1234567); // "1 million 234 thousand 567"
parseShortNotation('2.5M'); // 2500000
parseLongNotation('1 million 234 thousand 567'); // 1234567

toOrdinal(3); // "3-rd"
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

add(0.1, 0.2); // 0.3
subtract(0.3, 0.1); // 0.2
multiply(1.1, 1.1); // 1.21
divide(0.3, 0.1); // 3
round(1.005, 2); // 1.01
round(2.5, 0, 'halfEven'); // 2
```

Every formatter accepts an options object for overriding separators, decimals,
currency, or locale — see the JSDoc on each function for details. Every
integer-domain function also takes a `bigint` where it takes a `number`, and
every parser can return one — see "BigInt in and out" below. Separator
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

### Arithmetic

`add`, `subtract`, `multiply`, `divide` and `round` do decimal arithmetic on
plain numbers, so the classic floating-point traps don't apply: `0.1 + 0.2`
is `0.30000000000000004` in JavaScript, `add(0.1, 0.2)` is `0.3`. Each operand
is taken at its shortest decimal reading — the string `String(0.1)` gives you,
which is what you meant by the number — the operation runs exactly on
integers, and the result is the closest JavaScript number to the exact
answer. Everything goes in and comes out as a plain `number`; there is no
decimal type to wrap and unwrap, and no dependency.

```ts
import { add, subtract, multiply, divide, round } from 'num-fns';

add(0.1, 0.2); // 0.3   (0.1 + 0.2 is 0.30000000000000004)
subtract(0.3, 0.1); // 0.2   (0.3 - 0.1 is 0.19999999999999998)
multiply(1.1, 1.1); // 1.21  (1.1 * 1.1 is 1.2100000000000002)
divide(0.3, 0.1); // 3     (0.3 / 0.1 is 2.9999999999999996)
divide(1, 3); // 0.3333333333333333

round(1.005, 2); // 1.01  ((1.005).toFixed(2) is "1.00")
round(2.5, 0, 'halfEven'); // 2
round(-2.5, 0, 'halfDown'); // -2
round(-1.21, 1, 'floor'); // -1.3
round(1234, -2); // 1200
```

`round(value, precision, mode)` rounds the value as written rather than as the
binary float happens to be stored, takes a negative `precision` to round to
tens, hundreds and so on, and supports `'halfUp'` (the default, half away from
zero), `'halfDown'`, `'halfEven'`, `'ceil'` and `'floor'`. It is the one
rounding implementation in the package: `formatNumber`, `formatMoney` and
`formatPercentage` all delegate to it, so `formatNumber(1.005, { decimals: 2 })`
is `"1.01"` and the `roundingMode` option behaves identically everywhere. The
same exact-decimal reading drives every other place a value is rounded —
`numberToWords(2.675)` ends in "sixty-eight", `moneyToWords(2.675)` is
sixty-eight cents, `toShortNotation(2675000, { decimals: 2 })` is `"2.68M"` —
so a `number` and the equal `bigint` always format to the same digits.
`divide` carries the quotient to 25 significant digits before converting it
back, which is exact when the quotient terminates and otherwise the same as
correctly rounding the true quotient.

Like the rest of the package, these throw `RangeError` rather than returning
`NaN` or `Infinity`: on non-finite input, on division by zero, on a
non-integer `precision`, or when a result is too large for a JavaScript
number. None of them ever returns `-0`.

### BigInt in and out

A JavaScript `number` is exact only up to `Number.MAX_SAFE_INTEGER` (about
9 × 10¹⁵). A 64-bit database id, a file size from
`fs.statSync(path, { bigint: true })`, or a token balance in wei is already
past that, so every integer-domain function accepts `number | bigint` and
handles a `bigint` exactly at any magnitude — chunked, scaled and grouped in
integer arithmetic, never converted to a float on the way through. The same
goes in reverse: every parser takes `{ output: 'bigint' }` and hands back an
exact `bigint`, with the return type following the option through overloads so
there is nothing to cast.

```ts
import { statSync } from 'node:fs';
import {
  formatMoney,
  formatNumber,
  isEven,
  numberToWords,
  parseLongNotation,
  parseMoney,
  parseNumber,
  toByteSize,
  toLongNotation,
} from 'num-fns';

// In: number | bigint
formatNumber(BigInt('1234567890123456789')); // "1,234,567,890,123,456,789"
formatNumber(BigInt(10), { decimals: 2 }); // "10.00" — pads; there is nothing to round
formatMoney(BigInt('98765432109876543210'), { currency: 'EUR' }); // "€ 98,765,432,109,876,543,210.00"
numberToWords(BigInt('123456789012345')); // "one hundred twenty-three trillion four hundred ..."
toLongNotation(BigInt('999999999999999')); // "999 trillion 999 billion 999 million 999 thousand 999"
toByteSize(statSync('video.mkv', { bigint: true }).size); // "1.5 GB"
isEven(BigInt('9007199254740993')); // false — as a number this would be 9007199254740992, and even

// Out: { output: 'bigint' }
parseNumber('1,234,567,890,123,456,789', { output: 'bigint' }); // 1234567890123456789n
parseMoney('$ 1,234.00', { output: 'bigint' }); // 1234n
parseLongNotation('999 trillion 999 billion', { output: 'bigint' }); // 999999000000000n

// The return type tracks the option
const asNumber = parseNumber('1'); // number
const asBigInt = parseNumber('1', { output: 'bigint' }); // bigint
```

`formatNumber`, `formatMoney`, `formatPercentage`, `numberToWords`,
`moneyToWords`, `toLongNotation`, `toShortNotation`, `toByteSize`,
`numberToDigitWords`, `getOrdinalSuffix`, `toOrdinal`, `ordinalToWords`,
`withSuffix`, `toRoman`, `toBase`, `isEven` and `isOdd` take a `bigint`;
`parseNumber`, `parseMoney`, `parsePercentage`, `parseShortNotation`,
`parseLongNotation`, `parseByteSize` and `fromBase(value, radix, { output })`
return one. `moneyToWords(bigint)` reads a whole amount of the major unit.
`numberToWords` and `toLongNotation` keep their cap of
`1000 ** locale.words.scales.length - 1` (999 trillion for every launch
locale), computed exactly — so a custom locale that names quadrillions and
beyond needs a `bigint` to stay exact, and gets one. The ordinal family
narrows a `bigint` to a `number` for the locale's `ordinal` hooks and throws
`RangeError` above `Number.MAX_SAFE_INTEGER` rather than reaching the hook
rounded.

Two rules keep the `bigint` side honest:

- **A `bigint` result must be a whole number.** `"1,234.00"` parses to
  `1234n` and `"2.5M"` to `2500000n`, `"1.5 KB"` to `1536n`; but `"1.5"`,
  `"1.2345K"` and `parsePercentage(…, { asRatio: true, output: 'bigint' })`
  throw `RangeError`, because a `bigint` cannot carry a fraction and
  truncating it silently would be the wrong answer.
- **A parser never hands back an unsafe `number`.** `parseLongNotation` and
  `fromBase` compute exactly whatever the `output`, so when a `number` result
  would exceed `Number.MAX_SAFE_INTEGER` they throw `RangeError` pointing at
  `output: 'bigint'` instead of returning a rounded value.

Deliberately not included: `add`/`subtract`/`multiply`/`divide`/`round` and
`clamp`/`inRange` stay `number`-only — JavaScript already has exact native
`bigint` operators — as do the float-domain statistics and financial
functions; `fractionToWords` and `fromRoman` (range ≤ 3999) are unchanged.
Custom locales are unaffected: `plural`, `ordinal.*` and `words.renderGroup`
keep their `number` signatures and never receive a `bigint`.

### Errors, or empty values

Every function validates its input up front and **throws** — `RangeError`,
`TypeError` or `SyntaxError` — rather than returning `NaN` or `undefined`.
That covers values (`NaN`, `null`, `undefined`, `Infinity`, an unparseable
string, a roman numeral outside 1–3999), option combinations (a thousands
separator equal to the decimal separator) and numeric type (a `bigint` is
never silently converted through a float).

For code rendering values it did not produce, `noThrow` swaps every throw for
the return type's empty value:

```ts
import { setConfig, formatNumber } from 'num-fns';

setConfig({ noThrow: true });

formatNumber(Number.NaN); // ""
formatNumber(null); // ""
formatNumber(Number.POSITIVE_INFINITY); // "infinity"
formatNumber(Number.NEGATIVE_INFINITY, { locale: az }); // "mənfi sonsuzluq"
formatNumber(1234.5); // "1,234.5" — unchanged
```

| Returns | Empty value |
| --- | --- |
| a string | `''`, or the locale's `words.infinity` for `±Infinity` |
| a number | `NaN` (including a parser asked for `{ output: 'bigint' }`) |
| a boolean (`isEven`, `isOdd`, `inRange`) | `false` |
| a list (`mode`, `amortizationSchedule`) | `[]` |
| `getCurrency` | `undefined` |

`noThrow` suppresses *everything*, a mistyped option or an unknown currency
code as readily as bad data, so prefer the per-call option on the calls that
actually need it and leave the global setting alone:

```ts
formatNumber(userInput, { noThrow: true }); // "" rather than a thrown error
formatNumber(userInput); // still throws
```

Every options object accepts `noThrow`, and it wins over the global setting
in both directions. Functions whose parameters are all positional — `add`,
`round`, `clamp`, `isEven`, `toBase`, most of `stats` and `financial` —
follow the global setting only.

### Negative zero, and the magnitude bounds

`-0` is a value, not a rounding artefact: `formatNumber(-0)` is `"-0"`, a
negative amount that rounds away to zero keeps its sign
(`formatNumber(-0.4, { decimals: 0 })` is `"-0"`), `numberToWords(-0.001)` is
`"negative zero"`, and `add`/`subtract`/`multiply`/`divide`/`round` follow the
IEEE 754 sign rules (`multiply(-1, 0)` is `-0`, `add(-1.5, 1.5)` is `0`).
There is no negative zero `bigint`, so the `bigint` paths never produce one.

There is no magnitude limit either. Every finite number formats to its exact
positional digits — `formatNumber(1e21)` is
`"1,000,000,000,000,000,000,000"`, not `"1e+21"` — and arithmetic is exact on
operands of any size, with the single correctly-rounded conversion back to a
`number` as the only lossy step. What a "precise" function will not do is
hand back `Infinity`: a result outside the range of a JavaScript number
throws instead.

### No `Intl`

Nothing in the package touches `Intl`. Separators, rounding modes, grouping
and magnitude handling are all implemented here, so the output is byte-identical
on every runtime and every ICU build, and a snapshot test of it stays true.

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
