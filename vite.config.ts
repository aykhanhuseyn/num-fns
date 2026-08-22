import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { fixDistTypes } from './scripts/fix-dist-types'

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts'],
      insertTypesEntry: true,
      // The declarations this plugin emits are not consumable as-is: relative
      // specifiers are extensionless (rejected by `node16`/`nodenext`) and no
      // `.d.cts` twin is emitted for the `require` condition. See
      // `scripts/fix-dist-types.ts`. Hooking it here rather than chaining a
      // separate build step keeps `vite build --watch` correct too — the
      // plugin resets its `bundled` flag on `watchChange`, so `afterBuild`
      // fires on every rebuild.
      afterBuild: () => {
        fixDistTypes(resolve(import.meta.dirname, 'dist'))
      },
    }),
  ],
  build: {
    target: 'es2018',
    sourcemap: true,
    minify: false,
    emptyOutDir: false,
    lib: {
      // One entry per package subpath: `.` plus `./locale` (the barrel) and
      // one per-locale subpath (`./locale/az`, etc.) so a consumer can import
      // a single locale without pulling in the others (todo.md §1). Keep
      // this object in sync with the `exports` map in `package.json`.
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        'locale/index': resolve(import.meta.dirname, 'src/locale/index.ts'),
        'locale/az': resolve(import.meta.dirname, 'src/locale/az.ts'),
        'locale/en': resolve(import.meta.dirname, 'src/locale/en.ts'),
        'locale/en-gb': resolve(import.meta.dirname, 'src/locale/en-gb.ts'),
        'locale/ru': resolve(import.meta.dirname, 'src/locale/ru.ts'),
        'locale/es': resolve(import.meta.dirname, 'src/locale/es.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
})
