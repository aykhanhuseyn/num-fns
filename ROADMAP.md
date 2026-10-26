# Roadmap

This file is the plan for `num-fns`: what we do before `1.0.0`, and what we
do after. The task list is in [`docs/development-plan.md`](./docs/development-plan.md).
The reasoning behind the shape of this plan is in
[`docs/plan-review-2026-10-14.md`](./docs/plan-review-2026-10-14.md).

Rules for this file:

- It holds decisions, targets and dates. Not notes.
- Day-to-day items go to GitHub issues with a milestone.
- Closed decisions go to `docs/decisions/`.
- **No new domain and no new locale before `1.0.0`.** The surface we have is
  the surface we ship.

## Where we are (2026-10-14)

```
 0.2.0 ── 0.3.0 ── 0.4.0 ── 0.5.0 ── 0.6.0        all on npm, `latest` = 0.6.0
   │        │        │        │        │
 first   multi-   exact    exact    noThrow,
 stable  currency arith,   words    -0, edge
                  bigint                cases
```

- 54 public functions, 5 locales (`az`, `en`, `enGB`, `ru`, `es`).
- 100 % per-file coverage, property tests, `attw` strict, `publint`,
  `size-limit`, consumer smoke matrix.
- Playground and native-speaker review page on GitHub Pages.
- Changesets + npm trusted publishing. Works.
- Known gaps: `sum` and `add` disagree; `ru`/`es` words not reviewed by a
  native speaker; no API reference; no benchmarks; `Locale` cannot express
  Indian or CJK grouping; `todo.md` is a 98 KB journal.

## What `1.0.0` means

1. The public API — 54 root functions, their options, the `Locale`
   interface, the `num-fns/locale` exports — changes only by addition until
   `2.0.0`.
2. One rule for every function: exact decimal results, throw on bad input,
   `noThrow` as the opt-out. No exceptions.
3. Every locale shows a review status. A user can see if a native speaker
   checked the words.
4. Every function has a reference page.
5. Runtime support is written down (Node, browsers, `BigInt` requirement).

Locales are data. More of them come in minor versions.

## Path to `1.0.0`

```
   0.7.0              0.8.0              0.9.0              1.0.0
 "shape & rule"     "docs & proof"     "freeze"           "ship"
  Nov 2026           Dec 2026           Jan 2027           Feb–Mar 2027
 ───┬──────────────────┬──────────────────┬──────────────────┬──
    │ benchmarks first │ API reference    │ API review       │ remove
    │ Locale spike:    │ type tests       │ defineLocale     │ deprecated
    │  hi-IN, zh, ar   │ versioning.md    │ ru/es review     │ final docs
    │ exact stats      │ runtime support  │ migration guide  │ announce
    │ ordinal/money    │ todo.md archived │ rc.0 + dogfood   │
    │  defaults        │ 6 ADRs, hygiene  │  (DressOS, VF)   │
    │ Node >= 20       │ slim CLAUDE.md   │                  │
```

### 0.7.0 — shape and rule (Nov 2026)

All breaking changes happen here, early, while we are still `0.x`.

**Status (2026-10-25): all tasks done on `main`; release pending.** The
CHANGELOG entries (`.changeset/*.md`) list every breaking change with a
before/after table.

- **Benchmarks first.** `bench/` with a committed baseline. Every change
  below is measured against it.
- **`Locale` extensibility spike.** Write throw-away `hi-IN`, `zh`, `ar`
  locales to find what the interface cannot say. Land what they need as
  **optional** fields with `en` defaults. *Outcome:* `formatDefaults.grouping`
  (`[3, 2]` writes `12,34,567`), `words.grouping` (one CLDR-style list for
  every scale ladder — `[3, 2]` lakh/crore, `[4]` 万/亿 — instead of a
  separate `scaleBase`), `digits` (Arabic-Indic), `ordinal.prefix` (第3),
  and `PluralCategory` completed to CLDR's six. The spike locales did not
  ship; the finding is `docs/decisions/0007-locale-grouping.md`.
