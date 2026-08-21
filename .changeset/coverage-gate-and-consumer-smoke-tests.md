---
'num-fns': patch
---

Harden the test and release pipeline: a 100%-per-file coverage gate
(`bun run test:coverage`, wired into CI in place of `bun test`), `fast-check`
round-trip property tests for every format/parse pair across all four locales,
and a consumer smoke test (`bun run check:smoke`) that installs the packed
tarball into real ESM and CJS projects, executes them, and typechecks the
shipped declarations under `moduleResolution: nodenext`. CI now runs those
fixtures across Node 18/20/22/24 plus macOS and Windows.

`engines.node` moves from `>=14` to `>=18`. Nothing in the build requires it —
the output still targets es2018 — but 14 and 16 are long EOL and cannot be
tested on current CI runners, so the package no longer claims support it
cannot verify.

No runtime behavior changes. The only source edit is internal: `locale/az.ts`'s
two duplicate vowel-harmony scans are now one shared helper, which keeps the
same thrown `SyntaxError` messages.
