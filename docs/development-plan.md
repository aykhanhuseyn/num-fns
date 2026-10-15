# Development plan

The task list behind [`ROADMAP.md`](../ROADMAP.md). One task is one pull
request (or one commit series on `main`). Each task has: what, why, files,
done-when, size.

Sizes: **S** = under 2 hours, **M** = half a day, **L** = one to two days.

## How we work

```
 issue ──► commits on main ──► changeset ──► CI ──► "version packages" PR ──► npm
           (CLAUDE.local.md: no branches unless asked)
```

- Every user-visible change gets a changeset (`bun run changeset`).
- A breaking change in `0.x` is a **minor** bump. Put `!` in the commit
  type (`feat!:`) and say "Breaking" in the changeset.
- Before `1.0.0`, nothing ships without: test, JSDoc, README line, changeset,
  playground registry entry.
- Each milestone ends with the full gate:
  `bun run check && bun run test:coverage && bun run build && bun run
  check:pack && bun run check:smoke && bun run size && bun run bench`.
- **No new domain and no new locale before `1.0.0`.** If an idea arrives,
  it goes to a GitHub issue with milestone `after-1.0`.

### Definition of done for a task

1. Tests cover the default, one option override, and every thrown error.
2. Per-file coverage stays 100 %.
3. JSDoc has an `@example` and `@since`.
4. README and `site/src/registry.ts` know about the change.
5. `size-limit` passes, or the new budget is in the same change with the
   measured number.
6. `bench` shows no regression over 10 % without a written reason.

---

## Milestone 0.7.0 — shape and rule (target Nov 2026)

Order matters. 0.7-0 before 0.7-2. 0.7-1 before anything that touches
`Locale`.

### 0.7-0 Benchmarks (M)

