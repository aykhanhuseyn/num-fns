---
"num-fns": minor
---

Fixed two Russian (`ru`) linguistics gaps tracked in `todo.md` §2.

**Compound round-scale ordinals.** `ordinalToWords`/`toOrdinal`'s `ru`
implementation used to leave a round thousand/million/billion/trillion's
multiplier as a separate cardinal word in front of an ordinalized scale word,
which isn't grammatically correct Russian:

```ts
ordinalToWords(2000, { locale: ru }) // before: "две тысячный"
ordinalToWords(2000, { locale: ru }) // after:  "двухтысячный"

ordinalToWords(25000, { locale: ru }) // before: "двадцать пять тысячный"
ordinalToWords(25000, { locale: ru }) // after:  "двадцатипятитысячный"

ordinalToWords(2500000, { locale: ru })
// before: "два миллиона пятьсот тысячный"
// after:  "два миллиона пятисоттысячный"
```

The multiplier now fuses into a single compound word — its combining
("genitive-like") form plus the scale ordinal stem (`тысячный`/`миллионный`/
`миллиардный`/`триллионный`) — while any higher-magnitude chunks before it
stay as ordinary cardinal words. A reading that doesn't end in a scale word is
unaffected: `ordinalToWords(2001, { locale: ru })` still reads "две тысячи
первый", and `ordinalToWords(21, { locale: ru })` still reads "двадцать
первый".

**Decimal connector.** `ru` now sets `words.decimalConnector = 'запятая'`,
the standard spoken way of naming the decimal comma, so `numberToWords`
reads decimals the way `az`'s `'tam'` already did instead of joining the
integer and fractional parts with a bare space:

```ts
numberToWords(12.34, { locale: ru }) // before: "двенадцать тридцать четыре"
numberToWords(12.34, { locale: ru }) // after:  "двенадцать запятая тридцать четыре"

numberToWords(0.5, { locale: ru }) // after: "ноль запятая пятьдесят"
numberToWords(-3.7, { locale: ru }) // after: "минус три запятая семьдесят"
```
