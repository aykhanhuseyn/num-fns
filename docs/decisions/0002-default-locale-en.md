# 0002 — The default locale is `en`

- **Status:** accepted, 2026-08-09 (landed 2026-08-18)
- **Source:** `todo.md §1` ("Default locale")

## Context

Before the locale refactor every function spoke Azerbaijani. The package was
`az-number-utils`. After the rename to `num-fns` it is a general library.

## Decision

When a call has no `locale` option, the locale is `en`. This was a
deliberate breaking change and it landed together with the `locale` option
on every function, not silently.

## Consequences

- To get the old output, pass `{ locale: az }`. `az` stays fully supported.
- `az` is the reference locale: `src/locale/az.test.ts` checks that every
  other locale's algorithm does not change `az` output.
- Defaults live in each locale object, never in shared constants
  (`shared/constants.ts` was removed for this reason).
