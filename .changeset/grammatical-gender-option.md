---
'num-fns': minor
---

`numberToWords` now takes a `gender` option (`'masculine' | 'feminine' | 'neuter'`) for locales whose cardinal words inflect by grammatical gender. Each locale declares which genders its words distinguish (`Locale.words.genders` — `ru` all three, `es` masculine/feminine, `az`/`en` none) and its default (`Locale.words.defaultGender`, `'masculine'` for `ru`/`es`), so output is unchanged when the option is omitted; a gender the locale doesn't distinguish throws a `RangeError` instead of being silently ignored.

The requested gender agrees with the noun being counted, so it applies to the trailing units group and the decimal-fraction group: Russian inflects a trailing «один»/«два» (`одна`, `одно`, `две`), Spanish inflects `uno`/`veintiuno` and the `-cientos` hundreds (`una`, `veintiuna`, `doscientas`). Scale-bound groups keep agreeing with their own scale noun (`одна тысяча` regardless of the requested gender; `millón` and above stay masculine), except Spanish's gender-transparent `mil`, which passes agreement through (`doscientas mil`) while keeping the RAE apocope (`doscientas treinta y un mil`).

Also fixes a pre-existing Spanish bug: 21 000 read `veintiuno mil` and now correctly apocopates to `veintiún mil`.
