# 0007 — Locale grouping, scale ladders and native digits

- **Status:** accepted, 2026-10-24
- **Task:** 0.7-1 `Locale` extensibility spike (`docs/development-plan.md`)
- **Changes in:** 0.7.0

## Question

Can the `Locale` interface hold Indian (`hi-IN`), Chinese (`zh`) and
Arabic (`ar`) numbers without a breaking change after 1.0.0? If not, the
break must land now, in 0.7.0, while it is still a minor bump.

## What we did

We wrote three throw-away locales — `hi-IN`, `zh`, `ar` — with real
structure and unreviewed words, put them in the locale barrel and ran the
conformance suite (`src/locale/conformance.test.ts`) and a demo script
against them. Then we deleted them. They do not ship. No new locale before
1.0.0 (ROADMAP rule).

Before any engine change we committed `src/locale/golden.test.ts`: about
4 100 lines of output per shipped locale (`az`, `en`, `enGB`, `ru`, `es`),
error messages included. It did not change. The five shipped locales are
byte-identical before and after.

## The three numbering problems

```
            1234567
                │
   ┌────────────┼──────────────────┬───────────────────┐
   ▼            ▼                  ▼                   ▼
 en  [3]     hi-IN [3, 2]        zh  [4]            ar  digits
 1,234,567   12,34,567          1,234,567          ١٬٢٣٤٬٥٦٧
 1 million   12 lakh            123 万              ١ مليون
 234 thous.  34 thousand        4567               ٢٣٤ ألف
 567         567                                    ٥٦٧
```

1. **Digit grouping when writing digits.** Indian writes `12,34,567`: a
   group of three, then groups of two. `formatNumber` grouped by threes only
   (a regex).
2. **The scale ladder when writing words.** `numberToWords` and
   `toLongNotation` chunked in base 1000 only (`toThousandGroups`), and
   assumed scale `n` is `10^(3n)`. Indian counts thousand (10³), lakh
   (10⁵), crore (10⁷); Chinese counts 万 (10⁴), 亿 (10⁸).
3. **Native digits.** Arabic writes `٠١٢٣٤٥٦٧٨٩`, and `parseNumber` must read
   them back.

## Result per locale

| Locale | Result | Detail |
| --- | --- | --- |
| `hi-IN` | **works** with optional fields | `formatDefaults.grouping: [3, 2]`, `words.grouping: [3, 2]`. The 1-99 words of Hindi are all irregular; a private table inside `renderGroup` holds them. No interface change needed for that. |
| `zh` | **works** with optional field; 3 gaps, all optional | `words.grouping: [4]`. 零 rules and the 两/二 choice live in `renderGroup`/`compose`. Gaps below: word separator, fraction reading, ordinal prefix. |
| `ar` | **works** with optional field; **needed one breaking change** | `digits`. `plural` must return `'zero'` and `'two'` (ألفان, آلاف) — not in `PluralCategory`. Fixed now (breaking, types only). |

Spike output (words unreviewed):

```
hi-IN  formatNumber(1234567.5)   12,34,567.5
       numberToWords(1234567)    बारह लाख चौंतीस हज़ार पाँच सौ सड़सठ
       toLongNotation(1234567)   12 लाख 34 हज़ार 567
zh     numberToWords(1234567)    一百二十三万四千五百六十七
       numberToWords(10005)      一万零五
       toShortNotation(1234567)  123.5万
ar     formatNumber(1234567.5)   ١٬٢٣٤٬٥٦٧٫٥    (parses back to 1234567.5)
       numberToWords(2000)       ألفان
       toShortNotation(1234567)  ١٫٢ مليون
```

## Decision — what lands in 0.7.0

Three optional fields. Omitted, each means what every shipped locale does
today, so existing and custom locales need no change.

| Field | Default | Used by |
| --- | --- | --- |
| `Locale.formatDefaults.grouping?: readonly number[]` | `[3]` | `formatNumber` (so `formatMoney`, `formatPercentage`) |
| `Locale.words.grouping?: readonly number[]` | `[3]` | `numberToWords`, `toLongNotation`, `parseLongNotation` (so `moneyToWords`) |
| `Locale.digits?: readonly string[]` (ten entries) | ASCII | `formatNumber`/`parseNumber` (so money, percentage), `toShortNotation`/`parseShortNotation`, `toLongNotation`/`parseLongNotation` |

One breaking change, types only:

