# CLAUDE.md

Rules for working in this repository. History and reasons are elsewhere:
`CHANGELOG.md` (what changed), `docs/decisions/` (why), `ROADMAP.md` and
`docs/development-plan.md` (what is next).

## What this package is

`num-fns` is `date-fns` for numbers: format and parse numbers, money and
percentages; spell numbers in words; ordinals, short/long notation, roman
numerals, byte sizes, bases; exact decimal arithmetic, statistics and
financial helpers. It uses no `Intl` and has no runtime dependency. Locales
are objects passed per call (`numberToWords(1234, { locale: ru })`) from
`num-fns/locale`: `az`, `en` (the default), `enGB`, `ru`, `es`.

## Planning rules

- Read `ROADMAP.md` before you propose work. Put new work under a task id of
  `docs/development-plan.md` (for example 0.9-2).
- No new domain and no new locale before 1.0.0. New ideas go to a GitHub
  issue with the milestone `after-1.0`, not into `src/`.
- Breaking changes landed in 0.7.0. From 0.8.0 to 1.0.0 there are none; the
  release candidate (0.9) takes bug fixes only.
- Version bumps follow `docs/versioning.md`, for code and for locale data.
- `docs/archive/todo-2026.md` is the frozen backlog. Source comments cite it
  as `todo.md §N`. Cite it; never edit it.
- Measure before you change hot code: `bun run bench`, compare with
  `bench/BASELINE.md`. More than 10 % slower needs a reason in the changeset.

## Do not propose these again

Each one was reviewed and rejected. Read the record first.

- `Intl` for formatting → [0001](docs/decisions/0001-no-intl.md)
- `az` as the default locale → [0002](docs/decisions/0002-default-locale-en.md)
- A top-level `test/` directory → [0003](docs/decisions/0003-colocated-tests.md)
- `format/` + `parse/` or `humanize/` directories → [0004](docs/decisions/0004-no-format-parse-split.md)
- A decimal type or bignum dependency → [0005](docs/decisions/0005-raw-numbers-no-decimal-type.md)
- Returning `NaN`/`undefined` on bad input → [0006](docs/decisions/0006-throw-not-nan.md)
- Locale grouping and digits design → [0007](docs/decisions/0007-locale-grouping.md)

## Commands

Bun 1.4.4 (`packageManager`). `bunfig.toml` pins exact versions on install.

```sh
bun install
bun test                         # all tests (bun:test, colocated *.test.ts)
bun test src/number/words.test.ts
bun test -t "numberToWords"
bun run test:coverage            # tests + 100 % per-file coverage gate (CI)
bun run check                    # type, circular, unused, readme, biome
bun run check:type               # bun check on tsconfig.json (incl. tests)
bun run typecheck                # bun check on tsconfig.build.json
bun run check:jsdoc              # TypeDoc + JSDoc audit of every export
bun run docs:api                 # API reference -> site-dist/api/
bun run check:biome              # Biome lint + format (no ESLint/Prettier)
bun run build                    # vite -> dist/ (ESM + CJS + .d.ts/.d.cts)
bun run check:pack               # attw --profile strict + publint (after build)
bun run check:smoke              # install the tarball in real consumers
bun run size                     # size-limit budget per entry
bun run bench                    # mitata benchmarks
bun run new:function             # scaffold a function + its test
```

Type checking uses `bun check`, not `tsc`. `scripts/check-ts-version.ts`
fails when Bun's built-in TypeScript is not the `typescript` version in
`package.json`; bump Bun and `typescript` together. `tsc` (TypeScript 7)
stays for `vite-plugin-dts`; TypeDoc runs on TypeScript 6 through
`scripts/typedoc.mjs`; `tsc6` runs the `node10` smoke fixture.

`prepublishOnly` = `check`, tests, `build`, `check:pack`. CI also runs
`check:jsdoc`, `check:smoke` and `size`.

## Directory map

