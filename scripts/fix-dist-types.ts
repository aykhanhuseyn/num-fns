#!/usr/bin/env bun
/**
 * Post-build fixup for the declarations `vite-plugin-dts` emits into `dist/`.
 *
 * Two things are wrong with them as emitted, both caught by `bun run check:pack`
 * (see `CLAUDE.md`'s "Build output" section):
 *
 *  1. Relative specifiers are extensionless (`export * from './arithmetic/clamp'`).
 *     Node's `node16`/`nodenext` TypeScript resolution rejects those — it wants
 *     `'./arithmetic/clamp.js'` — so every entry point reported an internal
 *     resolution error for ESM *and* CJS consumers.
 *  2. Only `.d.ts` files are emitted. The package is `"type": "module"`, so a
 *     `.d.ts` file is ESM, and pointing `exports[...].require.types` at one hands
 *     ESM types to a consumer loading `dist/index.cjs` (attw's `FalseESM`).
 *
 * So this rewrites each `.d.ts` in place with explicit `.js` extensions, then
 * writes a `.d.cts` twin of it whose specifiers carry `.cjs` extensions — giving
 * the `require` condition real CJS declarations that resolve to each other
 * rather than back into the ESM tree.
 *
 * `vite.config.ts` calls `fixDistTypes` from the dts plugin's `afterBuild` hook,
 * so it runs for `vite build` *and* `vite build --watch` (`bun run dev`) off a
 * single definition. Running this file directly is the manual escape hatch:
 *
 *   bun scripts/fix-dist-types.ts
 *
 * Idempotent: safe to re-run over an already-fixed `dist/` (`build.emptyOutDir`
 * is `false`, so that happens on every incremental build).
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DECLARATION_SUFFIX = '.d.ts'
const DECLARATION_EXTENSION = /\.d\.ts$/
// `from './x'` and `import('./x')` — the only forms tsc emits for a relative
// module reference in a declaration file. The quote is captured and
// backreferenced rather than hardcoded, so a switch to double quotes upstream
// turns this into a visible failure instead of a silent no-op.
const RELATIVE_SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]*)\2/g
// Already-rewritten specifiers, so a second pass re-derives rather than stacks.
const MODULE_EXTENSION = /\.(?:js|cjs)$/

type ModuleExtension = '.js' | '.cjs'

const DEFAULT_DIST_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')

function declarationFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return declarationFiles(path)
    return entry.name.endsWith(DECLARATION_SUFFIX) ? [path] : []
  })
}

/**
 * Turns one emitted specifier into an explicitly-extensioned one, resolving
 * `'./locale'` to `'./locale/index.js'` when it names a directory rather than a
 * module (tsc emits the bare directory form for a folder with an `index.ts`).
 *
 * Throws rather than guessing when it is neither: guessing `/index` produced a
 * specifier that resolved to nothing *and* grew by one `/index` on every
 * rebuild, which `emptyOutDir: false` makes reachable via a stale declaration
 * left behind by a deleted module.
 */
function retarget(specifier: string, fileDirectory: string, extension: ModuleExtension): string {
  const base = specifier.replace(MODULE_EXTENSION, '')
  if (existsSync(join(fileDirectory, `${base}${DECLARATION_SUFFIX}`))) return `${base}${extension}`
  if (existsSync(join(fileDirectory, base, `index${DECLARATION_SUFFIX}`))) {
    return `${base}/index${extension}`
  }
  throw new Error(
    `fix-dist-types: '${specifier}' in ${fileDirectory} matches neither ` +
      `${base}${DECLARATION_SUFFIX} nor ${base}/index${DECLARATION_SUFFIX}. ` +
      'A stale declaration from a deleted module is the usual cause — ' +
      'remove dist/ and rebuild.',
  )
}

function rewriteSpecifiers(source: string, file: string, extension: ModuleExtension): string {
  const fileDirectory = dirname(file)
  return source.replace(
    RELATIVE_SPECIFIER,
    (_match, prefix: string, quote: string, specifier: string) =>
      `${prefix}${quote}${retarget(specifier, fileDirectory, extension)}${quote}`,
  )
}

/** Rewrites every `.d.ts` under `distRoot` and writes its `.d.cts` twin. */
export function fixDistTypes(distRoot: string = DEFAULT_DIST_ROOT): number {
  if (!existsSync(distRoot)) {
    throw new Error(`fix-dist-types: no dist/ directory at ${distRoot} — run \`vite build\` first.`)
  }

  const files = declarationFiles(distRoot)

  if (files.length === 0) {
    throw new Error(
      `fix-dist-types: no ${DECLARATION_SUFFIX} files under ${distRoot} — did the dts plugin run?`,
    )
  }

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    writeFileSync(file, rewriteSpecifiers(source, file, '.js'))
    writeFileSync(
      file.replace(DECLARATION_EXTENSION, '.d.cts'),
      rewriteSpecifiers(source, file, '.cjs'),
    )
  }

  return files.length
}

if (import.meta.main) {
  try {
    const count = fixDistTypes()
    console.log(`fix-dist-types: rewrote ${count} .d.ts files and wrote their .d.cts twins`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
