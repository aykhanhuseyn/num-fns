---
'num-fns': patch
---

Document the closed design decisions

`todo.md`'s two long-open decisions are settled, and README, CLAUDE.md and
CONTRIBUTING.md say so:

- **No `Intl`, anywhere.** `formatNumber` stays self-contained rather than
  delegating to `Intl.NumberFormat`. `Intl` output depends on the runtime's
  ICU data, which would make `formatNumber` the one function whose result a
  consumer cannot pin in a test, and it would only cover the grouping half of
  one function while words, ordinals, notation and roman numerals stayed
  hand-written. This also drops the planned `Intl.NumberFormat` cross-check
  from the test suite — the per-locale separator conventions are pinned by the
  conformance and round-trip property tests instead.
- **No precision limit on arithmetic operands.** An operand past
  `Number.MAX_SAFE_INTEGER` is read at its shortest decimal like any other,
  the operation runs exactly on `BigInt`, and the only lossy step is the
  single correctly-rounded conversion back to a `number`. What a precise
  function still refuses to do is return `±Infinity`.
