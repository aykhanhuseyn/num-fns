# Plan review — 2026-10-14

A critical read of the first draft of `ROADMAP.md` and
`docs/development-plan.md`. Each finding says what was wrong and what the
second draft does instead. Keep this file: it shows why the plan has the
shape it has.

## Order problems

**R1. Breaking changes were planned in the release candidate.**
Draft 1 put the `Locale` spike (`hi-IN`, `zh`, `ar`) in 0.9.0, the RC. An
RC with interface changes is not an RC. Also, `defineLocale` (0.7) would
validate a shape that the spike (0.9) then changes.
→ The spike moves to **0.7.0**, first task. `defineLocale` moves to 0.9,
after the shape is final. The RC gets bug fixes only.

**R2. Benchmarks came after the change they must measure.**
Draft 1 rewrites stats to exact arithmetic in 0.7 and adds benchmarks in
0.8. The "20× slower" limit was invented; there is no baseline.
→ Benchmarks are task **0.7-0**. The stats rewrite is gated on a measured
number, not a guess.

**R3. Four weeks of "soak" with no users.**
The package is new. A soak period finds nothing if nobody installs the RC.
→ Replace with dogfooding: install the RC in DressOS and Vision Floors
(the author's own apps) for two weeks. Real calls, real bugs.

## Missing things

**R4. No semver policy for locale data.**
If a reviewer corrects a Russian word, is that a patch or a minor? If `en`
changes its money spacing, is that breaking? Draft 1 did not say.
→ `docs/versioning.md`: word corrections = patch; default-format changes in
a locale = minor with a changeset note; `Locale` required-field changes =
major. Added to 0.8.

**R5. No API review before the freeze.**
54 functions were added over three months by different passes. Names are
not uniform: `toRoman/fromRoman`, `formatX/parseX`, `toShortNotation/
parseShortNotation`, `withSuffix`, `getOrdinalSuffix`. The draft froze them
without a look.
→ 0.9 gets an **API review** task with one output: a table of every export,
its naming pattern, and a decision. Default decision: no renames (churn
costs more than the gain), but the pattern is written down so new functions
follow it.

**R6. `setConfig` is global mutable state.**
A library that calls `setConfig({ noThrow: true })` changes the behaviour of
the whole app. Two copies of `num-fns` in one bundle have two configs. The
draft locked this in at 1.0 without a word.
→ Keep it (it is shipped) but the API review decides and the README states:
"`setConfig` is for applications. A library must use the per-call option."

**R7. No runtime support statement.**
`formatNumber` uses `BigInt` on every call since 0.6.0. That needs Safari
14+, Chrome 67+, Node 10.4+. Old browsers and some React Native engines
fail at runtime. The README does not say.
→ 0.7-5 becomes "Node and runtime support policy", with a browser line.

**R8. No type-level tests.**
The `output: 'bigint'` overloads are a contract. `attw` checks packaging,
not that `parseNumber(s, { output: 'bigint' })` is typed `bigint`.
→ 0.8 adds `expect-type` tests for every overloaded parser.

**R9. No dates.**
A plan with no dates cannot be late, so it cannot be checked.
→ Rough dates added. One maintainer, side project: 0.7 Nov 2026, 0.8 Dec
2026, 0.9 Jan 2027, 1.0 Feb–Mar 2027.

**R10. Scope creep is the biggest risk and it was not in the risk table.**
The history of this repo is new domains arriving because a vision doc said
so (stats, financial). → Rule added: **no new domain and no new locale
before 1.0.0**. Risk table updated.

## Things that were not necessary

**R11. `examples/` folder with a test that loads every file.**
The playground already calls every public function from the live source.
A second copy drifts. → Cut. README gets a short "Recipes" section instead.

**R12. Ten ADRs.**
Writing an ADR for every closed `[x]` in `todo.md` is busywork. → Write ADRs
only for decisions a newcomer would re-propose (the "do not re-propose"
list): no-Intl, default locale, colocated tests, no format/parse split,
raw numbers, throw-not-NaN. Six, not ten.

**R13. Deleting `todo.md`.**
Source comments and `CLAUDE.md` cite `todo.md §4` in many places. Deleting
the file breaks the trail. → Move it to `docs/archive/todo-2026.md`
unchanged and stop editing it. The citations still resolve.

**R14. Four locales in 1.2.**
Each locale is L-size and needs a native reviewer first. → One locale per
minor release, reviewer confirmed before the branch is opened. `tr` first.

**R15. `toByteSize` "moves under units" in 1.4.**
Moving an export for tidiness is churn with no user benefit. → Cut.

**R16. "One blog post per minor release."**
Not engineering, not realistic for one person. → Cut. One announcement at
1.0.0.

## Kept as-is

- Exact stats (0.7). The "one rule" promise is the core of the 1.0 story.
- Locale-driven ordinal separator and money spacing (0.7). `"3-rd"` and
  `"$ 1,234.50"` are Azerbaijani habits leaking into `en`.
- API reference by TypeDoc (0.8). The playground is not a reference.
- Native-speaker review of `ru`/`es` with a "not reviewed" fallback (0.9).
- `wordsToNumber` as the first post-1.0 feature. It is the only missing
  inverse.
