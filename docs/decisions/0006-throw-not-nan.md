# 0006 — Throw, do not return `NaN`

- **Status:** accepted from the first release; widened 2026-09-01 and 2026-09-20
- **Source:** `todo.md §4` (option validation, global configuration),
  `todo.md §5` (edge-case pass)

## Context

A function can answer bad input with `NaN`, `undefined` or an empty string,
or it can throw. A silent bad value travels far before someone sees it.

## Decision

Every public function validates its input first and throws `RangeError`,
`TypeError` or `SyntaxError`. This covers values (`NaN`, `Infinity`, `null`,
`undefined`), option combinations (equal separators) and numeric type (a
`bigint` is never converted through a float; a parser never returns an
inexact `number`).

## Consequences

- `noThrow` (per call, or `setConfig({ noThrow: true })`) is the opt-in
  exception: the function returns its type's empty value (`''`, `NaN`,
  `false`, `[]`, `undefined`). It is off by default.
- The thrown error type is part of the API: changing it is a major change
  (see `docs/versioning.md`).
- Each function's JSDoc lists its errors under `@throws`.
