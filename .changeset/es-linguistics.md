---
"num-fns": minor
---

Fixed two Spanish (`es`) linguistics gaps tracked in `todo.md` §2.

**Compound round-scale ordinals.** `ordinalToWords`/`toOrdinal`'s `es`
implementation ordinalizes every recognized token of a compound number, which
is correct for most values but not for a round multiple of a scale word
(`mil`/`millón(es)`/`millardo(s)`/`billón(es)`) — ordinalizing each token
independently produced a disagreeing pair of words instead of RAE's
idiomatic fused ordinal:

```ts
ordinalToWords(2000, { locale: es }) // before: "segundo milésimo"
ordinalToWords(2000, { locale: es }) // after:  "dosmilésimo"

ordinalToWords(100000, { locale: es }) // before: "centésimo milésimo"
ordinalToWords(100000, { locale: es }) // after:  "cienmilésimo"

ordinalToWords(1000000, { locale: es }) // before: "un millonésimo"
ordinalToWords(1000000, { locale: es }) // after:  "millonésimo"

ordinalToWords(21000, { locale: es })
// before: "veintiún milésimo"
// after:  "veintiunmilésimo"

ordinalToWords(250000, { locale: es })
// before: "doscientos quincuagésimo milésimo"
// after:  "doscientoscincuentamilésimo"
```

Only the number's *final* scale chunk fuses: its multiplier cardinal —
apocopated the same way `es`'s cardinal composer already apocopates it before
a scale word ("veintiún mil"), with the apocope's written accent dropped once
it's no longer word-final ("veintiunmilésimo", not "veintiúnmilésimo") —
attaches directly to that scale's ordinal stem, and a multiplier of exactly 1
is omitted entirely (`1e9` → "millardésimo", not "unmillardésimo"). Any chunk
above the fused one stays in ordinary cardinal form: `2003000` reads "dos
millones tresmilésimo". A multiplier that itself needs the "y" connector
("treinta y uno" before "mil") has no attested single-word RAE fusion, so
those numbers (e.g. `31000`) fall back to the pre-existing per-token
behavior rather than inventing an unattested spelling. A number that doesn't
end in a scale word is unaffected: `ordinalToWords(2001, { locale: es })`
still reads "segundo milésimo primero".

**Decimal connector.** `es` now sets `words.decimalConnector = 'coma'`, RAE's
standard reading of the decimal point, so `numberToWords` reads decimals the
way `az`'s `'tam'` and `ru`'s `'запятая'` already do instead of joining the
integer and fractional parts with a bare space:

```ts
numberToWords(12.34, { locale: es }) // before: "doce treinta y cuatro"
numberToWords(12.34, { locale: es }) // after:  "doce coma treinta y cuatro"

numberToWords(0.5, { locale: es }) // after: "cero coma cincuenta"
numberToWords(-3.5, { locale: es }) // after: "menos tres coma cincuenta"
```

The fraction group's grammatical-gender agreement is unaffected — only the
connector between the two groups changed: `numberToWords(0.21, { locale: es,
gender: 'feminine' })` now reads "cero coma veintiuna" (previously "cero
veintiuna").
