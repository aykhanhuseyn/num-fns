---
"num-fns": minor
---

Accept `bigint` input in every integer-domain function, and return an exact `bigint` from every parser on request.

A JavaScript `number` stops being exact at `Number.MAX_SAFE_INTEGER` (about 9 × 10¹⁵), which is smaller than a 64-bit database id, a file size from `fs.statSync(path, { bigint: true })`, or a token amount in wei. Those values now go through `num-fns` without ever touching a float:

```ts
// Input: number | bigint, handled exactly at any magnitude.
formatNumber(BigInt('1234567890123456789')); // "1,234,567,890,123,456,789"
formatNumber(BigInt(10), { decimals: 2 }); // "10.00" (decimals pads; nothing to round)
formatMoney(BigInt('98765432109876543210'), { currency: 'EUR' }); // "€ 98,765,432,109,876,543,210.00"
numberToWords(BigInt('123456789012345')); // "one hundred twenty-three trillion ..."
toLongNotation(BigInt('999999999999999')); // "999 trillion 999 billion 999 million 999 thousand 999"
toShortNotation(BigInt(1500)); // "1.5K"
toByteSize(fs.statSync(path, { bigint: true }).size); // "1.5 GB"
toOrdinal(BigInt(101)); // "101-st"
toRoman(BigInt(1994)); // "MCMXCIV"
isEven(BigInt('9007199254740993')); // false — a number would have said true

// Output: pass { output: 'bigint' } to any parser.
parseNumber('1,234,567,890,123,456,789', { output: 'bigint' }); // 1234567890123456789n
parseMoney('$ 1,234.00', { output: 'bigint' }); // 1234n
parseShortNotation('2.5M', { output: 'bigint' }); // 2500000n
parseLongNotation('999 trillion 999 billion', { output: 'bigint' }); // 999999000000000n
parseByteSize('1.5 KB', { output: 'bigint' }); // 1536n
fromBase('ffffffffffffffffffff', 16, { output: 'bigint' }); // 1208925819614629174706175n

// The return type follows the option through overloads — no cast needed.
const n = parseNumber('1'); // number
const b = parseNumber('1', { output: 'bigint' }); // bigint
```

**Input.** `formatNumber`, `formatMoney`, `formatPercentage`, `numberToWords`, `moneyToWords`, `toLongNotation`, `toShortNotation`, `toByteSize`, `numberToDigitWords`, `getOrdinalSuffix`, `toOrdinal`, `ordinalToWords`, `withSuffix`, `toRoman`, `toBase`, `isEven` and `isOdd` take `number | bigint`. A `bigint` is chunked, scaled and grouped in integer arithmetic, so every digit survives; `decimals` pads it with zeros; `moneyToWords(bigint)` reads a whole amount of the major unit. `numberToWords` and `toLongNotation` keep their `1000 ** locale.words.scales.length - 1` cap (999 trillion for every launch locale), now computed exactly, so a custom locale that names quadrillions and beyond can be fed a `bigint` and stay exact. The ordinal family narrows a `bigint` to a `number` for the locale's `ordinal` hooks and throws `RangeError` above `Number.MAX_SAFE_INTEGER` rather than reaching the hook rounded.

**Output.** `parseNumber`, `parseMoney`, `parsePercentage`, `parseShortNotation`, `parseLongNotation`, `parseByteSize` and `fromBase(value, radix, { output })` take an `output: 'number' | 'bigint'` option (default `'number'`). With `'bigint'` the parsed value must be a whole number — `"1,234.00"` is `1234n`, `"2.5M"` is `2500000n`, `"1.5 KB"` is `1536n`, but `"1.5"`, `"1.2345K"` and `parsePercentage` with `asRatio: true` throw `RangeError`, because a `bigint` cannot carry a fraction and truncating silently would be exactly the wrong answer the package throws to avoid. Any other `output` value is a `RangeError` too.

**Breaking change** (pre-1.0, so `minor` per semver's `0.x` rule — see `CONTRIBUTING.md`'s "Releasing" section):

- `parseLongNotation` and `fromBase` now compute exactly and throw `RangeError` — with a message pointing at `output: 'bigint'` — when a `number` result would exceed `Number.MAX_SAFE_INTEGER`, instead of silently returning a rounded `number`. Only strings that were already coming back wrong are affected: a long-notation string with an oversized digit group or a custom locale's scales past a trillion, or a base-N string of more than 53 bits.

**Unchanged, deliberately.** `add`/`subtract`/`multiply`/`divide`/`round` and `clamp`/`inRange` still take and return plain numbers — the arithmetic domain's "raw numbers" decision stands, and JavaScript already has exact native `bigint` operators for that. The statistics and financial functions are float-domain and stay `number`. `fractionToWords` and `fromRoman` (whose range ends at 3999) are unchanged. The `Locale` interface is untouched: `plural`, `ordinal.suffix`/`ordinal.words` and `words.renderGroup` keep their `number` signatures, so a custom locale never sees a `bigint` and needs no update. No new root exports — the public surface is the same 51 functions.
