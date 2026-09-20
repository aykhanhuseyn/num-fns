---
'num-fns': minor
---

Add a package-wide config with a `noThrow` mode, and an infinity word per locale

`num-fns` has always thrown on bad input rather than returning `NaN`, and that
is still the default. `setConfig({ noThrow: true })` swaps every throw for the
return type's empty value, for callers rendering values they do not control:

```ts
import { setConfig, formatNumber } from 'num-fns'

setConfig({ noThrow: true })
formatNumber(Number.NaN) // ""
formatNumber(Number.POSITIVE_INFINITY) // "infinity"
formatNumber(1234.5) // "1,234.5" — unchanged
```

The empty value is `''` for a string, `NaN` for a number, `false` for a
boolean, `[]` for `mode`/`amortizationSchedule` and `undefined` for
`getCurrency`. `Infinity` and `-Infinity` are the one case a renderer can say
something about, so they read as the locale's new `words.infinity`, prefixed
with `words.negative` when negative. The mode suppresses *every* error,
option-combination and configuration mistakes included, so prefer the per-call
`noThrow` option — every options object now accepts one, and it wins over the
global setting — and leave the global value `false`.

New exports: `getConfig`, `setConfig`, `resetConfig`, and the `NumFnsConfig`
and `NoThrowOptions` types. The public function surface goes from 51 to 54.

**Breaking for custom locales:** `Locale.words.infinity` is a new required
field. The five launch locales set it (`az` `sonsuzluq`, `en`/`enGB`
`infinity`, `ru` `бесконечность`, `es` `infinito`); a locale of your own needs
one line added.
