---
"num-fns": patch
---

Refactor internal code for clarity. No output, error message, export or type changes.

- English ordinal rules for `en` and `enGB` now live in one private module. `es`, `en` and `enGB` share the plural and thousand-group helpers.
- `toShortNotation`, `toLongNotation` and `toByteSize` share one private helper for trailing zeros and float noise.
- Smaller clean-ups in `roman`, `az`, `money/words`, `isEven`/`isOdd`, `standardDeviation` and `sumDecimals`.

Bench: interleaved A/B runs against 0.9.0 show every row within run-to-run noise.
