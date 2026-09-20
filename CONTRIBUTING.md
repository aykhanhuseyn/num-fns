# Contributing to num-fns

Thanks for taking an interest in `num-fns`. This guide covers everything you
need to set up the project, make a change, and get it merged.

## Local setup

The project uses [Bun](https://bun.sh) as the runtime, package manager, and
test runner.

```sh
git clone https://github.com/aykhanhuseyn/num-fns.git
cd num-fns
bun install
```

That's the whole setup — no build step is required before you can run tests.

`bun install` also runs [lefthook](https://lefthook.dev)'s `prepare` script,
which installs this repo's git hooks (`lefthook.yml`) automatically: a
`pre-commit` hook that runs `bun run check` against staged files, and a
`commit-msg` hook that lints your commit message with
[commitlint](https://commitlint.js.org) against the Conventional Commits
rules described below. Personal, uncommitted hook overrides go in
`lefthook-local.yml`.

## Running tests, typecheck, and lint

```sh
bun test                              # run the full test suite
bun test src/number/words.test.ts     # run a single test file
bun test -t "numberToWords"           # run tests matching a name pattern
bun run test:coverage                 # the suite plus the coverage gate (what CI runs)
bun run typecheck                     # tsc --noEmit, gate before publishing
bun run lint                          # biome lint .
bun run lint:fix                      # biome lint --write .
bun run format                        # biome format --write .
bun run format:check                  # biome format .
bun run check:biome                   # biome check . (lint + format in one pass)
bun run check:type                    # tsc --noEmit against the full project (incl. tests)
bun run check:circular                # dpdm, fails on import cycles
bun run check:unused                  # knip, reports unused exports/files/deps
bun run check                         # all of the above; pass file paths to scope check:biome
bun run build                         # vite build -> dist/ (ESM + CJS + .d.ts/.d.cts)
bun run check:attw                    # attw, verifies types resolve for ESM + CJS consumers
bun run check:publint                 # publint --strict, lints package.json for publishing
bun run check:pack                    # check:attw + check:publint, against a packed tarball
bun run check:smoke                   # installs the tarball into real consumer projects and runs them
```

Before opening a PR, run `bun run check && bun test` — this is the same gate
CI runs on every push and PR to `main`, and the same checks the `pre-commit`
hook runs against staged files.

If you touched anything that affects the published package — `vite.config.ts`,
`scripts/fix-dist-types.ts`, or the `exports`/`files`/`types` fields in
`package.json` — also run `bun run build && bun run check:pack && bun run
check:smoke`. `check:pack` packs a real tarball and runs `attw` and `publint`
against it; `check:smoke` installs that tarball into throwaway consumer
projects under `scripts/smoke/` and actually executes them: an ESM run, a CJS
run, a `moduleResolution: nodenext` typecheck of each, and a legacy
`moduleResolution: node10` typecheck that exercises the `typesVersions` map
(the only thing that makes the `./locale/*` subpaths resolvable for consumers
whose TypeScript cannot read `exports`). Both are slower than the other checks
and need a full dev install.

Adding a package subpath means touching **four** places, not two: `exports` and
`typesVersions` in `package.json`, `build.lib.entry` in `vite.config.ts`, and
the fixtures under `scripts/smoke/` that import it. CI and `release.yml`
run both after a build (`prepublishOnly` runs `check:pack` only — `check:smoke`
packs a tarball, which `npm publish` is already doing at that point).

CI also runs the smoke fixtures against every Node major the package supports
(`engines.node: >=18`) plus macOS and Windows, from a single tarball packed in
the main job. If you are adding a check that needs a specific Node version,
that `smoke` matrix in `ci.yml` is where it goes.

Coverage is gated: `bun run test:coverage` enforces a per-file threshold from
`bunfig.toml`, and CI runs it in place of `bun test`. A new module with no test
file will fail it — but read the comment in `bunfig.toml` first if you are
changing the threshold itself, because bun's per-metric config form does not
work and the scalar one behaves differently than the docs suggest.

Linting and formatting are both handled by [Biome](https://biomejs.dev)
(`biome.json`) — there is no separate ESLint or Prettier config.

## How to add a new function

0. **Scaffold it.** `bun run new:function <directory> <functionName>` (e.g.
   `bun run new:function arithmetic average`) generates
   `src/<directory>/<kebab-name>.ts` and its colocated
   `<kebab-name>.test.ts`, and inserts the `export * from` line into
   `src/index.ts` at the correct alphabetical position. It generates the
   file stubs for steps 2–3 below and fully handles step 4 — you still write
   the real implementation, real assertions, and a real JSDoc `@example`
   yourself. See `scripts/new-function.ts`.
1. **Pick the right directory.** Each unit of functionality lives in its own
   directory under `src/` (`number/`, `money/`, `percentage/`, `arithmetic/`,
   `stats/`, `financial/`, `utils/`). If your function is a new
   formatter/parser pair for an existing unit, add it to that unit's
   `format.ts`. If it's a standalone
   concern (like `toRoman`/`fromRoman` or `clamp`/`inRange`), give it its own
   file — see "Package design principles" below for when to split.
2. **Write the function.** Follow the conventions already in the codebase:
   - Named export only, full TypeScript types, no `any`.
   - Pure function — no side effects, no mutation of arguments.
   - Validate input up front and `throw` (`RangeError` for out-of-range or
     non-finite numbers, `TypeError` for the wrong kind of value,
     `SyntaxError` for unparseable strings) rather than returning `NaN` or
     `undefined`. Look at `src/number/roman.ts` or `src/arithmetic/clamp.ts`
     for the pattern.
   - **Integer-domain functions accept `number | bigint`; parsers take an
     `output` option.** If your function takes a whole number (a count, an
     id, a byte size — anything `numberToWords`, `toLongNotation`, `toBase`
     or `isEven` would take), type the parameter `number | bigint` and handle
     the `bigint` exactly: chunk, scale and group it in integer arithmetic,
     never `Number(value)` it on the way through. If it parses a string into
     a number, extend `ParseOutputOptions` (`src/shared/types.ts`), validate
     with `resolveOutput`, and declare the three-overload signature
     `parseNumber` uses so `{ output: 'bigint' }` is typed `bigint` and the
     default stays `number`. A `bigint` result must be a whole number
     (`RangeError` otherwise), and a parser that computes exactly must not
     return a `number` past `Number.MAX_SAFE_INTEGER` — throw and point at
     `output: 'bigint'`. The helpers for all of this (`toThousandGroups`,
     `scaleToFixed`, `splitFixed`, `decimalToBigInt`, `toOutput`, `toSafeNumber`, …) live
     in `src/shared/bigint.ts`; read its doc comment and reuse them rather
     than re-deriving the arithmetic. **Never write a BigInt literal**
     (`10n`) — the build targets ES2018, where it is a parse error; go
     through the `BigInt(...)` constructor, as `shared/bigint.ts` and
     `arithmetic/decimal.ts` do. Float-domain functions (statistics,
     financial, the decimal-safe arithmetic) stay `number`-only — see
     `README.md`'s "BigInt in and out" for the settled boundary — and the
     `Locale` hooks keep their `number` signatures, so narrow with
     `toSafeNumber`/`pluralOperand` before calling one.
   - Add a JSDoc comment with at least one `@example` — this is what shows up
     in editor tooltips and is the primary API documentation until a full
     reference site exists.
3. **Add a colocated test file** named `<module>.test.ts` next to the module
   it covers, using `bun:test` (`describe`/`it`/`expect`) — there is no
   separate `test/` directory, and that is a settled decision rather than an
   omission (see `CLAUDE.md`'s "Layout decisions", `todo.md` §3). At minimum,
   cover: the documented default behavior, at least one option override (if
   the function takes options), and every thrown-error case.
4. **Re-export it flatly from `src/index.ts`**, in alphabetical order by file
   path. There is no default export and no namespacing — every function is
   imported directly from the package root (`import { clamp } from
   'num-fns'`), never `num-fns.arithmetic.clamp` or similar.
5. Run `bun run check && bun test` before committing (the `pre-commit` hook
   runs the same checks against staged files automatically).

## How to add a new locale

Five locales exist today under `src/locale/` — `az`, `en`, `en-GB` (exported
as `enGB`), `ru`, and `es` — each implementing the `Locale` interface in
`src/locale/types.ts` and threaded through every locale-dependent public
function. Adding a sixth is mechanical if you follow the steps below in
order; the two things that actually validate correctness are the shared
conformance suite (step 8) and, ultimately, a native speaker (step 7).

1. **Copy the closest existing locale.** Don't start from a blank file — copy
   whichever existing locale is grammatically closest to the one you're
   adding and rename it. `src/locale/en-gb.ts` is the newest worked example
   of a locale built from scratch against the full interface (rather than
   ported from `az`'s pre-refactor hardcoded logic), including the
   `fractions` hook and a documented locale-specific composition
   irregularity — read it alongside `src/locale/types.ts` before writing
   your own.

2. **Implement the `Locale` interface** (`src/locale/types.ts`). Read that
   file's doc comments field group by field group before writing any words
   down; the short version:
   - **`code`/`name`** — the BCP 47 tag (e.g. `'en-GB'`) and a display name.
     If the tag isn't a valid JS identifier, your barrel export name will
     diverge from `code` — see step 6's `CODE_OVERRIDES` note.
   - **`formatDefaults`** — the thousands/decimal separator pair
     `formatNumber` defaults to for this locale.
   - **`words`** — the cardinal engine's vocabulary plus the two hooks that
     own all locale-specific irregularity: `renderGroup` (renders one 0-999
     chunk — hyphenation, an `and` connector, contractions like Spanish
     "veintiuno") and `compose` (joins chunks with scale words — dropping a
     leading "one" before a scale word, gender agreement, apocopation).
     `genders`/`defaultGender` are only set for a locale whose cardinals
     inflect by grammatical gender — omit both for a genderless locale, and
     `numberToWords` will reject any `gender` option with `RangeError`
     rather than silently ignoring it. `decimalConnector` is the
     integer/fraction joiner (az's `'tam'`) — distinct from `and`, which is
     purely the intra-group tens+ones connector — and should stay unset
     until you've settled your locale's real decimal-reading convention,
     since leaving it unset falls back to a plain space, not a claim of
     linguistic correctness. `infinity` is required: it is the word a
     renderer emits for `Infinity` under `noThrow` (prefixed with
     `negative` for `-Infinity`), and it has no default precisely so that no
     locale can quietly borrow another language's word.
   - **`plural`** — the CLDR-ish plural-category selector (`'one' | 'few' |
     'many' | 'other'`) used to pick the right scale/currency word form.
     Most locales can return `'other'` unconditionally; only implement the
     real split if your locale's scale or currency words actually inflect by
     count (Russian does; Spanish, English, and Azerbaijani don't).
   - **`ordinal`** — `suffix` (the short numeral suffix, `'5th'`/`'5-ci'`)
     and `words` (the full ordinal word, transforming the cardinal reading
     `numberToWords` produced). Grammatical case/gender declension on
     ordinals is out of scope for v1 — follow `ru.ts`'s and `es.ts`'s
     documented nominative-masculine-only precedent rather than trying to
     solve it yourself.
   - **`notation`** — the short/long scale abbreviations `toShortNotation`/
     `toLongNotation` use, plus whether a space separates the number from
     the short form. Keep `notation.scales` and `words.scales` vocabulary in
     sync at every magnitude — the conformance suite checks the two arrays'
     lengths align, and `locale/index.test.ts`'s scale-naming block checks
     the actual words agree.
   - **`currency`** — the default ISO 4217 `code`, the `symbolPosition`
     your language puts every currency sign on, and `units`: a map from
     each `CurrencyCode` (`AZN`, `USD`, `EUR`, `RUB`, `GBP` — the closed
     union in `src/money/currency.ts`) to that currency's `major`/`minor`
     unit words in your language. **Cover every code**, not just your
     default — the conformance suite pins that, so `moneyToWords` can spell
     any registered currency in any launch locale rather than throwing at
     the first caller. The symbol itself is *not* yours to set: it comes
     from the registry (`getCurrency(code).symbol`), because it's a fact
     about the currency, not the language. Each unit's `plurals` map
     (`ru`'s `рубль`/`рубля`/`рублей`) and `gender` field are what
     `moneyToWords` picks the word form and spells the amount with; a
     `gender` only makes sense for a unit word that's actually gendered — it
     must be a member of `words.genders`, and a genderless locale
     (`az`/`en`) must leave it unset on every unit. `ru.ts`'s minor unit
     ("копейка", feminine) next to its masculine major unit ("рубль"), and
     `es.ts`'s feminine "libra" among otherwise masculine units, are the
     reference examples for why the field exists: without it, `moneyToWords`
     spells every amount with `words.defaultGender` and gets those units
     wrong. Indeclinable words (`ru`'s "евро") simply omit `plurals`.
   - **`fractions`** (optional) — `half` plus a `words(numerator,
     denominator)` composer for `fractionToWords`. Only implement this once
     you have real fraction-noun vocabulary, not a guess derived from your
     ordinal words — see `number/fraction.ts`'s doc comment for why `ru`/`es`
     throw instead of guessing, and leave the hook unset (so
     `fractionToWords` throws `RangeError` for your locale) if you're in the
     same position.

3. **Never import your locale from a module `number/words.ts` can reach.**
   `number/words.ts` imports `en` as `numberToWords`'s structural default, so
   `en.ts` itself can never import back from `number/` — that's why `en`'s
   fraction composer lives directly in `number/fraction.ts`, special-cased,
   rather than as an `en.fractions` hook. Any locale that isn't the
   structural default is free to import from `number/` (`en-GB`'s
   `fractions.words` does exactly this, calling `numberToWords`/
   `ordinalToWords`); `bun run check:circular` (part of `bun run check`) is
   what catches a mistake here.

4. Keep all of your locale's linguistic data — vocabulary tables, irregular-
   word maps, composition logic — in the locale file itself, not in a shared
   module. `number/words.ts` holds no vocabulary of its own any more: the
   `ONES`/`TENS`/`SCALE_WORDS` constants that used to live there were
   Azerbaijani-only and moved into `locale/az.ts` as module-private values on
   2026-08-25 (`todo.md` §3) — that is the pattern, with `az.words.ones` and
   friends as the only way to read them. The engine (`numberToWords`,
   `toLongNotation`) only ever hands your hooks plain 0–999 `number`s — even
   when the caller passed a `bigint`, which the engine chunks before it
   reaches you — so a locale never has to handle `bigint`.

5. **Add a colocated `<code>.test.ts`** following the structure of the
   existing locale test files — pin real vocabulary and hand-build the
   `WordChunk`s or expected strings for a range of representative numbers
   (zero, single digits, teens, round scales like 1,000 and 1,000,000, at
   least one number that exercises an irregular rule specific to your
   locale's grammar, and every gender your locale declares, if any).

6. **Wire the new locale into everything that lists locales by hand** — the
   compiler and the coverage gate won't remind you about most of these.
   Four places are specifically about the package *subpath*:
   - `package.json` — a `./locale/<code>` entry in `exports` **and** in
     `typesVersions` (the latter is what makes the subpath resolve for
     consumers on legacy `moduleResolution: node10`; skipping it passes
     every other check but fails `check:pack`'s `attw --profile strict` —
     which is exactly the point of that flag).
   - `vite.config.ts` — a matching entry in `build.lib.entry`.
   - `scripts/smoke/` — add the new locale/subpath to each fixture that
     enumerates locales (`esm`, `cjs`, `types-esm`, `types-cjs`,
     `types-node10`) so `check:smoke` exercises it end to end, through a
     real install of a packed tarball.

   Four more places are about the *locale itself*:
   - `src/locale/index.ts` — re-export it from the barrel.
   - `src/locale/index.test.ts` — add it to `LAUNCH_LOCALES`, and to
     `CODE_OVERRIDES` if your export name (a valid JS identifier) differs
     from `Locale.code` (a BCP 47 tag, which can contain a hyphen) — `enGB`
     mapping to `'en-GB'` is the existing example.
   - `package.json` — a `size-limit` entry for the new subpath's bundle.
   - `site/src/locales.ts` — add it to `localeInfo` so the docs/playground
     picks it up.

7. **Document locale-specific grammatical quirks in a doc comment** on the
   locale file, the way `es.ts` documents its ordinal-of-every-token
   deviation and `ru.test.ts` pins the compound-ordinal round-scale gap
   (`ru.ordinal.words(2000, ...)` giving `"две тысячный"` rather than the
   idiomatic `"двухтысячный"`). Number words are wrong in embarrassing,
   specific ways when machine-generated — a native-speaker review before
   publishing is strongly preferred, especially for grammatical gender,
   plural categories, and ordinal forms.

8. **Run the shared conformance suite** —
   `bun test src/locale/conformance.test.ts` — **and make sure it passes
   unmodified.** This file is table-driven over every locale the barrel
   exports, so your new locale is picked up automatically with no edits to
   the suite itself; it asserts the structural shape `Locale` promises
   (separator/scale-array/gender/currency invariants) and generic behavioral
   invariants through the public API (`numberToWords`, ordinals,
   format/parse and short/long-notation round trips, `moneyToWords`, gender
   validation, `fractionToWords`) for every locale, without pinning any
   locale's specific vocabulary — that pinning is what your `<code>.test.ts`
   from step 5 is for. If this suite fails against your new locale, that's a
   real bug in your `Locale` implementation to fix, not a suite to loosen.

9. Run `bun run test:coverage` — the coverage gate is 100% per file, so your
   new locale file needs no untested branch — and confirm the new subpath
   resolves after a build (`bun run build`) with a real `import`/`require`
   of the built output, not just by inspecting the file tree.

## Coding conventions

- **TypeScript strict mode.** `tsconfig.json` has `strict: true` and
  `noUncheckedIndexedAccess: true`. No `any` — if you're reaching for `any`,
  there's almost always a narrower type or a type guard that works instead.
- **Biome, not ESLint/Prettier.** Formatting is 2-space indent, single quotes,
  semicolons only where required (`asNeeded`), trailing commas everywhere,
  100-character line width — `bun run format` applies all of this
  automatically, so don't hand-format.
- **Named exports only.** No default exports anywhere in `src/`.
- **Pure functions.** No shared mutable state, no reading from globals like
  `Date.now()` or `Math.random()`, no mutating arguments.
- **One function (or one tightly-coupled pair, like `formatX`/`parseX`) per
  file**, so the package stays tree-shakeable. Group functions in the same
  file only when they share internal constants or helpers that don't make
  sense to expose separately (e.g. `toRoman`/`fromRoman` share the numeral
  table; `toShortNotation`/`toLongNotation`/their parsers share scale words).
- **Options object pattern.** Any function that takes more than one optional
  parameter takes a single options object as its final parameter, with every
  field optional and a sensible default — see `NumberFormatOptions` in
  `src/shared/types.ts`.
- **Throw on bad input.** See "How to add a new function" above — this
  applies package-wide, not just to new code. Validate the *type* too:
  `assertNumericValue` in `src/shared/validation.ts` is the first call in
  every function taking a `number | bigint`, because `typeof value ===
  'number' && !Number.isFinite(value)` lets `null` through and `Math.abs(null)`
  is `0`.
- **Wrap the body in a `noThrow` guard.** Every public function returns
  `guardText`/`guardNumber`/`guardBoolean`/`guardList`/`guardRecord`
  (`src/shared/no-throw.ts`, `no-throw-text.ts`) around its body, passing its
  options object so a per-call `noThrow` is honoured; `guardText` also takes
  the function's value arguments, so an `Infinity` can be worded rather than
  blanked. Add the new function to the tables in `src/no-throw.test.ts` —
  they are checked against the export list, so the suite fails until you do.
- **`-0` is a value.** Never normalise it away. Read a sign with `isSigned`
  from `src/shared/sign.ts`, not `value < 0`, which is `false` for `-0`.
- **No `Intl`.** Not in `src/`, not in tests. `Intl` output depends on the
  runtime's ICU data, and the package's promise is that it does not
  (`todo.md` §1, 2026-09-20).
- **`number | bigint` in, `output` out, no BigInt literals.** Integer-domain
  functions take `number | bigint` and parsers take `{ output: 'bigint' }`
  (see "How to add a new function"). `BigInt` is reached only through the
  `BigInt(...)` constructor — a `10n` literal is a parse error at the ES2018
  build target — and the shared helpers in `src/shared/bigint.ts` are the
  place for any new `bigint` arithmetic, not a fresh copy in your module.

## Pull request process

1. Fork the repo and create a branch off `main`.
2. Make your change, following the conventions above.
3. Run `bun run check && bun test` locally — CI runs the same checks (plus
   `bun run build`) on every push and PR, and a red CI run will block
   merging.
4. Open a PR against `main` with a clear description of what changed and why.
   If it's a new function or locale, mention it in the PR description so it
   can be added to the README's "Full surface" list and the locale support
   matrix.
5. Keep PRs scoped to one logical change — a new function, a locale fix, a
   refactor — rather than bundling unrelated changes together, so review and
   `git blame` stay useful.
6. If your change affects published behavior (a new function, a bug fix, a
   breaking change — anything a consumer of the package would care about),
   add a changeset: `bun run changeset`. See "Releasing" below.

## Commit message style

This project uses [Conventional Commits](https://www.conventionalcommits.org/),
enforced automatically by commitlint via the `commit-msg` hook (see
`commitlint.config.js`) — a non-conforming message is rejected at commit
time, not caught later in review:

```
<type>(<scope>): <short summary>
```

Common types: `feat` (new function, new locale, new capability), `fix`,
`docs`, `refactor`, `test`, `chore` (tooling, deps, config). Scope is
typically the directory or concern touched (`locale`, `arithmetic`, `lint`,
`todo`). For example:

```
feat(arithmetic): add clamp and inRange
fix(locale): correct Spanish ordinal for round-scale multiples
docs(contributing): document the locale-authoring workflow
```

Squash-merge PRs with multiple work-in-progress commits into one
Conventional Commit message on merge, so `main`'s history stays readable.

## Releasing

Versioning and publishing are automated with [Changesets](https://github.com/changesets/changesets)
— you don't bump `package.json`'s version or hand-write `CHANGELOG.md`
entries.

1. Any PR that changes published behavior needs a changeset:
   ```sh
   bun run changeset
   ```
   Pick a bump type (`patch`/`minor`/`major` — this package hasn't hit 1.0
   yet, so breaking changes are still `minor`-scoped per semver's `0.x`
   convention) and write a summary in plain language, as it'll appear
   verbatim in `CHANGELOG.md`. This writes a small Markdown file under
   `.changeset/` — commit it as part of your PR.
2. Docs-only, test-only, or internal tooling changes don't need a changeset.
3. On merge to `main`, a bot opens (or updates) a `chore: version packages`
   PR that runs `changeset version` — bumping `package.json` and rewriting
   `CHANGELOG.md` from the accumulated changesets, consuming those files in
   the process — then `scripts/sync-readme-version.ts`, which rewrites the
   version in README.md's status callout to match (`bun run check:readme`
   fails CI and `prepublishOnly` if the two ever drift). You don't need to
   do anything for this step.
4. Merging *that* PR triggers the actual release: `bun run build` followed
   by `changeset publish`, which publishes to npm, tags the commit, and
   creates a GitHub release. See `.github/workflows/release.yml`.

## Questions

If anything here is unclear or you're not sure where a new function or
locale should live, open an issue or start a draft PR — happy to discuss
before you've written a lot of code.
