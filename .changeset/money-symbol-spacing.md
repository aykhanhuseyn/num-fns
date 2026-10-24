---
"num-fns": minor
---

**Breaking:** `formatMoney` takes the space between the currency symbol and
the amount from the locale (task 0.7-4). English no longer puts one there;
Azerbaijani, Russian and Spanish keep it. Pass `{ symbolSpacing: true }` to
keep the old English output.

| Call | 0.6.0 | 0.7.0 |
| --- | --- | --- |
| `formatMoney(1234.5)` | `"$ 1,234.50"` | `"$1,234.50"` |
| `formatMoney(1234.5, { locale: enGB })` | `"£ 1,234.50"` | `"£1,234.50"` |
| `formatMoney(-1.5)` | `"$ -1.50"` | `"$-1.50"` |
| `formatMoney(1234.5, { locale: az })` | `"1 234,50 ₼"` | `"1 234,50 ₼"` |

New option `symbolSpacing` on `formatMoney` overrides the locale. `parseMoney`
reads both forms (`"$1,234.50"` and `"$ 1,234.50"`) in every locale.

**Breaking for custom locales:** `Locale.currency.symbolSpacing: boolean` is
required. A locale written against 0.6 without it makes `formatMoney` throw
`TypeError` (naming the locale) unless the caller passes `symbolSpacing`.
