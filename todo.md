# TODO

Everything that could reasonably be added to `az-number-utils`, grouped by area. Nothing here is committed to — just a backlog to pull from.

## Core features

- [x] `moneyToWords` — spell out an amount with currency units (e.g. `"min iki yüz otuz dörd manat əlli qəpik"`), useful for checks/invoices. Builds on `numberToWords`.
- [x] `ordinalToWords` — fully spelled ordinal words (`"üçüncü"`), complementing the existing numeric-suffix-only `toOrdinal` (`"3-cü"`).
- [x] `parseShortNotation` — inverse of `toShortNotation`, parse `"2,5 mln"` / `"2.5M"` back into a number.
- [x] `parseLongNotation` — inverse of `toLongNotation`, parse `"1 milyon 234 min 567"` back into a number.
- [ ] Fraction words — `yarım`, `üçdə bir`, `çərək`, etc., for values that aren't naturally expressed as decimals.
- [ ] Digit-by-digit reading — spell a value digit by digit (phone numbers, codes), e.g. `"beş üç yeddi"`.
- [ ] Byte-size short notation — reuse the `toShortNotation` scale logic for KB/MB/GB.
- [ ] Rounding-mode option on `formatNumber` (half-up/half-down/half-even/ceil/floor) instead of relying on native rounding.
- [ ] Multi-currency presets (USD, EUR, manat) beyond swapping the `symbol` string manually.
- [ ] Permille (‰) / basis-point support in `formatPercentage`.
- [ ] Shared clamp/range validation helper used across formatters instead of repeating range checks per module.
- [ ] BigInt input path for `numberToWords` / `toLongNotation` beyond the current `MAX_SUPPORTED_INTEGER` ceiling.
- [ ] Roman numerals beyond 3999 (vinculum/overline notation) — optional, currently explicitly out of scope per `roman.ts`.

## Testing & quality

- [ ] Edge-case coverage for every function: `NaN`, `Infinity`, `-0`, and min/max boundary values.
- [ ] Round-trip property tests (e.g. `fast-check`) for every format/parse pair.
- [ ] Wire up `bun test --coverage` in CI with an enforced threshold.
- [ ] Smoke-test the built `dist/index.cjs` under an older Node runtime (14/16) to validate the "works in older projects" claim in the README.
- [ ] Micro-benchmarks for `formatNumber` / `numberToWords` on large inputs to catch performance regressions.

## Tooling & DX

- [ ] Pre-commit hook (Husky + lint-staged, or a plain git hook) running `bun run check` before commit.
- [ ] `.editorconfig` for consistent whitespace across editors.
- [ ] Dependabot or Renovate config for automated dependency bumps (relevant given `bunfig.toml` pins exact versions).
- [ ] TypeDoc site generated from the existing JSDoc, published to GitHub Pages.
- [ ] `examples/` folder with small runnable snippets per module.

## CI/CD & release

- [ ] npm publish GitHub Actions workflow triggered on a version tag, with provenance.
- [ ] CI matrix across multiple Node versions (14/16/18/20/22) to back up the compatibility claim, not just build on latest.
- [ ] Bundle-size check (`size-limit` or similar) in CI.
- [ ] Changesets or semantic-release for versioning and an auto-generated `CHANGELOG.md`.
- [ ] First publish to npm — package is still at `0.1.0` and unpublished.

## Documentation

- [ ] Full API reference (table or generated docs site) covering every export and its options — README currently only shows headline examples.
- [ ] Badges: npm version, CI status, license, bundle size.
- [ ] `CONTRIBUTING.md`.
- [ ] `CHANGELOG.md`.
- [ ] Azerbaijani-language README variant, given the target audience.