- **What:** `bench/` with [`mitata`](https://github.com/evanwashere/mitata).
  Cases: `formatNumber` on `1`, `1e6`, `1234567.891`, `1e21`,
  `Number.MAX_VALUE`; `numberToWords(1e15)` in `en` and `ru`; `add` ×
  100 000; `sum` of 100 000 decimals; `parseNumber("1,234,567.89")`.
  `bun run bench` prints a table. CI runs it and stores the text as an
  artifact. Baseline committed to `bench/BASELINE.md`.
- **Why:** `formatNumber` does `BigInt` work on every call since 0.6.0. We
  do not know what that costs. Every later task is measured against this.
- **Files:** `bench/*.bench.ts`, `bench/BASELINE.md`, `package.json`
  (`bench` script, `mitata` dev dependency, exact version per
  `bunfig.toml`), `.github/workflows/ci.yml`, `knip.json`.
- **Done when:** baseline table is committed; CI uploads the artifact.

### 0.7-1 `Locale` extensibility spike (L)

- **What:** on a local branch (not pushed), write the smallest possible
  `hi-IN`, `zh`, `ar` locales and run the conformance suite. Record, per
  locale: "works", "needs optional field X", or "needs breaking change Y".
  - `hi-IN`: `formatNumber(1234567)` must give `12,34,567`. Words need
    `thousand`, `lakh` (10⁵), `crore` (10⁷). Today `toThousandGroups` is
    base-1000 only and `scales` are assumed to be 10³ⁿ.
  - `zh`: scales 万 (10⁴), 億 (10⁸). Base-10 000 chunking.
  - `ar`: output digits `٠١٢٣٤٥٦٧٨٩`; `parseNumber` must read them back.
- **Land in 0.7.0:** every optional field the spike needs, with `en`
  defaults, plus the tests that pin the default:
  - `Locale.formatDefaults.grouping?: readonly number[]` (default `[3]`).
  - `Locale.words.scaleStep?: number` (default `3` = base 1000; `4` for
    CJK) and scales that may declare their own exponent for lakh/crore.
  - `Locale.digits?: readonly [string × 10]`.
  `toThousandGroups` becomes `toScaleGroups(value, step)`.
- **Why:** the package is called polyglot. If `hi` or `zh` forces `2.0.0`
  six months after `1.0.0`, the `1.0.0` promise was false. We find out
  now, while a required-field change is still a minor bump.
- **Files:** `src/locale/types.ts`, `src/shared/bigint.ts`,
  `src/number/format.ts`, `src/number/words.ts`, `src/number/notation.ts`,
  `src/locale/conformance.test.ts`, `docs/decisions/0007-locale-grouping.md`
  (the finding).
- **Done when:** five shipped locales are byte-identical in output before
  and after (the conformance suite proves it); the finding is written; the
  spike locales are deleted.
- **Breaking:** only if the spike finds no optional form. Then it lands
  here, in 0.7, with a changeset that says so.

### 0.7-2 Exact statistics (M)

- **What:** `sum`, `mean`, `median`, `percentile`, `quantile` accumulate
  with `arithmetic/add` and divide with `arithmetic/divide`. `variance` and
  `standardDeviation` build the sum of squares with
  `subtract`/`multiply`/`add` and call `Math.sqrt` last. `min`/`max`/`mode`
  compare only and do not change.
- **Why:** `sum([0.1, 0.2])` is `0.30000000000000004`; `add(0.1, 0.2)` is
  `0.3`. One package, two answers.
- **Files:** `src/stats/*.ts`, their tests, new
  `src/stats/stats.property.test.ts` (`sum(xs) === xs.reduce(add, 0)`;
  `mean(xs) === divide(sum(xs), xs.length)`).
- **Done when:** property test passes 10 000 runs; README "Arithmetic"
  says stats are exact up to `sqrt`; `bench` shows the cost.
- **Gate:** if `sum` of 100 000 decimals is more than 20× the baseline, add
  a fast path: when every value is a safe integer, use `+`. The number 20
  is the budget; the benchmark decides.

### 0.7-3 Locale-driven ordinal separator (S)

- **What:** `LocaleOrdinal.separator: string` (required; every shipped
  locale sets it). `toOrdinal` uses it when the caller passes none.
  `en`/`enGB`: `''` → `"3rd"`. `az`: `'-'` → `"3-cü"`. `ru`: `'-'` →
  `"3-й"`. `es`: `''` → `"3º"` (confirm in 0.9-3 review).
- **Why:** `"3-rd"` is not English. The hyphen is an Azerbaijani habit.
- **Files:** `src/locale/types.ts`, `src/locale/*.ts`,
  `src/number/suffix.ts`, `src/locale/conformance.test.ts`, README.
- **Done when:** README shows `toOrdinal(3) // "3rd"`; changeset marked
  breaking. A custom locale written against 0.6 gets a `TypeError` from
  the conformance check, not a silent `undefined`.

### 0.7-4 Locale-driven money spacing (S)

- **What:** `LocaleCurrency.symbolSpacing: boolean`. `en`/`enGB`: `false`
  → `"$1,234.50"`, `"£1,234.50"`. `az`, `ru`, `es`: `true`. New option
  `symbolSpacing` on `MoneyFormatOptions` overrides it. `parseMoney`
  accepts both forms in every locale (it already strips whitespace; verify).
- **Files:** `src/locale/types.ts`, `src/locale/*.ts`,
  `src/money/format.ts`, `src/shared/types.ts`,
  `src/money/format.property.test.ts`.
- **Done when:** round trip `parseMoney(formatMoney(n)) === n` holds in all
  five locales with both spacings.

### 0.7-5 Node and runtime support policy (S)

- **What:** `engines.node` → `>=20`. Smoke matrix → 20, 22, 24. README gets
  a "Runtime support" section: Node 20+; Bun; Deno; browsers with `BigInt`
  (Chrome 67+, Firefox 68+, Safari 14+); ES2018 output; no polyfill
  shipped. React Native: Hermes 0.70+ has `BigInt`; older engines throw.
- **Why:** Node 18 is end-of-life. `BigInt` is on every `formatNumber`
  call since 0.6.0 and nobody has written that down.
- **Files:** `package.json`, `.github/workflows/ci.yml`, README.

### 0.7-6 Release 0.7.0 (S)

- `bun run version`, read the CHANGELOG as a user, publish.

---

## Milestone 0.8.0 — docs and proof (target Dec 2026)

No API change in this milestone.

### 0.8-1 API reference (M)

- **What:** TypeDoc over `src/index.ts` and `src/locale/index.ts`, output
  to `site/dist/api/`, deployed by `pages.yml` beside the playground. The
  playground header links to it; every playground card links to its page.
- **Files:** `typedoc.json`, `package.json` (`docs:api`), `pages.yml`,
  `site/src/card.ts`.
- **Done when:** `typedoc --treatWarningsAsErrors` passes; every one of the
  54 + locale exports has a page.

### 0.8-2 JSDoc audit (M)

- **What:** every export: one-line summary, `@param`, `@returns`,
  `@throws`, `@example`, `@since`. Remove dates and `todo.md §` references
  from public JSDoc. They mean nothing to a user. (Internal comments may
  keep them.)
- **Done when:** 0.8-1 builds warning-free.

### 0.8-3 Type-level tests (S)

- **What:** `expect-type` (dev dependency). `src/types.test-d.ts` or inline
  `expectTypeOf` in the existing tests: `parseNumber(s, { output: 'bigint'
  })` is `bigint`; omitted is `number`; a `ParseOutput` variable gives the
  union. Same for `parseMoney`, `parsePercentage`, `parseShortNotation`,
  `parseLongNotation`, `parseByteSize`, `fromBase`.
- **Why:** overloads are a 1.0 contract. `attw` checks packaging, not
  inference.

### 0.8-4 `docs/versioning.md` (S)

- **What:** one page. Patch: bug fix, locale word correction, doc.
  Minor: new function, new locale, new optional field, new currency code,
  change of a locale's default format (with a changeset that shows before/
  after). Major: removed or renamed export, required `Locale` field,
  changed thrown error type, changed default locale.
