---
"num-fns": minor
---

**Breaking:** make the statistics exact in decimal, the same way `add`/`divide` are.
`sum([0.1, 0.2])` is now `0.3` (it was `0.30000000000000004`),
`mean([0.1, 0.2])` is `0.15`, and `median`, `percentile`, `quantile` and
`variance` keep every middle step exact and round only the result — so
`percentile(xs, 50)` always equals `median(xs)`, and a total that would
overflow no longer breaks `mean`/`median` (`mean([Number.MAX_VALUE,
Number.MAX_VALUE])` is `Number.MAX_VALUE`). `standardDeviation` takes
`Math.sqrt` of an exact variance. `min`, `max` and `mode` are unchanged.

Results can differ from `0.6.0` in the last digits — that is the fix, but
check any test that pinned a float-rounded value. The overflow error of
`sum`/`variance` now names the size of the exact result
(`sum: result (about 2e+308) is outside the range of a JavaScript number`).

Cost: `sum` of 100 000 two-decimal values is about 11× slower than the float
loop (1.9 ms vs 0.18 ms on the baseline machine); lists with a few fraction
digits take a fast path that never touches `BigInt`. See `bench/BASELINE.md`.
