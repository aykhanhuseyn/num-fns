# 0003 — Tests are colocated

- **Status:** accepted, 2026-08-25
- **Source:** `todo.md §3` ("Tests: colocated vs. top-level `test/`")

## Context

The project vision document shows a top-level `test/` directory.

## Decision

Tests stay next to the module they test: `src/x/y.ts` and `src/x/y.test.ts`.
Property tests are `y.property.test.ts`. There is no `test/` directory.

## Consequences

- The `src/**/*.test.ts` glob keeps tests out of the bundle and the
  declarations (`vite.config.ts`, `tsconfig.build.json`), and `knip.json`
  depends on it.
- `scripts/new-function.ts` makes the module and its test together.
- `src/shared/arbitraries.test.ts` has a `.test.ts` name only to get these
  excludes.
- The 100 % per-file coverage gate works because each module has a test
  file beside it.
- Moving the tests would change every relative import and give nothing: the
  package has no fixtures, no e2e layer and no separate test build.
