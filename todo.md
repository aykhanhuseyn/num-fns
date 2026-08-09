# TODO

Backlog for `num-fns` — an internationalized number utility library, in the
spirit of `date-fns` but for numbers only. Nothing here is committed to; it's a
list to pull from.

**Launch locales: `az`, `en`, `ru`, `es`.**

Rewritten 2026-08-09 against the updated project vision (Cowork project
instructions): scope widened beyond formatting/words/notation to add
arithmetic, statistics, financial and base-conversion helpers, and a fuller
contribution/CI story. See §3 for the structural questions that vision raises
against what's actually in the repo today.

## 0. Rename to `num-fns` (in progress)

- [x] `package.json` — name, description, keywords, repository/bugs/homepage URLs.
- [x] README rewritten around the internationalized positioning.
- [x] `CLAUDE.md` architecture section updated.
- [x] `bun.lock` workspace name.
- [x] Git remote pointed at `github.com/aykhanhuseyn/num-fns` (verified: `origin` is `https://github.com/aykhanhuseyn/num-fns.git`).
- [x] Rename the local directory `az-number-utils` → `num-fns` (must be done
      outside the editor session — the folder is mounted and can't rename itself).
- [x] Check `num-fns` availability on npm — `registry.npmjs.org/num-fns` returns
      empty/404 as of 2026-08-09, so the name is unclaimed. Not yet reserved —
      reservation only happens on first `npm publish` (see §7).
- [ ] Rename the GitHub repo `az-number-utils` → `num-fns` so the remote resolves
      (the local remote URL already assumes this happened — confirm on GitHub).

## 1. Locale architecture (the big one)

Everything below blocks the rest of the i18n work. Current code hardcodes
Azerbaijani words and separators; the goal is to lift all of that into locale
objects, `date-fns` style.

- [x] Define the `Locale` interface in `src/locale/types.ts`. Covers `code`,
      `formatDefaults`, `words` (+ `compose` hook), `plural`, `ordinal`,
      `notation`, `currency`.
- [x] `src/locale/az.ts` — port the existing hardcoded Azerbaijani data over
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
- [ ] Number system / digit conversion (Latin, Arabic-Indic, Extended
      Arabic-Indic) — listed as a launch i18n feature in the project vision;
      scope it as a `Locale.digits` (or similar) field once `en`/`ru`/`es` land,
      since `az` doesn't need it and there's no reference implementation yet.

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

## 3. Project structure — reconcile the vision doc with the actual repo

The updated project instructions suggest a top-level layout —
`src/{format,parse,arithmetic,humanize,locale,stats,financial,utils}/` plus a
separate top-level `test/` directory and a `scripts/` directory — that
diverges from what's actually built and from what `CLAUDE.md` documents as
deliberate. Nothing here should be restructured silently; each point below is
a decision to make (and reflect back into `CLAUDE.md`) before or during the
locale refactor, since moving files now vs. after §1 lands changes how much
gets touched twice.

- [ ] **Tests: colocated vs. top-level `test/`.** Every existing test is
      `*.test.ts` next to its module, and `CLAUDE.md` documents this as
      intentional ("no separate `tests/` directory"). The suggested structure
      lists a top-level `test/`. Decide whether the vision doc's `test/` is
      aspirational boilerplate (ignore it, keep colocating) or an actual
      request to move tests — if the latter, update `CLAUDE.md` in the same
      change so the two docs don't disagree.
- [ ] **`format/` + `parse/` split vs. per-domain `format.ts`.** Today
      `formatNumber`/`parseNumber` live together in `src/number/format.ts`
      (same for money, percentage). The suggested structure implies splitting
      format and parse into separate top-level directories across every
      domain. This is a bigger reorg than it looks — decide before adding the
      new domains below, so they're not built twice.
- [ ] **`humanize/` as a home for words/ordinal/notation/roman.** Currently
      under `src/number/`. If the `format/`+`parse/` split happens, `words.ts`,
      `suffix.ts`, `notation.ts` and `roman.ts` don't fit either bucket and
      plausibly move to a `humanize/` directory, matching the vision doc.
- [ ] Once the above are decided, update the "Architecture" section of
      `CLAUDE.md` to match — it's the source of truth `Claude Code` reads, and
      it currently describes the pre-reorg layout.

New domains the vision doc calls for that don't conflict with anything above —
these can be added as new top-level directories regardless of how the
format/parse question resolves:

- [ ] `src/arithmetic/` (see §4).
- [ ] `src/stats/` (see §4).
- [ ] `src/financial/` (see §4).
- [ ] `src/utils/` for the base-conversion and common utility helpers (see §4).
- [ ] `scripts/` — currently doesn't exist. Natural home for the "add a new
      function" / "add a new locale" scaffolding scripts §8's `CONTRIBUTING.md`
      needs to reference, so the guide points at something real instead of
      describing a manual process.

## 4. Core features

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
- [ ] Shared range-validation helper instead of repeating checks per module.
- [ ] BigInt input path for `numberToWords` / `toLongNotation`.
- [ ] Roman numerals above 3999 (vinculum notation) — currently out of scope.
      Note roman numerals are locale-independent and stay outside the locale system.

### New: precise arithmetic (`src/arithmetic/`)

Explicitly called out in the project vision as a launch pillar — avoiding the
classic `0.1 + 0.2 !== 0.3` floating-point traps. Not started.

- [ ] `add` / `subtract` / `multiply` / `divide` operating on decimal-safe
      representations (likely integer-scaled, not naive `Number` math).
- [ ] `round(value, precision, mode)` — ties into the rounding-mode decision
      above; should be the one rounding implementation the rest of the package
      (money, percentage, stats) delegates to rather than reimplementing.
- [ ] `clamp` / `inRange` — cheap, currently-unimplemented wins.
- [ ] Decide precision limits and failure mode (throw vs. silently lose
      precision) for inputs beyond safe-integer range; document the tradeoff
      vs. a real decimal/bignum library the package deliberately isn't taking
      as a dependency.

### New: statistics (`src/stats/`)

Not represented anywhere in the previous backlog — new domain from the vision
doc.

- [ ] `mean`, `median`, `mode`.
- [ ] `variance`, `standardDeviation` (population vs. sample variants).
- [ ] `percentile` / `quantile`.
- [ ] `sum`, `min`, `max` — likely trivial but worth having for API symmetry
      with the rest of the module.
- [ ] Decide behavior on empty arrays and non-finite values (throw, per the
      package-wide convention of throwing on bad input rather than returning
      `NaN`).

### New: financial helpers (`src/financial/`)

New domain from the vision doc.

- [ ] Simple and compound interest.
- [ ] Loan/annuity payment (`PMT`-style) and amortization schedule.
- [ ] Present value / future value.
- [ ] Decide whether these take a `locale` for output formatting or return raw
      numbers or return raw numbers for the caller to format with
      `formatMoney` — leaning the latter, to keep this module decoupled from
      i18n.

### New: base conversion & common utilities (`src/utils/`)

- [ ] `toBase` / `fromBase` — arbitrary-radix conversion (binary, octal, hex,
      base36), distinct from the locale digit-system conversion in §1 (that's
      Latin ↔ Arabic-Indic *within* base 10; this is base-10 ↔ base-N).
      Self-contained, no locale dependency — the vision doc lists this as a
      "common number utilities" item, not an i18n one.
- [ ] `isEven` / `isOdd`, `isInteger`, other small predicates if they earn
      their keep beyond what's already trivial in plain JS.

## 5. Testing & quality

- [ ] Shared conformance suite run against every locale (see §2).
- [ ] Edge-case coverage per function: `NaN`, `Infinity`, `-0`, min/max bounds.
- [ ] Round-trip property tests (`fast-check`) for every format/parse pair.
- [ ] Cross-check `formatNumber` output against `Intl.NumberFormat` for all four
      locales — catches separator mistakes no human reviewer will spot.
- [ ] Native-speaker review of the `ru` and `es` word lists before publishing.
      Machine-generated number words are wrong in embarrassing, specific ways.
- [ ] `bun test --coverage` in CI with an enforced threshold — "high test
      coverage" is an explicit success criterion in the project vision, so this
      needs a real number and a CI gate, not just running tests.
- [ ] Smoke-test built `dist/index.cjs` on Node 14/16 to back the compatibility claim.
- [ ] Bundle-size assertion per locale — the selling point is that importing
      one locale doesn't pull in four.
- [ ] Micro-benchmarks for `formatNumber` / `numberToWords` on large inputs.
- [ ] Test coverage for the new arithmetic/stats/financial/utils domains once
      built — same bar as existing modules (default behavior, option override,
      thrown-error cases).

## 6. Tooling & DX

- [ ] Pre-commit hook running `bun run check`.
- [ ] `.editorconfig`.
- [ ] Renovate or Dependabot (relevant given `bunfig.toml` pins exact versions).
- [ ] TypeDoc site from the existing JSDoc, published to GitHub Pages.
- [ ] `examples/` folder with runnable snippets per module and per locale.
- [ ] Playground page where you pick a locale and see every function's output —
      doubles as documentation and as a manual QA tool for new locales.
- [ ] Scaffolding script(s) under `scripts/` for "add a new function" and "add
      a new locale" — generates the file + colocated test + index.ts export,
      so `CONTRIBUTING.md` (§8) can point at a command instead of prose.

## 7. CI/CD & release

- [x] CI workflow (`.github/workflows/ci.yml`) — installs, typechecks, lints,
      format-checks, tests, and builds on every push/PR to `main`.
- [ ] npm publish workflow on version tag, with provenance.
- [ ] CI matrix across Node 14/16/18/20/22 (current CI only runs on whatever
      Bun's default Node compat target is — doesn't yet verify the
      `engines.node: >=14` claim in `package.json`).
- [ ] `size-limit` check in CI.
- [ ] Changesets for versioning and an auto-generated `CHANGELOG.md`.
- [ ] First publish to npm — still unpublished at `0.1.0`; name is confirmed
      available (see §0) but not reserved.

## 8. Documentation

- [ ] Full API reference covering every export and its options.
- [ ] Locale support matrix — which functions are implemented for which locale,
      and where a locale is knowingly incomplete.
- [ ] Migration note for anyone who found the package as `az-number-utils`.
- [ ] Badges: npm version, CI status, license, bundle size.
- [ ] `CONTRIBUTING.md` — doesn't exist yet. Needs, per the project vision,
      explicit sections for:
  - [ ] Local setup (`bun install`).
  - [ ] Running tests, typecheck, and lint (`bun test`, `bun run typecheck`,
        `bun run lint` / `bun run check`).
  - [ ] How to add a new function (one file per function, colocated test,
        flat re-export from `src/index.ts` — point at the §6 scaffolding
        script once it exists).
  - [ ] How to add a new locale (point at the §2 locale-authoring guide and
        conformance suite).
  - [ ] Coding conventions — Biome rules, TypeScript strict mode, no `any`,
        named exports only, pure functions.
  - [ ] Pull request process.
  - [ ] Commit message style — recommend Conventional Commits.
- [ ] `CHANGELOG.md`.
- [ ] Azerbaijani-language README variant.
