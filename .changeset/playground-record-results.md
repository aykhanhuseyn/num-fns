---
"num-fns": patch
---

Docs-site and tooling fixes (`site/` and `lefthook.yml`, neither part of the published package).

- The playground's result box rendered a record result through `String(value)`, so the `getCurrency` card showed `[object Object]` instead of the currency it had just looked up. A record now goes through the same table renderer the array-of-records results (`amortizationSchedule`) already used, so `getCurrency("EUR")` shows `code` / `symbol` / `decimals` as `EUR` / `€` / `2`. `numberToWords`' card description also now states how a leading zero in the fraction is read.
- The pre-commit Biome hook's `glob` did not list `webmanifest`, so `site/public/site.webmanifest` was the one committed file the hook skipped. Biome formats it as JSON and the repo-wide `bun run format:check` in CI does check it, so a reformat of that file passed the commit hook and could only fail later in CI. The glob now covers it.
