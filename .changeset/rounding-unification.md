---
"num-fns": minor
---

`numberToWords`, `moneyToWords`, `toShortNotation` and `toByteSize` now round through the same exact-decimal path as everything else — the last four places that still used `Math.round`/`toFixed` on a float-scaled magnitude.

- `numberToWords(2.675)` ends in "sixty-eight" and `moneyToWords(2.675)` is "two dollars sixty-eight cents" (both read "sixty-seven" before: `(2.675 - 2) * 100` is `67.49999999999997` in floating point). The fraction is rounded by `round`, so `1.999` carries into "two" as part of the rounding and the magnitude cap is checked after the carry.
- `toShortNotation(2675000, { decimals: 2 })` is `"2.68M"` and `toByteSize(1005, { base: 1000 })` is `"1.01 KB"` (were `"2.67M"` and `"1 KB"`: the quotient's double sits just below the tie). A `number` and the equal `bigint` now format to the same string on every digit — the property test that used to *allow* a one-unit disagreement asserts equality.
- Consequences of the shared path: `decimals` is validated on the `number` path of `toShortNotation`/`toByteSize` too (`{ decimals: 1.5 }` throws `RangeError` instead of being truncated); a negative value that rounds to zero is `"0"` / "zero", never `"-0"` / "negative zero"; a `number` whose scaled value is past 1e21 keeps every digit like a `bigint` does (`toShortNotation(1e300)` is 289 digits and a `T`, not `"1e+288T"`).

Bundle: `locale/az` and `locale/en-gb` grow by ~0.45 kB because `numberToWords` now pulls in `round`; the root `index` is unchanged (it already had it).
