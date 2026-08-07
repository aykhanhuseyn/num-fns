# az-number-utils

Azerbaijani-focused utilities for parsing and formatting numbers, money, and
percentages: number-to-words, roman numerals, short/long notation, and
ordinal suffixes. Written in TypeScript, built with Vite as dual ESM/CJS
output with type declarations, so it works in both modern and older
projects.

## Install

```sh
bun add az-number-utils
# or
npm install az-number-utils
```

## Usage

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
} from 'az-number-utils';

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

Every formatter accepts an options object for overriding separators,
decimals, currency symbol, or locale — see the JSDoc on each function for
details.

## Development

This project uses Bun, TypeScript, and Vite.

```sh
bun install        # install dependencies
bun test            # run the test suite
bun run typecheck    # type-check without emitting
bun run lint         # lint with Biome
bun run build        # build dist/ (ESM + CJS + .d.ts)
```

## License

MIT
