#!/usr/bin/env bun
/**
 * Scaffolds a new function per CONTRIBUTING.md's "How to add a new function":
 * creates `src/<directory>/<kebab-name>.ts` and its colocated
 * `<kebab-name>.test.ts`, then inserts a flat `export * from` line into
 * `src/index.ts` at the correct alphabetical position (src/index.ts is
 * ordered alphabetically by import path, one line per exported module).
 *
 * This only scaffolds the files — you still have to write the real
 * implementation, real assertions, and a JSDoc @example, then run
 * `bun run check && bun test` before committing.
 *
 * Usage:
 *   bun scripts/new-function.ts <directory> <functionName>
 *
 * Example:
 *   bun scripts/new-function.ts arithmetic average
 *     -> src/arithmetic/average.ts
 *     -> src/arithmetic/average.test.ts
 *     -> src/index.ts gains `export * from './arithmetic/average'`
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '..')
const SRC_ROOT = join(REPO_ROOT, 'src')
const INDEX_PATH = join(SRC_ROOT, 'index.ts')
const FUNCTION_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*$/
const KEBAB_BOUNDARY_1 = /([a-z0-9])([A-Z])/g
const KEBAB_BOUNDARY_2 = /([A-Z]+)([A-Z][a-z])/g
const INDEX_EXPORT_PATH = /from '(.+)'/
const LEADING_SRC_PREFIX = /^src\//
const TRAILING_SLASH = /\/$/

function toKebabCase(name: string): string {
  return name.replace(KEBAB_BOUNDARY_1, '$1-$2').replace(KEBAB_BOUNDARY_2, '$1-$2').toLowerCase()
}

function moduleTemplate(functionName: string): string {
  return `/**
 * TODO: one-line description of what \`${functionName}\` does.
 *
 * @example
 * ${functionName}(); // TODO
 */
export function ${functionName}(): never {
  // TODO: define real parameters and a real return type above, implement the
  // function, and validate input up front — throw RangeError/TypeError/
  // SyntaxError on bad input rather than returning NaN/undefined. See
  // src/arithmetic/clamp.ts for the pattern, and src/shared/validation.ts
  // for shared assertion helpers.
  throw new Error('TODO: implement ${functionName}')
}
`
}

function testTemplate(functionName: string, fileBase: string): string {
  return `import { describe, expect, it } from 'bun:test'
import { ${functionName} } from './${fileBase}'

describe('${functionName}', () => {
  it('is exported as a function', () => {
    expect(typeof ${functionName}).toBe('function')
  })

  // TODO: cover the documented default behavior.
  // TODO: cover at least one option override, if the function takes options.
  // TODO: cover every thrown-error case (RangeError/TypeError/SyntaxError).
})
`
}

function insertIndexExport(importPath: string): void {
  const content = readFileSync(INDEX_PATH, 'utf8')
  const lines = content.split('\n').filter((line) => line.length > 0)
  const newLine = `export * from '${importPath}'`

  if (lines.includes(newLine)) {
    console.error(`src/index.ts already has: ${newLine}`)
    process.exit(1)
  }

  const insertAt = lines.findIndex((line) => {
    const match = line.match(INDEX_EXPORT_PATH)
    return match !== null && match[1] !== undefined && match[1] > importPath
  })

  if (insertAt === -1) {
    lines.push(newLine)
  } else {
    lines.splice(insertAt, 0, newLine)
  }

  writeFileSync(INDEX_PATH, `${lines.join('\n')}\n`)
}

function formatWithBiome(paths: string[]): void {
  const biomeBin = join(REPO_ROOT, 'node_modules', '.bin', 'biome')
  const result = Bun.spawnSync([biomeBin, 'format', '--write', ...paths], { cwd: REPO_ROOT })
  if (result.exitCode !== 0) {
    console.error(
      'Warning: `biome format --write` failed on the generated files — run `bun run format` manually.',
    )
  }
}

function main(): void {
  const [directory, rawName] = process.argv.slice(2)

  if (!directory || !rawName) {
    console.error('Usage: bun scripts/new-function.ts <directory> <functionName>')
    console.error('Example: bun scripts/new-function.ts arithmetic average')
    process.exit(1)
  }

  if (!FUNCTION_NAME_PATTERN.test(rawName)) {
    console.error(
      `"${rawName}" isn't a valid function name — use camelCase, letters and digits only.`,
    )
    process.exit(1)
  }

  const functionName = `${rawName[0]?.toLowerCase()}${rawName.slice(1)}`
  const cleanDirectory = directory.replace(LEADING_SRC_PREFIX, '').replace(TRAILING_SLASH, '')
  const fileBase = toKebabCase(functionName)
  const dirPath = join(SRC_ROOT, cleanDirectory)
  const modulePath = join(dirPath, `${fileBase}.ts`)
  const testPath = join(dirPath, `${fileBase}.test.ts`)
  const importPath = `./${cleanDirectory}/${fileBase}`

  if (existsSync(modulePath)) {
    console.error(
      `${relative(REPO_ROOT, modulePath)} already exists — pick a different name or edit it directly.`,
    )
    process.exit(1)
  }

  mkdirSync(dirPath, { recursive: true })
  writeFileSync(modulePath, moduleTemplate(functionName))
  writeFileSync(testPath, testTemplate(functionName, fileBase))
  insertIndexExport(importPath)
  formatWithBiome([modulePath, testPath, INDEX_PATH])

  console.log(`Created ${relative(REPO_ROOT, modulePath)}`)
  console.log(`Created ${relative(REPO_ROOT, testPath)}`)
  console.log(`Added \`export * from '${importPath}'\` to src/index.ts`)
  console.log('')
  console.log('Next steps (CONTRIBUTING.md "How to add a new function"):')
  console.log(`  1. Implement ${functionName}() — real params, return type, and validation.`)
  console.log('  2. Write real assertions in the test file — default behavior, option')
  console.log('     override (if any), and every thrown-error case.')
  console.log('  3. Add a real JSDoc @example.')
  console.log('  4. bun run check && bun test')
}

main()
