---
"num-fns": patch
---

Add `scripts/new-function.ts`, run via `bun run new:function <directory> <functionName>`. Scaffolds a new function's `.ts` file, its colocated `.test.ts`, and the `export * from` line in `src/index.ts` (inserted at the correct alphabetical position). CONTRIBUTING.md's "How to add a new function" now leads with this as step 0.
