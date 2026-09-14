#!/usr/bin/env bun
/**
 * Keeps the version in README.md's status callout in step with package.json.
 *
 * `changeset version` bumps package.json and CHANGELOG.md but knows nothing
 * about the README, which is how the README kept advertising 0.3.0 while npm
 * served 0.4.0. The `version` script in package.json chains this after
 * `changeset version`, so the "chore: version packages" PR that
 * changesets/action opens carries the README change too, and `check:readme`
 * (part of `check`, hence `prepublishOnly`, and a CI step) fails if the two
 * drift apart anyway.
 *
 * Usage:
 *   bun scripts/sync-readme-version.ts          # rewrite README.md
 *   bun scripts/sync-readme-version.ts --check  # exit 1 if README.md is stale
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '..')
const PACKAGE_JSON_PATH = join(REPO_ROOT, 'package.json')
const README_PATH = join(REPO_ROOT, 'README.md')
// The callout under the tagline: `> **Status: 0.4.0** — ...`. Only the version
// belongs to this script; the prose after it is hand-written.
const STATUS_PATTERN = /^(> \*\*Status: )(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)(\*\*)/m

const { version } = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as { version: string }
const readme = readFileSync(README_PATH, 'utf8')
const current = STATUS_PATTERN.exec(readme)?.[2]

if (current === undefined) {
  throw new Error('README.md has no `> **Status: <version>**` callout to update')
}

if (current === version) {
  console.log(`README.md status is already ${version}`)
  process.exit(0)
}

if (process.argv.includes('--check')) {
  console.error(
    `README.md says ${current} but package.json is ${version}; run \`bun scripts/sync-readme-version.ts\``,
  )
  process.exit(1)
}

writeFileSync(README_PATH, readme.replace(STATUS_PATTERN, `$1${version}$3`))
console.log(`README.md status ${current} -> ${version}`)
