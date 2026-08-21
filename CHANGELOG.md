# num-fns

## 0.2.0-alpha.1

### Patch Changes

- [`083df70`](https://github.com/aykhanhuseyn/num-fns/commit/083df7070086c98ff4228322740d9b333518ba7c) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Fix type resolution for CommonJS and `node16`/`nodenext` consumers. The emitted declarations carried extensionless relative specifiers (`export * from './arithmetic/clamp'`), which Node-style TypeScript resolution rejects, and only `.d.ts` files were shipped — so with `"type": "module"` every `exports` entry handed ESM types to consumers loading the `.cjs` build (attw's `FalseESM`). A new post-build step, `scripts/fix-dist-types.ts`, adds explicit extensions and emits a `.d.cts` twin of every declaration, and each `exports` entry now carries per-condition `types` (`import` → `.d.ts`, `require` → `.d.cts`). Bundler-based setups were unaffected and stay unchanged; `attw` and `publint` now pass, and both are enforced in CI and before publish by the new `bun run check:pack`.

## 0.2.0-alpha.0

### Minor Changes

- [`bbb7674`](https://github.com/aykhanhuseyn/num-fns/commit/bbb7674aa017146f55d9d9868347ee11c49724a4) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Thread a `locale` option through every public function with locale-dependent behavior (`numberToWords`, `toOrdinal`/`ordinalToWords`/`getOrdinalSuffix`, `formatNumber`/`parseNumber`, `formatMoney`/`parseMoney`/`moneyToWords`, `formatPercentage`/`parsePercentage`, `toShortNotation`/`parseShortNotation`/`toLongNotation`/`parseLongNotation`, `numberToDigitWords`, and `fractionToWords`), with real cardinal/ordinal/notation vocabulary for all four launch locales (`az`, `en`, `ru`, `es`).

  **Breaking changes** (this package hasn't hit 1.0 yet — see `CONTRIBUTING.md`'s "Releasing" section for why this is `minor`, not `major`):

  - **The default locale is now `en`, not the previous implicit Azerbaijani behavior.** Callers that want the old behavior must now pass `{ locale: az }` explicitly (`import { az } from 'num-fns/locale'`).
  - `toOrdinal`'s separator moved from a positional second parameter to its options object: `toOrdinal(3, { separator: '-' })` instead of `toOrdinal(3, '-')`.
  - `toShortNotation`'s `locale` option was a bare `'az' | 'en'` string; it's now a full `Locale` object (`{ locale: az }` instead of `{ locale: 'az' }`).

  `fractionToWords` only has real fraction-noun vocabulary for `az` and `en` — `ru`/`es` throw a `RangeError` rather than guess at linguistically risky vocabulary (Russian fraction nouns need feminine forms distinct from their ordinal adjectives; Spanish's "tercio" diverges from its ordinal "tercero"). Tracked as follow-up in `todo.md` §2.

### Patch Changes

- [`d1f657b`](https://github.com/aykhanhuseyn/num-fns/commit/d1f657b569462cdb2c9361deaa84a6d1d3972bf3) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Confirm the GitHub repo rename from `az-number-utils` to `num-fns` (§0 of `todo.md`) — verified `github.com/aykhanhuseyn/num-fns` resolves via `git ls-remote` and the old `az-number-utils` URL redirects to the same commits, so the rename task is fully complete.

- [`b8e8696`](https://github.com/aykhanhuseyn/num-fns/commit/b8e86968c7dd99a4d3bdd9e24108b66dfb8d826d) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Add `scripts/new-function.ts`, run via `bun run new:function <directory> <functionName>`. Scaffolds a new function's `.ts` file, its colocated `.test.ts`, and the `export * from` line in `src/index.ts` (inserted at the correct alphabetical position). CONTRIBUTING.md's "How to add a new function" now leads with this as step 0.

- [`b8e8696`](https://github.com/aykhanhuseyn/num-fns/commit/b8e86968c7dd99a4d3bdd9e24108b66dfb8d826d) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Add Renovate config (`renovate.json`) for automated dependency updates, tuned for `bunfig.toml`'s `install.exact = true` (bumps pinned versions in place rather than widening to ranges). Groups lockstep tool pairs (Biome, Changesets, commitlint, Vite + vite-plugin-dts) and requires manual dashboard approval before bumping the pinned `typescript` prerelease line.

- [`bbb7674`](https://github.com/aykhanhuseyn/num-fns/commit/bbb7674aa017146f55d9d9868347ee11c49724a4) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Restore `cardinalToOrdinalWords`, a public export that was unintentionally dropped from `number/suffix.ts` during the locale-threading work (see the pending "Thread a `locale` option through every public function" changeset). It's now a thin wrapper around `locale.ordinal.words`, taking an `OrdinalOptions` (`{ locale }`) like the rest of the ordinal family, and defaults to `en`.

  Also fixes the docs playground (`site/`, not part of the published package): `toShortNotation`/`parseShortNotation`'s locale field was still passing a raw `'az' | 'en'` string where the real function now requires a `Locale` object, and `toOrdinal`'s `separator` field was still wired as a positional argument after that function's separator moved into its options object. Every example whose function accepts `options.locale` now has a live locale picker.

- [`b8e8696`](https://github.com/aykhanhuseyn/num-fns/commit/b8e86968c7dd99a4d3bdd9e24108b66dfb8d826d) Thanks [@aykhanhuseyn](https://github.com/aykhanhuseyn)! - Add a `size-limit` check (`bun run size`), wired into CI after the build step. Tracks the full `dist/index.js` surface, the `dist/locale/index.js` barrel, and each of the `az`/`en`/`ru`/`es` locale subpaths individually — the per-locale entries double as the bundle-size evidence that importing one locale doesn't pull in the other three.
