---
"num-fns": patch
---

Add a benchmark suite (`bun run bench`, mitata) with a committed baseline in
`bench/BASELINE.md`. It measures `formatNumber` across magnitudes,
`numberToWords`, the exact `add`, `sum` and `parseNumber`. CI runs it and
keeps the table as an artifact. No runtime change.
