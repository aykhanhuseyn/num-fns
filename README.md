# num-fns

Modern internationalized number utility library for JavaScript — like
`date-fns`, but for numbers.

Format and parse numbers, money and percentages; spell numbers out in words;
ordinals, short/long notation and roman numerals. Written in TypeScript, built
as dual ESM/CJS with type declarations, so it works in modern and older
projects alike.

**[Live docs & playground →](https://aykhanhuseyn.github.io/num-fns/)**

> **Status: pre-release.** The package is currently Azerbaijani-only and is
> being generalized into a multi-locale library. `en`, `ru` and `es` are on the
> roadmap — see [`todo.md`](./todo.md). The locale API shown below is the target
> design and is not implemented yet.

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

formatMoney(1234.5, { locale: az, currency: 'AZN' }); // "1 234,50 ₼"
formatMoney(1234.5, { locale: en, currency: 'USD' }); // "$1,234.50"
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
  formatPercentage,
  parsePercentage,
} from 'num-fns';
```

Examples below use the Azerbaijani locale, the only one currently implemented:

```ts
formatNumber(1234567.89, { decimals: 2 }); // "1 234 567,89"
parseNumber('1 234 567,89'); // 1234567.89

numberToWords(1234); // "min iki yüz otuz dörd"
numberToWords(1000000); // "bir milyon"

toRoman(1994); // "MCMXCIV"
fromRoman('MCMXCIV'); // 1994

toShortNotation(2500000); // "2,5 mln"
toLongNotation(1234567); // "1 milyon 234 min 567"
parseShortNotation('2,5 mln'); // 2500000
parseLongNotation('1 milyon 234 min 567'); // 1234567

toOrdinal(3); // "3-cü"
ordinalToWords(3); // "üçüncü"
withSuffix(120, 'kg'); // "120 kg"

formatMoney(1234.5); // "1 234,50 ₼"
parseMoney('1 234,50 ₼'); // 1234.5
moneyToWords(1234.5); // "min iki yüz otuz dörd manat əlli qəpik"

formatPercentage(45.5, { decimals: 1 }); // "45,5%"
parsePercentage('45,5%', { asRatio: true }); // 0.455
```

Every formatter accepts an options object for overriding separators, decimals,
currency, or locale — see the JSDoc on each function for details.

Roman numerals are locale-independent and take no `locale` option.

## Locale support

| Locale | Code | Status |
| --- | --- | --- |
| Azerbaijani | `az` | Implemented |
| English | `en` | Planned |
| Russian | `ru` | Planned |
| Spanish | `es` | Planned |

Adding a locale means implementing one object against a shared conformance test
suite. Contributions welcome — a locale-authoring guide is on the roadmap.

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

## History

This package was previously published-in-progress as `az-number-utils`. It was
renamed to `num-fns` when the scope widened from Azerbaijani-only to a general
internationalized number library.

## License

MIT
