# 0001 — No `Intl`

- **Status:** accepted, 2026-09-20
- **Source:** `todo.md §1` ("Number formatting vs `Intl.NumberFormat`")

## Context

The platform has `Intl.NumberFormat`. It could do the grouping and decimal
separators of `formatNumber`, with a smaller bundle.

## Decision

The package does not use `Intl` anywhere. Separators, rounding and magnitude
handling are our own code.

## Consequences

- The output is the same on every runtime and every ICU build, so a user can
  pin it in a test. `Intl` output changes with the platform's ICU data.
- `Intl` would cover only the grouping half of one function. Words, ordinals,
  notation and roman numerals have no `Intl` equivalent, so the bundle saving
  is small and the behaviour would split.
- Per-locale separators are tested by `src/locale/conformance.test.ts` and the
  round-trip property tests, not by a comparison with `Intl`.
