---
'num-fns': minor
---

Docs and proof (milestone 0.8.0). No API change and no output change: every
function returns the same value as in 0.7.0, and the golden snapshot is
unchanged.

- **API reference.** TypeDoc builds a page for every export at
  [`/api/`](https://aykhanhuseyn.github.io/num-fns/api/), next to the
  playground. Each playground card links to its page.
- **JSDoc.** Every export has a summary, `@param`, `@returns`, `@throws`,
  `@example` and `@since`, so editor tooltips show the errors a call can
  throw and the version that added it.
- **Type-level tests** for the `output` overloads of all seven parsers
  (`parseNumber`, `parseMoney`, `parsePercentage`, `parseShortNotation`,
  `parseLongNotation`, `parseByteSize`, `fromBase`).
- **`docs/versioning.md`** says which changes are a patch, a minor or a major
  release, for code and for locale data.
- Decision records `docs/decisions/0001`–`0006`; `todo.md` is frozen at
  `docs/archive/todo-2026.md`; issue and pull request templates,
  `SECURITY.md` and `CODE_OF_CONDUCT.md`.
- Type checking uses `bun check` (Bun 1.4.4) instead of `tsc`; CI uses the
  Bun version from `package.json`.
