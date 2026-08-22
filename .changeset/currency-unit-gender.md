---
"num-fns": minor
---

`LocaleCurrencyUnit` now takes an optional `gender` field (`'masculine' | 'feminine' | 'neuter'`), threaded into `moneyToWords`'s call to `numberToWords` when spelling the major and minor amounts. Major and minor units can declare different genders — real payoff for Russian, whose `рубль` (major) is masculine but `копейка` (minor) is feminine.

Fixes a pre-existing Russian bug: `moneyToWords` always spelled the minor amount masculine regardless of the unit it named, so `1.01` read «один рубль **один** копейка» — ungrammatical, since «копейка» takes «одна»/«две». `ru.currency.minor` now declares `gender: 'feminine'` (and `ru.currency.major` explicitly declares `gender: 'masculine'`, matching the existing default), so:

- `1.01` -> «один рубль **одна** копейка»
- `2.02` -> «два рубля **две** копейки»
- `21.21` -> «двадцать один рубль двадцать **одна** копейка»

`es.currency`'s `euro`/`céntimo` are both masculine — set explicitly for the same self-documenting reason, with no change in output. The field is optional and omitted for `az`/`en`, whose locales don't distinguish grammatical gender (`numberToWords` throws if a gender were passed to them); their `moneyToWords` output is unchanged.
