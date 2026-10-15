# Benchmark baseline

Reference numbers for `bun run bench` (`bench/num-fns.bench.ts`), recorded at
`0.6.0` before the 0.7 work started (`docs/development-plan.md`, task 0.7-0).

How to use this file:

- Run `bun run bench` before and after a change on the same machine. The
  numbers here come from one machine and are not comparable to another one;
  compare the *ratio* between before and after.
- A change that makes a case more than 10 % slower needs a written reason in
  its changeset.
- Refresh this table only when a change moves a number on purpose (and say so
  in the changeset). Produce it with `BENCH_FORMAT=markdown bun run bench`.

## 0.6.0 baseline (2026-10-15)

```
clk: ~2.15 GHz
cpu: Intel(R) Xeon(R) Processor @ 2.10GHz
runtime: bun 1.4.2 (x64-linux)
```

| • formatNumber                 |              avg |         min |         p75 |         p99 |         max |
| ------------------------------ | ---------------- | ----------- | ----------- | ----------- | ----------- |
| formatNumber(1)                | `299.35 ns/iter` | `267.53 ns` | `297.14 ns` | `494.86 ns` | `685.83 ns` |
| formatNumber(1e6)              | `556.82 ns/iter` | `501.95 ns` | `569.31 ns` | `837.01 ns` | `889.35 ns` |
| formatNumber(1234567.891)      | `801.27 ns/iter` | `678.49 ns` | `797.31 ns` | `  1.34 µs` | `  1.68 µs` |
| formatNumber(1e21)             | `  1.53 µs/iter` | `  1.41 µs` | `  1.54 µs` | `  1.76 µs` | `  2.25 µs` |
| formatNumber(Number.MAX_VALUE) | `146.98 µs/iter` | `132.04 µs` | `147.29 µs` | `196.25 µs` | `910.88 µs` |

| • numberToWords                        |              avg |         min |         p75 |         p99 |         max |
| -------------------------------------- | ---------------- | ----------- | ----------- | ----------- | ----------- |
| numberToWords(999 999 999 999 999, en) | `  2.62 µs/iter` | `  1.41 µs` | `  2.43 µs` | ` 14.83 µs` | `476.48 µs` |
| numberToWords(999 999 999 999 999, ru) | `  2.72 µs/iter` | `  1.61 µs` | `  2.58 µs` | ` 15.45 µs` | `498.95 µs` |

| • arithmetic            |              avg |         min |         p75 |         p99 |         max |
| ----------------------- | ---------------- | ----------- | ----------- | ----------- | ----------- |
| add × 100 000           | ` 98.79 ms/iter` | ` 89.27 ms` | `103.90 ms` | `109.00 ms` | `112.63 ms` |
| sum of 100 000 decimals | `176.04 µs/iter` | `142.91 µs` | `158.31 µs` | `556.46 µs` | `  3.23 ms` |

| • parseNumber               |              avg |         min |         p75 |         p99 |         max |
| --------------------------- | ---------------- | ----------- | ----------- | ----------- | ----------- |
| parseNumber("1,234,567.89") | `463.49 ns/iter` | `236.00 ns` | `395.00 ns` | `  1.84 µs` | `  2.09 ms` |