```
src/
  index.ts          flat barrel: export * (only ./number/words is by name)
  config.ts         getConfig/setConfig/resetConfig, NoThrowOptions
  number/           formatNumber/parseNumber (the base every formatter uses),
                    words, suffix (ordinals), notation, roman, digits,
                    fraction, byte-size
  money/            currency registry (ISO 4217), format, words
  percentage/       format
  arithmetic/       add, subtract, multiply, divide, round, clamp, inRange;
                    decimal.ts = internal exact plumbing
  stats/            sum, mean, median, … ; exact.ts = internal
  financial/        interest, payments, amortization
  utils/            toBase/fromBase, isEven/isOdd
  shared/           types, validation, sign, bigint, numbering, no-throw
  locale/           Locale interface (types.ts) + az, en, en-gb, ru, es
site/               playground + review page (Vite, imports ../src)
scripts/            build fixes, checks, smoke consumers
docs/               plan, versioning, decisions, archive
```

## Code conventions

- One exported function per file in most domains; a domain's formatter and
  parser share one file.
- Every public function validates input first and throws `RangeError`,
  `TypeError` or `SyntaxError`. `assertNumericValue` runs first for any
  `number | bigint` parameter. Guards live in `shared/validation.ts`.
- `noThrow`: each public body is wrapped once in a `guard*` helper
  (`shared/no-throw*.ts`). Only the outermost wrapper catches.
- Rounding has one implementation: `arithmetic/round`. Never use `toFixed`,
  `Math.round(x * 100)` or `String(n)` for digits; use `arithmetic/decimal`.
- `bigint`: never through a float. Use `shared/bigint.ts`. Locale hooks get
  `number` only (`pluralOperand`, `toSafeNumber`). Create values with
  `BigInt(...)`, never `10n` literals (target is ES2018).
- `-0` is a value: test signs with `isSigned`/`isNegativeZero`, not `< 0`.
- Parsers with `output` have three overloads (`'bigint'`, `'number'`/omitted,
  `ParseOutput`). Copy that shape. `src/parsers.types.test.ts` tests them.
- Locale-dependent defaults come from the `Locale` object, never from shared
  constants. A new required `Locale` field is a major change.
- No `Intl`. No runtime dependency.

## Documentation conventions

Every export: a one-line summary, `@param`, `@returns`, `@throws`,
`@example`, `@since`. No dates and no `todo.md` references in public JSDoc
(use a `//` comment for maintainer notes). `{@link}` only to exported
symbols. `bun run check:jsdoc` enforces this.

## Testing conventions

- Tests are colocated: `x.ts` + `x.test.ts`, property tests in
  `x.property.test.ts` (fast-check, shared arbitraries in
  `src/shared/arbitraries.test.ts`).
- Cover the default behaviour, at least one option, and every throw.
- Coverage is 100 % per file (`bunfig.toml`). A line you cannot cover means
  the guard is in the wrong place; do not lower the gate.
- `src/index.test.ts` pins the export list. A new export updates it.
- `src/locale/golden.test.ts` snapshots every locale's output. When a change
  must alter output: `bun test src/locale/golden.test.ts -u`, then check the
  diff touches only the intended lines and put it in the changeset.
- `scripts/smoke/` fixtures are separate consumer projects, not part of the
  suite.

## Build and package

- `vite.config.ts` builds ESM + CJS for ES2018 with per-module declarations.
  `emptyOutDir` is `false`.
- `scripts/fix-dist-types.ts` (run from the dts plugin's `afterBuild`) adds
  `.js` extensions and writes `.d.cts` twins. If it throws on a missing
  specifier, delete `dist/` and build again.
- A new subpath goes into `exports` and `typesVersions` in `package.json`
  and the entry list in `vite.config.ts`, plus a `size-limit` entry.

## Definition of done

Tests (default, one option, every throw), 100 % per-file coverage, JSDoc
with `@example` and `@since`, README and `site/src/registry.ts` updated,
a changeset, `size-limit` passes.
