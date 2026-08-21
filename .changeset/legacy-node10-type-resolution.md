---
'num-fns': patch
---

Make the `./locale` and `./locale/{az,en,ru,es}` subpaths resolvable for
consumers on legacy TypeScript module resolution (`moduleResolution: node`/
`node10`, still the default for CommonJS projects on TypeScript 5.x). Those
resolvers cannot read the `exports` map at all, so importing
`num-fns/locale/az` failed with `TS2307 Cannot find module` even though the
declarations were right there in the tarball; a `typesVersions` map now points
each subpath at its `.d.ts`.

With that in place `attw` runs under its default `strict` profile instead of
`--profile node16`, so no resolution mode is skipped any more, and a
`moduleResolution: node10` consumer fixture is part of `bun run check:smoke`.
