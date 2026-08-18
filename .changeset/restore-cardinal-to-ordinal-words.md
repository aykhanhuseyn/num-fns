---
"num-fns": patch
---

Restore `cardinalToOrdinalWords`, a public export that was unintentionally dropped from `number/suffix.ts` during the locale-threading work (see the pending "Thread a `locale` option through every public function" changeset). It's now a thin wrapper around `locale.ordinal.words`, taking an `OrdinalOptions` (`{ locale }`) like the rest of the ordinal family, and defaults to `en`.

Also fixes the docs playground (`site/`, not part of the published package): `toShortNotation`/`parseShortNotation`'s locale field was still passing a raw `'az' | 'en'` string where the real function now requires a `Locale` object, and `toOrdinal`'s `separator` field was still wired as a positional argument after that function's separator moved into its options object. Every example whose function accepts `options.locale` now has a live locale picker.
