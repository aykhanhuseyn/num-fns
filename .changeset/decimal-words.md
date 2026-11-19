---
'num-fns': minor
---

**`numberToWords` reads decimals correctly** (task 0.9-3). Until now it
rounded every fraction to two digits and read them as a number of
hundredths, so `2.1` was "two point ten", `3.125` lost its last digit and
`0.001` read as "zero". Now every fraction digit of the number is read (up
to 20), in the way each language says it:

| Call | 0.8.0 | 0.9.0 |
| --- | --- | --- |
| `numberToWords(2.1)` | two point ten | two point one |
| `numberToWords(12.34)` | twelve point thirty-four | twelve point three four |
| `numberToWords(3.125)` | three point thirteen | three point one two five |
| `numberToWords(0.001)` | zero | zero point zero zero one |
| `numberToWords(1.5, { locale: az })` | bir tam əlli | bir tam onda beş |
| `numberToWords(12.34, { locale: az })` | on iki tam otuz dörd | on iki tam yüzdə otuz dörd |
| `numberToWords(0.5, { locale: ru })` | ноль запятая пятьдесят | ноль запятая пять |
| `numberToWords(0.5, { locale: es })` | cero coma cincuenta | cero coma cinco |

Integers, `bigint` values and `moneyToWords` do not change. The
`src/locale/golden.test.ts` snapshot changes only in its `numberToWords`
decimal lines.

New **optional** `Locale` field `words.decimalStyle`:
`'digits'` (`en`, `enGB`), `'number'` (`ru`, `es`, and the default when a
custom locale leaves it out) or `'fraction'` (`az`, read through
`Locale.fractions`). A style that cannot read a value falls back from
`'fraction'` to `'number'` to `'digits'`; an unknown value throws
`RangeError`.

Size: the decimal reader adds under 0.1 kB brotli. `locale/az` (3.68 kB)
and `locale/en-gb` (3.32 kB) bundle `numberToWords` for their fraction
words, so their `size-limit` budgets go 3.6 → 3.7 KB and 3.3 → 3.4 KB. The
root entry stays inside 9.5 KB (9.49 kB).

Also in this release, documentation only: `docs/api-review-1.0.md` (every
export reviewed for 1.0, all kept), the naming rules and the "`setConfig`
is for applications, not libraries" rule in the README, and the JSDoc of
`CurrencyCode` (new codes come in minor versions; do not `switch` over it
exhaustively).
