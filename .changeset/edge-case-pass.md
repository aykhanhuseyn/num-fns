---
'num-fns': minor
---

Close the `NaN` / `Infinity` / `-0` / min-max edge cases per function

The per-function edge-case pass turned up four places where the package's own
throw-on-bad-input rule was not actually being kept:

- **`null` and `undefined` were silently zero.** The `typeof value ===
  'number' && !Number.isFinite(value)` guard let a non-number straight
  through, and `Math.abs(null)` is `0`, so `formatNumber(null)` returned
  `"0"`, `numberToWords(null)` returned `"zero"` and `toOrdinal(null)`
  returned `"null-th"`. Every function taking a `number | bigint` now throws
  `TypeError` for a value that is neither.
- **`formatNumber` emitted exponent notation at the bounds.** `String(1e21)`
  is `"1e+21"` and `toFixed` has the same cliff, so `formatNumber(1e21)` was
  `"1e+21"` rather than a grouped twenty-two-digit number. The digits now come
  from the value's exact decimal, so every finite number formats positionally
  at any magnitude — `Number.MAX_VALUE` and `5e-324` included — and
  round-trips back through `parseNumber`.
- **Parsers could return `Infinity`.** `Number("Infinity")` succeeds, so
  `parseNumber("Infinity")` returned `Infinity`; it throws `RangeError` now,
  and so do `parseMoney`, `parsePercentage`, `parseShortNotation` and
  `parseByteSize` through it.
- **`sum` and `variance` could return `Infinity`.** An accumulation that
  overflows throws `RangeError`, the way `add`/`multiply` already did.

Also: `formatNumber` validates a negative `decimals` on both input types
(`toFixed` used to do it by accident on the `number` path), and
`toLongNotation(-0)` is `"-0"` like the other renderers.
