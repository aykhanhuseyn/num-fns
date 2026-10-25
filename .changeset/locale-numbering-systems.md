---
"num-fns": minor
---

Let a `Locale` describe its numbering system (task 0.7-1). Three new
**optional** fields; no shipped locale sets them, and the output of `az`,
`en`, `enGB`, `ru` and `es` is byte-identical to 0.6.0 (pinned by the new
`src/locale/golden.test.ts`).

- `formatDefaults.grouping` — digit-group sizes for `formatNumber` (and so
  `formatMoney`/`formatPercentage`). Default `[3]`; `[3, 2]` writes Indian
  `12,34,567`.
- `words.grouping` — the groups each scale word counts in `numberToWords`,
  `moneyToWords`, `toLongNotation` and `parseLongNotation`. Default `[3]`;
  `[3, 2]` gives thousand/lakh/crore, `[4]` gives 万/亿.
- `digits` — the ten characters a locale writes for 0-9 (for example
  Arabic-Indic `٠`…`٩`). The formatters and notation functions write them;
  `parseNumber`, `parseMoney`, `parsePercentage` and the notation parsers
  read them back, ASCII digits too.

A malformed value throws `RangeError` at the first call that reads it.

**Breaking (types only):** `PluralCategory` is now all six CLDR categories,
`'zero' | 'one' | 'two' | 'few' | 'many' | 'other'` — Arabic needs `'zero'` and
`'two'`. Code that handles every member of the old four must handle two
more. No runtime output changes.

Why and what is still missing: `docs/decisions/0007-locale-grouping.md`.

Performance: `formatNumber` groups digits in one pass instead of a regex
lookahead, so it is a little faster for short numbers and much faster for
long ones (`formatNumber(Number.MAX_VALUE)` 3.7 µs, was 161 µs, measured
before and after on one machine). `numberToWords` is unchanged within noise.

Size: the grouping, digit and validation code adds about 0.5 kB brotli to the
root entry (8.25 → 8.74 kB) and about 0.2 kB to `locale/az`, `locale/en-gb`
and the locale barrel, which pull in the word engine. `size-limit` budgets:
`index` 8.5 → 9 KB, `locale` 7 → 7.2 KB, `locale/az` 3.3 → 3.6 KB,
`locale/en-gb` 3 → 3.3 KB.
