---
"num-fns": patch
---

Fix type resolution for CommonJS and `node16`/`nodenext` consumers. The emitted declarations carried extensionless relative specifiers (`export * from './arithmetic/clamp'`), which Node-style TypeScript resolution rejects, and only `.d.ts` files were shipped — so with `"type": "module"` every `exports` entry handed ESM types to consumers loading the `.cjs` build (attw's `FalseESM`). A new post-build step, `scripts/fix-dist-types.ts`, adds explicit extensions and emits a `.d.cts` twin of every declaration, and each `exports` entry now carries per-condition `types` (`import` → `.d.ts`, `require` → `.d.cts`). Bundler-based setups were unaffected and stay unchanged; `attw` and `publint` now pass, and both are enforced in CI and before publish by the new `bun run check:pack`.
