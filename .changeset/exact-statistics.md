---
"num-fns": minor
---

Make the statistics exact in decimal, the same way `add`/`divide` are.
`sum([0.1, 0.2])` is now `0.3` (it was `0.30000000000000004`),
`mean([0.1, 0.2])` is `0.15`, and `median`, `percentile`, `quantile` and
`variance` use the exact arithmetic for every step; `standardDeviation`
takes `Math.sqrt` of an exact variance. `min`, `max` and `mode` are unchanged.

Results can differ from `0.6.0` in the last digits — that is the fix, but
check any test that pinned a float-rounded value. The overflow error message
of `sum`/`variance` now shows the exact result instead of `Infinity`.

Cost: `sum` of 100 000 two-decimal values is about 11× slower than the float
loop (1.9 ms vs 0.18 ms on the baseline machine); lists with a few fraction
digits take a fast path that never touches `BigInt`. See `bench/BASELINE.md`.
