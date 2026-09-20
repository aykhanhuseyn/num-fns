---
'num-fns': minor
---

Treat `-0` as a value instead of scrubbing it

A negative zero now survives every operation that produces one, reversing the
"never return `-0`" rule. `formatNumber(-0)` is `"-0"`, `formatNumber(-0.4, {
decimals: 0 })` is `"-0"`, `toShortNotation(-0.4)` is `"-0"`,
`numberToWords(-0.001)` is `"negative zero"`, `moneyToWords(-0.001)` is
`"negative zero dollars"`, and `toBase(-0, 2)` is `"-0"` (which `fromBase`
reads back as `-0`).

`round` keeps the sign of a value that rounds away to zero (`round(-0.4)` is
`-0`), and `add`/`subtract`/`multiply`/`divide` follow IEEE 754 for signed
zeros: `multiply(-1, 0)` and `divide(0, -5)` are `-0`, `add(-0, -0)` is `-0`,
`add(-1.5, 1.5)` is `0`. A negative value that underflows to zero
(`divide(-1e-308, 1e308)`) keeps its sign too.

There is no negative zero `bigint`, so the `bigint` paths are unchanged:
`formatNumber(BigInt('-0'))` is `"0"` and `fromBase('-0', 2, { output:
'bigint' })` is `0n`.
