---
"num-fns": minor
---

Remove eleven Azerbaijani vocabulary constants from the public API. They are module-private in `locale/az.ts` now, reachable through the `az` locale object like every other locale's vocabulary.

**Breaking change** (this package hasn't hit 1.0 yet — see `CONTRIBUTING.md`'s "Releasing" section for why this is `minor`, not `major`). These names no longer exist on `num-fns`:

| Removed | Was exported from | Read it as |
| --- | --- | --- |
| `ONES` | `number/words.ts` | `az.words.ones` |
| `TENS` | `number/words.ts` | `az.words.tens` |
| `SCALE_WORDS` | `number/words.ts` | `az.words.scales` |
| `ZERO_WORD` | `number/words.ts` | `az.words.zero` |
| `NEGATIVE_WORD` | `number/words.ts` | `az.words.negative` |
| `DECIMAL_WORD` | `number/words.ts` | `az.words.decimalConnector` |
| `HUNDRED_WORD` | `number/words.ts` | `az.words.hundreds` |
| `SHORT_SCALES_AZ` | `number/notation.ts` | `az.notation.scales` |
| `AZN_SYMBOL` | `shared/constants.ts` | `az.currency.symbol` |
| `DEFAULT_THOUSANDS_SEPARATOR` | `shared/constants.ts` | `az.formatDefaults.thousandsSeparator` |
| `DEFAULT_DECIMAL_SEPARATOR` | `shared/constants.ts` | `az.formatDefaults.decimalSeparator` |

Every one was Azerbaijani data left behind in a locale-generic module by the locale refactor, and only `locale/az.ts` ever imported them. The two `DEFAULT_*` names were the most misleading: despite the names they held `' '` and `','`, which are Azerbaijani conventions, not the `en` defaults (`','` and `'.'`) that every function actually falls back to.

`src/shared/constants.ts` is gone with them, and the package root's pinned export surface drops from 57 names to 46 — all of which are now functions.

No behavior changes: `az`'s output is byte-identical, and the notation table it derived from `SHORT_SCALES_AZ` is written out literally, matching how every other locale declares it.
