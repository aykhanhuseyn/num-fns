---
"num-fns": patch
---

Add a `size-limit` check (`bun run size`), wired into CI after the build step. Tracks the full `dist/index.js` surface, the `dist/locale/index.js` barrel, and each of the `az`/`en`/`ru`/`es` locale subpaths individually — the per-locale entries double as the bundle-size evidence that importing one locale doesn't pull in the other three.
