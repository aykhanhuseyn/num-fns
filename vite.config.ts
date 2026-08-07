import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

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
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AzNumberUtils',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
});
