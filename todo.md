# TODO

Backlog for `num-fns` — an internationalized number utility library, in the
spirit of `date-fns` but for numbers only. Nothing here is committed to; it's a
list to pull from.

**Launch locales: `az`, `en`, `ru`, `es`.**

## 0. Rename to `num-fns` (in progress)

- [x] `package.json` — name, description, keywords, repository/bugs/homepage URLs.
- [x] README rewritten around the internationalized positioning.
- [x] `CLAUDE.md` architecture section updated.
- [x] `bun.lock` workspace name.
- [x] Git remote pointed at `github.com/aykhanhuseyn/num-fns`.
- [ ] Rename the local directory `az-number-utils` → `num-fns` (must be done
      outside the editor session — the folder is mounted and can't rename itself).
- [ ] Rename the GitHub repo `az-number-utils` → `num-fns` so the remote resolves.
- [ ] Check `num-fns` availability on npm and reserve it.

## 1. Locale architecture (the big one)

Everything below blocks the rest of the i18n work. Current code hardcodes
Azerbaijani words and separators; the goal is to lift all of that into locale
objects, `date-fns` style.

- [ ] Define the `Locale` interface in `src/locale/types.ts`. Minimum surface:
  - `code` — BCP 47 tag (`'az'`, `'en'`, `'ru'`, `'es'`).
  - `formatDefaults` — `{ thousandsSeparator, decimalSeparator }`.
  - `words` — `{ zero, ones, teens, tens, hundreds, scales, negative, and }`
    plus a `compose(chunks)` hook, because word order and joining differ per
    language (Spanish `"mil doscientos"`, Russian `"одна тысяча двести"`).
  - `plural(n)` → `'one' | 'few' | 'many' | 'other'` — needed for Russian scale
    words (`тысяча` / `тысячи` / `тысяч`) and gendered forms.
  - `ordinal` — suffix derivation (`toOrdinal`) and full ordinal words.
  - `notation` — short scale abbreviations (`mln` / `M` / `млн` / `M`) and long
    scale words.
  - `currency` — default currency code, major/minor unit words with plural forms.
- [ ] `src/locale/az.ts` — port the existing hardcoded Azerbaijani data over
      unchanged; this is the reference implementation and must not regress.
- [ ] `src/locale/en.ts`, `src/locale/ru.ts`, `src/locale/es.ts`.
- [ ] Thread a `locale` option through every public function; default to `az`
      only if no locale is passed (see the "default locale" decision below).
- [ ] `src/locale/index.ts` barrel re-exporting every locale.
- [ ] Add a `./locale` subpath export to `package.json` and a second Vite entry
      so `import { ru } from 'num-fns/locale'` resolves in ESM and CJS.
- [ ] Per-locale subpath exports (`num-fns/locale/ru`) for consumers who want
      to skip the barrel entirely.
- [ ] Verify tree-shaking actually drops unused locales — a barrel import can
      defeat it. Test with a real Rollup/esbuild bundle, not by inspection.

### Decisions to make before writing code

- [ ] **Default locale.** `date-fns` defaults to `en-US`. Options: default to
      `en` (conventional), default to `az` (current behavior, no breaking
      change), or require an explicit locale (most honest, worst DX). Leaning
      `en` as the library default, with `az` a one-line import.
- [ ] **Number formatting vs `Intl.NumberFormat`.** The platform already does
      grouping/decimal separators well. Decide whether `formatNumber` delegates
      to `Intl` when available (smaller bundle, correct for every locale) or
      stays self-contained (predictable, works on ancient runtimes, no ICU
      dependency). The genuinely novel surface — words, ordinals, notation,
      roman — has no `Intl` equivalent either way.
- [ ] **Scale naming.** Short scale (billion = 10⁹) vs long scale (milliard).
      `az` and `ru` use milliard; `en` uses billion; `es` uses *millardo* but
      commonly *mil millones*. This must be a per-locale property, not a global.
- [ ] **Grammatical gender.** Russian `один`/`одна` and Spanish `un`/`una`
      change with the noun being counted. Decide whether `numberToWords` takes a
      `gender` option or stays masculine-by-default.

## 2. Per-locale linguistic work

- [ ] **Russian** — plural categories for every scale word; `одна тысяча` not
      `один тысяча`; ordinal forms decline by case and gender (scope this down
      to nominative masculine for v1 and document the limitation).
- [ ] **Spanish** — `veintiuno`/`veintiún` contraction, `ciento` vs `cien`,
      `y` only between tens and ones (`treinta y uno`, but `ciento uno`).
- [ ] **English** — hyphenation (`twenty-one`), the `and` convention
      (`one hundred and one` in en-GB, dropped in en-US), ordinal suffixes
      `st/nd/rd/th`.
- [ ] **Azerbaijani** — already implemented; keep the vowel-harmony suffix
      derivation in `suffix.ts` and make sure the locale refactor doesn't sever
      it from the word list it depends on.
- [ ] Locale-authoring guide in `CONTRIBUTING.md` plus a shared conformance test
      suite every new locale must pass, so adding a fifth locale is mechanical.

## 3. Core features

- [x] `moneyToWords` — spell out an amount with currency units.
- [x] `ordinalToWords` — fully spelled ordinals.
- [x] `parseShortNotation` — inverse of `toShortNotation`.
- [x] `parseLongNotation` — inverse of `toLongNotation`.
- [ ] Multi-currency support keyed off ISO 4217 codes (AZN, USD, EUR, RUB) with
      per-locale symbol placement — replaces the manual `symbol` string.
- [ ] Fraction words — `yarım` / `half` / `половина` / `medio`, plus `1/3`, `1/4`.
- [ ] Digit-by-digit reading for phone numbers and codes.
- [ ] Byte-size notation (KB/MB/GB) reusing the `toShortNotation` scale logic.
- [ ] Rounding-mode option on `formatNumber` (half-up/half-down/half-even/ceil/floor).
- [ ] Permille (‰) and basis-point support in `formatPercentage`.
- [ ] Compact/relative helpers: `clamp`, `inRange`, `round(value, precision)` —
      cheap wins that make the package useful beyond formatting.
- [ ] Shared range-validation helper instead of repeating checks per module.
- [ ] BigInt input path for `numberToWords` / `toLongNotation`.
- [ ] Roman numerals above 3999 (vinculum notation) — currently out of scope.
      Note roman numerals are locale-independent and stay outside the locale system.

## 4. Testing & quality

- [ ] Shared conformance suite run against every locale (see §2).
- [ ] Edge-case coverage per function: `NaN`, `Infinity`, `-0`, min/max bounds.
- [ ] Round-trip property tests (`fast-check`) for every format/parse pair.
- [ ] Cross-check `formatNumber` output against `Intl.NumberFormat` for all four
      locales — catches separator mistakes no human reviewer will spot.
- [ ] Native-speaker review of the `ru` and `es` word lists before publishing.
      Machine-generated number words are wrong in embarrassing, specific ways.
- [ ] `bun test --coverage` in CI with an enforced threshold.
- [ ] Smoke-test built `dist/index.cjs` on Node 14/16 to back the compatibility claim.
- [ ] Bundle-size assertion per locale — the selling point is that importing
      one locale doesn't pull in four.
- [ ] Micro-benchmarks for `formatNumber` / `numberToWords` on large inputs.

## 5. Tooling & DX

- [ ] Pre-commit hook running `bun run check`.
- [ ] `.editorconfig`.
- [ ] Renovate or Dependabot (relevant given `bunfig.toml` pins exact versions).
- [ ] TypeDoc site from the existing JSDoc, published to GitHub Pages.
- [ ] `examples/` folder with runnable snippets per module and per locale.
- [ ] Playground page where you pick a locale and see every function's output —
      doubles as documentation and as a manual QA tool for new locales.

## 6. CI/CD & release

- [ ] npm publish workflow on version tag, with provenance.
- [ ] CI matrix across Node 14/16/18/20/22.
- [ ] `size-limit` check in CI.
- [ ] Changesets for versioning and an auto-generated `CHANGELOG.md`.
- [ ] First publish to npm — still unpublished at `0.1.0`.

## 7. Documentation

- [ ] Full API reference covering every export and its options.
- [ ] Locale support matrix — which functions are implemented for which locale,
      and where a locale is knowingly incomplete.
- [ ] Migration note for anyone who found the package as `az-number-utils`.
- [ ] Badges: npm version, CI status, license, bundle size.
- [ ] `CONTRIBUTING.md` (including the locale-authoring guide).
- [ ] `CHANGELOG.md`.
- [ ] Azerbaijani-language README variant.
