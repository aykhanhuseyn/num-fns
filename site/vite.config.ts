import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

/** The published version, inlined so `review.html` can stamp a report with the release it judged. */
const { version } = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8'),
) as { version: string }

// Separate Vite root for the docs/playground landing page (see todo.md §6
// "Playground page..."). Kept independent from the library's own
// `vite.config.ts` (library build in `dist/`) — this app imports directly
// from `../src` so its examples run the real, current source rather than a
// built artifact, and it is never part of the published npm package.
export default defineConfig({
  root: resolve(import.meta.dirname),
  base: './',
  define: {
    __PKG_VERSION__: JSON.stringify(version),
  },
  build: {
    // Two pages: the docs/playground landing page and the native-speaker
    // locale review tool (`todo.md` §2). They share `src/tokens.css` and the
    // `public/` assets but no layout, so they are separate entries rather than
    // one router.
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        review: resolve(import.meta.dirname, 'review.html'),
      },
    },
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