- **Why:** a reviewer will correct words after 1.0. We need to know what
  bump that is before it happens.

### 0.8-5 Archive `todo.md` (M)

- **What:** `git mv todo.md docs/archive/todo-2026.md`. Add a header: "Frozen
  2026-12. Do not edit. Cited as `todo.md §N` in source comments." Every
  open `[ ]` item becomes a GitHub issue with milestone `0.9.0` or
  `after-1.0`. Update links in README and CLAUDE.md.
- **Why:** 98 KB of journal is not a backlog. But the citations in source
  comments must keep resolving, so move, do not delete.

### 0.8-6 Six ADRs (M)

- **What:** `docs/decisions/0001-no-intl.md`, `0002-default-locale-en.md`,
  `0003-colocated-tests.md`, `0004-no-format-parse-split.md`,
  `0005-raw-numbers-no-decimal-type.md`, `0006-throw-not-nan.md`. Each
  10–20 lines: context, decision, consequences, date. Content comes from
  the matching `todo.md` section; cite it.
- **Why:** these six are the decisions a newcomer (or an AI assistant) will
  re-propose. `CLAUDE.md` says "do not re-propose" today with a long
  explanation; the ADR is where that explanation belongs.

### 0.8-7 Slim `CLAUDE.md` (M)

- **What:** keep: what the package is (5 lines), commands, directory map,
  conventions, the "do not re-propose" list as links to ADRs. Remove every
  dated paragraph; link the ADR or the CHANGELOG entry instead. Target
  under 10 KB (today 42 KB).
- **Done when:** a new contributor can read it in five minutes.

### 0.8-8 Repository hygiene (S)

- `.github/ISSUE_TEMPLATE/bug.yml`, `feature.yml`, `locale.yml` (field:
  "Are you a native speaker? Will you review the words page?"),
  `PULL_REQUEST_TEMPLATE.md` (checklist = definition of done),
  `SECURITY.md` (report by email, 90-day window), `CODE_OF_CONDUCT.md`
  (Contributor Covenant). Enable Discussions for locale questions.

### 0.8-9 Release 0.8.0 (S)

---

## Milestone 0.9.0 — freeze (target Jan 2027)

### 0.9-1 API review (M)

- **What:** `docs/api-review-1.0.md`: a table of every root and
  `num-fns/locale` export — name, pattern (`formatX/parseX`,
  `toX/fromX`, `xToWords`, verb), options, decision.
- **Decisions to make, with the default answer:**
  - Renames: **no**. Churn costs more than consistency gains. Write the
    pattern down for new functions: `formatX/parseX` for text with
    options; `toX/fromX` for lossless pure conversions; `xToWords` for
    spelling.
  - `setConfig`: **keep**, README rule "for applications, not libraries;
    a library uses the per-call `noThrow`".
  - `withSuffix`: keep; it is the generic form of `toOrdinal`.
  - `getOrdinalSuffix`: keep.
  - `isEven`/`isOdd`: keep; `isInteger` stays rejected.
  - Anything with no decision in the table blocks the RC.
- **Done when:** the table is complete and every row says "keep" or
  "deprecate → X".

### 0.9-2 `defineLocale` / `extendLocale` (M)

- **What:** two exports from `num-fns/locale`:
  - `defineLocale(input: Locale): Locale` — runtime validation: `ones`
    length 10, `tens` length 10 (or 8 with `teens`), `scales` not empty,
    `infinity` present, every `units` key a known `CurrencyCode`,
    `ordinal.separator` a string, `grouping` all positive integers. Throws
    `TypeError` naming the field.
  - `extendLocale(base, overrides)` — deep merge; what `en-gb.ts` does by
    hand.
- **Why:** the `Locale` interface is final after 0.7. A custom-locale
  author needs an error at definition time, not a wrong word in
  production.
