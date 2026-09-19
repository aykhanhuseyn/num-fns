---
"num-fns": patch
---

`numberToWords` no longer drops a leading zero from the fractional part, so a hundredths value is not read back as a tenths one.

The fractional part reaches the reader as a plain integer — `splitFixed` rounds to two places and hands back `1` for `.01` and `10` for `.1` — and it was rendered with `locale.words.renderGroup` as-is. That dropped the leading zero: `numberToWords(1.01)` was `"one point one"`, which is exactly how a speaker reads `1.1`, so the two values were indistinguishable in words. `numberToWords(1.005)` inherited the same collision through the rounding.

The fraction is now padded back to two digits and each leading zero is spoken as `locale.words.zero` before the remainder:

- `numberToWords(1.01)` is `"one point zero one"`, against `"one point ten"` for `1.1`; `numberToWords(0.09)` is `"zero point zero nine"`.
- The fix lives in the locale-generic engine, so every locale gets it without a new hook: `{ locale: az }` reads `"bir tam sıfır bir"`, `{ locale: ru }` `"один запятая ноль один"`, `{ locale: es }` `"uno coma cero uno"`.
- A fraction with no leading zero is untouched — `12.34` is still `"twelve point thirty-four"` and `0.5` still `"zero point fifty"` — as are `bigint` inputs, which have no fractional part at all.

This changes the string returned for any value whose first fraction digit is zero, including `numberToWords(1.005)` (now `"one point zero one"`). A new locale-agnostic invariant in `locale/conformance.test.ts` pins the hundredths/tenths distinction for every locale.
