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
- [x] `src/locale/en.ts`, `src/locale/ru.ts`, `src/locale/es.ts` — vocabulary,
      `compose`, `ordinal`, `notation`, and `currency` for all three, plus a
      `*.test.ts` per locale (`az.test.ts`'s structure, but hand-built
      `WordChunk`s since none of these locales are wired into `numberToWords`
      yet). `en.words.compose` is the default join-and-space-scale-words
      pattern; `ru.words.compose` flips a trailing "один"/"два" to feminine
      "одна"/"две" before "тысяча" only (million+ stays masculine); `es.words.compose`
      special-cases standalone 100 to "cien" and apocopates "uno"/"veintiuno" to
      "un"/"veintiún" before millón/millardo/billón, while "mil" drops "uno"
      entirely like `az`'s "min". `es.ordinal.words` ordinalizes every token of
      a compound number (not just the last), which is the one Spanish-specific
      deviation from the "transform the last word" pattern the interface
      otherwise assumes — see the doc comments in `locale/es.ts` for the
      round-scale-multiple gap this leaves (e.g. "dos mil" -> "segundo
      milésimo" instead of idiomatic "dosmilésimo").
- [ ] Thread a `locale` option through every public function; default to `en`
      only if no locale is passed (see the "default locale" decision below).
- [x] `src/locale/index.ts` barrel re-exporting every locale.
- [x] Add a `./locale` subpath export to `package.json` and a second Vite entry
      so `import { ru } from 'num-fns/locale'` resolves in ESM and CJS.
      (2026-08-09: `vite.config.ts` now builds one lib entry per subpath,
      keyed by entry name, instead of a single `src/index.ts` entry.)
- [x] Per-locale subpath exports (`num-fns/locale/ru`) for consumers who want
      to skip the barrel entirely. `az`/`en`/`ru`/`es` all added alongside the
      barrel in the same change.
- [x] Verify tree-shaking actually drops unused locales — a barrel import can
      defeat it. Test with a real Rollup/esbuild bundle, not by inspection.
      (2026-08-09: verified from the actual Rollup/Vite build output —
      `dist/locale/en.js`, `ru.js`, and `es.js` have zero imports each
      (fully self-contained); only `dist/locale/az.js` and `dist/index.js`
      reference the shared `number/words`+`number/suffix`+`number/notation`
      chunk, since `az` is the only locale still delegating to those
      pre-refactor modules. Also ran a real Node consumer — both
      `require('num-fns/locale/az')` and
      `import ... from 'num-fns/locale/az'` resolve through the `exports`
      map — rather than asserting from file existence alone.)
- [ ] Number system / digit conversion (Latin, Arabic-Indic, Extended
      Arabic-Indic) — listed as a launch i18n feature in the project vision;
      scope it as a `Locale.digits` (or similar) field once `en`/`ru`/`es` land,
      since `az` doesn't need it and there's no reference implementation yet.

### Decisions to make before writing code

- [x] **Default locale.** Decided: `en`, per explicit direction from the
      project owner (2026-08-09) — this is a breaking change from the current
      implicit-`az` behavior, so it should land in the same change that
      threads `locale` through every public function, not silently. `az`
      remains a one-line import (`numberToWords(1234, { locale: az })`).
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

- [x] `src/arithmetic/` (see §4). (2026-08-09: created with `clamp`/`inRange`;
      `add`/`subtract`/`multiply`/`divide`/`round` still pending on the
      decimal-safe-representation and rounding-mode decisions in §1/§4.)
- [x] `src/stats/` (see §4). (2026-08-10: created with `sum`/`mean`/`median`/
      `mode`/`min`/`max`/`variance`/`standardDeviation`/`percentile`/`quantile`,
      one function per file. `variance`/`standardDeviation` default to
      population and take `{ sample: true }` for Bessel's-correction sample
      variants, per the §4 "population vs. sample" decision point. `mode`
      returns every value tied for the highest frequency (not just one), sorted
      ascending. `percentile` uses linear interpolation (Excel PERCENTILE.INC /
      NumPy "linear"); `quantile` is a thin `q * 100` wrapper over it. All throw
      `RangeError` on empty input or non-finite values, per the package-wide
      convention — resolves the §4 "empty arrays and non-finite values" open
      question in favor of throwing, matching arithmetic/utils.)
- [x] `src/financial/` (see §4). (2026-08-10: created with `simpleInterest`/
      `compoundInterest`/`presentValue`/`futureValue`; `PMT`-style loan/annuity
      payment and amortization schedule still pending, see §4.)
- [x] `src/utils/` for the base-conversion and common utility helpers (see §4).
      (2026-08-09: created with `toBase`/`fromBase` and `isEven`/`isOdd`.)
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
- [x] Fraction words (Azerbaijani) — `yarım` / `half` / `половина` / `medio`,
      plus `1/3`, `1/4`. (2026-08-10: `src/number/fraction.ts` —
      `fractionToWords(numerator, denominator)`. `1/2` returns the idiomatic
      `"yarım"`; every other proper fraction returns `"<denominator +
      locative suffix> <numerator words>"`, e.g. `"üçdə bir"` (1/3), `"onda
      bir"` (1/10), `"yüzdə bir"` (1/100 — the same phrase Azerbaijani uses
      for "percent"). The locative suffix ("-da"/"-də") uses a *two-way*
      front/back vowel harmony on the denominator's last word, distinct from
      the four-way harmony `suffix.ts` uses for ordinals — kept as a small
      self-contained table in `fraction.ts` rather than importing
      `suffix.ts`'s, per the doc comment there. Scoped to proper fractions
      (`0 < numerator < denominator`) — mixed numbers and improper fractions
      throw `RangeError`, since there's no single idiomatic reading to fall
      back to without deciding a mixed-number format first. `en`/`ru`/`es`
      fraction words still pending the locale refactor (§1) — this is
      hardcoded Azerbaijani like the rest of `number/`.)
- [x] Digit-by-digit reading for phone numbers and codes. (2026-08-10:
      `src/number/digits.ts` — `numberToDigitWords`, reuses `ONES`/
      `ZERO_WORD`/`NEGATIVE_WORD` from `words.ts` rather than duplicating the
      digit vocabulary. Accepts `number | string`; string input preserves
      leading zeros, which a `number` can't represent. Formatting punctuation
      common in phone numbers (space, `-`, `(`, `)`, `.`, a leading `+`) is
      silently ignored rather than spoken. Like the rest of `number/`,
      hardcoded Azerbaijani for now — not gated on the locale refactor since
      it only consumes the already-shared word constants.)
- [x] Byte-size notation (KB/MB/GB) reusing the `toShortNotation` scale logic.
      (2026-08-10: `src/number/byte-size.ts` — `toByteSize`/`parseByteSize`,
      same descending-threshold-scan and trailing-zero-trim pattern as
      `toShortNotation`/`parseShortNotation`, but self-contained rather than
      importing from `notation.ts` since the scale table is keyed by exponent
      of a configurable `base` (`1024` binary default, or `1000` decimal SI)
      instead of a fixed magnitude. Labels (`KB`/`MB`/...) stay the same
      regardless of `base` — same ambiguity every OS/file-manager has, noted
      in the doc comment. Locale-independent, unlike `toShortNotation`'s
      `az`/`en` option.)
- [x] Rounding-mode option on `formatNumber` (half-up/half-down/half-even/ceil/floor).
      (2026-08-10: `roundingMode` on `NumberFormatOptions` — `'halfUp'`
      (default, delegates to `toFixed`), `'halfDown'`, `'halfEven'`, `'ceil'`,
      `'floor'`. Rounding now happens on the signed value before sign
      extraction (previously `formatNumber` rounded the absolute value and
      reattached the sign after), which was needed for `ceil`/`floor` to have
      their standard directional meaning for negative inputs and, as a side
      effect, fixed a pre-existing bug where a negative value that rounds to
      zero (e.g. `formatNumber(-0.4, { decimals: 0 })`) rendered as `"-0"`.
      Threaded through `formatMoney`; `formatPercentage` also takes and
      forwards it. Not decimal-safe — shares `toFixed`'s floating-point
      representation quirks for every mode except the `halfUp` fast path; the
      decimal-safe version is still `arithmetic/round`, tracked separately
      below.)
- [x] Permille (‰) and basis-point support in `formatPercentage`.
      (2026-08-10: `unit?: 'percent' | 'permille' | 'basisPoint'` on
      `PercentageFormatOptions`/`PercentageParseOptions`, defaulting to
      `'percent'` — unchanged behavior for existing callers. Each unit has
      its own sign (`%`/`‰`/`‱`) and ratio-scale factor (100/1000/10000);
      `multiplyBy100`/`asRatio` now scale by the selected unit's factor
      rather than a hardcoded 100.)
- [x] Shared range-validation helper instead of repeating checks per module.
      (2026-08-10: `src/shared/validation.ts` — `assertFinite`/
      `assertFiniteRate`/`assertNonNegative`/`assertPositive`/
      `assertPositiveInteger`/`assertFiniteBounds`, each throwing the exact
      same `RangeError` message the call site previously wrote inline.
      Applied to `src/arithmetic/` (`clamp`/`inRange`, which had a
      byte-for-byte identical min/max block — the clearest duplication) and
      all of `src/financial/`. Deliberately *not* re-exported from
      `src/index.ts` — these are internal guards, not public API, unlike
      `shared/types.ts`/`shared/constants.ts`. `src/number/`, `src/stats/`,
      and `src/utils/` still validate inline; migrate opportunistically
      rather than in one large sweep.)
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
- [x] `clamp` / `inRange` — cheap, currently-unimplemented wins. (2026-08-09:
      `src/arithmetic/clamp.ts` and `src/arithmetic/in-range.ts`, both
      inclusive-range, both throwing `RangeError` on non-finite input or
      `min > max`.)
- [ ] Decide precision limits and failure mode (throw vs. silently lose
      precision) for inputs beyond safe-integer range; document the tradeoff
      vs. a real decimal/bignum library the package deliberately isn't taking
      as a dependency.

### New: statistics (`src/stats/`)

Not represented anywhere in the previous backlog — new domain from the vision
doc.

- [x] `mean`, `median`, `mode`. (2026-08-10)
- [x] `variance`, `standardDeviation` (population vs. sample variants).
      (2026-08-10: population is the default, `{ sample: true }` opts into
      Bessel's correction and throws below 2 values.)
- [x] `percentile` / `quantile`. (2026-08-10: `percentile` (0-100) does the
      interpolation work; `quantile` (0-1) delegates to it.)
- [x] `sum`, `min`, `max` — likely trivial but worth having for API symmetry
      with the rest of the module. (2026-08-10)
- [x] Decide behavior on empty arrays and non-finite values (throw, per the
      package-wide convention of throwing on bad input rather than returning
      `NaN`). (2026-08-10: decided in favor of throwing — every `src/stats/`
      function throws `RangeError` on empty input or a non-finite element,
      matching `arithmetic`/`utils`.)

### New: financial helpers (`src/financial/`)

New domain from the vision doc.

- [x] Simple and compound interest. (2026-08-10: `src/financial/simple-interest.ts`
      (`simpleInterest`, `P * r * t`) and `src/financial/compound-interest.ts`
      (`compoundInterest`, takes a `{ compoundsPerPeriod }` option, default
      `1`). Both return interest earned only, not the resulting balance —
      matches the "raw numbers" decision below.)
- [x] Loan/annuity payment (`PMT`-style) and amortization schedule.
      (2026-08-10: `src/financial/loan-payment.ts` — `loanPayment` (ordinary
      annuity, standard `PMT` formula, `principal / periods` when `rate` is
      `0`) and `amortizationSchedule`, which builds the full period-by-period
      interest/principal split by calling `loanPayment` once and walking the
      balance down. The final row's `principal`/`balance` are corrected so
      the schedule always lands on exactly `0`, offsetting the
      floating-point drift that accumulates from repeatedly subtracting a
      fixed payment over many periods — the same kind of correction
      `toByteSize`'s `correctFloatingPointNoise` applies elsewhere.)
- [x] Present value / future value. (2026-08-10: `src/financial/present-value.ts`
      / `src/financial/future-value.ts`, single compounding-per-period
      formula (`PV = FV / (1+r)^n`), round-trip-tested against each other.)
- [x] Decide whether these take a `locale` for output formatting or return raw
      numbers or return raw numbers for the caller to format with
      `formatMoney` — leaning the latter, to keep this module decoupled from
      i18n. (2026-08-10: decided in favor of raw numbers — none of the four
      functions added so far take a `locale` option or format their output;
      callers pipe the result through `formatMoney` themselves if they want a
      currency-formatted string.)

### New: base conversion & common utilities (`src/utils/`)

- [x] `toBase` / `fromBase` — arbitrary-radix conversion (binary, octal, hex,
      base36), distinct from the locale digit-system conversion in §1 (that's
      Latin ↔ Arabic-Indic *within* base 10; this is base-10 ↔ base-N).
      Self-contained, no locale dependency — the vision doc lists this as a
      "common number utilities" item, not an i18n one. (2026-08-09:
      `src/utils/base.ts`, radix 2–36, negative-integer support, throws
      `SyntaxError` on characters outside the target radix's alphabet.)
- [x] `isEven` / `isOdd`, `isInteger`, other small predicates if they earn
      their keep beyond what's already trivial in plain JS. (2026-08-09:
      `src/utils/predicates.ts` adds `isEven`/`isOdd` — real value-add over
      plain JS. Deliberately skipped `isInteger`: it would just be
      `Number.isInteger` with a rename, which is the "doesn't earn its keep"
      case this item itself calls out.)

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

- [x] Pre-commit hook running `bun run check`. (2026-08-10: superseded the
      versioned `.githooks/pre-commit` approach below with
      [lefthook](https://lefthook.dev) (`lefthook.yml`), installed
      automatically via the `prepare` script in `package.json` — so it's no
      longer opt-in. `.githooks/pre-commit` is now a no-op stub;
      `.githooks/` should be deleted once someone with normal filesystem
      access to the repo can run `rm -rf .githooks` — the session that made
      this change was on a mounted filesystem that doesn't support deleting
      files. Original 2026-08-10 note, now outdated: "versioned
      `.githooks/pre-commit`, opt-in via `git config core.hooksPath
      .githooks` — documented in `CONTRIBUTING.md`'s 'Local setup' section.
      Not wired up automatically since `bun install` has no standard
      postinstall hook-install convention without adding a devDependency like
      `husky`/`simple-git-hooks`, which felt like more than this needed.")
- [x] Commit message linting. (2026-08-10: commitlint +
      `@commitlint/config-conventional`, run via lefthook's `commit-msg`
      hook — see `commitlint.config.js`. Enforces the Conventional Commits
      style already documented in `CONTRIBUTING.md`'s "Commit message style"
      section, at commit time rather than only in review.)
- [ ] `check:circular` (`madge --circular --extensions ts src/index.ts`,
      added 2026-08-10) currently crashes at require-time, not just on
      finding a cycle: madge's TypeScript support goes through
      `@typescript-eslint/typescript-estree`, whose installed version
      (8.66.0) declares `peerDependencies: { typescript: ">=4.8.4 <6.1.0" }`
      — incompatible with this repo's pinned `typescript@7.0.2`, which
      restructures the `ts.Extension` enum that `typescript-estree` reads at
      module-load time. Confirmed this is a real incompatibility, not a
      sandbox artifact (pure JS/peer-dep resolution, not a native binary).
      Bun's `overrides` field doesn't support npm's nested/scoped
      overrides (`bun install` warns "Bun currently does not support nested
      'overrides'"), so there's no low-risk way to point just
      `typescript-estree` at the existing `@typescript/typescript6`
      devDependency without a flat `typescript` override that would also
      change what `vite-plugin-dts` and other tools resolve. Options: (a)
      wait for `typescript-estree` to support TS 7, (b) make the check
      non-blocking the way `check:unused` already is (`knip
      --no-exit-code`), or (c) swap `madge` for a circular-dependency tool
      that doesn't depend on `typescript-estree`. Needs a decision before
      this check can run in CI/pre-commit.
- [ ] `check:unused` (`knip --cache --no-exit-code`, added 2026-08-10)
      crashed with `RangeError: Array buffer allocation failed` inside
      `oxc-parser`'s native `raw-transfer` buffer allocation when tested in
      the ARM64 Linux Cowork sandbox, despite ~3.4 GB free memory — looks
      like a native-binding issue specific to that environment (both
      `linux-arm64-gnu` and `linux-arm64-musl` bindings were present; glibc
      2.35 host) rather than a real bug in this repo's code. Unverified on a
      normal machine — re-run `bun run check:unused` locally to confirm
      before relying on it.
- [x] `.editorconfig`. (2026-08-10: mirrors `biome.json` — 2-space indent, LF,
      UTF-8, trim trailing whitespace — for editors that don't read Biome's
      config directly.)
- [ ] Renovate or Dependabot (relevant given `bunfig.toml` pins exact versions).
- [ ] TypeDoc site from the existing JSDoc, published to GitHub Pages.
- [ ] `examples/` folder with runnable snippets per module and per locale.
- [x] Playground page — landing page with docs + a live, runnable example per
      public function. (2026-08-10: `site/` — a separate Vite root (own
      `vite.config.ts`/`tsconfig.json`, not part of the published package)
      that imports directly from `../src` so every example calls the real,
      current source rather than a built artifact. `site/src/registry.ts`
      catalogs all ~40 public functions with a field schema per parameter;
      `site/src/engine.ts` generically turns form state into a real call
      (positional args always included; option-object keys included
      whenever a field has one, since a field's UI default is usually not
      the same as the function's own default — see the `isOmittedWhenDefault`
      doc comment for the bug this fixed) plus the matching code snippet.
      Errors are caught and rendered as the real thrown `RangeError`/
      `TypeError`/`SyntaxError`, not a synthesized message. Verified against
      a built bundle in jsdom: initial render matches each function's own
      JSDoc `@example`, live input changes recompute correctly, and invalid
      input surfaces the real error. Does *not* yet do the "pick a locale"
      half of this item — `numberToWords`/`formatNumber`/etc. are still
      Azerbaijani-only (§1's locale-threading item is unstarted), so the
      page has a separate "Locales" section that previews the real `az`/
      `en`/`ru`/`es` `Locale` data objects read-only instead, with an
      explicit note on what isn't wired in yet. Run with `bun run
      site:dev` / `bun run site:build` (outputs to `site-dist/`, gitignored
      via `site-dist*`); `build.emptyOutDir: false` for the same reason as
      the root `vite.config.ts` — this repo's connected-folder mount blocks
      `unlink()`, so emptying the out dir before a second build fails with
      `EPERM`.)
- [ ] Scaffolding script(s) under `scripts/` for "add a new function" and "add
      a new locale" — generates the file + colocated test + index.ts export,
      so `CONTRIBUTING.md` (§8) can point at a command instead of prose.
- [x] Fix all violations surfaced by the tightened `biome.json` ruleset
      (2026-08-09: added `noExcessiveCognitiveComplexity`, `noUnusedImports`,
      `useTopLevelRegex`, `useExplicitLengthCheck`, `useConsistentArrayType`
      (the actual v2 rule name — `useShorthandArrayType` doesn't exist in
      Biome 2.5.7, config would have failed to load), `noSkippedTests`, and
      bumped `noUnusedVariables`/`noUnusedFunctionParameters` to error).
      `biome check .` only flagged `useTopLevelRegex` (11 hits, none of the
      other new rules fired) — hoisted the inline regexes in `locale/en.ts`,
      `locale/es.ts`, `locale/ru.ts`, and `number/notation.ts` to module-level
      constants. `biome check`, `tsc --noEmit`, and `bun test` (164 pass) are
      all clean; `bun run build` wasn't re-verified in this pass (sandbox's
      installed `rolldown`/`vite` native bindings are for a different
      platform) — worth a local `bun run build` sanity check.

## 7. CI/CD & release

- [x] CI workflow (`.github/workflows/ci.yml`) — installs, typechecks, lints,
      format-checks, tests, and builds on every push/PR to `main`.
- [x] GitHub Pages deploy workflow (`.github/workflows/pages.yml`, added
      2026-08-10) — builds the `site/` playground with `bun run site:build`
      and publishes `site-dist/` via `actions/upload-pages-artifact` +
      `actions/deploy-pages`, on push to `main` (paths: `site/**`, `src/**`)
      or manual dispatch. Relies on `site/vite.config.ts`'s `base: './'`
      (relative asset paths), so no change was needed for the project-page
      subpath. Requires a one-time repo setting: Settings -> Pages -> Build
      and deployment -> Source: "GitHub Actions" — not something this sandbox
      can flip (no push/GitHub-API access here); do this before the workflow's
      `deploy` job will succeed. Live at
      https://aykhanhuseyn.github.io/num-fns/, linked from `README.md`. The
      separate TypeDoc API-reference site below is unrelated and still
      unstarted.
- [x] ~~npm publish workflow on version tag, with provenance.~~ Superseded
      2026-08-10 by the Changesets bot flow below — `release.yml` no longer
      triggers on `v*` tags.
- [x] Changesets for versioning and an auto-generated `CHANGELOG.md`.
      (2026-08-10: `@changesets/cli` + `@changesets/changelog-github`
      installed; `.changeset/config.json` set to `access: public`,
      `baseBranch: main`. New scripts — `bun run changeset` (add one),
      `bun run version` (`changeset version`: bump + changelog), `bun run
      release` (`bun run build && changeset publish`). `.github/workflows/
      release.yml` rewritten to trigger on push to `main` instead of `v*`
      tags: `changesets/action@v1` opens/updates a `chore: version packages`
      PR when changesets are pending, and runs `bun run release` once that
      PR is merged. Provenance now comes from `npm publish` (which
      `changeset publish` shells out to) reading `NPM_CONFIG_PROVENANCE=true`
      from the job env, rather than `bun publish --provenance` directly —
      `@changesets/cli` doesn't support Bun as a publish backend natively
      (see changesets/changesets#1152), so `actions/setup-node` is now a
      step in `release.yml` alongside `oven-sh/setup-bun` to get a modern
      npm (≥9.5) on `PATH`. Still requires the `NPM_TOKEN` repo secret,
      not yet added. Untested end-to-end — worth watching the first real
      "Version Packages" PR closely before trusting it unattended.)
- [ ] CI matrix across Node 14/16/18/20/22 (current CI only runs on whatever
      Bun's default Node compat target is — doesn't yet verify the
      `engines.node: >=14` claim in `package.json`).
- [ ] `size-limit` check in CI.
- [ ] First publish to npm — still unpublished at `0.1.0`; name is confirmed
      available (see §0) but not reserved. The first `changeset version` run
      will bump this off `0.1.0`, so this item and the version number should
      be revisited together.

## 8. Documentation

- [ ] Full API reference covering every export and its options.
- [ ] Locale support matrix — which functions are implemented for which locale,
      and where a locale is knowingly incomplete.
- [ ] Migration note for anyone who found the package as `az-number-utils`.
- [ ] Badges: npm version, CI status, license, bundle size.
- [x] `CONTRIBUTING.md` — doesn't exist yet. Needs, per the project vision,
      explicit sections for: (2026-08-09: written, covering all sections
      below. The §6 scaffolding script and §2 locale conformance suite don't
      exist yet, so those two sections describe the current manual process
      and note what they'll point at once built — revisit both sections when
      those land so the guide doesn't go stale.)
  - [x] Local setup (`bun install`).
  - [x] Running tests, typecheck, and lint (`bun test`, `bun run typecheck`,
        `bun run lint` / `bun run check`).
  - [x] How to add a new function (one file per function, colocated test,
        flat re-export from `src/index.ts` — point at the §6 scaffolding
        script once it exists).
  - [x] How to add a new locale (point at the §2 locale-authoring guide and
        conformance suite).
  - [x] Coding conventions — Biome rules, TypeScript strict mode, no `any`,
        named exports only, pure functions.
  - [x] Pull request process.
  - [x] Commit message style — recommend Conventional Commits.
- [ ] `CHANGELOG.md`.
- [ ] Azerbaijani-language README variant.
