---
'num-fns': minor
---

Reject option combinations that made output unparseable, and make `resolveScaleWord` internal.

Three pre-1.0 corrections, all of which turn silently-wrong results into thrown errors:

- `formatNumber` and `parseNumber` now throw `RangeError` when `thousandsSeparator` equals `decimalSeparator`. Previously `parseNumber('0.001', { thousandsSeparator: '.', decimalSeparator: '.' })` stripped both separators and returned `1`. `formatMoney`/`parseMoney` and `formatPercentage`/`parsePercentage` inherit the guard by delegation.
- `toLongNotation` and `parseLongNotation` now throw `RangeError` when `groupSeparator` is empty or contains a digit. An empty separator produced `"1 million234 thousand"`, which `parseLongNotation` could not read back; a digit-bearing separator merged into the digit groups the same way.
- `resolveScaleWord` is no longer exported from the package root. It resolves a locale scale entry to a plural form for `numberToWords` and `toLongNotation` and was only ever reachable because the barrel used `export *`; the root surface is now 45 functions. Reach scale words through a locale's `words.scales` instead.