- **Files:** `src/locale/define.ts`, `src/locale/extend.ts`, tests,
  `src/locale/en-gb.ts` rebuilt on `extendLocale` (byte-identical output,
  `locale/en-gb.test.ts` proves it), `src/locale/index.ts` and its export
  list test, `CONTRIBUTING.md`.
- **Note:** root export list stays at 54.

### 0.9-3 Native-speaker review of `ru` and `es` (M + external wait)

- **What:** send `site/review.html` to one speaker per locale. Apply fixes
  as patches. Record `reviewed: <date> by <handle>` in the locale file
  header and in the README locale table. Include the `es` `"3º"` ordinal
  check and the flagged currency spellings (гяпик, kopek/kopeck, gapik).
- **Also:** `fractionToWords` vocabulary for `ru`/`es` if the reviewer can
  give it. Otherwise the table says "fractions: not supported".
- **Fallback:** no reviewer by the RC date → `ru`/`es` ship labelled
  "machine-generated, not reviewed". The API is still stable; words are
  data and a correction is a patch (0.8-4).
- **Where to find reviewers:** the `locale.yml` issue template, GitHub
  Discussions, colleagues at iktex.

### 0.9-4 Migration guide (S)

- `docs/migrating-to-1.0.md`: every breaking change since `0.2.0` in one
  table — before, after, how to fix. Default locale `en`; `toOrdinal`
  separator option; `toShortNotation` `locale` object; `parseLongNotation`
  `RangeError` past safe range; ordinal separator and money spacing
  (0.7); any `Locale` field change (0.7-1). Linked from the README status
  callout.

### 0.9-5 `1.0.0-rc.0` and dogfooding (2 weeks, S of work)

- `bunx changeset pre enter rc`. Publish `1.0.0-rc.0`.
- Install it in DressOS and Vision Floors. Replace their local number and
  money formatting with `num-fns` calls. Every surprise is a bug or a doc
  gap; file each one.
- Only fixes land. After two weeks: `bunx changeset pre exit`.

---

## Milestone 1.0.0 — ship (target Feb–Mar 2027)

### 1.0-1 Remove deprecated code (S)
### 1.0-2 Final docs (S)
- README status callout: "Stable. Follows semver; see
  `docs/versioning.md`." Remove the `az-number-utils` migration section
  (it was never published; nobody migrates from it).
### 1.0-3 Release (S)
- Publish. GitHub release notes from CHANGELOG. One announcement.
  `src/index.test.ts` gets the comment "frozen at 1.0.0 — additions only".

---

## After 1.0.0

Each item is a minor release. Order can change; the rule "reviewer first"
cannot.

### 1.1 — `wordsToNumber` (L)

- Per-locale parser built from `Locale.words` tables: a token → value map
  plus the scale rules. Start with `en` and `az`; `ru`/`es` need the
  inflected forms in the map (`тысяча`/`тысячи`/`тысяч` all → 10³).
  Property test: `wordsToNumber(numberToWords(n)) === n`.
- Why first: it is the only domain without a parser, and it needs no
  external reviewer.

### 1.2 — `ar` and digit systems (L + reviewer)

- `Locale.digits` used for real. Arabic-Indic output and parse.
  Right-to-left does not change the string; it is a rendering concern.
  `SAR`, `AED` added to `CurrencyCode` and to every locale's `units`.

### 1.3 — `tr` (M + author review)

- Same structure as `az`. The author can review it directly. `TRY`.

### 1.4 and onward — one locale per minor

- `hi-IN` (lakh/crore, `INR`), `de` (compound words), `fr`
  (`quatre-vingt-dix`), `pt-BR`, `fa`, `zh`. A branch opens only when a
  reviewer is confirmed in the `locale.yml` issue.

### Always on

- `formatNumber` fast path: safe integer with `decimals: 0` skips
  `toDecimal`. Benchmark-gated.
- Renovate: merge weekly. Bun, TypeScript and Vite majors by hand.
- `size-limit` budgets: raise only with the measured number in the
  changeset.

## Risks

| Risk | Effect | Plan |
|---|---|---|
| Scope creep (new domains, new locales) | 1.0 never ships | hard rule: nothing new before 1.0; issues go to `after-1.0` |
| Spike finds a breaking `Locale` change | delays 0.7 | it lands in 0.7 while it is still a minor bump — that is why the spike is first |
| No native speaker for `ru`/`es` | wrong words at 1.0 | ship labelled "not reviewed"; corrections are patches |
| Exact stats too slow | users complain | integer fast path; benchmark decides; document the cost |
| One maintainer | bus factor | ADRs + slim CLAUDE.md + templates so a second person can start |
| Dogfooding finds a design flaw in RC | late breaking change | better in RC than after 1.0; extend RC, do not skip |
