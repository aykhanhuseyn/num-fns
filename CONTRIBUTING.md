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

Optionally, enable the versioned pre-commit hook so `bun run check` runs
automatically before every commit (same gate CI runs, catching lint/format
issues before they leave your machine):

```sh
git config core.hooksPath .githooks
```

## Running tests, typecheck, and lint

```sh
bun test                              # run the full test suite
bun test src/number/words.test.ts     # run a single test file
bun test -t "numberToWords"           # run tests matching a name pattern
bun run typecheck                     # tsc --noEmit, gate before publishing
bun run lint                          # biome lint .
bun run lint:fix                      # biome lint --write .
bun run format                        # biome format --write .
bun run check                         # biome check . (lint + format in one pass)
bun run build                         # vite build -> dist/
```

Before opening a PR, run `bun run check && bun run typecheck && bun test` —
this is the same gate CI runs on every push and PR to `main`, and what
`prepublishOnly` runs before a release.

Linting and formatting are both handled by [Biome](https://biomejs.dev)
(`biome.json`) — there is no separate ESLint or Prettier config.

## How to add a new function

1. **Pick the right directory.** Each unit of functionality lives in its own
   directory under `src/` (`number/`, `money/`, `percentage/`, `arithmetic/`,
   `utils/`, ...). If your function is a new formatter/parser pair for an
   existing unit, add it to that unit's `format.ts`. If it's a standalone
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
   - Add a JSDoc comment with at least one `@example` — this is what shows up
     in editor tooltips and is the primary API documentation until a full
     reference site exists.
3. **Add a colocated test file** named `<module>.test.ts` next to the module
   it covers, using `bun:test` (`describe`/`it`/`expect`) — there is no
   separate `test/` directory. At minimum, cover: the documented default
   behavior, at least one option override (if the function takes options),
   and every thrown-error case.
4. **Re-export it flatly from `src/index.ts`**, in alphabetical order by file
   path. There is no default export and no namespacing — every function is
   imported directly from the package root (`import { clamp } from
   'num-fns'`), never `num-fns.arithmetic.clamp` or similar.
5. Run `bun run check && bun run typecheck && bun test` before committing.

## How to add a new locale

Locale support is mid-refactor (see `todo.md` §1) — `az`, `en`, `ru`, and
`es` locale objects already exist under `src/locale/`, implementing the
`Locale` interface in `src/locale/types.ts`, but not every public function
consumes a `locale` option yet.

To add a new locale:

1. Read `src/locale/types.ts` for the shape you need to fill in: `code`,
   `formatDefaults`, `words` (+ `compose` hook), `plural`, `ordinal`,
   `notation`, `currency`.
2. Use `src/locale/az.ts` as the reference implementation and `src/locale/en.ts`,
   `ru.ts`, or `es.ts` for examples of locales built from scratch against the
   interface (rather than ported from pre-existing hardcoded logic).
3. Add a colocated `<code>.test.ts` following the structure of the existing
   locale test files — hand-build the `WordChunk`s you expect for a range of
   representative numbers (zero, single digits, teens, round scales like
   1,000 and 1,000,000, and at least one number that exercises an irregular
   rule specific to your locale's grammar).
4. Re-export the locale from `src/locale/index.ts` and add a per-locale
   subpath (`./locale/<code>`) to both the `exports` map in `package.json`
   and the `lib.entry` object in `vite.config.ts` — keep the two in sync, and
   confirm the new subpath resolves after a build (`bun run build`) with a
   real `import`/`require` of the built output, not just by inspecting the
   file tree.
5. Document any locale-specific grammatical quirks in a doc comment on the
   locale file, the way `src/locale/es.ts` documents its ordinal-of-every-token
   deviation. Number words are wrong in embarrassing, specific ways when
   machine-generated — a native-speaker review before publishing is strongly
   preferred, especially for grammatical gender, plural categories, and
   ordinal forms.

A shared conformance test suite that every new locale must pass against is
planned (`todo.md` §2) but doesn't exist yet — until it lands, match the
depth of testing in the existing locale test files.

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
  applies package-wide, not just to new code.

## Pull request process

1. Fork the repo and create a branch off `main`.
2. Make your change, following the conventions above.
3. Run `bun run check && bun run typecheck && bun test` locally — CI runs the
   same checks (plus `bun run build`) on every push and PR, and a red CI run
   will block merging.
4. Open a PR against `main` with a clear description of what changed and why.
   If it's a new function or locale, mention it in the PR description so it
   can be added to the README's "Full surface" list and the locale support
   matrix.
5. Keep PRs scoped to one logical change — a new function, a locale fix, a
   refactor — rather than bundling unrelated changes together, so review and
   `git blame` stay useful.

## Commit message style

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

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

## Questions

If anything here is unclear or you're not sure where a new function or
locale should live, open an issue or start a draft PR — happy to discuss
before you've written a lot of code.
