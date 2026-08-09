import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts'],
      insertTypesEntry: true,
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
