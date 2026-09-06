---
"num-fns": minor
---

Add decimal-safe arithmetic: `add`, `subtract`, `multiply`, `divide` and `round`.

Five new root exports (46 → 51) do arithmetic on plain numbers without the classic floating-point traps. Each operand is taken at its shortest decimal reading — the string `String(0.1)` gives you, which is what you meant by the number — the operation runs exactly on integers, and the result is the closest JavaScript number to the exact answer. Everything goes in and comes out as a plain `number`; there is no decimal type to wrap and unwrap, and no new dependency:

```ts
add(0.1, 0.2); // 0.3   (0.1 + 0.2 is 0.30000000000000004)
subtract(0.3, 0.1); // 0.2   (0.3 - 0.1 is 0.19999999999999998)
multiply(1.1, 1.1); // 1.21  (1.1 * 1.1 is 1.2100000000000002)
divide(0.3, 0.1); // 3     (0.3 / 0.1 is 2.9999999999999996)
divide(1, 3); // 0.3333333333333333

round(1.005, 2); // 1.01  ((1.005).toFixed(2) is "1.00")
round(2.5, 0, 'halfEven'); // 2
round(-2.5, 0, 'halfDown'); // -2
round(-1.21, 1, 'floor'); // -1.3
round(1234, -2); // 1200
```

`round(value, precision = 0, mode = 'halfUp')` takes the same `RoundingMode` values as `formatNumber`'s `roundingMode` option (`'halfUp'`, `'halfDown'`, `'halfEven'`, `'ceil'`, `'floor'`) and accepts a negative `precision` to round to tens, hundreds and so on. It is now the one rounding implementation in the package: `formatNumber`, `formatMoney` and `formatPercentage` all delegate to it, and `formatPercentage`'s `multiplyBy100`/`asRatio` scaling goes through `multiply`/`divide`. `divide` carries the quotient to 25 significant digits, so a terminating quotient is exact and a non-terminating one matches correctly rounding the true quotient.

All five throw `RangeError` rather than returning `NaN` or `Infinity` — on non-finite input, division by zero, a non-integer `precision`, or a result too large for a JavaScript number — and never return `-0`.

The long-standing `halfUp` property-test flake in `formatNumber`'s round-trip suite (a `0.000050008...` diff on values like `-268435456.47635`) is gone: the rounding is exact now, and the property measures the round-trip difference with `subtract` instead of float `-`.

**Breaking changes** (pre-1.0, so `minor` per semver's `0.x` rule — see `CONTRIBUTING.md`'s "Releasing" section):

- `formatNumber` (and therefore `formatMoney`) rounds decimal-safely in every `roundingMode`. Values that sit on a decimal tie but a hair below it in binary now round the way they are written: `formatNumber(1.005, { decimals: 2 })` is `"1.01"`, where it was `"1.00"` via `toFixed`. Most outputs are unchanged; the ones that differ were the floating-point artefacts.
- `formatPercentage` scales exactly: `formatPercentage(1.005, { multiplyBy100: true })` is `"101%"`, where it was `"100%"` because `1.005 * 100` is `100.49999999999999` in JavaScript.
- `formatNumber`, `formatMoney` and `formatPercentage` throw `RangeError` for a non-integer `decimals` (e.g. `decimals: 1.5`), which `toFixed` used to truncate silently.
