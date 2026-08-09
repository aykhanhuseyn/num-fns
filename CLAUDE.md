# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this package is

`num-fns` is an internationalized number utility library — `date-fns`, but for numbers only. It formats and parses numbers, money and percentages, spells numbers out in words, and handles ordinals, short/long notation and roman numerals.

It was renamed from `az-number-utils`, and the code still reflects that origin: **every module today is hardcoded Azerbaijani**. The target architecture is `date-fns`-style locale objects imported from `num-fns/locale` and passed per call (`numberToWords(1234, { locale: ru })`), with `az`, `en`, `ru` and `es` as the launch locales. That refactor has not happened yet — see `todo.md` §1 for the plan and the open design decisions. When adding a feature, prefer a shape that will survive the locale refactor over one that bakes in more Azerbaijani.

Note the pre-existing `locale: 'az' | 'en'` string option on `toShortNotation` — it is unrelated to the planned locale objects and will be folded into them.

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
bun run build               # vite build -> dist/ (ESM + CJS + per-module .d.ts)
bun run dev                 # vite build --watch
```

Linting and formatting are handled by a single tool, Biome (`biome.json`), not ESLint/Prettier.

`prepublishOnly` runs typecheck, lint, test, and build in sequence — that's the full gate before `npm publish`.

`bunfig.toml` sets `install.exact = true`, so `bun add`/`bun install` always pin exact versions in `package.json` (no `^`/`~` ranges) — keep that in mind when adding a new dependency.

## Architecture

Each unit (number, money, percentage) has its own directory under `src/`, with a single `format.ts` (or, for the `number/` directory, one file per concern) exporting a `formatX`/`parseX` pair. Everything is re-exported flat from `src/index.ts` — there is no default export and no namespacing, so `formatMoney`, `numberToWords`, `toRoman`, etc. are all imported directly from the package root.

`src/arithmetic/` and `src/utils/` (added 2026-08-09, per the `todo.md` §3 note that these new domains can land as top-level directories regardless of the still-open `format/`+`parse/` split question) follow the same one-file-per-function convention but hold self-contained helpers with no locale dependency, rather than a `formatX`/`parseX` pair per domain.

- `src/number/format.ts` — `formatNumber` / `parseNumber`, the base formatter every other formatter (money, percentage) delegates to for grouping digits and joining the fractional part. Azerbaijani defaults: space as thousands separator, comma as decimal separator (see `src/shared/constants.ts`).
- `src/number/words.ts` — `numberToWords`, spells out Azerbaijani cardinal numbers. This is the linguistic core of the package: it groups a number into base-1000 chunks and walks them with `SCALE_WORDS` (`min`, `milyon`, `milyard`, `trilyon`), applying two irregular rules that are easy to get wrong — "min" (not "bir min") for exactly 1000 at the thousands scale, but "bir milyon" for exactly 1,000,000 at every scale above thousands. `SCALE_WORDS` is exported and reused by `notation.ts`.
- `src/number/suffix.ts` — `getOrdinalSuffix` / `toOrdinal` derive the Azerbaijani ordinal suffix (`cı`/`ci`/`cu`/`cü`) from vowel harmony on the *last vowel of the last word* of `numberToWords(value)`, rather than a hardcoded lookup table. This makes it correct by construction for every value `numberToWords` can spell, but also means suffix correctness is coupled to the word list in `words.ts` — if `ONES`/`TENS`/`SCALE_WORDS` ever change spelling, re-check the suffix mapping in the same file's doc comment against real Azerbaijani ordinals.
- `src/number/notation.ts` — `toShortNotation` (scaled abbreviation, e.g. `"2,5 mln"` or, with `locale: 'en'`, `"2.5M"`) and `toLongNotation` (digit groups paired with scale words, e.g. `"1 milyon 234 min 567"`). Distinct from `numberToWords`: notation functions keep digits and only localize the scale word, they don't spell every number out.
- `src/number/roman.ts` — standard `toRoman` / `fromRoman`, integers 1–3999 only, self-contained (no dependency on the words/notation modules).
- `src/money/format.ts`, `src/percentage/format.ts` — thin wrappers around `formatNumber`/`parseNumber` that add a currency symbol or `%` sign. Money defaults to the manat sign `₼` (`AZN_SYMBOL` in `src/shared/constants.ts`).
- `src/shared/types.ts` / `src/shared/constants.ts` — shared option interfaces (each domain's options interface extends `NumberFormatOptions`) and the two Azerbaijani-locale defaults every formatter falls back to. These constants are the seam the locale refactor will cut along: they become properties of a `Locale` object rather than module-level defaults.
- `src/arithmetic/clamp.ts`, `src/arithmetic/in-range.ts` — `clamp` and `inRange`, both inclusive `[min, max]`, both throwing `RangeError` on non-finite input or `min > max`. First functions in the `src/arithmetic/` domain; `add`/`subtract`/`multiply`/`divide`/`round` are still pending on the decimal-safe-representation and rounding-mode decisions in `todo.md` §1/§4.
- `src/utils/base.ts` — `toBase`/`fromBase`, arbitrary-radix (2–36) conversion, distinct from the locale digit-system conversion planned in `todo.md` §1 (Latin ↔ Arabic-Indic *within* base 10 — this is base-10 ↔ base-N).
- `src/utils/predicates.ts` — `isEven`/`isOdd`, throwing `TypeError` for non-integers. `isInteger` was deliberately not added — it would just rename `Number.isInteger`.

All public functions validate input up front and throw (`RangeError`/`TypeError`/`SyntaxError`) rather than returning `NaN`/`undefined` on bad input (non-finite numbers, out-of-range roman numerals, unparseable strings).

### Build output

`vite.config.ts` builds `src/index.ts` in library mode to both `dist/index.js` (ESM) and `dist/index.cjs` (CJS), targeting `es2018` for compatibility with older consumers, with `vite-plugin-dts` emitting per-module `.d.ts` files (not rolled up into one file — rollup-based type bundling pulls in `@microsoft/api-extractor`, which was unreliable in this environment, so `rollupTypes` is intentionally left off). `build.emptyOutDir` is set to `false`; the `dist/` directory is not cleaned before each build.

Adding the `num-fns/locale` entry point will require a second Vite input and a matching `exports` entry in `package.json` — the export map currently declares only `.` and `./package.json`, so `import { ru } from 'num-fns/locale'` will not resolve until both are added.

### Testing conventions

Tests are colocated as `*.test.ts` next to the module they cover and use `bun:test` (`describe`/`it`/`expect`) — no separate `tests/` directory, no Vitest/Jest. Every module has a matching test file. When adding a new exported function, the existing test files show the expected pattern: cover the documented default behavior, at least one option override, and the thrown-error cases.
