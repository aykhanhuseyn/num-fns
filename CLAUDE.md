# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this package is

`num-fns` is an internationalized number utility library — `date-fns`, but for numbers only. It formats and parses numbers, money and percentages, spells numbers out in words, and handles ordinals, short/long notation and roman numerals.

It was renamed from `az-number-utils`, and the locale refactor (`todo.md` §1) is largely done: `date-fns`-style locale objects live in `num-fns/locale` and are passed per call (`numberToWords(1234, { locale: ru })`), with `az`, `en`, `ru` and `es` as the launch locales. **The default locale is `en`, not `az`** — this was an explicit, intentional breaking change (`todo.md` §1's "default locale" decision, 2026-08-09), landed 2026-08-18 alongside the locale-threading itself. Callers that want the pre-refactor behavior pass `{ locale: az }` explicitly; `az` remains fully supported and is the locale every other locale's algorithm is checked against for regressions (`locale/az.test.ts`).

Threaded so far: `numberToWords`, `toOrdinal`/`ordinalToWords`/`getOrdinalSuffix`, `formatNumber`/`parseNumber`, `formatMoney`/`parseMoney`/`moneyToWords`, `formatPercentage`/`parsePercentage`, `toShortNotation`/`parseShortNotation`/`toLongNotation`/`parseLongNotation`, and `numberToDigitWords`. `fractionToWords` takes a `locale` option too, but only `az` and `en` have real fraction-word vocabulary — `ru`/`es` throw rather than guess (see `number/fraction.ts`'s doc comment). `toRoman`/`fromRoman` and `toByteSize`/`parseByteSize` are deliberately locale-independent and don't take the option; financial/stats/arithmetic/utils functions don't either, per `todo.md` §4's "raw numbers" decision.

The pre-existing `locale: 'az' | 'en'` string option on `toShortNotation` has been folded into the full `Locale` object system described above — it now takes a `Locale`, not a bare string.

## Commands

Package manager is Bun.

```sh
bun install                # install dependencies
bun test                   # run the full test suite (bun:test, colocated *.test.ts)
bun test src/number/words.test.ts   # run a single test file
bun test -t "numberToWords"         # run tests matching a name pattern
bun run typecheck          # tsc --noEmit, gate before publishing
bun run lint               # biome lint . (biome.json)
bun run lint:fix           # biome lint --write .
bun run format              # biome format --write .
bun run format:check        # biome format .
bun run check                # biome check . (lint + format in one pass)
bun run check:pack           # attw + publint against a packed tarball (run after build)
bun run build               # vite build -> dist/ (ESM + CJS + per-module .d.ts/.d.cts)
bun run dev                 # vite build --watch
```

Linting and formatting are handled by a single tool, Biome (`biome.json`), not ESLint/Prettier.

`prepublishOnly` runs `check`, the tests, `build`, and finally `check:pack` — that's the full gate before `npm publish`. `check:pack` runs [`attw`](https://github.com/arethetypeswrong/arethetypeswrong.github.io) (`--profile node16`, so the legacy `node10` resolution row is skipped) and `publint --strict` against a packed tarball; it does **not** build, so it needs a `bun run build` ahead of it (both `ci.yml` and `release.yml` order it that way). `check` itself stays build-free and fast.

`bunfig.toml` sets `install.exact = true`, so `bun add`/`bun install` always pin exact versions in `package.json` (no `^`/`~` ranges) — keep that in mind when adding a new dependency.

## Architecture

Each unit (number, money, percentage) has its own directory under `src/`, with a single `format.ts` (or, for the `number/` directory, one file per concern) exporting a `formatX`/`parseX` pair. Everything is re-exported flat from `src/index.ts` — there is no default export and no namespacing, so `formatMoney`, `numberToWords`, `toRoman`, etc. are all imported directly from the package root.

`src/arithmetic/` and `src/utils/` (added 2026-08-09, per the `todo.md` §3 note that these new domains can land as top-level directories regardless of the still-open `format/`+`parse/` split question) follow the same one-file-per-function convention but hold self-contained helpers with no locale dependency, rather than a `formatX`/`parseX` pair per domain.

- `src/number/format.ts` — `formatNumber` / `parseNumber`, the base formatter every other formatter (money, percentage) delegates to for grouping digits and joining the fractional part. Defaults come from `options.locale.formatDefaults` (`en`: comma thousands separator, period decimal separator); an explicit `thousandsSeparator`/`decimalSeparator` always wins.
- `src/number/words.ts` — `numberToWords`, the locale-generic word-composition engine every locale's cardinal reading runs through. Groups a number into base-1000 chunks, renders each chunk's own 0-999 reading via `locale.words.renderGroup` (locale-owned: hyphenation for `en`, the veinti-contraction and "y" for `es`, gender-neutral masculine forms for `ru`, the original hardcoded logic for `az`), resolves each chunk's scale word via `locale.plural` + `locale.words.scales`, and joins chunks via `locale.words.compose` (locale-owned: dropping "bir" before Azerbaijani "min", Russian gender agreement, Spanish "cien"/apocopation). `az`'s `renderGroup`/`compose` are verified byte-identical to the pre-refactor hardcoded implementation (`locale/az.test.ts`, `number/words.test.ts`). `ONES`/`TENS`/`SCALE_WORDS`/etc. still live here (not moved into `locale/az.ts`) since `number/digits.ts`'s legacy consumers and `locale/az.ts` itself both reuse them.
- `src/number/suffix.ts` — `getOrdinalSuffix` / `ordinalToWords` / `toOrdinal` delegate to `locale.ordinal.suffix`/`locale.ordinal.words`, which each locale implements itself (Azerbaijani vowel harmony lives in `locale/az.ts` now, not here — see that file's doc comment for why it moved). `toOrdinal`'s separator is part of its options object now, not a positional second parameter, to make room for `locale` alongside it.
- `src/number/notation.ts` — `toShortNotation`/`parseShortNotation` (scaled abbreviation, e.g. `"2.5M"` default, or `"2,5 mln"` with `{ locale: az }`) and `toLongNotation`/`parseLongNotation` (digit groups paired with scale words, e.g. `"1 million 234 thousand 567"`), both reading `locale.notation.scales`/`locale.words.scales`. Distinct from `numberToWords`: notation functions keep digits and only localize the scale word, they don't spell every number out. `toShortNotation`'s `locale` option used to be a bare `'az' | 'en'` string, unrelated to the `Locale` objects; it's now a real `Locale`.
- `src/number/roman.ts` — standard `toRoman` / `fromRoman`, integers 1–3999 only, self-contained (no dependency on the words/notation modules, and no `locale` option — roman numerals are locale-independent).
- `src/number/digits.ts` — `numberToDigitWords`, digit-by-digit reading (phone numbers, codes), reads `locale.words.zero`/`ones`/`negative`.
- `src/number/fraction.ts` — `fractionToWords`, only `az` and `en` implemented (see the module's doc comment for why `ru`/`es` throw instead of guessing at fraction-noun vocabulary). `en`'s composer lives in this module rather than as a `Locale.fractions` hook because it needs `numberToWords`, and `en` can't import back from `number/` without a cycle (see `Locale.fractions`'s doc comment in `locale/types.ts`).
- `src/money/format.ts`, `src/percentage/format.ts` — thin wrappers around `formatNumber`/`parseNumber` that add a currency symbol or `%` sign. Money's symbol/position/separators default from `options.locale.currency`/`formatDefaults` (`en`: `$` before the amount).
- `src/money/words.ts` — `moneyToWords`, resolves the major/minor unit word for the amount's plural category via `locale.plural` + `locale.currency.major`/`minor`'s `plurals` map (real payoff for `ru`: `"один рубль"`/`"два рубля"`/`"пять рублей"` come out correct without the caller doing anything).
- `src/shared/types.ts` — shared option interfaces; every one that has a locale-dependent default now carries an optional `locale?: Locale` field (defaulting to `en` at the call site, not here — this file only declares the shape).
- `src/shared/constants.ts` — `DEFAULT_THOUSANDS_SEPARATOR`/`DEFAULT_DECIMAL_SEPARATOR`/`AZN_SYMBOL`, still used by `locale/az.ts` to build `az.formatDefaults`/`az.currency` (the values themselves didn't move, `az.ts` just also exposes them as `Locale` fields now).
- `src/locale/types.ts` — the `Locale` interface itself. `LocaleWords.renderGroup` (a locale's own 0-999 word composer) and `LocaleWords.decimalConnector` (the integer/fraction joiner, `az`'s `'tam'` — split out from the overloaded `and` field, which is now solely the intra-group tens+ones connector, e.g. Spanish `'y'`) were added as part of the locale-threading work; see their doc comments for why.
- `src/arithmetic/clamp.ts`, `src/arithmetic/in-range.ts` — `clamp` and `inRange`, both inclusive `[min, max]`, both throwing `RangeError` on non-finite input or `min > max`. First functions in the `src/arithmetic/` domain; `add`/`subtract`/`multiply`/`divide`/`round` are still pending on the decimal-safe-representation and rounding-mode decisions in `todo.md` §1/§4.
- `src/utils/base.ts` — `toBase`/`fromBase`, arbitrary-radix (2–36) conversion, distinct from the locale digit-system conversion planned in `todo.md` §1 (Latin ↔ Arabic-Indic *within* base 10 — this is base-10 ↔ base-N).
- `src/utils/predicates.ts` — `isEven`/`isOdd`, throwing `TypeError` for non-integers. `isInteger` was deliberately not added — it would just rename `Number.isInteger`.

All public functions validate input up front and throw (`RangeError`/`TypeError`/`SyntaxError`) rather than returning `NaN`/`undefined` on bad input (non-finite numbers, out-of-range roman numerals, unparseable strings).

### Build output

`vite.config.ts` builds `src/index.ts` in library mode to both `dist/index.js` (ESM) and `dist/index.cjs` (CJS), targeting `es2018` for compatibility with older consumers, with `vite-plugin-dts` emitting per-module `.d.ts` files (not rolled up into one file — rollup-based type bundling pulls in `@microsoft/api-extractor`, which was unreliable in this environment, so `rollupTypes` is intentionally left off). `build.emptyOutDir` is set to `false`; the `dist/` directory is not cleaned before each build.

`vite-plugin-dts` emits extensionless relative specifiers (`export * from './arithmetic/clamp'`), which `node16`/`nodenext` resolution rejects, and emits only `.d.ts` files — which, with `"type": "module"`, means CJS consumers of `dist/index.cjs` were handed ESM types (attw's `FalseESM`). `scripts/fix-dist-types.ts` fixes both: it rewrites each `.d.ts` in place with explicit `.js` extensions and writes a `.d.cts` twin with `.cjs` extensions, so `exports[...].require.types` points at real CJS declarations. It is idempotent, which matters because `emptyOutDir` is `false`, and it throws rather than guessing when a specifier matches neither `<base>.d.ts` nor `<base>/index.d.ts` (a stale declaration from a deleted module is the usual cause — remove `dist/` and rebuild).

It is invoked from the dts plugin's `afterBuild` hook in `vite.config.ts`, not as a separate step chained onto `build`, so `vite build --watch` (`bun run dev`) produces correct declarations too. Running the file directly (`bun scripts/fix-dist-types.ts`) is the manual escape hatch.

Every `exports` entry therefore has per-condition `types` — `import` → `.d.ts`, `require` → `.d.cts` — and `bun run check:pack` (attw `--profile node16` + `publint --strict`) is the regression test. Legacy `node10` resolution is deliberately out of scope; it would need `typesVersions`.

The export map declares `.`, `./locale`, `./locale/{az,en,ru,es}` and `./package.json`, one per Vite entry in `vite.config.ts` — adding a subpath means adding both, in both files.

### Testing conventions

Tests are colocated as `*.test.ts` next to the module they cover and use `bun:test` (`describe`/`it`/`expect`) — no separate `tests/` directory, no Vitest/Jest. Every module has a matching test file. When adding a new exported function, the existing test files show the expected pattern: cover the documented default behavior, at least one option override, and the thrown-error cases.
