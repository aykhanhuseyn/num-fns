import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Separate Vite root for the docs/playground landing page (see todo.md §6
// "Playground page..."). Kept independent from the library's own
// `vite.config.ts` (library build in `dist/`) — this app imports directly
// from `../src` so its examples run the real, current source rather than a
// built artifact, and it is never part of the published npm package.
export default defineConfig({
  root: resolve(import.meta.dirname),
  base: './',
  build: {
    outDir: resolve(import.meta.dirname, '../site-dist'),
    // Mirrors the root `vite.config.ts`'s `emptyOutDir: false` — on this repo's
    // fuse-mounted connected folder, `unlink()` is blocked entirely (see
    // `todo.md` §6 / memory `git-commit-mounted-folder-unlink`), so
    // `emptyOutDir: true`'s pre-build cleanup fails on a second build with
    // `EPERM: operation not permitted, unlink`. Content-hashed filenames mean
    // stale assets from old builds are simply unreferenced, not incorrect.
    emptyOutDir: false,
  },
  server: {
    port: 5175,
  },
})
