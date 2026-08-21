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

## 0. Rename to `num-fns` (done)

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
- [x] Rename the GitHub repo `az-number-utils` → `num-fns` so the remote resolves.
      (2026-08-18: confirmed done — `git ls-remote https://github.com/aykhanhuseyn/num-fns.git`
      resolves with `HEAD`/`main`/`changeset-release/main` refs, and the old
      `az-number-utils.git` URL still resolves to the same commits via GitHub's
      automatic redirect, as expected after a rename.)

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
- [x] Thread a `locale` option through every public function; default to `en`
      only if no locale is passed (see the "default locale" decision below).
      (2026-08-18: `locale?: Locale` added to every option interface with
      locale-dependent behavior — `numberToWords`, `toOrdinal`/
      `ordinalToWords`/`getOrdinalSuffix`, `formatNumber`/`parseNumber`,
      `formatMoney`/`parseMoney`/`moneyToWords`, `formatPercentage`/
      `parsePercentage`, `toShortNotation`/`parseShortNotation`/
      `toLongNotation`/`parseLongNotation`, `numberToDigitWords`, and
      `fractionToWords` — defaulting to `en` everywhere, per the "default
      locale" decision below. `toRoman`/`fromRoman`, `toByteSize`/
      `parseByteSize`, and the arithmetic/stats/financial/utils domains stay
      locale-independent, per §4's "raw numbers" decision.

      The core engine change is `number/words.ts`'s `numberToWords`: each
      locale now owns a `words.renderGroup(value: number): string` (renders
      one 0-999 group — hyphenation for `en`, veinti-contraction and "y" for
      `es`, gender-neutral masculine for `ru`, the original hardcoded
      algorithm for `az`, ported unchanged) and `words.compose(chunks)`
      (joins base-1000 groups with scale words — dropping "bir"/"uno" before
      "min"/"mil", Russian gender agreement before "тысяча", Spanish "cien"
      apocopation). Scale words that inflect by count (Russian especially)
      resolve through the existing `plural` + a new `resolveScaleWord`
      helper. The old `LocaleWords.and` field was overloaded to mean both
      "intra-group tens+ones connector" and "integer/fraction decimal
      joiner" depending on locale — split into `and` (the former) and a new
      `decimalConnector` (the latter, `az`'s `"tam"`) so each locale sets
      only the one it needs.

      `az`'s ordinal vowel-harmony logic (`getOrdinalSuffix`/
      `ordinalToWords`'s old implementation) moved from `number/suffix.ts`
      into `locale/az.ts` itself, since it's Azerbaijani-specific linguistic
      data, not generic algorithm — `number/suffix.ts` now just delegates to
      `locale.ordinal.suffix`/`locale.ordinal.words`. Same reasoning for
      `az`'s fraction-word composer (`üçdə bir` etc.), which moved into a
      new `Locale.fractions?: { half?, words }` hook every locale can
      implement. `fractionToWords` currently only has real vocabulary for
      `az` and `en` — `ru`/`es` fraction nouns aren't simple derivations of
      their ordinal words (Russian needs feminine forms like
      "треть"/"четверть"; Spanish's "tercio" diverges from its ordinal
      "tercero"), so rather than guess and risk the "wrong in embarrassing,
      specific ways" failure mode §5 calls out, it throws `RangeError` for
      those two locales instead — tracked as follow-up linguistic work
      in §2, not part of this pass. `en` is deliberately excluded from the
      `Locale.fractions` hook pattern: `number/words.ts` imports `en` as its
      structural default, so `en.ts` can never import back from `number/`
      (incl. `ordinalToWords`, which `en`'s fraction composer needs) without
      a circular dependency — `en`'s fraction composer lives directly in
      `number/fraction.ts` instead, special-cased.

      Verified byte-identical `az` output against the pre-refactor
      hardcoded implementation (extensive `{ locale: az }` coverage in every
      rewritten test file) and correct `en`/`ru`/`es` output hand-checked
      against the linguistic rules above. `toOrdinal`'s separator moved from
      a positional second parameter to its options object (to make room for
      `locale` alongside it) and `toShortNotation`'s pre-existing
      `'az' | 'en'` string `locale` option was folded into the full `Locale`
      object system — both are intentional breaking changes, along with the
      default-locale change itself; documented in a changeset.

      One bundle-size regression surfaced and was fixed during this pass:
      `number/fraction.ts` initially imported `az` directly (for its
      fraction composer), which pulled `az`'s entire vocabulary into the
      default `dist/index.js` bundle for every consumer regardless of which
      locale they actually use — caught by `bun run size`, fixed by routing
      through the generic `Locale.fractions` hook instead of a static
      per-locale import. `bun run check` (typecheck, circular-dependency,
      lint/format), `bun test` (366/366), `bun run build`, and `bun run
      size` are all clean after the fix.)
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
- [x] **Scale naming.** Decided: a per-locale property of
      `Locale.words.scales`/`Locale.notation.scales`, never a global
      short/long switch — this was already the shape the §1 locale refactor
      built, just never closed out or covered by a test that ties all four
      locales to the decision text. `en` uses the short-scale
      `billion`/`trillion` pair at 1e9/1e12; `az`/`ru` keep the same
      short-scale group-of-three progression but name 1e9
      `milyard`/`миллиард` (the long-scale-derived word); `es` diverges
      furthest, naming 1e9 `millardo` (not the more colloquial *mil
      millones*) **and** naming 1e12 `billón` — the traditional long-scale
      word for 10¹², distinct from English's 1e9 `billion`. (2026-08-21:
      closed out with a dedicated conformance suite in `locale/index.test.ts`
      — asserts `numberToWords`/`toLongNotation` output and
      `words.scales`/`notation.scales` vocabulary agreement for all four
      locales at 1e9 and 1e12. 480/480 tests green, 100% coverage unchanged.
      Incidentally surfaced a pre-existing, unrelated flake: `bun run
      test:coverage`'s `formatNumber` `halfUp`-rounding property test
      occasionally fails on extreme values like `[-268435456.47635, 4,
      'halfUp']` — floating-point error pushes the round-trip diff
      (`0.000050008...`) a hair past the half-unit tolerance (`0.00005`).
      Reproduced deterministically outside the suite; not fixed here, tracked
      as a new open bug below since it's unrelated to scale naming.)
- [x] **Grammatical gender.** Russian `один`/`одна` and Spanish `un`/`una`
      change with the noun being counted. Decide whether `numberToWords` takes a
      `gender` option or stays masculine-by-default.
      (2026-08-21: **decided — `numberToWords` takes a `gender` option, with
      the default owned by the locale.** `NumberWordsOptions.gender` accepts
      `'masculine' | 'feminine' | 'neuter'` (`GrammaticalGender` in
      `locale/types.ts`); each locale declares which genders its cardinal
      words actually distinguish (`Locale.words.genders` — `ru` all three,
      `es` masculine/feminine, `az`/`en` none) and its default
      (`Locale.words.defaultGender`, `'masculine'` for `ru`/`es`), so
      omitting the option keeps every pre-existing output byte-identical.
      Per the package-wide throw-on-bad-input rule, a gender the locale
      doesn't distinguish throws `RangeError` (`az`/`en` with any gender,
      `es` with `neuter`) instead of being silently ignored.

      Scope: the requested gender agrees with the noun being *counted*, so
      it applies to the trailing units group and the decimal-fraction group
      — `renderGroup` grew an optional `gender` parameter for this — while
      scale-bound groups keep agreeing with their scale noun via `compose`
      (`одна тысяча` regardless of requested gender; `миллион`/`millón` stay
      masculine). `compose` also receives the gender so Spanish can pass
      agreement through its gender-transparent `mil` (`doscientas mil`,
      `doscientas treinta y un mil` — RAE keeps the apocope before `mil`
      even in feminine agreement, so `veintiuna mil` is not produced). Words
      affected: ru `один`->`одна`/`одно`, `два`->`две` (neuter shares `два`);
      es `uno`->`una`, `veintiuno`->`veintiuna`, `-cientos`->`-cientas`
      (`ciento`/`cien` invariable). Fixing the `mil` path also fixed a
      pre-existing masculine bug: 21 000 was `veintiuno mil`, now
      `veintiún mil` (part of §2's Spanish apocopation item).

      Not covered, deliberately: `moneyToWords` doesn't thread gender yet —
      the currency unit's own gender should drive it (`рубль` masculine but
      `копейка` feminine, so ru minor amounts currently read `один копейка`
      instead of `одна копейка`); that wants a
      `LocaleCurrencyUnit.gender` field and is tracked as follow-up work in
      §2's Russian item rather than guessed at here. Ordinal gender (`первая`,
      `primera`) stays out of scope per §2's nominative-masculine v1 call.)

## 2. Per-locale linguistic work

- [ ] **Russian** — plural categories for every scale word; `одна тысяча` not
      `один тысяча`; ordinal forms decline by case and gender (scope this down
      to nominative masculine for v1 and document the limitation).
      (2026-08-21 addition, found while landing §1's gender option:
      `moneyToWords` reads ru minor amounts as `один копейка` — `копейка` is
      feminine. Needs a `LocaleCurrencyUnit.gender` field threaded through
      `moneyToWords`'s `numberToWords` calls; the `gender` option itself
      already exists.)
- [ ] **Spanish** — `veintiuno`/`veintiún` contraction, `ciento` vs `cien`,
      `y` only between tens and ones (`treinta y uno`, but `ciento uno`).
      (2026-08-21: the missing apocope before `mil` is fixed — 21 000 was
      `veintiuno mil`, now `veintiún mil` — as part of §1's gender work; the
      contraction before `millón`+ and the `cien`/`ciento`/`y` rules were
      already in. What's left here is a final conformance sweep.)
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
- [ ] **Reject ambiguous separator configurations.** `parseNumber` (and
      therefore `parseMoney`/`parsePercentage`, which delegate to it) accepts
      `thousandsSeparator === decimalSeparator` and then strips both, silently
      returning a wrong number: `parseNumber('0.001', { thousandsSeparator:
      '.', decimalSeparator: '.' })` is `1`. Found 2026-08-20 by the §5
      property tests, which now exclude the case with an `fc.pre` and a comment
      pointing here. Every other public function throws on input it cannot
      honor (`RangeError`/`TypeError`/`SyntaxError`), so the consistent fix is
      a `RangeError` from both `formatNumber` and `parseNumber` when the two
      separators are equal — decide before 1.0, since it turns silently-wrong
      output into a throw.
      Related, lower-stakes: `parseLongNotation` cannot read
      `toLongNotation`'s own output when `groupSeparator: ''`, because the
      scale word ends up glued to the next digit group ("1 million234
      thousand"). Either reject an empty `groupSeparator` at format time or
      document it as unsupported.
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
- [x] Round-trip property tests (`fast-check`) for every format/parse pair.
      (2026-08-20: `fast-check@4.9.0` (exact-pinned devDep) plus six
      `*.property.test.ts` files colocated beside the modules they cover —
      `number/format`, `money/format`, `percentage/format`, `number/byte-size`,
      `number/notation` (short *and* long) and `utils/base`, plus
      `number/roman` which is small enough to enumerate its whole 1–3999
      domain exhaustively instead of sampling. Each format/parse pair is
      checked against all four locales, i.e. all three separator conventions
      (`,`/`.`, ` `/`,`, `.`/`,`). The lossy formatters (`toByteSize`,
      `toShortNotation`) get a *bounded* round trip — relative error ≤ half a
      unit of the last kept digit — since exactness is not what they promise.
      Shared arbitraries live in `src/shared/arbitraries.test.ts` (named
      `.test.ts` so the build and the dts plugin both skip it); it generates
      decimals from integer parts rather than `fc.double`, so values always
      have a plain-digit `String()` form.
      **Three findings, all recorded rather than silently fixed:**
      (a) `parseNumber` with `thousandsSeparator === decimalSeparator` (e.g.
      both `'.'`) strips both and returns a silently wrong number — `0.001`
      parses as `1` — instead of throwing the way the rest of the package
      does on ambiguous input. See the §4 item added for it.
      (b) `parseLongNotation` cannot read `toLongNotation`'s own output when
      `groupSeparator: ''` ("1 million234 thousand"); the property excludes it
      and documents why.
      (c) Found 2026-08-21, while verifying the Scale naming decision (§1):
      `formatNumber`'s `'halfUp'`-rounding property test is flaky — it fails
      roughly 1 run in 5-10 with a counterexample like
      `[-268435456.47635, 4, 'halfUp']`. Reproduced deterministically outside
      `fast-check`: `formatNumber(-268435456.47635, { decimals: 4, roundingMode:
      'halfUp' })` round-trips to a value `0.000050008...` away from the
      input, a hair past the `0.00005` half-unit tolerance the property
      asserts — floating-point representation error at this magnitude, not a
      logic bug in the rounding itself. Not fixed here (out of scope for scale
      naming); needs its own pass, likely either a slightly looser tolerance
      for large-magnitude values or a decimal-safe rounding path (ties into
      the `arithmetic`/`round` decision in §1).)
- [ ] Cross-check `formatNumber` output against `Intl.NumberFormat` for all four
      locales — catches separator mistakes no human reviewer will spot.
- [ ] Native-speaker review of the `ru` and `es` word lists before publishing.
      Machine-generated number words are wrong in embarrassing, specific ways.
- [x] `bun test --coverage` in CI with an enforced threshold — "high test
      coverage" is an explicit success criterion in the project vision, so this
      needs a real number and a CI gate, not just running tests.
      (2026-08-20: `bunfig.toml` `[test].coverageThreshold = 0.98` plus a
      `test:coverage` script, which `ci.yml` runs *instead of* `bun test`.
      Two non-obvious things, both load-bearing:
      (a) the documented per-metric table form
      (`coverageThreshold = { line = …, function = … }`) is **silently ignored**
      by bun 1.3.13 — verified by setting it to 1.0 and watching the run pass —
      so only the scalar form works, and it is applied **per file**, not
      globally;
      (b) per-file thresholds only cover files a test actually loads, so a new
      module with no test would be *absent* from the report rather than failing
      it. `src/index.test.ts` and `src/locale/index.test.ts` (which also pin the
      57-export public surface and the four-locale barrel) import every module
      and close that hole.
      The gate is **100% per file**. It started at 98% because
      `locale/az.ts` had two copies of the same "find the last vowel or throw"
      scan — one for ordinal harmony, one for the locative suffix — and only
      the ordinal one was reachable (`az.ordinal.words` takes an arbitrary
      string; `azFractionWords` builds its input with `numberToWords`, which
      never emits a vowel-less word). Merging them into a single
      `lastVowel(word, context)` on a shared `VOWELS` set (2026-08-21) made the
      throw reachable, removed the duplicated vowel inventory, and let the gate
      go to 100% — the right way round: an uncoverable line is a signal about
      the code, not a reason to lower the number.
      Closing the reachable gaps needed four new tests (`toLongNotation`'s
      non-finite and over-magnitude throws, `ru.ordinal.words`'s derived-form
      fallback, `az.ordinal.words`'s no-vowel throw). Gate verified negatively
      by hiding a test file and watching the run fail.)
- [x] Smoke-test built `dist/index.cjs` on real Node versions to back the
      compatibility claim. (2026-08-20: `scripts/smoke.mjs` + four fixtures
      under `scripts/smoke/` — an ESM consumer, a CJS consumer, and a
      `moduleResolution: nodenext` typecheck of each. It runs `npm pack`,
      installs the tarball into throwaway consumer projects and executes them,
      so it is the only check that sees the package the way `npm install` hands
      it over: real `node_modules/num-fns`, real `exports` resolution, real
      Node. `bun run check:smoke` locally (and in `ci.yml`/`release.yml`);
      `--tarball <path>` reuses a prebuilt tarball, which is how the CI version
      matrix runs it. The runner is dependency-free plain ESM so it needs no
      install step in the matrix jobs. Verified negatively by deleting
      `dist/index.d.cts` and watching `types-cjs` fail. Node 14/16 are *not*
      covered — see the §7 matrix item for why the `engines` claim moved to
      `>=18` instead.)
- [x] Bundle-size assertion per locale — the selling point is that importing
      one locale doesn't pull in four. (2026-08-10: covered by the same
      `size-limit` config as §7's CI item — see that entry for details. The
      barrel (`dist/locale/index.js`, all four locales) measures 3.34 kB
      brotli vs. 0.72–1.4 kB for any single `locale/<code>` subpath import,
      which is the actual evidence for the tree-shaking claim, not just an
      assertion of it.)
- [ ] Micro-benchmarks for `formatNumber` / `numberToWords` on large inputs.
- [ ] Test coverage for the new arithmetic/stats/financial/utils domains once
      built — same bar as existing modules (default behavior, option override,
      thrown-error cases).

## 6. Tooling & DX

- [x] Pre-commit hook running `bun run check`. (2026-08-10: superseded the
      versioned `.githooks/pre-commit` approach below with
      [lefthook](https://lefthook.dev) (`lefthook.yml`), installed
      automatically via the `prepare` script in `package.json` — so it's no
      longer opt-in. `.githooks/` (the old no-op-stub `pre-commit`) has since
      been deleted — confirmed gone from the repo as of 2026-08-10, resolving
      the earlier note about needing normal (non-mounted) filesystem access
      to remove it. Original 2026-08-10 note, now outdated: "versioned
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
- [x] `check:circular` — was `madge --circular`, which crashed at
      require-time against this repo's pinned `typescript@7.0.2` (see the
      now-resolved note this replaces: `@typescript-eslint/typescript-estree`
      declares `peerDependencies: { typescript: ">=4.8.4 <6.1.0" }`). Fixed
      2026-08-10 (commit `374fa7b`) by swapping to `dpdm` (option (c) from
      the original list — a circular-dependency tool that doesn't depend on
      `typescript-estree`), not by waiting for a fix or making the check
      permanently non-blocking. `bun run check:circular` now runs clean
      ("no circular dependency was found") — verified directly, not just by
      reading the script. `continue-on-error: true` removed from both
      `ci.yml` and `release.yml` for this step now that it's a real gate
      again; `check:unused` (knip) stays non-blocking, see below.
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
- [x] Renovate or Dependabot (relevant given `bunfig.toml` pins exact versions).
      (2026-08-10: `renovate.json` at the repo root, extending
      `config:recommended`. `rangeStrategy: "bump"` everywhere — every
      dependency in `package.json` is already an exact version because of
      `bunfig.toml`'s `install.exact = true`, so Renovate bumps the pinned
      version in place rather than widening it to a range. Grouped
      lockstep-versioned tool pairs (`@biomejs/biome`, the Changesets pair,
      the commitlint pair, `vite`+`vite-plugin-dts`) so a partial bump can't
      land. `typescript`/`@typescript/typescript6` require manual dashboard
      approval — they're pinned to the 7.x prerelease line on purpose (see
      `CLAUDE.md`'s tech stack table) and shouldn't move without a human
      looking. Weekly schedule (`before 6am on monday`) plus lock-file
      maintenance on the same cadence. Unverified against a live Renovate
      run — no Renovate GitHub App install/token available in this sandbox
      to confirm the config parses and onboards cleanly; worth checking the
      Dependency Dashboard issue after the app is enabled on the repo.)
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
      input surfaces the real error. Run with `bun run
      site:dev` / `bun run site:build` (outputs to `site-dist/`, gitignored
      via `site-dist*`); `build.emptyOutDir: false` for the same reason as
      the root `vite.config.ts` — this repo's connected-folder mount blocks
      `unlink()`, so emptying the out dir before a second build fails with
      `EPERM`.

      2026-08-18: did the "pick a locale" half, now that §1's locale-threading
      landed. Every example whose real function accepts `options.locale`
      (number formatting, words, ordinals, notation, money, percentage — 18
      of the ~45 examples) gained a live `locale` select, via a new
      `ValueType: 'locale'` in `site/src/types.ts` that `engine.ts`'s
      `coerceValue` resolves from a code string to the real `Locale` object
      (`site/src/locales.ts`'s `localeByCode`), and that `toLiteral` renders
      as a bare identifier (`az`, not `"az"` or a dump of the object — the
      object isn't serializable anyway, `renderGroup`/`compose` are
      functions) in the displayed call snippet. Fields whose real default
      comes from the locale rather than a fixed value
      (`thousandsSeparator`/`decimalSeparator`/`symbol`/`symbolPosition`/
      `majorUnit`/`minorUnit`) were converted to the sentinel
      `omitWhenDefault` pattern `engine.ts`'s doc comment had anticipated but
      never used — left blank, they're omitted from the call so the locale's
      own default applies; typed in, they override it explicitly, same as a
      real caller. `numberToWords`/`toOrdinal`/etc.'s example `value` fields
      that were literal az-formatted strings (`'1 234 567,89'`, `'2,5 mln'`)
      were updated to match the new default locale (`en`). The "Locales"
      section keeps its read-only per-locale data browser (useful on its own
      merits) but dropped the "not wired in yet" framing and its
      Implemented/Planned status column, replacing it with a
      `fractionToWords`-support column — the one function that isn't
      uniformly implemented across all four locales.

      Along the way, found and fixed a real regression from the §1
      locale-threading pass: `cardinalToOrdinalWords` (transforms an
      already-computed cardinal reading into its ordinal form) was a public
      export before that pass and got silently dropped when its
      implementation moved into locale objects — the site's registry.ts
      still imported it, so the playground wouldn't even have compiled.
      Restored it in `number/suffix.ts` as a thin wrapper around
      `locale.ordinal.words` (passing `NaN` for the unused `value`
      parameter every current locale's `ordinal.words` ignores — see its
      doc comment), with tests and a changeset. Also fixed two latent bugs
      the new locale-picker work exposed: `toShortNotation`/
      `parseShortNotation`'s example fields were still passing a raw
      `'az'`/`'en'` string where the real function now requires a `Locale`
      object (silently broken since §1 landed, since nothing had exercised
      it), and `toOrdinal`'s `separator` field was still wired as a
      positional argument after that function's separator moved into its
      options object. Verified end-to-end with an ad hoc jsdom-style smoke
      test (a headless `happy-dom` window executing the real built bundle,
      not committed to the repo) confirming all 45 cards mount without
      errors, all 18 locale selects list `az`/`en`/`ru`/`es`, and switching
      a card's locale select actually re-renders the result.)
- [x] Scaffolding script(s) under `scripts/` for "add a new function" and "add
      a new locale" — generates the file + colocated test + index.ts export,
      so `CONTRIBUTING.md` (§8) can point at a command instead of prose.
      (2026-08-10: "add a new function" half done —
      `scripts/new-function.ts`, run via `bun run new:function <directory>
      <functionName>`. Generates `src/<directory>/<kebab-name>.ts` +
      colocated `<kebab-name>.test.ts` from templates matching the
      conventions in `CONTRIBUTING.md`/`src/arithmetic/clamp.ts` (named
      export, JSDoc `@example` placeholder, throw-on-bad-input reminder
      comment), inserts the `export * from` line into `src/index.ts` at the
      correct alphabetical position (parses existing lines rather than
      assuming a fixed insertion point), rejects a name that already
      exists, and runs `biome format --write` on the generated files before
      exiting. `CONTRIBUTING.md`'s "How to add a new function" section now
      leads with this as step 0. Verified against a real scratch copy of
      the repo (not just read) — insertion at the start/middle/end of
      `src/index.ts`, PascalCase-to-camelCase and camelCase-to-kebab-case
      name conversion, duplicate-name rejection, and that the generated
      test file actually passes `bun test` and `biome lint`. Added
      `scripts` to `tsconfig.json`'s `include` and to `knip.json`'s
      `entry`/`project` so the script itself is typechecked and doesn't
      trip `check:unused` as a dead file. "add a new locale" scaffolding
      still unstarted — locale files are more structurally varied (see
      `src/locale/es.ts`'s ordinal-of-every-token deviation) than a single
      template can cleanly cover; worth revisiting once a second
      from-scratch locale (beyond `en`/`ru`/`es`) exists to generalize
      from.)
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
- [x] CI matrix across Node versions. (2026-08-20: `ci.yml` gained a `smoke`
      job — `needs: build`, matrix `18`/`20`/`22`/`24` on `ubuntu-latest` plus
      `22` on `macos-latest` and `windows-latest`, `fail-fast: false`. The
      `build` job packs one tarball and uploads it as an artifact, so every
      matrix job installs identical bytes and needs neither Bun nor a build.
      Runs the runtime fixtures from §5's smoke script; the `--types` pass
      stays in the `build` job since it needs a modern `tsc`.
      **`engines.node` went `>=14` -> `>=18`** as part of this: 14 and 16 are
      long EOL and `ubuntu-latest` can no longer install them, so backing the
      old claim would have meant pinning a deprecated `ubuntu-22.04` runner.
      The build still targets es2018 and uses no post-2018 runtime API, so it
      very likely keeps working on 14/16 — the package just stops promising
      what CI cannot check. Windows is in the matrix because path separators in
      `exports` resolution are the realistic platform-specific failure.)
- [x] `size-limit` check in CI. (2026-08-10: `size-limit` +
      `@size-limit/preset-small-lib` (esbuild + brotli, matching the
      preset's own "libraries < 10 kB" scope this package fits). Config
      lives in package.json's `size-limit` array — six entries: the full
      `dist/index.js` surface (6 KB limit, measures 4.32 kB), the
      `dist/locale/index.js` barrel (5 KB limit, 3.34 kB), and each of
      `locale/az`/`en`/`ru`/`es` individually (limits 1.1–2 KB, each
      measuring under 1.4 kB) — also resolves the §5 "bundle-size assertion
      per locale" item, since the per-locale entries are exactly that
      assertion. Limits set with roughly 30–50% headroom over the measured
      brotli size, not exact-fit, so routine growth doesn't false-positive
      but a real regression (e.g. an accidental cross-locale import) still
      trips it. New `bun run size` script; `ci.yml` runs it after `bun run
      build` (size-limit needs the built `dist/` output, not source).
      Verified with a real `bunx size-limit` run against a fresh build, not
      just by reading the config.)
- [ ] First publish to npm — still unpublished at `0.1.0`; name is confirmed
      available (see §0) but not reserved. The first `changeset version` run
      will bump this off `0.1.0`, so this item and the version number should
      be revisited together.

## 8. Documentation

- [ ] Full API reference covering every export and its options.
- [x] Locale support matrix — which functions are implemented for which locale,
      and where a locale is knowingly incomplete. (2026-08-18: added as
      README's "Locale support" section, alongside the locale-threading work
      above — a two-column table since every threaded function now covers
      all four locales uniformly, with `fractionToWords`'s `az`/`en`-only
      status called out separately since it's the one locale-dependent gap.)
- [x] Migration note for anyone who found the package as `az-number-utils`.
      (2026-08-10: expanded the README's old one-line "History" section into
      "Migrating from `az-number-utils`" — confirmed via the npm registry
      that `az-number-utils` was never published, so the note says so
      explicitly rather than leaving readers to wonder whether they need to
      `npm uninstall` an old package.)
- [x] Badges: npm version, CI status, license, bundle size. (2026-08-10:
      added to the top of `README.md` — npm version and bundlephobia bundle
      size point at the `num-fns` npm page/API and will render "not found"
      until the first publish lands (§7); CI status links
      `.github/workflows/ci.yml`'s badge, license is a static shields.io
      badge rather than the npm-registry-backed one, so it renders correctly
      even pre-publish.)
- [x] `CONTRIBUTING.md` — doesn't exist yet. Needs, per the project vision,
      explicit sections for: (2026-08-09: written, covering all sections
      below. The §6 scaffolding script and §2 locale conformance suite don't
      exist yet, so those two sections describe the current manual process
      and note what they'll point at once built — revisit both sections when
      those land so the guide doesn't go stale. 2026-08-10: "How to add a new
      function" revisited now that the function half of the §6 scaffolding
      script exists — leads with `bun run new:function` as step 0. "How to
      add a new locale" is unchanged and still describes the manual process,
      since locale scaffolding is still unstarted.)
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
