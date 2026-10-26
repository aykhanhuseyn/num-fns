/**
 * `bun check` type checks with the TypeScript version built into Bun. The
 * editor, `vite-plugin-dts` and TypeDoc use the `typescript` package from
 * `package.json`. When the two versions are different, CI and the editor can
 * show different errors. This script stops `check:type` in that case.
 *
 * Fix: change `packageManager` (Bun) or `devDependencies.typescript` so that
 * `bun -p process.versions.typescript` and the package version are the same.
 */
import pkg from '../package.json' with { type: 'json' }

const bundled = process.versions.typescript
const pinned = pkg.devDependencies.typescript
const bun = Bun.version
const wanted = pkg.packageManager.replace(/^bun@/, '')

const problems: string[] = []
if (bundled === undefined) {
  problems.push(
    `Bun ${bun} has no built-in type checker. Use Bun ${wanted} (package.json "packageManager").`,
  )
} else if (bundled !== pinned) {
  problems.push(
    `Bun ${bun} checks with TypeScript ${bundled}, but package.json pins typescript ${pinned}.`,
  )
}
if (bun !== wanted) {
  // Only a warning: a different Bun with the same TypeScript gives the same
  // errors. CI always runs the pinned version (bun-version-file).
  console.warn(
    `check-ts-version: Bun ${bun} is running, but package.json "packageManager" is bun@${wanted}.`,
  )
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`check-ts-version: ${problem}`)
  process.exit(1)
}
console.log(`check-ts-version: Bun ${bun}, TypeScript ${bundled}`)
