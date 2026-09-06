---
"num-fns": minor
---

Add multi-currency support keyed off ISO 4217 codes.

`formatMoney`, `parseMoney` and `moneyToWords` take a new `currency` option — `'AZN' | 'USD' | 'EUR' | 'RUB' | 'GBP'` — that defaults to the locale's own currency. The symbol and minor-unit exponent come from a new locale-independent registry (`getCurrency(code)`, the 46th root export); the locale decides which side of the amount the symbol goes and supplies the unit words, in every plural form and grammatical gender the language needs. Every launch locale now carries words for all five currencies:

```ts
formatMoney(9.99, { currency: 'EUR' }); // "€ 9.99"
formatMoney(9.99, { locale: az, currency: 'USD' }); // "9,99 $"
moneyToWords(1.5, { currency: 'GBP' }); // "one pound fifty pence"
moneyToWords(2.02, { locale: ru, currency: 'USD' }); // "два доллара два цента"
moneyToWords(1, { locale: es, currency: 'GBP' }); // "una libra"
```

An unknown code, or one the locale has no unit words for, throws `RangeError`. Explicit `symbol`, `symbolPosition`, `majorUnit` and `minorUnit` options still override whatever the code resolves to, so a currency outside the registry remains possible.

**Breaking changes** (pre-1.0, so `minor` per semver's `0.x` rule — see `CONTRIBUTING.md`'s "Releasing" section):

- `Locale.currency` is reshaped. The single `symbol`/`major`/`minor` triple is gone; the object is now `{ code, symbolPosition, units }`, where `units` maps each `CurrencyCode` to `{ major, minor }`. Read `az.currency.units.AZN.major.word` instead of `az.currency.major.word`, and `getCurrency(az.currency.code).symbol` instead of `az.currency.symbol`. Custom `Locale` objects must be updated to the new shape (`CurrencyCode` is re-exported from `num-fns/locale` for that).
- `enGB` defaults to `GBP` rather than `USD`: `formatMoney(1, { locale: enGB })` is now `"£ 1.00"` and `moneyToWords(1, { locale: enGB })` `"one pound"`. It also spells `RUB` as "rouble".
