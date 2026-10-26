# 0004 — No `format/` + `parse/` split, no `humanize/`

- **Status:** accepted, 2026-08-25
- **Source:** `todo.md §3` ("`format/` + `parse/` split")

## Context

The project vision document shows `src/{format,parse,humanize,…}/`. The code
has one directory per domain: `number/`, `money/`, `percentage/`, ….

## Decision

Each domain keeps its formatter and its parser in one file. There is no
`humanize/` directory.

## Consequences

- A formatter and its parser change and are tested as one unit. The
  property tests check `parse(format(n)) === n` in one place.
- Money and percentage parsing call `parseNumber`, and their options live
  together in `shared/types.ts`.
- `src/number/` is almost all locale-driven words. A `humanize/` directory
  would take most of it and leave two files. `notation.ts` has digits and
  words that share one scale table.
- The package publishes a flat barrel, so the internal layout is invisible
  to users. A reorganisation would give no API benefit.
