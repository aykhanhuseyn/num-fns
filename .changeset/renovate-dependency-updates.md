---
"num-fns": patch
---

Add Renovate config (`renovate.json`) for automated dependency updates, tuned for `bunfig.toml`'s `install.exact = true` (bumps pinned versions in place rather than widening to ranges). Groups lockstep tool pairs (Biome, Changesets, commitlint, Vite + vite-plugin-dts) and requires manual dashboard approval before bumping the pinned `typescript` prerelease line.