- **Exact statistics.** `sum`, `mean`, `median`, `percentile`, `quantile`,
  `variance`, `standardDeviation` use `add`/`subtract`/`multiply`/`divide`.
  `sqrt` is the only float step. Fast path for safe integers if the
  benchmark says so.
- **Locale-driven defaults.** `toOrdinal(3)` → `"3rd"` in `en` (was
  `"3-rd"`). `formatMoney(1234.5)` → `"$1,234.50"` in `en` (was
  `"$ 1,234.50"`). `az` keeps `"3-cü"` and `"9,99 ₼"`. New required locale
  fields: `ordinal.separator`, `currency.symbolSpacing`.
- **Node >= 20.** Node 18 is end-of-life. Smoke matrix becomes 20/22/24.

### 0.8.0 — docs and proof (Dec 2026)

No API change.

- API reference from JSDoc (TypeDoc) at `/api/` beside the playground.
  Build fails on a missing doc comment.
- Type-level tests (`expect-type`) for every overloaded parser.
- `docs/versioning.md`: what is a patch, minor, major — for code and for
  locale data.
- ~~README "Runtime support"~~ — done early, in 0.7-5.
- `todo.md` moves to `docs/archive/todo-2026.md`, frozen. Open items
  become issues. Six ADRs in `docs/decisions/` for the decisions a
  newcomer would re-propose.
- `CLAUDE.md` cut to rules only (target under 10 KB).
- Issue and PR templates, `SECURITY.md`, `CODE_OF_CONDUCT.md`.
- Type check with `bun check` instead of `tsc` (Bun >= 1.4.3). CI uses
  the Bun version pinned in `package.json`.

### 0.9.0 — freeze (Jan 2027)

Bug fixes only after `rc.0`.

- **API review.** One table: every export, its naming pattern, its
  decision. Default: no renames. Decide `setConfig`'s role: "for
  applications, not libraries".
- **`defineLocale` / `extendLocale`** in `num-fns/locale`, now that the
  shape is final. `enGB` is rebuilt on `extendLocale`.
- **Native-speaker review** of `ru` and `es` via `site/review.html`.
  Result in the README locale table. Fallback: ship labelled "not
  reviewed". The API is still stable.
- **Migration guide** `docs/migrating-to-1.0.md`: every breaking change
  since `0.2.0`, before/after.
- **`1.0.0-rc.0`**, then two weeks in DressOS and Vision Floors.

### 1.0.0 — ship (Feb–Mar 2027)

- Remove `@deprecated` items. Final README, CHANGELOG. One announcement.
- `src/index.test.ts` export list becomes the contract.

## After `1.0.0`

```
 1.0 ──► 1.1 ──► 1.2 ──► 1.3 ──► 1.4 ──► … ──► 2.0 (only if forced)
         │       │       │       │
       words→   ar +    tr      hi-IN
       number   digits          + more, one per minor
```

- **1.1 — `wordsToNumber`.** The inverse of `numberToWords`, per locale,
  built from the same tables. The only domain today without a parser.
- **1.2 — `ar` and digit systems.** `Locale.digits` used for real. First
  right-to-left locale; first non-Latin digits. `SAR`, `AED` currencies.
- **1.3 — `tr`.** Closest to `az`; the author can review it. `TRY`.
- **1.4 onward — one locale per minor.** `hi-IN` (lakh/crore), `de`, `fr`,
  `pt-BR`, `fa`, `zh`. Order follows who volunteers as reviewer. A locale
  branch opens only after a reviewer is confirmed.
- **Later ideas, not planned:** `formatUnit` (SI), `formatRange`, roman
  numerals above 3999.
- **Always:** `formatNumber` fast path for safe integers; bundle budget;
  Renovate.
- **2.0.0** only if `Locale` needs a required field we cannot add as
  optional. The 0.7 spike exists to make this unlikely.

## Non-goals

- No `Intl`. Results are the same on every runtime (decided 2026-09-20).
- No decimal type, no bignum dependency. `number` and `bigint` only.
- No dates, durations, phone numbers, CLI.
