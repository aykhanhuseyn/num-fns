---
"num-fns": minor
---

**Breaking:** `toOrdinal` takes the text between the digits and the suffix
from the locale, not a fixed `'-'` (task 0.7-3). English is now `"3rd"`
(was `"3-rd"`), and Spanish `"3º"` (was `"3-º"`); Azerbaijani `"3-cü"` and
Russian `"3-й"` do not change. Pass `{ separator: '-' }` to keep the old
output.

| Call | 0.6.0 | 0.7.0 |
| --- | --- | --- |
| `toOrdinal(3)` | `"3-rd"` | `"3rd"` |
| `toOrdinal(3, { locale: enGB })` | `"3-rd"` | `"3rd"` |
| `toOrdinal(3, { locale: es })` | `"3-º"` | `"3º"` |
| `toOrdinal(3, { locale: az })` | `"3-cü"` | `"3-cü"` |
| `toOrdinal(3, { locale: ru })` | `"3-й"` | `"3-й"` |

**Breaking for custom locales:** `Locale.ordinal.separator: string` is
required. A locale written against 0.6 without it makes `toOrdinal` throw
`TypeError` (naming the locale) instead of writing `"3undefinedrd"`; an
explicit `separator` option still works.

New optional `Locale.ordinal.prefix`, written before the digits, for a
language that marks the ordinal in front (Chinese `第3`). No shipped locale
sets it.
