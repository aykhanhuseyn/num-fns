# num-fns

## 0.6.0

### Minor Changes

- [`ee9f4fb`](https://github.com/aykhanhuseyn/num-fns/commit/ee9f4fb874b8332327a931ef32ca43c4d772be15) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Close the `NaN` / `Infinity` / `-0` / min-max edge cases per function

  The per-function edge-case pass turned up four places where the package's own
  throw-on-bad-input rule was not actually being kept:

  - **`null` and `undefined` were silently zero.** The `typeof value ===
'number' && !Number.isFinite(value)` guard let a non-number straight
    through, and `Math.abs(null)` is `0`, so `formatNumber(null)` returned
    `"0"`, `numberToWords(null)` returned `"zero"` and `toOrdinal(null)`
    returned `"null-th"`. Every function taking a `number | bigint` now throws
    `TypeError` for a value that is neither.
  - **`formatNumber` emitted exponent notation at the bounds.** `String(1e21)`
    is `"1e+21"` and `toFixed` has the same cliff, so `formatNumber(1e21)` was
    `"1e+21"` rather than a grouped twenty-two-digit number. The digits now come
    from the value's exact decimal, so every finite number formats positionally
    at any magnitude — `Number.MAX_VALUE` and `5e-324` included — and
    round-trips back through `parseNumber`.
  - **Parsers could return `Infinity`.** `Number("Infinity")` succeeds, so
    `parseNumber("Infinity")` returned `Infinity`; it throws `RangeError` now,
    and so do `parseMoney`, `parsePercentage`, `parseShortNotation` and
    `parseByteSize` through it.
  - **`sum` and `variance` could return `Infinity`.** An accumulation that
    overflows throws `RangeError`, the way `add`/`multiply` already did.

  Also: `formatNumber` validates a negative `decimals` on both input types
  (`toFixed` used to do it by accident on the `number` path), and
  `toLongNotation(-0)` is `"-0"` like the other renderers.

- [`26344dc`](https://github.com/aykhanhuseyn/num-fns/commit/26344dc9fa375e3243ae678435bf6f8b7b0bb735) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Add a package-wide config with a `noThrow` mode, and an infinity word per locale

  `num-fns` has always thrown on bad input rather than returning `NaN`, and that
  is still the default. `setConfig({ noThrow: true })` swaps every throw for the
  return type's empty value, for callers rendering values they do not control:

  ```ts
  import { setConfig, formatNumber } from "num-fns";

  setConfig({ noThrow: true });
  formatNumber(Number.NaN); // ""
  formatNumber(Number.POSITIVE_INFINITY); // "infinity"
  formatNumber(1234.5); // "1,234.5" — unchanged
  ```

  The empty value is `''` for a string, `NaN` for a number, `false` for a
  boolean, `[]` for `mode`/`amortizationSchedule` and `undefined` for
  `getCurrency`. `Infinity` and `-Infinity` are the one case a renderer can say
  something about, so they read as the locale's new `words.infinity`, prefixed
  with `words.negative` when negative. The mode suppresses _every_ error,
  option-combination and configuration mistakes included, so prefer the per-call
  `noThrow` option — every options object now accepts one, and it wins over the
  global setting — and leave the global value `false`.

  New exports: `getConfig`, `setConfig`, `resetConfig`, and the `NumFnsConfig`
  and `NoThrowOptions` types. The public function surface goes from 51 to 54.

  **Breaking for custom locales:** `Locale.words.infinity` is a new required
  field. The five launch locales set it (`az` `sonsuzluq`, `en`/`enGB`
  `infinity`, `ru` `бесконечность`, `es` `infinito`); a locale of your own needs
  one line added.

- [`e49f7eb`](https://github.com/aykhanhuseyn/num-fns/commit/e49f7ebb8549d0b9f6fd2705ef10ac56a3975262) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Treat `-0` as a value instead of scrubbing it

  A negative zero now survives every operation that produces one, reversing the
  "never return `-0`" rule. `formatNumber(-0)` is `"-0"`, `formatNumber(-0.4, {
decimals: 0 })` is `"-0"`, `toShortNotation(-0.4)` is `"-0"`,
  `numberToWords(-0.001)` is `"negative zero"`, `moneyToWords(-0.001)` is
  `"negative zero dollars"`, and `toBase(-0, 2)` is `"-0"` (which `fromBase`
  reads back as `-0`).

  `round` keeps the sign of a value that rounds away to zero (`round(-0.4)` is
  `-0`), and `add`/`subtract`/`multiply`/`divide` follow IEEE 754 for signed
  zeros: `multiply(-1, 0)` and `divide(0, -5)` are `-0`, `add(-0, -0)` is `-0`,
  `add(-1.5, 1.5)` is `0`. A negative value that underflows to zero
  (`divide(-1e-308, 1e308)`) keeps its sign too.

  There is no negative zero `bigint`, so the `bigint` paths are unchanged:
  `formatNumber(BigInt('-0'))` is `"0"` and `fromBase('-0', 2, { output:
'bigint' })` is `0n`.

### Patch Changes

- [`1ad2590`](https://github.com/aykhanhuseyn/num-fns/commit/1ad25900a4b1886dc5bf1a37bc2a717451411940) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Document the closed design decisions

  `todo.md`'s two long-open decisions are settled, and README, CLAUDE.md and
  CONTRIBUTING.md say so:

  - **No `Intl`, anywhere.** `formatNumber` stays self-contained rather than
    delegating to `Intl.NumberFormat`. `Intl` output depends on the runtime's
    ICU data, which would make `formatNumber` the one function whose result a
    consumer cannot pin in a test, and it would only cover the grouping half of
    one function while words, ordinals, notation and roman numerals stayed
    hand-written. This also drops the planned `Intl.NumberFormat` cross-check
    from the test suite — the per-locale separator conventions are pinned by the
    conformance and round-trip property tests instead.
  - **No precision limit on arithmetic operands.** An operand past
    `Number.MAX_SAFE_INTEGER` is read at its shortest decimal like any other,
    the operation runs exactly on `BigInt`, and the only lossy step is the
    single correctly-rounded conversion back to a `number`. What a precise
    function still refuses to do is return `±Infinity`.

- [`cef0daf`](https://github.com/aykhanhuseyn/num-fns/commit/cef0daf4c93a53a31980a083e4412e7cb22ef97b) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Docs-site and tooling fixes (`site/` and `lefthook.yml`, neither part of the published package).

  - The playground's result box rendered a record result through `String(value)`, so the `getCurrency` card showed `[object Object]` instead of the currency it had just looked up. A record now goes through the same table renderer the array-of-records results (`amortizationSchedule`) already used, so `getCurrency("EUR")` shows `code` / `symbol` / `decimals` as `EUR` / `€` / `2`. `numberToWords`' card description also now states how a leading zero in the fraction is read.
  - The pre-commit Biome hook's `glob` did not list `webmanifest`, so `site/public/site.webmanifest` was the one committed file the hook skipped. Biome formats it as JSON and the repo-wide `bun run format:check` in CI does check it, so a reformat of that file passed the commit hook and could only fail later in CI. The glob now covers it.

- [`ceea040`](https://github.com/aykhanhuseyn/num-fns/commit/ceea040cffb5b4c8762450c1e75d59bbdbf505a5) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - `numberToWords` no longer drops a leading zero from the fractional part, so a hundredths value is not read back as a tenths one.

  The fractional part reaches the reader as a plain integer — `splitFixed` rounds to two places and hands back `1` for `.01` and `10` for `.1` — and it was rendered with `locale.words.renderGroup` as-is. That dropped the leading zero: `numberToWords(1.01)` was `"one point one"`, which is exactly how a speaker reads `1.1`, so the two values were indistinguishable in words. `numberToWords(1.005)` inherited the same collision through the rounding.

  The fraction is now padded back to two digits and each leading zero is spoken as `locale.words.zero` before the remainder:

  - `numberToWords(1.01)` is `"one point zero one"`, against `"one point ten"` for `1.1`; `numberToWords(0.09)` is `"zero point zero nine"`.
  - The fix lives in the locale-generic engine, so every locale gets it without a new hook: `{ locale: az }` reads `"bir tam sıfır bir"`, `{ locale: ru }` `"один запятая ноль один"`, `{ locale: es }` `"uno coma cero uno"`.
  - A fraction with no leading zero is untouched — `12.34` is still `"twelve point thirty-four"` and `0.5` still `"zero point fifty"` — as are `bigint` inputs, which have no fractional part at all.

  This changes the string returned for any value whose first fraction digit is zero, including `numberToWords(1.005)` (now `"one point zero one"`). A new locale-agnostic invariant in `locale/conformance.test.ts` pins the hundredths/tenths distinction for every locale.

## 0.5.0

### Minor Changes

- [`eade610`](https://github.com/aykhanhuseyn/num-fns/commit/eade6102638cdefc4b09168ec7a1d918091b1a45) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - `numberToWords`, `moneyToWords`, `toShortNotation` and `toByteSize` now round through the same exact-decimal path as everything else — the last four places that still used `Math.round`/`toFixed` on a float-scaled magnitude.

  - `numberToWords(2.675)` ends in "sixty-eight" and `moneyToWords(2.675)` is "two dollars sixty-eight cents" (both read "sixty-seven" before: `(2.675 - 2) * 100` is `67.49999999999997` in floating point). The fraction is rounded by `round`, so `1.999` carries into "two" as part of the rounding and the magnitude cap is checked after the carry.
  - `toShortNotation(2675000, { decimals: 2 })` is `"2.68M"` and `toByteSize(1005, { base: 1000 })` is `"1.01 KB"` (were `"2.67M"` and `"1 KB"`: the quotient's double sits just below the tie). A `number` and the equal `bigint` now format to the same string on every digit — the property test that used to _allow_ a one-unit disagreement asserts equality.
  - Consequences of the shared path: `decimals` is validated on the `number` path of `toShortNotation`/`toByteSize` too (`{ decimals: 1.5 }` throws `RangeError` instead of being truncated); a negative value that rounds to zero is `"0"` / "zero", never `"-0"` / "negative zero"; a `number` whose scaled value is past 1e21 keeps every digit like a `bigint` does (`toShortNotation(1e300)` is 289 digits and a `T`, not `"1e+288T"`).

  Bundle: `locale/az` and `locale/en-gb` grow by ~0.45 kB because `numberToWords` now pulls in `round`; the root `index` is unchanged (it already had it).

## 0.4.0

### Minor Changes

- [`54c28ad`](https://github.com/aykhanhuseyn/num-fns/commit/54c28ad7e984eff4f6c0559d2c2fca2f5b384e51) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Accept `bigint` input in every integer-domain function, and return an exact `bigint` from every parser on request.

  A JavaScript `number` stops being exact at `Number.MAX_SAFE_INTEGER` (about 9 × 10¹⁵), which is smaller than a 64-bit database id, a file size from `fs.statSync(path, { bigint: true })`, or a token amount in wei. Those values now go through `num-fns` without ever touching a float:

  ```ts
  // Input: number | bigint, handled exactly at any magnitude.
  formatNumber(BigInt("1234567890123456789")); // "1,234,567,890,123,456,789"
  formatNumber(BigInt(10), { decimals: 2 }); // "10.00" (decimals pads; nothing to round)
  formatMoney(BigInt("98765432109876543210"), { currency: "EUR" }); // "€ 98,765,432,109,876,543,210.00"
  numberToWords(BigInt("123456789012345")); // "one hundred twenty-three trillion ..."
  toLongNotation(BigInt("999999999999999")); // "999 trillion 999 billion 999 million 999 thousand 999"
  toShortNotation(BigInt(1500)); // "1.5K"
  toByteSize(fs.statSync(path, { bigint: true }).size); // "1.5 GB"
  toOrdinal(BigInt(101)); // "101-st"
  toRoman(BigInt(1994)); // "MCMXCIV"
  isEven(BigInt("9007199254740993")); // false — a number would have said true

  // Output: pass { output: 'bigint' } to any parser.
  parseNumber("1,234,567,890,123,456,789", { output: "bigint" }); // 1234567890123456789n
  parseMoney("$ 1,234.00", { output: "bigint" }); // 1234n
  parseShortNotation("2.5M", { output: "bigint" }); // 2500000n
  parseLongNotation("999 trillion 999 billion", { output: "bigint" }); // 999999000000000n
  parseByteSize("1.5 KB", { output: "bigint" }); // 1536n
  fromBase("ffffffffffffffffffff", 16, { output: "bigint" }); // 1208925819614629174706175n

  // The return type follows the option through overloads — no cast needed.
  const n = parseNumber("1"); // number
  const b = parseNumber("1", { output: "bigint" }); // bigint
  ```

  **Input.** `formatNumber`, `formatMoney`, `formatPercentage`, `numberToWords`, `moneyToWords`, `toLongNotation`, `toShortNotation`, `toByteSize`, `numberToDigitWords`, `getOrdinalSuffix`, `toOrdinal`, `ordinalToWords`, `withSuffix`, `toRoman`, `toBase`, `isEven` and `isOdd` take `number | bigint`. A `bigint` is chunked, scaled and grouped in integer arithmetic, so every digit survives; `decimals` pads it with zeros; `moneyToWords(bigint)` reads a whole amount of the major unit. `numberToWords` and `toLongNotation` keep their `1000 ** locale.words.scales.length - 1` cap (999 trillion for every launch locale), now computed exactly, so a custom locale that names quadrillions and beyond can be fed a `bigint` and stay exact. The ordinal family narrows a `bigint` to a `number` for the locale's `ordinal` hooks and throws `RangeError` above `Number.MAX_SAFE_INTEGER` rather than reaching the hook rounded.

  **Output.** `parseNumber`, `parseMoney`, `parsePercentage`, `parseShortNotation`, `parseLongNotation`, `parseByteSize` and `fromBase(value, radix, { output })` take an `output: 'number' | 'bigint'` option (default `'number'`). With `'bigint'` the parsed value must be a whole number — `"1,234.00"` is `1234n`, `"2.5M"` is `2500000n`, `"1.5 KB"` is `1536n`, but `"1.5"`, `"1.2345K"` and `parsePercentage` with `asRatio: true` throw `RangeError`, because a `bigint` cannot carry a fraction and truncating silently would be exactly the wrong answer the package throws to avoid. Any other `output` value is a `RangeError` too.

  **Breaking change** (pre-1.0, so `minor` per semver's `0.x` rule — see `CONTRIBUTING.md`'s "Releasing" section):

  - `parseLongNotation` and `fromBase` now compute exactly and throw `RangeError` — with a message pointing at `output: 'bigint'` — when a `number` result would exceed `Number.MAX_SAFE_INTEGER`, instead of silently returning a rounded `number`. Only strings that were already coming back wrong are affected: a long-notation string with an oversized digit group or a custom locale's scales past a trillion, or a base-N string of more than 53 bits.

  **Unchanged, deliberately.** `add`/`subtract`/`multiply`/`divide`/`round` and `clamp`/`inRange` still take and return plain numbers — the arithmetic domain's "raw numbers" decision stands, and JavaScript already has exact native `bigint` operators for that. The statistics and financial functions are float-domain and stay `number`. `fractionToWords` and `fromRoman` (whose range ends at 3999) are unchanged. The `Locale` interface is untouched: `plural`, `ordinal.suffix`/`ordinal.words` and `words.renderGroup` keep their `number` signatures, so a custom locale never sees a `bigint` and needs no update. No new root exports — the public surface is the same 51 functions.

- [`a242e92`](https://github.com/aykhanhuseyn/num-fns/commit/a242e922ebcfa99e1e347d919742afb3f835b019) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Add multi-currency support keyed off ISO 4217 codes.

  `formatMoney`, `parseMoney` and `moneyToWords` take a new `currency` option — `'AZN' | 'USD' | 'EUR' | 'RUB' | 'GBP'` — that defaults to the locale's own currency. The symbol and minor-unit exponent come from a new locale-independent registry (`getCurrency(code)`, the 46th root export); the locale decides which side of the amount the symbol goes and supplies the unit words, in every plural form and grammatical gender the language needs. Every launch locale now carries words for all five currencies:

  ```ts
  formatMoney(9.99, { currency: "EUR" }); // "€ 9.99"
  formatMoney(9.99, { locale: az, currency: "USD" }); // "9,99 $"
  moneyToWords(1.5, { currency: "GBP" }); // "one pound fifty pence"
  moneyToWords(2.02, { locale: ru, currency: "USD" }); // "два доллара два цента"
  moneyToWords(1, { locale: es, currency: "GBP" }); // "una libra"
  ```

  An unknown code, or one the locale has no unit words for, throws `RangeError`. Explicit `symbol`, `symbolPosition`, `majorUnit` and `minorUnit` options still override whatever the code resolves to, so a currency outside the registry remains possible.

  **Breaking changes** (pre-1.0, so `minor` per semver's `0.x` rule — see `CONTRIBUTING.md`'s "Releasing" section):

  - `Locale.currency` is reshaped. The single `symbol`/`major`/`minor` triple is gone; the object is now `{ code, symbolPosition, units }`, where `units` maps each `CurrencyCode` to `{ major, minor }`. Read `az.currency.units.AZN.major.word` instead of `az.currency.major.word`, and `getCurrency(az.currency.code).symbol` instead of `az.currency.symbol`. Custom `Locale` objects must be updated to the new shape (`CurrencyCode` is re-exported from `num-fns/locale` for that).
  - `enGB` defaults to `GBP` rather than `USD`: `formatMoney(1, { locale: enGB })` is now `"£ 1.00"` and `moneyToWords(1, { locale: enGB })` `"one pound"`. It also spells `RUB` as "rouble".

- [`b18129c`](https://github.com/aykhanhuseyn/num-fns/commit/b18129cc1d8cd777d5e26d601ea931aba5fb9e4b) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Add decimal-safe arithmetic: `add`, `subtract`, `multiply`, `divide` and `round`.

  Five new root exports (46 → 51) do arithmetic on plain numbers without the classic floating-point traps. Each operand is taken at its shortest decimal reading — the string `String(0.1)` gives you, which is what you meant by the number — the operation runs exactly on integers, and the result is the closest JavaScript number to the exact answer. Everything goes in and comes out as a plain `number`; there is no decimal type to wrap and unwrap, and no new dependency:

  ```ts
  add(0.1, 0.2); // 0.3   (0.1 + 0.2 is 0.30000000000000004)
  subtract(0.3, 0.1); // 0.2   (0.3 - 0.1 is 0.19999999999999998)
  multiply(1.1, 1.1); // 1.21  (1.1 * 1.1 is 1.2100000000000002)
  divide(0.3, 0.1); // 3     (0.3 / 0.1 is 2.9999999999999996)
  divide(1, 3); // 0.3333333333333333

  round(1.005, 2); // 1.01  ((1.005).toFixed(2) is "1.00")
  round(2.5, 0, "halfEven"); // 2
  round(-2.5, 0, "halfDown"); // -2
  round(-1.21, 1, "floor"); // -1.3
  round(1234, -2); // 1200
  ```

  `round(value, precision = 0, mode = 'halfUp')` takes the same `RoundingMode` values as `formatNumber`'s `roundingMode` option (`'halfUp'`, `'halfDown'`, `'halfEven'`, `'ceil'`, `'floor'`) and accepts a negative `precision` to round to tens, hundreds and so on. It is now the one rounding implementation in the package: `formatNumber`, `formatMoney` and `formatPercentage` all delegate to it, and `formatPercentage`'s `multiplyBy100`/`asRatio` scaling goes through `multiply`/`divide`. `divide` carries the quotient to 25 significant digits, so a terminating quotient is exact and a non-terminating one matches correctly rounding the true quotient.

  All five throw `RangeError` rather than returning `NaN` or `Infinity` — on non-finite input, division by zero, a non-integer `precision`, or a result too large for a JavaScript number — and never return `-0`.

  The long-standing `halfUp` property-test flake in `formatNumber`'s round-trip suite (a `0.000050008...` diff on values like `-268435456.47635`) is gone: the rounding is exact now, and the property measures the round-trip difference with `subtract` instead of float `-`.

  **Breaking changes** (pre-1.0, so `minor` per semver's `0.x` rule — see `CONTRIBUTING.md`'s "Releasing" section):

  - `formatNumber` (and therefore `formatMoney`) rounds decimal-safely in every `roundingMode`. Values that sit on a decimal tie but a hair below it in binary now round the way they are written: `formatNumber(1.005, { decimals: 2 })` is `"1.01"`, where it was `"1.00"` via `toFixed`. Most outputs are unchanged; the ones that differ were the floating-point artefacts.
  - `formatPercentage` scales exactly: `formatPercentage(1.005, { multiplyBy100: true })` is `"101%"`, where it was `"100%"` because `1.005 * 100` is `100.49999999999999` in JavaScript.
  - `formatNumber`, `formatMoney` and `formatPercentage` throw `RangeError` for a non-integer `decimals` (e.g. `decimals: 1.5`), which `toFixed` used to truncate silently.

## 0.3.0

### Minor Changes

- [`cfade24`](https://github.com/aykhanhuseyn/num-fns/commit/cfade2486ba036a23fa384b2f24585d73d62d942) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Reject option combinations that made output unparseable, and make `resolveScaleWord` internal.

  Three pre-1.0 corrections, all of which turn silently-wrong results into thrown errors:

  - `formatNumber` and `parseNumber` now throw `RangeError` when `thousandsSeparator` equals `decimalSeparator`. Previously `parseNumber('0.001', { thousandsSeparator: '.', decimalSeparator: '.' })` stripped both separators and returned `1`. `formatMoney`/`parseMoney` and `formatPercentage`/`parsePercentage` inherit the guard by delegation.
  - `toLongNotation` and `parseLongNotation` now throw `RangeError` when `groupSeparator` is empty or contains a digit. An empty separator produced `"1 million234 thousand"`, which `parseLongNotation` could not read back; a digit-bearing separator merged into the digit groups the same way.
  - `resolveScaleWord` is no longer exported from the package root. It resolves a locale scale entry to a plural form for `numberToWords` and `toLongNotation` and was only ever reachable because the barrel used `export *`; the root surface is now 45 functions. Reach scale words through a locale's `words.scales` instead.

## 0.2.0

### Minor Changes

- Remove eleven Azerbaijani vocabulary constants from the public API. They are module-private in `locale/az.ts` now, reachable through the `az` locale object like every other locale's vocabulary.

  **Breaking change** (this package hasn't hit 1.0 yet — see `CONTRIBUTING.md`'s "Releasing" section for why this is `minor`, not `major`). These names no longer exist on `num-fns`:

  | Removed                       | Was exported from     | Read it as                             |
  | ----------------------------- | --------------------- | -------------------------------------- |
  | `ONES`                        | `number/words.ts`     | `az.words.ones`                        |
  | `TENS`                        | `number/words.ts`     | `az.words.tens`                        |
  | `SCALE_WORDS`                 | `number/words.ts`     | `az.words.scales`                      |
  | `ZERO_WORD`                   | `number/words.ts`     | `az.words.zero`                        |
  | `NEGATIVE_WORD`               | `number/words.ts`     | `az.words.negative`                    |
  | `DECIMAL_WORD`                | `number/words.ts`     | `az.words.decimalConnector`            |
  | `HUNDRED_WORD`                | `number/words.ts`     | `az.words.hundreds`                    |
  | `SHORT_SCALES_AZ`             | `number/notation.ts`  | `az.notation.scales`                   |
  | `AZN_SYMBOL`                  | `shared/constants.ts` | `az.currency.symbol`                   |
  | `DEFAULT_THOUSANDS_SEPARATOR` | `shared/constants.ts` | `az.formatDefaults.thousandsSeparator` |
  | `DEFAULT_DECIMAL_SEPARATOR`   | `shared/constants.ts` | `az.formatDefaults.decimalSeparator`   |

  Every one was Azerbaijani data left behind in a locale-generic module by the locale refactor, and only `locale/az.ts` ever imported them. The two `DEFAULT_*` names were the most misleading: despite the names they held `' '` and `','`, which are Azerbaijani conventions, not the `en` defaults (`','` and `'.'`) that every function actually falls back to.

  `src/shared/constants.ts` is gone with them, and the package root's pinned export surface drops from 57 names to 46 — all of which are now functions.

  No behavior changes: `az`'s output is byte-identical, and the notation table it derived from `SHORT_SCALES_AZ` is written out literally, matching how every other locale declares it.

- `LocaleCurrencyUnit` now takes an optional `gender` field (`'masculine' | 'feminine' | 'neuter'`), threaded into `moneyToWords`'s call to `numberToWords` when spelling the major and minor amounts. Major and minor units can declare different genders — real payoff for Russian, whose `рубль` (major) is masculine but `копейка` (minor) is feminine.

  Fixes a pre-existing Russian bug: `moneyToWords` always spelled the minor amount masculine regardless of the unit it named, so `1.01` read «один рубль **один** копейка» — ungrammatical, since «копейка» takes «одна»/«две». `ru.currency.minor` now declares `gender: 'feminine'` (and `ru.currency.major` explicitly declares `gender: 'masculine'`, matching the existing default), so:

  - `1.01` -> «один рубль **одна** копейка»
  - `2.02` -> «два рубля **две** копейки»
  - `21.21` -> «двадцать один рубль двадцать **одна** копейка»

  `es.currency`'s `euro`/`céntimo` are both masculine — set explicitly for the same self-documenting reason, with no change in output. The field is optional and omitted for `az`/`en`, whose locales don't distinguish grammatical gender (`numberToWords` throws if a gender were passed to them); their `moneyToWords` output is unchanged.

- en and enGB now read decimals with "point" (12.34 → "twelve point thirty-four"; previously a bare space: "twelve thirty-four").

- Add the `enGB` locale (`num-fns/locale/en-gb`), British English cardinal/
  ordinal/fraction words alongside `en` (en-US). Same vocabulary, separators,
  currency and short-scale notation as `en` — the only difference is the
  British "and" convention: `"one hundred and one"`, `"one thousand and one"`,
  `"two million and five"`. `fractionToWords` is supported for `enGB` too
  (`"one half"`, `"one third"`, ...).

- Fixed two Spanish (`es`) linguistics gaps tracked in `todo.md` §2.

  **Compound round-scale ordinals.** `ordinalToWords`/`toOrdinal`'s `es`
  implementation ordinalizes every recognized token of a compound number, which
  is correct for most values but not for a round multiple of a scale word
  (`mil`/`millón(es)`/`millardo(s)`/`billón(es)`) — ordinalizing each token
  independently produced a disagreeing pair of words instead of RAE's
  idiomatic fused ordinal:

  ```ts
  ordinalToWords(2000, { locale: es }); // before: "segundo milésimo"
  ordinalToWords(2000, { locale: es }); // after:  "dosmilésimo"

  ordinalToWords(100000, { locale: es }); // before: "centésimo milésimo"
  ordinalToWords(100000, { locale: es }); // after:  "cienmilésimo"

  ordinalToWords(1000000, { locale: es }); // before: "un millonésimo"
  ordinalToWords(1000000, { locale: es }); // after:  "millonésimo"

  ordinalToWords(21000, { locale: es });
  // before: "veintiún milésimo"
  // after:  "veintiunmilésimo"

  ordinalToWords(250000, { locale: es });
  // before: "doscientos quincuagésimo milésimo"
  // after:  "doscientoscincuentamilésimo"
  ```

  Only the number's _final_ scale chunk fuses: its multiplier cardinal —
  apocopated the same way `es`'s cardinal composer already apocopates it before
  a scale word ("veintiún mil"), with the apocope's written accent dropped once
  it's no longer word-final ("veintiunmilésimo", not "veintiúnmilésimo") —
  attaches directly to that scale's ordinal stem, and a multiplier of exactly 1
  is omitted entirely (`1e9` → "millardésimo", not "unmillardésimo"). Any chunk
  above the fused one stays in ordinary cardinal form: `2003000` reads "dos
  millones tresmilésimo". A multiplier that itself needs the "y" connector
  ("treinta y uno" before "mil") has no attested single-word RAE fusion, so
  those numbers (e.g. `31000`) fall back to the pre-existing per-token
  behavior rather than inventing an unattested spelling. A number that doesn't
  end in a scale word is unaffected: `ordinalToWords(2001, { locale: es })`
  still reads "segundo milésimo primero".

  **Decimal connector.** `es` now sets `words.decimalConnector = 'coma'`, RAE's
  standard reading of the decimal point, so `numberToWords` reads decimals the
  way `az`'s `'tam'` and `ru`'s `'запятая'` already do instead of joining the
  integer and fractional parts with a bare space:

  ```ts
  numberToWords(12.34, { locale: es }); // before: "doce treinta y cuatro"
  numberToWords(12.34, { locale: es }); // after:  "doce coma treinta y cuatro"

  numberToWords(0.5, { locale: es }); // after: "cero coma cincuenta"
  numberToWords(-3.5, { locale: es }); // after: "menos tres coma cincuenta"
  ```

  The fraction group's grammatical-gender agreement is unaffected — only the
  connector between the two groups changed: `numberToWords(0.21, { locale: es,
gender: 'feminine' })` now reads "cero coma veintiuna" (previously "cero
  veintiuna").

- `numberToWords` now takes a `gender` option (`'masculine' | 'feminine' | 'neuter'`) for locales whose cardinal words inflect by grammatical gender. Each locale declares which genders its words distinguish (`Locale.words.genders` — `ru` all three, `es` masculine/feminine, `az`/`en` none) and its default (`Locale.words.defaultGender`, `'masculine'` for `ru`/`es`), so output is unchanged when the option is omitted; a gender the locale doesn't distinguish throws a `RangeError` instead of being silently ignored.

  The requested gender agrees with the noun being counted, so it applies to the trailing units group and the decimal-fraction group: Russian inflects a trailing «один»/«два» (`одна`, `одно`, `две`), Spanish inflects `uno`/`veintiuno` and the `-cientos` hundreds (`una`, `veintiuna`, `doscientas`). Scale-bound groups keep agreeing with their own scale noun (`одна тысяча` regardless of the requested gender; `millón` and above stay masculine), except Spanish's gender-transparent `mil`, which passes agreement through (`doscientas mil`) while keeping the RAE apocope (`doscientas treinta y un mil`).

  Also fixes a pre-existing Spanish bug: 21 000 read `veintiuno mil` and now correctly apocopates to `veintiún mil`.

- Fixed two Russian (`ru`) linguistics gaps tracked in `todo.md` §2.

  **Compound round-scale ordinals.** `ordinalToWords`/`toOrdinal`'s `ru`
  implementation used to leave a round thousand/million/billion/trillion's
  multiplier as a separate cardinal word in front of an ordinalized scale word,
  which isn't grammatically correct Russian:

  ```ts
  ordinalToWords(2000, { locale: ru }); // before: "две тысячный"
  ordinalToWords(2000, { locale: ru }); // after:  "двухтысячный"

  ordinalToWords(25000, { locale: ru }); // before: "двадцать пять тысячный"
  ordinalToWords(25000, { locale: ru }); // after:  "двадцатипятитысячный"

  ordinalToWords(2500000, { locale: ru });
  // before: "два миллиона пятьсот тысячный"
  // after:  "два миллиона пятисоттысячный"
  ```

  The multiplier now fuses into a single compound word — its combining
  ("genitive-like") form plus the scale ordinal stem (`тысячный`/`миллионный`/
  `миллиардный`/`триллионный`) — while any higher-magnitude chunks before it
  stay as ordinary cardinal words. A reading that doesn't end in a scale word is
  unaffected: `ordinalToWords(2001, { locale: ru })` still reads "две тысячи
  первый", and `ordinalToWords(21, { locale: ru })` still reads "двадцать
  первый".

  **Decimal connector.** `ru` now sets `words.decimalConnector = 'запятая'`,
  the standard spoken way of naming the decimal comma, so `numberToWords`
  reads decimals the way `az`'s `'tam'` already did instead of joining the
  integer and fractional parts with a bare space:

  ```ts
  numberToWords(12.34, { locale: ru }); // before: "двенадцать тридцать четыре"
  numberToWords(12.34, { locale: ru }); // after:  "двенадцать запятая тридцать четыре"

  numberToWords(0.5, { locale: ru }); // after: "ноль запятая пятьдесят"
  numberToWords(-3.7, { locale: ru }); // after: "минус три запятая семьдесят"
  ```

- Thread a `locale` option through every public function with locale-dependent behavior (`numberToWords`, `toOrdinal`/`ordinalToWords`/`getOrdinalSuffix`, `formatNumber`/`parseNumber`, `formatMoney`/`parseMoney`/`moneyToWords`, `formatPercentage`/`parsePercentage`, `toShortNotation`/`parseShortNotation`/`toLongNotation`/`parseLongNotation`, `numberToDigitWords`, and `fractionToWords`), with real cardinal/ordinal/notation vocabulary for all four launch locales (`az`, `en`, `ru`, `es`).

  **Breaking changes** (this package hasn't hit 1.0 yet — see `CONTRIBUTING.md`'s "Releasing" section for why this is `minor`, not `major`):

  - **The default locale is now `en`, not the previous implicit Azerbaijani behavior.** Callers that want the old behavior must now pass `{ locale: az }` explicitly (`import { az } from 'num-fns/locale'`).
  - `toOrdinal`'s separator moved from a positional second parameter to its options object: `toOrdinal(3, { separator: '-' })` instead of `toOrdinal(3, '-')`.
  - `toShortNotation`'s `locale` option was a bare `'az' | 'en'` string; it's now a full `Locale` object (`{ locale: az }` instead of `{ locale: 'az' }`).

  `fractionToWords` only has real fraction-noun vocabulary for `az` and `en` — `ru`/`es` throw a `RangeError` rather than guess at linguistically risky vocabulary (Russian fraction nouns need feminine forms distinct from their ordinal adjectives; Spanish's "tercio" diverges from its ordinal "tercero"). Tracked as follow-up in `todo.md` §2.

### Patch Changes

- Confirm the GitHub repo rename from `az-number-utils` to `num-fns` (§0 of `todo.md`) — verified `github.com/aykhanhuseyn/num-fns` resolves via `git ls-remote` and the old `az-number-utils` URL redirects to the same commits, so the rename task is fully complete.

- Harden the test and release pipeline: a 100%-per-file coverage gate
  (`bun run test:coverage`, wired into CI in place of `bun test`), `fast-check`
  round-trip property tests for every format/parse pair across all four locales,
  and a consumer smoke test (`bun run check:smoke`) that installs the packed
  tarball into real ESM and CJS projects, executes them, and typechecks the
  shipped declarations under `moduleResolution: nodenext`. CI now runs those
  fixtures across Node 18/20/22/24 plus macOS and Windows.

  `engines.node` moves from `>=14` to `>=18`. Nothing in the build requires it —
  the output still targets es2018 — but 14 and 16 are long EOL and cannot be
  tested on current CI runners, so the package no longer claims support it
  cannot verify.

  No runtime behavior changes. The only source edit is internal: `locale/az.ts`'s
  two duplicate vowel-harmony scans are now one shared helper, which keeps the
  same thrown `SyntaxError` messages.

- Fix type resolution for CommonJS and `node16`/`nodenext` consumers. The emitted declarations carried extensionless relative specifiers (`export * from './arithmetic/clamp'`), which Node-style TypeScript resolution rejects, and only `.d.ts` files were shipped — so with `"type": "module"` every `exports` entry handed ESM types to consumers loading the `.cjs` build (attw's `FalseESM`). A new post-build step, `scripts/fix-dist-types.ts`, adds explicit extensions and emits a `.d.cts` twin of every declaration, and each `exports` entry now carries per-condition `types` (`import` → `.d.ts`, `require` → `.d.cts`). Bundler-based setups were unaffected and stay unchanged; `attw` and `publint` now pass, and both are enforced in CI and before publish by the new `bun run check:pack`.

- Make the `./locale` and `./locale/{az,en,ru,es}` subpaths resolvable for
  consumers on legacy TypeScript module resolution (`moduleResolution: node`/
  `node10`, still the default for CommonJS projects on TypeScript 5.x). Those
  resolvers cannot read the `exports` map at all, so importing
  `num-fns/locale/az` failed with `TS2307 Cannot find module` even though the
  declarations were right there in the tarball; a `typesVersions` map now points
  each subpath at its `.d.ts`.

  With that in place `attw` runs under its default `strict` profile instead of
  `--profile node16`, so no resolution mode is skipped any more, and a
  `moduleResolution: node10` consumer fixture is part of `bun run check:smoke`.

- Add `scripts/new-function.ts`, run via `bun run new:function <directory> <functionName>`. Scaffolds a new function's `.ts` file, its colocated `.test.ts`, and the `export * from` line in `src/index.ts` (inserted at the correct alphabetical position). CONTRIBUTING.md's "How to add a new function" now leads with this as step 0.

- Add Renovate config (`renovate.json`) for automated dependency updates, tuned for `bunfig.toml`'s `install.exact = true` (bumps pinned versions in place rather than widening to ranges). Groups lockstep tool pairs (Biome, Changesets, commitlint, Vite + vite-plugin-dts) and requires manual dashboard approval before bumping the pinned `typescript` prerelease line.

- Restore `cardinalToOrdinalWords`, a public export that was unintentionally dropped from `number/suffix.ts` during the locale-threading work (see the pending "Thread a `locale` option through every public function" changeset). It's now a thin wrapper around `locale.ordinal.words`, taking an `OrdinalOptions` (`{ locale }`) like the rest of the ordinal family, and defaults to `en`.

  Also fixes the docs playground (`site/`, not part of the published package): `toShortNotation`/`parseShortNotation`'s locale field was still passing a raw `'az' | 'en'` string where the real function now requires a `Locale` object, and `toOrdinal`'s `separator` field was still wired as a positional argument after that function's separator moved into its options object. Every example whose function accepts `options.locale` now has a live locale picker.

- Add a `size-limit` check (`bun run size`), wired into CI after the build step. Tracks the full `dist/index.js` surface, the `dist/locale/index.js` barrel, and each of the `az`/`en`/`ru`/`es` locale subpaths individually — the per-locale entries double as the bundle-size evidence that importing one locale doesn't pull in the other three.

## 0.2.0-alpha.1

### Minor Changes

- `numberToWords` now takes a `gender` option (`'masculine' | 'feminine' | 'neuter'`) for locales whose cardinal words inflect by grammatical gender. Each locale declares which genders its words distinguish (`Locale.words.genders` — `ru` all three, `es` masculine/feminine, `az`/`en` none) and its default (`Locale.words.defaultGender`, `'masculine'` for `ru`/`es`), so output is unchanged when the option is omitted; a gender the locale doesn't distinguish throws a `RangeError` instead of being silently ignored.

  The requested gender agrees with the noun being counted, so it applies to the trailing units group and the decimal-fraction group: Russian inflects a trailing «один»/«два» (`одна`, `одно`, `две`), Spanish inflects `uno`/`veintiuno` and the `-cientos` hundreds (`una`, `veintiuna`, `doscientas`). Scale-bound groups keep agreeing with their own scale noun (`одна тысяча` regardless of the requested gender; `millón` and above stay masculine), except Spanish's gender-transparent `mil`, which passes agreement through (`doscientas mil`) while keeping the RAE apocope (`doscientas treinta y un mil`).

  Also fixes a pre-existing Spanish bug: 21 000 read `veintiuno mil` and now correctly apocopates to `veintiún mil`.

### Patch Changes

- Harden the test and release pipeline: a 100%-per-file coverage gate
  (`bun run test:coverage`, wired into CI in place of `bun test`), `fast-check`
  round-trip property tests for every format/parse pair across all four locales,
  and a consumer smoke test (`bun run check:smoke`) that installs the packed
  tarball into real ESM and CJS projects, executes them, and typechecks the
  shipped declarations under `moduleResolution: nodenext`. CI now runs those
  fixtures across Node 18/20/22/24 plus macOS and Windows.

  `engines.node` moves from `>=14` to `>=18`. Nothing in the build requires it —
  the output still targets es2018 — but 14 and 16 are long EOL and cannot be
  tested on current CI runners, so the package no longer claims support it
  cannot verify.

  No runtime behavior changes. The only source edit is internal: `locale/az.ts`'s
  two duplicate vowel-harmony scans are now one shared helper, which keeps the
  same thrown `SyntaxError` messages.

- Fix type resolution for CommonJS and `node16`/`nodenext` consumers. The emitted declarations carried extensionless relative specifiers (`export * from './arithmetic/clamp'`), which Node-style TypeScript resolution rejects, and only `.d.ts` files were shipped — so with `"type": "module"` every `exports` entry handed ESM types to consumers loading the `.cjs` build (attw's `FalseESM`). A new post-build step, `scripts/fix-dist-types.ts`, adds explicit extensions and emits a `.d.cts` twin of every declaration, and each `exports` entry now carries per-condition `types` (`import` → `.d.ts`, `require` → `.d.cts`). Bundler-based setups were unaffected and stay unchanged; `attw` and `publint` now pass, and both are enforced in CI and before publish by the new `bun run check:pack`.

- Make the `./locale` and `./locale/{az,en,ru,es}` subpaths resolvable for
  consumers on legacy TypeScript module resolution (`moduleResolution: node`/
  `node10`, still the default for CommonJS projects on TypeScript 5.x). Those
  resolvers cannot read the `exports` map at all, so importing
  `num-fns/locale/az` failed with `TS2307 Cannot find module` even though the
  declarations were right there in the tarball; a `typesVersions` map now points
  each subpath at its `.d.ts`.

  With that in place `attw` runs under its default `strict` profile instead of
  `--profile node16`, so no resolution mode is skipped any more, and a
  `moduleResolution: node10` consumer fixture is part of `bun run check:smoke`.

## 0.2.0-alpha.0

### Minor Changes

- [`bbb7674`](https://github.com/aykhanhuseyn/num-fns/commit/bbb7674aa017146f55d9d9868347ee11c49724a4) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Thread a `locale` option through every public function with locale-dependent behavior (`numberToWords`, `toOrdinal`/`ordinalToWords`/`getOrdinalSuffix`, `formatNumber`/`parseNumber`, `formatMoney`/`parseMoney`/`moneyToWords`, `formatPercentage`/`parsePercentage`, `toShortNotation`/`parseShortNotation`/`toLongNotation`/`parseLongNotation`, `numberToDigitWords`, and `fractionToWords`), with real cardinal/ordinal/notation vocabulary for all four launch locales (`az`, `en`, `ru`, `es`).

  **Breaking changes** (this package hasn't hit 1.0 yet — see `CONTRIBUTING.md`'s "Releasing" section for why this is `minor`, not `major`):

  - **The default locale is now `en`, not the previous implicit Azerbaijani behavior.** Callers that want the old behavior must now pass `{ locale: az }` explicitly (`import { az } from 'num-fns/locale'`).
  - `toOrdinal`'s separator moved from a positional second parameter to its options object: `toOrdinal(3, { separator: '-' })` instead of `toOrdinal(3, '-')`.
  - `toShortNotation`'s `locale` option was a bare `'az' | 'en'` string; it's now a full `Locale` object (`{ locale: az }` instead of `{ locale: 'az' }`).

  `fractionToWords` only has real fraction-noun vocabulary for `az` and `en` — `ru`/`es` throw a `RangeError` rather than guess at linguistically risky vocabulary (Russian fraction nouns need feminine forms distinct from their ordinal adjectives; Spanish's "tercio" diverges from its ordinal "tercero"). Tracked as follow-up in `todo.md` §2.

### Patch Changes

- [`d1f657b`](https://github.com/aykhanhuseyn/num-fns/commit/d1f657b569462cdb2c9361deaa84a6d1d3972bf3) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Confirm the GitHub repo rename from `az-number-utils` to `num-fns` (§0 of `todo.md`) — verified `github.com/aykhanhuseyn/num-fns` resolves via `git ls-remote` and the old `az-number-utils` URL redirects to the same commits, so the rename task is fully complete.

- [`b8e8696`](https://github.com/aykhanhuseyn/num-fns/commit/b8e86968c7dd99a4d3bdd9e24108b66dfb8d826d) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Add `scripts/new-function.ts`, run via `bun run new:function <directory> <functionName>`. Scaffolds a new function's `.ts` file, its colocated `.test.ts`, and the `export * from` line in `src/index.ts` (inserted at the correct alphabetical position). CONTRIBUTING.md's "How to add a new function" now leads with this as step 0.

- [`b8e8696`](https://github.com/aykhanhuseyn/num-fns/commit/b8e86968c7dd99a4d3bdd9e24108b66dfb8d826d) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Add Renovate config (`renovate.json`) for automated dependency updates, tuned for `bunfig.toml`'s `install.exact = true` (bumps pinned versions in place rather than widening to ranges). Groups lockstep tool pairs (Biome, Changesets, commitlint, Vite + vite-plugin-dts) and requires manual dashboard approval before bumping the pinned `typescript` prerelease line.

- [`bbb7674`](https://github.com/aykhanhuseyn/num-fns/commit/bbb7674aa017146f55d9d9868347ee11c49724a4) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Restore `cardinalToOrdinalWords`, a public export that was unintentionally dropped from `number/suffix.ts` during the locale-threading work (see the pending "Thread a `locale` option through every public function" changeset). It's now a thin wrapper around `locale.ordinal.words`, taking an `OrdinalOptions` (`{ locale }`) like the rest of the ordinal family, and defaults to `en`.

  Also fixes the docs playground (`site/`, not part of the published package): `toShortNotation`/`parseShortNotation`'s locale field was still passing a raw `'az' | 'en'` string where the real function now requires a `Locale` object, and `toOrdinal`'s `separator` field was still wired as a positional argument after that function's separator moved into its options object. Every example whose function accepts `options.locale` now has a live locale picker.

- [`b8e8696`](https://github.com/aykhanhuseyn/num-fns/commit/b8e86968c7dd99a4d3bdd9e24108b66dfb8d826d) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Add a `size-limit` check (`bun run size`), wired into CI after the build step. Tracks the full `dist/index.js` surface, the `dist/locale/index.js` barrel, and each of the `az`/`en`/`ru`/`es` locale subpaths individually — the per-locale entries double as the bundle-size evidence that importing one locale doesn't pull in the other three.
