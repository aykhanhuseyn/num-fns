#!/usr/bin/env node
// Installs the packed tarball into throwaway consumer projects and runs them,
// which is the only check here that sees the package the way `npm install`
// hands it over: real `node_modules/num-fns`, real `exports` resolution, real
// Node version. `check:pack` (attw + publint) reads the same tarball but only
// reasons about it statically, and `bun test` never touches `dist/` at all.
//
//   node scripts/smoke.mjs                      # pack, then run every fixture
//   node scripts/smoke.mjs --types              # also typecheck the TS fixtures
//   node scripts/smoke.mjs --tarball num-fns-0.2.0.tgz
//   node scripts/smoke.mjs --keep               # leave the temp dir for poking at
//
// Requires a prior `bun run build` (like `check:pack`, it packs but does not
// build). Deliberately plain ESM with no dependencies and no modern syntax:
// CI runs this file on every Node version in the support matrix, including the
// oldest one `engines.node` claims, so it has to parse there.
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(scriptsDir, '..')
const fixturesDir = join(scriptsDir, 'smoke')

const args = process.argv.slice(2)
const withTypes = args.includes('--types')
const keepTempDir = args.includes('--keep')
const tarballArgIndex = args.indexOf('--tarball')
const tarballArg = tarballArgIndex === -1 ? null : args[tarballArgIndex + 1]

/**
 * Runtime fixtures run everywhere; the type fixtures need a working `tsc`.
 * `types-esm`/`types-cjs` resolve through the `exports` map's per-condition
 * `types`; `types-node10` resolves through `typesVersions`, which is the only
 * thing legacy `moduleResolution: node10` can read — and the only reason that
 * field exists in `package.json`.
 */
const RUNTIME_FIXTURES = [
  { name: 'esm', entry: 'smoke.mjs' },
  { name: 'cjs', entry: 'smoke.cjs' },
]
const TYPE_FIXTURES = [
  { name: 'types-esm', compiler: 'current' },
  { name: 'types-cjs', compiler: 'current' },
  // `moduleResolution: node10` was removed in TypeScript 7 (error TS5108), so
  // this one has to run on the legacy compiler the repo already pins.
  { name: 'types-node10', compiler: 'legacy' },
]

/** `npm` is a shell script on POSIX and a `.cmd` shim on Windows. */
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function run(command, commandArgs, cwd) {
  return execFileSync(command, commandArgs, { cwd, encoding: 'utf8', stdio: 'pipe' })
}

/**
 * Copies a fixture's files into `destination`. Flat on purpose — one level of
 * `copyFileSync` works on every Node version in the matrix, whereas
 * `cpSync`'s recursive mode only landed in Node 16.7.
 */
function copyFixture(name, destination) {
  const source = join(fixturesDir, name)
  mkdirSync(destination, { recursive: true })
  for (const entry of readdirSync(source)) {
    const from = join(source, entry)
    if (statSync(from).isFile()) copyFileSync(from, join(destination, entry))
  }
}

/**
 * Packs into `destination` and finds the tarball by extension rather than by
 * parsing npm's stdout: `npm pack` runs the `prepare` script (lefthook prints
 * to stdout) even under `--ignore-scripts` on npm 11, so `--json`'s output is
 * not reliably JSON. `--ignore-scripts` stays anyway, to keep a future
 * `prepack` out of a purely local pack.
 */
function packTarball(destination) {
  run(npm, ['pack', '--ignore-scripts', '--pack-destination', destination], repoRoot)
  const tarball = readdirSync(destination).find((entry) => entry.endsWith('.tgz'))
  if (!tarball) throw new Error(`npm pack produced no tarball in ${destination}`)
  return join(destination, tarball)
}

function installTarball(tarball, cwd) {
  run(
    npm,
    [
      'install',
      tarball,
      '--no-audit',
      '--no-fund',
      '--no-package-lock',
      '--ignore-scripts',
      '--loglevel=error',
    ],
    cwd,
  )
}

/**
 * Resolves one of this repo's own pinned compilers, so the fixtures never pull
 * a TypeScript version from the network: `current` is `typescript` (7.x),
 * `legacy` is `@typescript/typescript6`, whose `tsc6` binary still understands
 * `moduleResolution: node10`.
 */
function tscBinary(compiler) {
  return compiler === 'legacy'
    ? join(repoRoot, 'node_modules', '@typescript', 'typescript6', 'bin', 'tsc6')
    : join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc')
}

/**
 * Sets a fixture up in its own directory with the tarball installed, then runs
 * `command` in it. Returns an error report, or `null` when the fixture passed.
 */
function checkFixture(fixture, tarball, tempDir, buildCommand) {
  const consumerDir = join(tempDir, fixture.name)
  copyFixture(fixture.name, consumerDir)
  installTarball(tarball, consumerDir)
  try {
    const output = run(process.execPath, buildCommand(consumerDir), consumerDir)
    console.log(`  ${fixture.name}: ${output.trim() || 'ok'}`)
    return null
  } catch (error) {
    return `${fixture.name}\n${error.stdout || ''}${error.stderr || ''}`
  }
}

function main() {
  const tempDir = mkdtempSync(join(tmpdir(), 'num-fns-smoke-'))
  const failures = []
  try {
    const tarball = tarballArg ? resolve(process.cwd(), tarballArg) : packTarball(tempDir)
    console.log(`smoke: node ${process.version}, tarball ${tarball}`)

    const checks = RUNTIME_FIXTURES.map((fixture) => ({
      fixture,
      buildCommand: (consumerDir) => [join(consumerDir, fixture.entry)],
    }))
    if (withTypes) {
      for (const fixture of TYPE_FIXTURES) {
        checks.push({
          fixture,
          buildCommand: () => [tscBinary(fixture.compiler), '--project', 'tsconfig.json'],
        })
      }
    }

    for (const { fixture, buildCommand } of checks) {
      const failure = checkFixture(fixture, tarball, tempDir, buildCommand)
      if (failure) failures.push(failure)
    }
  } finally {
    if (keepTempDir) console.log(`smoke: kept ${tempDir}`)
    else rmSync(tempDir, { recursive: true, force: true })
  }

  if (failures.length > 0) {
    console.error(`\nsmoke failed:\n\n${failures.join('\n\n')}`)
    process.exit(1)
  }
  console.log('smoke: all fixtures passed')
}

main()
