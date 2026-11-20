import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** The published version, inlined so `review.html` can stamp a report with the release it judged. */
const { version } = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8'),
) as { version: string }

// Separate Vite root for the website: landing, docs, playground and the
// native-speaker review page (see todo.md §6 "Playground page..."), all React.
// Kept independent from the library's own
// `vite.config.ts` (library build in `dist/`) — this app imports directly
// from `../src` so its examples run the real, current source rather than a
// built artifact, and it is never part of the published npm package.
export default defineConfig({
  root: resolve(import.meta.dirname),
  base: './',
  plugins: [react()],
  define: {
    __PKG_VERSION__: JSON.stringify(version),
  },
  build: {
    // Four static pages that share `src/ui/` (header, footer, theme) and the
    // `public/` assets. They are separate entries rather than one client-side
    // router, so every page has its own URL and works on GitHub Pages with no
    // fallback rewrite.
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        docs: resolve(import.meta.dirname, 'docs.html'),
        playground: resolve(import.meta.dirname, 'playground.html'),
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
