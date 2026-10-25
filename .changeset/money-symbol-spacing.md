---
"num-fns": minor
---

**Breaking:** `formatMoney` takes the space between the currency symbol and
the amount from the locale (task 0.7-4). English no longer puts one there;
Azerbaijani, Russian and Spanish keep it. Pass `{ symbolSpacing: true }` to
keep the old English spacing. A negative amount now puts its minus sign in
front of a leading symbol (`"-$1.50"`, not `"$-1.50"`) in every locale.

| Call | 0.6.0 | 0.7.0 |
| --- | --- | --- |
| `formatMoney(1234.5)` | `"$ 1,234.50"` | `"$1,234.50"` |
| `formatMoney(1234.5, { locale: enGB })` | `"£ 1,234.50"` | `"£1,234.50"` |
| `formatMoney(-1.5)` | `"$ -1.50"` | `"-$1.50"` |
| `formatMoney(-1.5, { locale: az })` | `"-1,50 ₼"` | `"-1,50 ₼"` |
| `formatMoney(1234.5, { locale: az })` | `"1 234,50 ₼"` | `"1 234,50 ₼"` |

New option `symbolSpacing` on `formatMoney` overrides the locale. The locale's spacing
also applies when you move the symbol: `formatMoney(9.99, { symbolPosition: 'after' })`
is `"9.99$"` in `en`; add `symbolSpacing: true` for `"9.99 $"`. `parseMoney`
reads every form (`"$1,234.50"`, `"$ 1,234.50"`, `"-$1.50"`, `"$-1.50"`) in
every locale.

**Breaking for custom locales:** `Locale.currency.symbolSpacing: boolean` is
required. A locale written against 0.6 without it makes `formatMoney` throw
`TypeError` (naming the locale) unless the caller passes `symbolSpacing`.