- `PluralCategory` is now all six CLDR categories:
  `'zero' | 'one' | 'two' | 'few' | 'many' | 'other'`. Code that handles every
  member of the old four-member union must handle two more. No runtime
  output changes. It is CLDR's complete list, so it will not grow again.

### Why one `grouping` shape, not `scaleStep` plus per-scale exponents

The plan proposed `words.scaleStep` (3 or 4) and scales that declare their
own exponent for lakh/crore. A CLDR-style grouping list covers all three
cases with one idea, and it is the same idea as the digit grouping:

- `[3]` → 3, 3, 3, … (thousand, million, …)
- `[3, 2]` → 3, 2, 2, … (thousand, lakh, crore, arab, …)
- `[4]` → 4, 4, 4, … (万, 亿, 万亿)

The first entry is the units group; the last entry repeats. Scale `i` is
`10^(sum of the first i sizes)`. `toThousandGroups(value)` became
`toScaleGroups(value, grouping)` in `src/shared/bigint.ts`, with
`groupSize`, `scaleExponent` and a grouping-aware `maxSupportedBigInt`.

Digit grouping and word grouping are two fields because Chinese writes
`1,234,567` (threes) but counts words in fours.

### Validation

A locale is data a third party writes. `src/shared/numbering.ts` checks the
fields at the first call that reads them and throws `RangeError`:

- a grouping is a non-empty list of integers 1-15 (`[0]` would loop forever;
  above 15 a group is not a safe integer);
- `digits` is ten distinct single characters, an ASCII digit only in its own
  place.

The conformance suite checks the same, plus that no digit equals a
separator and that `plural` returns a CLDR category.

## Gaps found — all optional, not landed

Each gap can be closed later by an **optional** field whose default keeps
today's output. That is a minor release, not a major. We land each one
together with the locale that needs it (ROADMAP: 1.2 `ar`, then one locale
per minor), so it gets a native-speaker review in the same change.

| Gap | Seen in | Today | Future optional field |
| --- | --- | --- | --- |
| Words joined by a space in the engine (`negative`, `decimalConnector`, spoken leading zeros; count and scale word in `toLongNotation`) | `zh` | `负 一十二 点 二十五`, `123 万 4567` | `words.separator?: string`, default `' '` |
| Fraction read as one group (二十五), not digit by digit (二五) | `zh`, `hi-IN` | `点 二十五` | `words.fractionReading?: 'group' \| 'digits'`, default `'group'` |
| Ordinal is a prefix (第3), not a suffix | `zh` | conformance fails "non-empty suffix" | **handled by 0.7-3**, which reshapes `LocaleOrdinal` anyway (required `separator`); 0.7-3 should allow a prefix too and relax that conformance check |
| Minus sign with the Arabic letter mark (U+061C U+002D), bidi in general | `ar` | `-١٬٢٣٤` | `formatDefaults.minusSign?: string`, default `'-'` |
| `toOrdinal` writes ASCII digits | `ar` | `3-.` | wire `Locale.digits` into `toOrdinal`/`withSuffix` (behaviour change only for a locale that sets `digits`) |
| Currencies INR, CNY, SAR not registered | all three | locales default to USD | see the `CurrencyCode` note below |

### `CurrencyCode` needs a semver rule, not a change

`CurrencyCode` is a closed union (`'AZN' | 'USD' | 'EUR' | 'RUB' | 'GBP'`).
Adding `'INR'` later widens it — the same type-level break as
`PluralCategory`, for code that handles every member. Unlike plural
categories, the list of currencies has no natural end, so completing it
now is not possible. Proposal for the semver rules in `ROADMAP.md`: *adding
a member to `CurrencyCode` is a minor change*. The conformance suite then
must not require a custom locale to cover new codes; that check stays for
shipped locales only. To decide in 0.9-1 (API freeze).

## Consequences

- `hi-IN`, `zh` and `ar` after 1.0.0 need no major release for numbering.
  The 1.0.0 promise holds for them.
- Every shipped locale's output is unchanged (`golden.test.ts`).
- `renderGroup` and `plural` can now receive group values above 999 (up to
  9999 under `[4]`). A shipped locale never does, because none sets
  `words.grouping`.
- `bench`: no regression. `formatNumber` now groups in one left-to-right
  pass (the old regex lookahead was quadratic): `formatNumber(1e6)` about
  0.5 µs (was 0.59 µs), `formatNumber(Number.MAX_VALUE)` 3.7 µs (was
  161 µs). `numberToWords` is the same within noise; `toScaleGroups`
  computes a group base only when the size changes.
